import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

import Login from "./pages/login/login";
import DashboardSeguranca from "./pages/dashboard_seguranca/dashboard_seguranca";
import DashboardRH from "./pages/dashboard_rh/dashboard_rh";
import DashboardAdmin from "./pages/dashboard_admin/dashboard_admin"; // Novo Import

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
    if (perfilSalvo === "admin") return "/dashboard-admin"; // Desvio para o Admin
    return "/dashboard-seguranca";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            !usuarioLogado ? (
              <Login />
            ) : (
              <Navigate to={getRedirecionamentoPadrao()} />
            )
          }
        />

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

        {/* Nova Rota Protegida do Administrador */}
        <Route
          path="/dashboard-admin"
          element={
            usuarioLogado ? <DashboardAdmin /> : <Navigate to="/login" />
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
