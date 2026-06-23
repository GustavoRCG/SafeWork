import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import axios from "axios"; // 💡 Importado para gerenciar os cabeçalhos globais de segurança

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

  // 1️⃣ MONITORAMENTO DO ESTADO DE AUTENTICAÇÃO DO FIREBASE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuarioLogado(user);
        try {
          // Salva o token inicial como contingência no localStorage
          const token = await user.getIdToken();
          localStorage.setItem("token_firebase", token);
        } catch (error) {
          console.error("Erro ao obter ID token do Firebase:", error);
        }
      } else {
        setUsuarioLogado(null);
        localStorage.removeItem("token_firebase");
      }
      setCarregando(false);
    });

    return () => unsubscribe();
  }, []);

  
 // 2️⃣ 🛡️ INTERCEPTOR GLOBAL DA API (Corrigido para evitar quebras de token nulo)
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      async (config) => {
        try {
          let token = null;

          // 1. Tenta pegar o token do estado reativo do usuário logado
          if (usuarioLogado) {
            token = await usuarioLogado.getIdToken();
          } 
          // 2. Se o estado ainda não carregou, tenta direto do SDK do Firebase
          else if (auth.currentUser) {
            token = await auth.currentUser.getIdToken();
          } 
          // 3. Fallback final em caso de carregamento rápido/refresh de página
          else {
            token = localStorage.getItem("token_firebase");
          }

          if (token) {
            // Formatação exigida pelo get_current_user da API FastAPI
            config.headers["Authorization"] = `Bearer ${token}`;
          }
        } catch (tokenError) {
          console.warn("Aviso: Falha ao renovar token no interceptor, usando fallback local.", tokenError);
          const backupToken = localStorage.getItem("token_firebase");
          if (backupToken) {
            config.headers["Authorization"] = `Bearer ${backupToken}`;
          }
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Limpa o interceptor ao desmontar o componente para evitar vazamento de memória
    return () => axios.interceptors.request.eject(interceptor);
  }, [usuarioLogado]); // Executa novamente sempre que o estado do usuário mudar

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
        {/* 🚀 ROTA RAIZ INTELIGENTE */}
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
          element={
            usuarioLogado ? <DashboardSeguranca /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/dashboard-rh"
          element={
            usuarioLogado ? <DashboardRH /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/dashboard-admin"
          element={
            usuarioLogado ? <DashboardAdmin /> : <Navigate to="/login" replace />
          }
        />

        <Route
          path="/cadastro-funcionario"
          element={
            usuarioLogado ? <CadastroFuncionario /> : <Navigate to="/login" replace />
          }
        />

        {/* Qualquer rota desconhecida joga de volta para o começo */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;