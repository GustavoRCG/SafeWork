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
  const [fotoCapturada, setFotoCapturada] = useState(null); 
  const [carregando, setCarregando] = useState(false);

  // 🎭 FUNÇÃO DE MÁSCARA DE CPF CORRIGIDA (TRAVA DE SEGURANÇA INTEGRADA)
  const handleCpfChange = (e) => {
    // 1. Remove imediatamente qualquer caractere que não seja número
    let valorRaw = e.target.value.replace(/\D/g, "");

    // 2. Trava física no React: impede que a string limpa passe de 11 dígitos
    if (valorRaw.length > 11) {
      valorRaw = valorRaw.slice(0, 11);
    }

    // 3. Aplica a formatação baseada em blocos de substituição progressiva
    const valorComMascara = valorRaw
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");

    // 4. Atualiza o estado controlado do componente
    setCpf(valorComMascara);
  };

  // 📷 Inicializa a visualização do fluxo da câmera
  const ligarCamera = () => {
    setFotoCapturada(null);
    setCameraAtiva(true);
  };

  // ✂️ Captura o frame do backend
  const capturarFotoPeloBackend = async () => {
    try {
      setCarregando(true);
      const response = await api.get("/api/monitoramento/capturar-frame");

      if (response.data && response.data.imagem_base64) {
        setFotoCapturada(response.data.imagem_base64);
        setCameraAtiva(false);
      } else {
        alert("O servidor não retornou um frame válido.");
      }
    } catch (err) {
      console.error("Erro ao solicitar captura de frame ao backend: ", err);
      alert("Não foi possível capturar a imagem do servidor de IA. Verifique se o backend está rodando.");
    } finally {
      setCarregando(false);
    }
  };

  const resetarCaptura = () => {
    setFotoCapturada(null);
    setCameraAtiva(true);
  };

  // Enviar Payload ao Backend
  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!fotoCapturada) {
      alert("Aviso: A captura da biometria facial (Face ID) é obrigatória para o treinamento da IA.");
      return;
    }

    const cpfLimpo = cpf.replace(/\D/g, "");
    if (cpfLimpo.length !== 11) {
      alert("Por favor, digite um CPF válido com 11 dígitos.");
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
      const dataHoje = new Date().toISOString().split("T")[0];

      const novoColaborador = {
        id_empresa: 1,
        nome: nome.trim(),
        cpf: cpfLimpo,
        cargo: cargo.trim(),
        data_admissao: dataHoje,
        face_id_image: fotoCapturada,
      };

      await api.post("/funcionarios/", novoColaborador, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Colaborador indexado e Face ID registrado com sucesso!");
      navigate("/dashboard-rh");
    } catch (erro) {
      console.error("Erro detalhado ao enviar dados para a API:", erro);
      alert("Falha operacional ao persistir dados no banco relacional.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro-screen-container">
      {/* Barra Superior */}
      <header className="cadastro-header">
        <button onClick={() => navigate("/dashboard-rh")} className="btn-back-rh">
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
            <h2>Dados do Contrato</h2>
            <p>Associe o novo funcionário às matrizes de proteção da NR-6.</p>
          </div>

          <form onSubmit={handleCadastro} className="form-inputs-stack">
            <div className="input-field">
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome Completo"
                required
              />
            </div>

            <div className="input-field">
              <input
                type="text"              
                value={cpf}                
                onChange={handleCpfChange} 
                placeholder="000.000.000-00"
                maxLength={14}            
                required
              />
            </div>

            <div className="input-field">
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Cargo / Função"
                required
              />
            </div>

            <div className="input-field">
              <input
                type="text"
                value={setor}
                onChange={(e) => setSetor(e.target.value)}
                placeholder="Setor Alocado"
                required
              />
            </div>

            <div className="input-field">
              <select
                value={epiObrigatorio}
                onChange={(e) => setEpiObrigatorio(e.target.value)}
              >
                <option value="Capacete, Colete">Capacete + Colete Refletivo</option>
                <option value="Capacete, Óculos, Luvas">Capacete + Óculos + Luvas</option>
                <option value="Apenas Capacete">Apenas Capacete Operacional</option>
                <option value="Capacete, Protetor Auricular">Capacete + Protetor Auricular</option>
              </select>
            </div>

            <button type="submit" disabled={carregando} className="btn-finish-cadastro">
              <UserPlus size={18} /> 
              {carregando ? "Persistindo..." : "Salvar Funcionário na Base"}
            </button>
          </form>
        </div>

        {/* Lado Direito: Captura de Face ID */}
        <div className="cadastro-camera-card">
          <div className="card-intro">
            <h2>Biometria Facial (Face ID)</h2>
            <p>Imprescindível para correlacionar o rosto do colaborador com o CPF durante as detecções do modelo.</p>
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
              <img
                src="http://localhost:8000/api/video-stream"
                alt="Transmissão de Vídeo da IA"
                className="live-webcam-element"
              />
            ) : (
              <div className="camera-idle-placeholder">
                <Camera size={48} color="#4b5563" />
                <p>Câmera em modo de espera</p>
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
                <Camera size={18} /> {carregando ? "Capturando..." : "Capturar Face ID"}
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
                    <Camera size={18} /> Ativar Captura de Vídeo
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