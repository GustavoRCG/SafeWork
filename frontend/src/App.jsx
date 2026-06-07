import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import Login from "./pages/login/Login";
import DashboardSeguranca from "./pages/dashboard_seguranca/dashboard_seguranca";

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Monitora em tempo real se o usuário está logado ou não no Firebase
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
          fontFamily: "sans-serif",
          color: "#0f766e",
        }}
      >
        <h3>Carregando sistema SafeWork...</h3>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rota pública de login */}
        <Route
          path="/login"
          element={
            !usuarioLogado ? <Login /> : <Navigate to="/dashboard-seguranca" />
          }
        />

        {/* Rota protegida do painel de segurança */}
        <Route
          path="/dashboard-seguranca"
          element={
            usuarioLogado ? <DashboardSeguranca /> : <Navigate to="/login" />
          }
        />

        {/* Rota padrão: Se digitar qualquer coisa errada, joga para o login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
