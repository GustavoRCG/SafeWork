import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import api from "./services/api"; // 💡 Utilizando a instância pré-configurada do seu serviço de API

import WelcomePage from "./pages/dashboard_inicial/dashboard_inicial";
import Login from "./pages/login/login";
import CadastroEmpresa from "./pages/dashboard_empresa/cadastro_empresa";
import DashboardSeguranca from "./pages/dashboard_seguranca/dashboard_seguranca";
import DashboardRH from "./pages/dashboard_rh/dashboard_rh";
import DashboardAdmin from "./pages/dashboard_admin/dashboard_admin";
import CadastroFuncionario from "./pages/dashboard_rh/cadastro_funcionario";

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // MONITORAMENTO DO ESTADO DE AUTENTICAÇÃO DO FIREBASE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuarioLogado(user);
        try {
          const token = await user.getIdToken();
          localStorage.setItem("token_firebase", token);
        } catch (error) {
          console.error("Erro ao obter ID token do Firebase na inicialização:", error);
        }
      } else {
        setUsuarioLogado(null);
        localStorage.removeItem("token_firebase");
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  // 2️ INTERCEPTOR GLOBAL DA API (Vinculado diretamente à sua instância do Axios)
  useEffect(() => {
    const interceptor = api.interceptors.request.use(
      async (config) => {
        try {
          let token = null;

          // Valida as origens de tokens de forma sequencial assíncrona
          if (usuarioLogado) {
            token = await usuarioLogado.getIdToken();
          } else if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          } else {
            token = localStorage.getItem("token_firebase");
          }

          if (token) {
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        } catch (tokenError) {
          console.warn("Aviso: Falha ao renovar token no interceptor, buscando do armazenamento local.", tokenError);
          const backupToken = localStorage.getItem("token_firebase");
          if (backupToken) {
            config.headers["Authorization"] = `Bearer ${backupToken}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => api.interceptors.request.eject(interceptor);
  }, [usuarioLogado]);

  if (carregando) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "#0b0f19",
          color: "#38bdf8",
          fontFamily: "sans-serif",
        }}
      >
        <h3>A inicializar ecossistema SafeWork...</h3>
      </div>
    );
  }

  const getRedirecionamentoPadrao = () => {
    const perfilSalvo = localStorage.getItem("user_profile");
    if (perfilSalvo === "rh") return "/dashboard-rh";
    if (perfilSalvo === "admin") return "/dashboard-admin";
    return "/dashboard-seguranca";
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* ROTA RAIZ INTELIGENTE */}
        <Route 
          path="/" 
          element={
            usuarioLogado ? (
              <Navigate to={getRedirecionamentoPadrao()} replace />
            ) : (
              <WelcomePage />
            )
          } 
        />
        
        <Route path="/empresa" element={<CadastroEmpresa />} />

        {/* ROTA DE LOGIN */}
        <Route
          path="/login"
          element={
            !usuarioLogado ? (
              <Login />
            ) : (
              <Navigate to={getRedirecionamentoPadrao()} replace />
            )
          }
        />

        {/* Dashboards Protegidos baseados no estado do Firebase */}
        <Route
          path="/dashboard-seguranca"
          element={usuarioLogado ? <DashboardSeguranca /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/dashboard-rh"
          element={usuarioLogado ? <DashboardRH /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/dashboard-admin"
          element={usuarioLogado ? <DashboardAdmin /> : <Navigate to="/login" replace />}
        />

        <Route
          path="/cadastro-funcionario"
          element={usuarioLogado ? <CadastroFuncionario /> : <Navigate to="/login" replace />}
        />

        {/* Fallback de navegação */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;