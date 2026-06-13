import { useState, useEffect } from "react";
import { auth } from "../../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  Tv,
  History,
  BarChart3,
  Camera,
  Sliders,
  LogOut,
  User,
} from "lucide-react";
import logoSafeWork from "../../assets/logoSafeWork.jpeg";
import "./sidebar_seguranca.css";

function SidebarSeguranca({ telaAtiva, setTelaAtiva }) {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState({
    nome: "Carregando...",
    cargo: "Técnico de Seg. do Trabalho",
    avatar: null,
  });

  useEffect(() => {
    // Monitora o estado de login do Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario({
          nome: user.displayName || user.email.split("@")[0], // Fallback caso o nome esteja vazio
          cargo: "Técnico de Seg. do Trabalho", // Perfil operacional desta view
          avatar: user.photoURL || null,
        });
      } else {
        // Se o estado perder o login por algum motivo, joga para a tela de seleção de perfil
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente encerrar sua sessão?")) {
      try {
        await signOut(auth);
        navigate("/");
      } catch (erro) {
        console.error("Erro ao deslogar:", erro);
      }
    }
  };

  const menuItens = [
    {
      id: "monitoramento",
      label: "Monitoramento ao Vivo",
      icon: <Tv size={20} />,
    },
    {
      id: "historico",
      label: "Histórico de Alertas",
      icon: <History size={20} />,
    },
    {
      id: "relatorios",
      label: "Relatórios de BI",
      icon: <BarChart3 size={20} />,
    },
    { id: "cameras", label: "Gerenciar Câmeras", icon: <Camera size={20} /> },
    {
      id: "configuracoes",
      label: "Configurações da IA",
      icon: <Sliders size={20} />,
    },
  ];

  return (
    <aside className="safework-sidebar">
      {/* 🖼️ Bloco da Brand Atualizado com a Logo Oficial em Imagem */}
      <div
        className="sidebar-brand"
        style={{
          padding: "15px 10px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img
          src={logoSafeWork}
          alt="SafeWork Visão Computacional"
          style={{
            width: "100%",
            maxHeight: "75px",
            objectFit: "contain",
            borderRadius: "4px",
          }}
        />
      </div>

      <div className="model-status-badge">
        <span className="pulse-dot"></span>
        <span className="model-txt">MODELO ATIVO (YOLOv8)</span>
      </div>

      <nav className="sidebar-navigation">
        <ul>
          {menuItens.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-menu-link ${telaAtiva === item.id ? "active" : ""}`}
                onClick={() => setTelaAtiva(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 👤 Rodapé Dinâmico com dados vindos do Firebase Auth */}
      <div className="sidebar-footer-user">
        <div className="user-profile-wrapper">
          {usuario.avatar ? (
            <img
              src={usuario.avatar}
              alt={usuario.nome}
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar-placeholder">
              <User size={20} color="#94a3b8" />
            </div>
          )}
          <div className="user-text-info">
            <h4 title={usuario.nome}>{usuario.nome}</h4>
            <span>{usuario.cargo}</span>
          </div>
        </div>
        <button
          className="btn-logout-sidebar"
          title="Sair do Sistema"
          onClick={handleLogout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

export default SidebarSeguranca;
