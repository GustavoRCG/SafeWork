import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  HardHat,
  Settings,
  Users,
} from "lucide-react";
import { auth } from "../../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";
import logoSafeWork from "../../assets/logoSafeWork.jpeg";

// Instância configurada do Axios/API para consultar o banco de dados
import api from "../../services/api"; 

function Login() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null); // Armazena "rh", "seguranca" ou "admin"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      // 1. Mapeia a seleção visual da tela para o ID correspondente no banco de dados
      let idPerfilSelecionado;
      if (perfil === "admin") idPerfilSelecionado = 1;
      if (perfil === "rh") idPerfilSelecionado = 2;
      if (perfil === "seguranca") idPerfilSelecionado = 3;

      // 2. Consulta o banco de dados via API para verificar as permissões do e-mail informado
      const response = await api.get(`/api/usuarios?email=${email}`);
      
      const dadosUsuario = Array.isArray(response.data) 
        ? response.data.find(u => u.email.toLowerCase() === email.toLowerCase())
        : response.data;

      if (!dadosUsuario) {
        setErro("E-mail não encontrado no sistema.");
        // Limpa a memória por segurança se o e-mail não existir
        setEmail("");
        setSenha("");
        setCarregando(false);
        return;
      }

      const idPerfilDoBanco = Number(dadosUsuario.id_perfil);

      // 3. REGRA DE VALIDAÇÃO CRUCIAL:
      // O Administrador (ID: 1) tem passe livre para entrar por qualquer painel.
      // Usuários comuns (RH e Técnico) são bloqueados se o ID do banco não for idêntico ao card escolhido.
      if (idPerfilDoBanco !== 1 && idPerfilDoBanco !== idPerfilSelecionado) {
        setErro(`Acesso negado. Este e-mail não pertence a este perfil de acesso.`);
        
        //LIMPA OS DADOS DA MEMÓRIA IMEDIATAMENTE PARA NÃO REPETIR NOS OUTROS PERFIS
        setEmail("");
        setSenha("");
        
        setCarregando(false);
        return; 
      }

      // 4. Se o perfil coincidir perfeitamente, realiza a autenticação de senha no Firebase
      await signInWithEmailAndPassword(auth, email, senha);

      // 5. Salva as informações de sessão no armazenamento local
      localStorage.setItem("@SafeWork:user", JSON.stringify(dadosUsuario));
      localStorage.setItem("user_profile", perfil); 

      // 6. Redireciona o usuário de forma segura para o dashboard escolhido
      navigate(`/dashboard-${perfil}`);

    } catch (error) {
      console.error(error);
      //Limpa o campo de senha se errar a senha no Firebase
      setSenha("");

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro("Erro ao conectar ao servidor. Verifique sua conexão e tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-box" style={{ display: "flex", justifyContent: "center", marginBottom: "15px" }}>
            <img
              src={logoSafeWork}
              alt="SafeWork Visão Computacional"
              style={{
                width: "auto",
                maxHeight: "65px",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
          </div>

          <h1 className="login-title">Selecione seu Perfil de Acesso</h1>
          <p className="login-subtitle">
            Escolha o tipo de acesso para entrar no sistema SafeWork.
          </p>
        </div>

        {/* Grade Inicial com a escolha dos 3 Perfis */}
        {!perfil ? (
          <div className="profiles-grid">
            {/* CARD 2: Recursos Humanos */}
            <button onClick={() => setPerfil("rh")} className="profile-card">
              <div className="profile-icon-bg blue">
                <Briefcase size={36} color="#ffffff" />
              </div>
              <span className="profile-name">Recursos Humanos</span>
              <span className="profile-desc">
                Gestão de colaboradores e ocorrências
              </span>
            </button>

            {/* CARD 3: Técnico de Segurança */}
            <button onClick={() => setPerfil("seguranca")} className="profile-card">
              <div className="profile-icon-bg green">
                <HardHat size={36} color="#ffffff" />
              </div>
              <span className="profile-name">Técnico do Trabalho</span>
              <span className="profile-desc">
                Monitoramento e segurança operacional
              </span>
            </button>

            {/* CARD 1: Administrador */}
            <button onClick={() => setPerfil("admin")} className="profile-card">
              <div className="profile-icon-bg purple">
                <Settings size={36} color="#ffffff" />
              </div>
              <span className="profile-name">Administrador do Sistema</span>
              <span className="profile-desc">
                Configurações e gestão global
              </span>
            </button>
          </div>
        ) : (
          /* Formulário de Autenticação exibido após selecionar o perfil */
          <div className="login-form-wrapper">
            <form onSubmit={handleLogin} className="login-form">
              <div className="back-row">
                <span className="badge-perfil">
                  Perfil:{" "}
                  {perfil === "seguranca" ? "TÉCNICO" : perfil.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    // 🧼 LIMPEZA COMPLETA AO CLICAR EM VOLTAR
                    setPerfil(null);
                    setEmail("");
                    setSenha("");
                    setErro("");
                  }}
                  className="btn-trocar"
                  disabled={carregando}
                >
                  Voltar
                </button>
              </div>

              {erro && (
                <div
                  style={{
                    color: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    padding: "12px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  {erro}
                </div>
              )}

              <div className="input-group">
                <label className="input-label">E-mail Corporativo</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input
                    type="email"
                    placeholder="nome@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input"
                    required
                    disabled={carregando}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="senha-label-row">
                  <label className="input-label">Senha</label>
                </div>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="login-input"
                    required
                    disabled={carregando}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="eye-button"
                    disabled={carregando}
                  >
                    {mostrarSenha ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-submit"
                disabled={carregando}
              >
                {carregando ? "Autenticando..." : "Entrar no Sistema"}
              </button>
            </form>
          </div>
        )}

        <div className="login-footer-text">
          <div className="footer-icon-row">
            <Users size={16} />
            <span>Acesso restrito. Todas as atividades são monitoradas.</span>
          </div>
          <span>SafeWork AI &copy; 2026 - Versão do Protótipo</span>
        </div>
      </div>
    </div>
  );
}

export default Login;