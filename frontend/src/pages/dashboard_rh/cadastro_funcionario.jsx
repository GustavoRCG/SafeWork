import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebaseConfig";
import {
  ArrowLeft,
  Camera,
  RefreshCw,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import "./cadastro_funcionario.css";

function CadastroFuncionario() {
  const navigate = useNavigate();

  // Estados dos inputs do formulário
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [cargo, setCargo] = useState("");
  const [setor, setSetor] = useState("");
  const [epiObrigatorio, setEpiObrigatorio] = useState("Capacete, Colete");

  // Estados do Face ID (Webcam centralizada no Backend)
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState(null); // Guarda a imagem em String Base64 vinda do Python
  const [carregando, setCarregando] = useState(false);

  // 📷 Inicializa a visualização do fluxo que o Python está capturando
  const ligarCamera = () => {
    setFotoCapturada(null);
    setCameraAtiva(true);
  };

  // ✂️ Solicita ao Backend que capture o frame atual da câmera dele
  const capturarFotoPeloBackend = async () => {
    try {
      setCarregando(true);

      // Rota no seu FastAPI que lê o frame atual do cv2.VideoCapture e retorna em Base64
      const response = await api.get("/api/monitoramento/capturar-frame");

      if (response.data && response.data.imagem_base64) {
        setFotoCapturada(response.data.imagem_base64);
        setCameraAtiva(false);
      } else {
        alert("O servidor não retornou um frame válido.");
      }
    } catch (err) {
      console.error("Erro ao solicitar captura de frame ao backend: ", err);
      alert(
        "Não foi possível capturar a imagem do servidor de IA. Verifique se o backend está rodando.",
      );
    } finally {
      setCarregando(false);
    }
  };

  const resetarCaptura = () => {
    setFotoCapturada(null);
    setCameraAtiva(true);
  };

  // 🟢 Enviar Payload Completo ao FastAPI
  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!fotoCapturada) {
      alert(
        "Aviso: A captura da biometria facial (Face ID) é obrigatória para o treinamento da IA.",
      );
      return;
    }

    try {
      setCarregando(true);
      const usuarioAtual = auth.currentUser;
      if (!usuarioAtual) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }

      const token = await usuarioAtual.getIdToken();
      const cpfLimpo = cpf.replace(/\D/g, "");
      const dataHoje = new Date().toISOString().split("T")[0];

      // CORREÇÃO TÉCNICA AQUI:
      // O payload agora contém APENAS os campos exatos mapeados no banco da Emilly!
      // (setor e epi_obrigatorio foram removidos do envio para não quebrar a aplicação)
      const novoColaborador = {
        id_empresa: 1,
        nome: nome.trim(),
        cpf: cpfLimpo,
        cargo: cargo.trim(),
        data_admissao: dataHoje,
        face_id_image: fotoCapturada, // String Base64 enviada para tratamento no backend
      };

      await api.post("/funcionarios/", novoColaborador, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Colaborador indexado e Face ID registrado com sucesso!");
      navigate("/dashboard-rh");
    } catch (erro) {
      console.error("Erro detalhado ao enviar dados para a API:", erro);

      if (erro.response && erro.response.data && erro.response.data.detail) {
        const detalheDoErro = erro.response.data.detail;

        if (Array.isArray(detalheDoErro)) {
          const listaDeErros = detalheDoErro
            .map((err) => `• Campo [${err.loc[1]}]: ${err.msg}`)
            .join("\n");
          alert(`Erro de validação de dados no Backend:\n\n${listaDeErros}`);
        } else {
          alert(`Restrição do Servidor: ${detalheDoErro}`);
        }
      } else {
        alert("Falha operacional ao persistir dados no banco relacional.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro-screen-container">
      {/* Barra Superior */}
      <header className="cadastro-header">
        <button
          onClick={() => navigate("/dashboard-rh")}
          className="btn-back-rh"
        >
          <ArrowLeft size={18} /> Voltar ao Painel
        </button>
        <div className="cadastro-header-title">
          <ShieldCheck size={22} color="#2563eb" />
          <span>SafeWork ID — Módulo de Admissão</span>
        </div>
      </header>

      {/* Grid Central */}
      <main className="cadastro-grid-content">
        {/* Formulário de dados textuais */}
        <div className="cadastro-form-card">
          <div className="card-intro">
            <h2>Dados Operacionais</h2>
            <p>
              Insira as informações do contrato e associe as regras de EPI da
              NR-6.
            </p>
          </div>

          <form onSubmit={handleCadastro} className="form-inputs-stack">
            <div className="input-field">
              <label>Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Wagner Silva"
                required
              />
            </div>

            <div className="input-field">
              <label>CPF (Apenas números)</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>

            <div className="input-field">
              <label>Cargo / Função Contratual</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Operador de Empilhadeira"
                required
              />
            </div>

            <div className="input-field">
              <label>Setor / Área de Locação</label>
              <input
                type="text"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Ex: Galpão de Carga e Logística"
                required
              />
            </div>

            <div className="input-field">
              <label>Matriz de Proteção Individual Requerida</label>
              <select
                value={epiObrigatorio}
                onChange={(e) => setEpiObrigatorio(e.target.value)}
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
                <option value="Capacete, Protetor Auricular">
                  Capacete + Protetor Auricular
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="btn-finish-cadastro"
            >
              <UserPlus size={18} />{" "}
              {carregando
                ? "Persistindo..."
                : "Finalizar e Indexar Funcionário"}
            </button>
          </form>
        </div>

        {/* Lado Direito: Captura de Face ID via Feed do Backend */}
        <div className="cadastro-camera-card">
          <div className="card-intro">
            <h2>Biometria Facial (Face ID)</h2>
            <p>
              Obrigatório para que a rede neural correlacione e valide as
              infrações em tempo real.
            </p>
          </div>

          <div className="viewport-camera-box">
            {fotoCapturada ? (
              <div className="photo-success-preview">
                <img src={fotoCapturada} alt="Face ID Capturado" />
                <div className="success-overlay-tag">
                  <CheckCircle2 size={16} /> Biometria Coletada
                </div>
              </div>
            ) : cameraAtiva ? (
              /* O React apenas consome a rota de streaming de vídeo do seu FastAPI */
              <img
                src="http://localhost:8000/api/video-stream"
                alt="Transmissão de Vídeo da IA"
                className="live-webcam-element"
                style={{ width: "440px", height: "330px", objectFit: "cover" }}
              />
            ) : (
              <div className="camera-idle-placeholder">
                <Camera size={48} color="#94a3b8" />
                <p>Fluxo de vídeo inativo</p>
              </div>
            )}
          </div>

          <div className="camera-actions-zone">
            {cameraAtiva ? (
              <button
                type="button"
                onClick={capturarFotoPeloBackend}
                disabled={carregando}
                className="btn-trigger-snap"
              >
                <Camera size={18} />{" "}
                {carregando ? "Capturando..." : "Capturar Face ID"}
              </button>
            ) : (
              <button
                type="button"
                onClick={fotoCapturada ? resetarCaptura : ligarCamera}
                className="btn-trigger-power"
              >
                {fotoCapturada ? (
                  <>
                    <RefreshCw size={18} /> Substituir Foto Recente
                  </>
                ) : (
                  <>
                    <Camera size={18} /> Iniciar Dispositivo de Vídeo
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default CadastroFuncionario;
