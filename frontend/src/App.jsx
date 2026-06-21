import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

import Login from "./pages/login/login";
import DashboardSeguranca from "./pages/dashboard_seguranca/dashboard_seguranca";
import DashboardRH from "./pages/dashboard_rh/dashboard_rh";
import DashboardAdmin from "./pages/dashboard_admin/dashboard_admin";
import CadastroFuncionario from "./pages/dashboard_rh/cadastro_funcionario";

// Import do fluxo de Onboarding da Empresa
import CadastroEmpresa from "./pages/dashboard_empresa/cadastro_empresa";

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
        {/* 1ª TELA ABSOLUTA: Quem acessa o sistema cai direto no Onboarding da Empresa */}
        <Route path="/" element={<CadastroEmpresa />} />
        <Route path="/empresa" element={<CadastroEmpresa />} />

        {/* 2ª TELA: Após o checkout, o fluxo redireciona para cá para o vínculo do usuário */}
        <Route
          path="/login"
          element={
            !usuarioLogado ? (
              <Login />
            ) : (
              // 3ª TELA: Se já autenticou no Firebase, o próprio componente Login lida com a Seleção de Perfil ou joga para o Dashboard correto
              <Navigate to={getRedirecionamentoPadrao()} />
            )
          }
        />

        {/* Dashboards Protegidos */}
        <Route
          path="/dashboard-seguranca"
          element={
            usuarioLogado ? <DashboardSeguranca /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/dashboard-rh"
          element={usuarioLogado ? <DashboardRH /> : <Navigate to="/login" />}
        />

        <Route
          path="/dashboard-admin"
          element={
            usuarioLogado ? <DashboardAdmin /> : <Navigate to="/login" />
          }
        />

        <Route
          path="/cadastro-funcionario"
          element={
            usuarioLogado ? <CadastroFuncionario /> : <Navigate to="/login" />
          }
        />

        {/* Qualquer rota desconhecida joga de volta para o começo do Onboarding */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
