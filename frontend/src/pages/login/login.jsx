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

function Login() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
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
      await signInWithEmailAndPassword(auth, email, senha);
      // Guarda o perfil selecionado para sabermos para onde redirecionar no App.jsx
      localStorage.setItem("user_profile", perfil);
      navigate(`/dashboard-${perfil}`);
    } catch (error) {
      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro("Erro ao conectar ao servidor. Tente novamente.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Cabeçalho igual ao Print */}
        <div className="login-header">
          <div className="logo-box">
            <span className="logo-text-top">
              SAFE<span style={{ color: "#dc2626" }}>WORK</span>
            </span>
            <span className="logo-text-bottom">VISÃO COMPUTACIONAL</span>
          </div>
          <h1 className="login-title">Selecione seu Perfil de Acesso</h1>
          <p className="login-subtitle">
            Escolha o tipo de acesso para entrar no sistema SafeWork.
          </p>
        </div>

        {/* PASSO 1: Grid de Perfis idêntico ao Print */}
        {!perfil ? (
          <div className="profiles-grid">
            <button onClick={() => setPerfil("rh")} className="profile-card">
              <div className="profile-icon-bg blue">
                <Briefcase size={36} color="#ffffff" />
              </div>
              <span className="profile-name">Recursos Humanos</span>
              <span className="profile-desc">
                Gestão de colaboradores e ocorrências
              </span>
            </button>

            <button
              onClick={() => setPerfil("seguranca")}
              className="profile-card"
            >
              <div className="profile-icon-bg green">
                <HardHat size={36} color="#ffffff" />
              </div>
              <span className="profile-name">Técnico do Trabalho</span>
              <span className="profile-desc">
                Monitoramento e segurança operacional
              </span>
            </button>

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
          /* PASSO 2: Tela de Credenciais (Modo Escuro) */
          <div className="login-form-wrapper">
            <form onSubmit={handleLogin} className="login-form">
              <div className="back-row">
                <span className="badge-perfil">
                  Perfil:{" "}
                  {perfil === "seguranca" ? "TÉCNICO" : perfil.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => setPerfil(null)}
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
                  <a href="#esqueci" className="link-esqueci">
                    Esqueceu a senha?
                  </a>
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

        {/* Rodapé institucional */}
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
