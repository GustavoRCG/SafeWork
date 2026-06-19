import { useState, useEffect, useRef } from "react";
import {
  Users,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  LogOut,
  UserPlus,
  Camera,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./dashboard_rh.css";

function DashboardRH() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // 🧭 Controla se mostra o 'dashboard' (tabela/métricas) ou o 'cadastro' (formulário/Face ID)
  const [visaoAtual, setVisaoAtual] = useState("dashboard");

  // Estados das Métricas e Tabela do Dashboard
  const [historico, setHistorico] = useState([]);
  const [metricas, setMetricas] = useState({
    totalColaboradores: 0,
    infracoesMes: 0,
    indiceConformidade: 100,
  });
  const [carregando, setCarregando] = useState(true);

  // Estados dos Inputs do Formulário de Cadastro
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [epiObrigatorio, setEpiObrigatorio] = useState("Capacete, Colete");

  // Estados do Controle da Câmera (Centralizada no Backend)
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null);
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);

  // 💡 Define dinamicamente a URL base do backend para o streaming de vídeo
  const baseURL = api.defaults.baseURL || "http://localhost:8000";

  // 🔐 Carrega dados iniciais do Dashboard do RH
  const carregarDadosPainel = async () => {
    try {
      setCarregando(true);
      const usuarioAtual = auth.currentUser;
      if (!usuarioAtual) return;

      const token = await usuarioAtual.getIdToken();
      const idEmpresa = 1;

      const [resHistorico, resMetricas] = await Promise.all([
        api.get(`/ocorrencias/empresa/${idEmpresa}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get(`/empresas/${idEmpresa}/metricas`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setHistorico(resHistorico.data);
      setMetricas(resMetricas.data);
    } catch (erro) {
      console.error("Erro ao sincronizar dados do painel de RH:", erro);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) carregarDadosPainel();
    });
    return () => unsubscribe();
  }, []);

  // 📷 Liga o monitoramento visual consumindo o feed ativo do Python
  const ligarCamera = () => {
    setFotoCapturada(null);
    setCameraAtiva(true);
  };

  // ✂️ Solicita ao Backend o frame atual capturado da webcam controlada pela IA
  const capturarFoto = async () => {
    try {
      setSalvandoCadastro(true);
      const response = await api.get("/api/monitoramento/capturar-frame");

      if (response.data && response.data.imagem_base64) {
        setFotoCapturada(response.data.imagem_base64);
        setCameraAtiva(false);
      } else {
        alert("O servidor de IA não retornou um frame válido.");
      }
    } catch (err) {
      console.error("Erro ao solicitar captura de frame ao backend:", err);
      alert(
        "Não foi possível capturar a imagem do servidor de IA. Verifique a conexão.",
      );
    } finally {
      setSalvandoCadastro(false);
    }
  };

  const desligarStreamCamera = () => {
    setCameraAtiva(false);
  };

  // 💡 Envio do formulário integrado ao endpoint protegido
  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!fotoCapturada) {
      alert("A captura da biometria facial (Face ID) é obrigatória.");
      return;
    }

    try {
      setSalvandoCadastro(true);
      const usuarioAtual = auth.currentUser;
      if (!usuarioAtual) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const token = await usuarioAtual.getIdToken();
      const cpfLimpo = cpf.replace(/\D/g, "");
      const dataHoje = new Date().toISOString().split("T")[0];

      const novoColaborador = {
        id_empresa: 1,
        nome: nome.trim(),
        cpf: cpfLimpo,
        cargo: cargo.trim(),
        data_admissao: dataHoje,
        setor: setor.trim(),
        epi_obrigatorio: epiObrigatorio,
        face_id_image: fotoCapturada,
      };

      await api.post("/funcionarios/", novoColaborador, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Colaborador indexado e Face ID registrado com sucesso!");

      // Limpa formulário e retorna pro painel principal atualizado
      setNome("");
      setCpf("");
      setCargo("");
      setSetor("");
      setFotoCapturada(null);
      setVisaoAtual("dashboard");
      carregarDadosPainel();
    } catch (erro) {
      console.error("Erro ao cadastrar funcionário:", erro);
      if (erro.response && erro.response.data && erro.response.data.detail) {
        const detalheDoErro = erro.response.data.detail;
        if (Array.isArray(detalheDoErro)) {
          const listaDeErros = detalheDoErro
            .map((err) => `• Campo [${err.loc[1] || "dado"}]: ${err.msg}`)
            .join("\n");
          alert(`Erro de validação no Backend:\n\n${listaDeErros}`);
        } else {
          alert(`Restrição do Servidor: ${detalheDoErro}`);
        }
      } else {
        alert("Falha operacional ao persistir dados.");
      }
    } finally {
      setSalvandoCadastro(false);
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      localStorage.removeItem("user_profile");
      navigate("/login");
    });
  };

  return (
    <div className="dash-rh-container">
      <header className="rh-header">
        <div className="rh-logo">
          <Users size={28} color="#2563eb" />
          <span>
            SafeWork <small className="badge-rh">Módulo RH</small>
          </span>
        </div>

        {visaoAtual === "dashboard" ? (
          <button onClick={handleLogout} className="btn-logout-rh">
            <LogOut size={18} /> Sair
          </button>
        ) : (
          <button
            onClick={() => {
              desligarStreamCamera();
              setVisaoAtual("dashboard");
            }}
            className="btn-back-rh"
          >
            <ArrowLeft size={16} /> Voltar ao Painel
          </button>
        )}
      </header>

      {visaoAtual === "dashboard" ? (
        <main className="rh-content">
          {/* Cards de Métricas */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Total de Colaboradores</span>
                <span className="metric-value">
                  {metricas.totalColaboradores}
                </span>
              </div>
              <Users size={32} color="#2563eb" />
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Infrações este Mês</span>
                <span className="metric-value text-danger">
                  {metricas.infracoesMes}
                </span>
              </div>
              <AlertTriangle size={32} color="#ef4444" />
            </div>
            <div className="metric-card">
              <div className="metric-info">
                <span className="metric-label">Índice de Conformidade</span>
                <span className="metric-value text-success">
                  {metricas.indiceConformidade}%
                </span>
              </div>
              <CheckCircle size={32} color="#10b981" />
            </div>
          </div>

          {/* Tabela de Histórico */}
          <div className="table-card">
            <div className="table-header">
              <h3>Histórico de Ocorrências e Auditoria (Mapeamento IA)</h3>
              <div className="table-actions-group">
                <button
                  className="btn-action-primary"
                  onClick={() => setVisaoAtual("cadastro")}
                >
                  <UserPlus size={16} /> Novo Cadastro (Face ID)
                </button>
                <button
                  className="btn-action-secondary"
                  onClick={() =>
                    alert("Gerando planilha XLSX contendo logs de auditoria...")
                  }
                >
                  <FileSpreadsheet size={16} /> Exportar Relatório
                </button>
              </div>
            </div>

            {carregando ? (
              <p className="loading-table-text">
                Sincronizando auditoria com o banco de dados...
              </p>
            ) : historico.length === 0 ? (
              <p className="empty-table-text">
                Nenhuma não-conformidade registrada no histórico.
              </p>
            ) : (
              <table className="rh-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Funcionário</th>
                    <th>Setor / Área</th>
                    <th>Infração Detetada</th>
                    <th>Status Administrativo</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item) => (
                    <tr key={item.id}>
                      <td>{item.data}</td>
                      <td className="font-bold">{item.funcionario}</td>
                      <td>{item.setor}</td>
                      <td>
                        <span className="rh-badge-infrax">{item.infracao}</span>
                      </td>
                      <td>
                        <span
                          className={`status-pill ${item.status.toLowerCase()}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      ) : (
        /* TELA DE CADASTRO ADMISSIONÁRIO / FACE ID */
        <main className="rh-cadastro-grid">
          {/* Lado Esquerdo: Formulário */}
          <div className="cadastro-form-card">
            <div className="form-section-header">
              <h2>Dados do Contrato</h2>
              <p>Associe o novo funcionário às matrizes de proteção da NR-6.</p>
            </div>

            <form onSubmit={handleCadastro} className="form-cadastro-container">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome Completo"
                required
                className="input-field-rh"
              />
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="CPF (Apenas números)"
                required
                className="input-field-rh"
              />
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Cargo / Função"
                required
                className="input-field-rh"
              />
              <input
                type="text"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Setor Alocado"
                required
                className="input-field-rh"
              />

              <select
                value={epiObrigatorio}
                onChange={(e) => setEpiObrigatorio(e.target.value)}
                className="select-field-rh"
              >
                <option value="Capacete, Colete">
                  Capacete + Colete Refletivo
                </option>
                <option value="Capacete, Óculos, Luvas">
                  Capacete + Óculos + Luvas
                </option>
                <option value="Apenas Capacete">
                  Apenas Capacete Operacional
                </option>
              </select>

              <button
                type="submit"
                disabled={salvandoCadastro}
                className="btn-submit-cadastro"
              >
                <UserPlus size={18} />{" "}
                {salvandoCadastro
                  ? "Indexando e salvando..."
                  : "Salvar Funcionário na Base"}
              </button>
            </form>
          </div>

          {/* Lado Direito: Visualizador de Vídeo de IA */}
          <div className="cadastro-camera-card">
            <div className="camera-section-header">
              <h2>Biometria Facial (Face ID)</h2>
              <p>
                Imprescindível para correlacionar o rosto do colaborador com o
                CPF durante as detecções do modelo.
              </p>
            </div>

            <div className="camera-viewport-display">
              {fotoCapturada ? (
                <div className="preview-image-container">
                  <img
                    src={fotoCapturada}
                    alt="Face ID Preview"
                    className="captured-photo-preview"
                  />
                  <div className="success-badge-coleta">
                    <CheckCircle2 size={16} /> Coleta Finalizada
                  </div>
                </div>
              ) : cameraAtiva ? (
                /* Consome dinamicamente o fluxo do Python sem roubar o hardware de imagem */
                <img
                  src={`${baseURL}/api/video-stream`}
                  alt="Transmissão de Vídeo da IA"
                  className="live-video-stream"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={() => {
                    alert(
                      "O fluxo de vídeo da IA não foi detectado no servidor.",
                    );
                    setCameraAtiva(false);
                  }}
                />
              ) : (
                <div className="camera-placeholder-box">
                  <Camera
                    size={44}
                    color="#475569"
                    className="camera-placeholder-icon"
                  />
                  <p>Câmera em modo de espera</p>
                </div>
              )}
            </div>

            <div className="camera-actions-wrapper">
              {cameraAtiva ? (
                <button
                  type="button"
                  onClick={capturarFoto}
                  disabled={salvandoCadastro}
                  className="btn-trigger-capture"
                >
                  <Camera size={18} />{" "}
                  {salvandoCadastro
                    ? "Capturando..."
                    : "Registrar Frame Facial"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={fotoCapturada ? ligarCamera : ligarCamera}
                  className="btn-toggle-camera"
                >
                  {fotoCapturada ? (
                    <>
                      <RefreshCw size={18} /> Coletar Nova Biometria
                    </>
                  ) : (
                    <>
                      <Camera size={18} /> Ativar Captura de Vídeo
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </main>
      )}
    </div>
  );
}

export default DashboardRH;
