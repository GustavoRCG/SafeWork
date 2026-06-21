import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUsuarioLogado(user);
      setCarregando(false);
    });
    return () => unsubscribe();
  }, []);

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
        {/* 🚀 ROTA RAIZ INTELIGENTE: Remove o risco de telas pretas travadas por quebra de ciclo */}
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

        {/* Dashboards Protegidos */}
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
