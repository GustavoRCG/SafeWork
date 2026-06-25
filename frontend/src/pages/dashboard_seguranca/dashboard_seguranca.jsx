import { useState, useEffect } from "react";
import SidebarSeguranca from "./sidebar_seguranca";
import MonitoramentoAoVivo from "./monitoramento";
import HistoricoAlertas from "./historico_alertas"; 
import RelatoriosBI from "./RelatoriosBI"; // Importação do componente de relatórios
import api from "../../services/api";
import { auth } from "../../firebaseConfig";
import "./dashboard_seguranca.css";

// ==========================================
// COMPONENTE: GERENCIAMENTO DE CÂMERAS
// ==========================================
function GerenciamentoCameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarCameras = async (token) => {
      try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await api.get("/api/cameras", config);
        setCameras(response.data);
      } catch (err) {
        console.error("Erro ao buscar câmeras do banco:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        buscarCameras(token);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="seguranca-page-container">
      <div className="page-header-flex-row">
        <div className="page-header-block">
          <h2 className="page-title-text">🎥 Gerenciamento de Câmeras Cadastradas</h2>
          <p className="page-subtitle-text">Status operacional vindo do PostgreSQL.</p>
        </div>
      </div>
      {loading ? (
        <div className="api-status-container"><p>A carregar fluxos de vídeo...</p></div>
      ) : (
        <div className="cameras-table-wrapper">
          <table className="cameras-data-table">
            <thead>
              <tr>
                <th>ID FLUXO</th>
                <th>IDENTIFICAÇÃO</th>
                <th>IP / RTSP</th>
                <th>ZONA</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {cameras.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>Nenhuma câmara registada.</td></tr>
              ) : (
                cameras.map((cam) => (
                  <tr key={cam.id}>
                    <td className="td-monospace-code">{cam.id}</td>
                    <td className="td-highlight-name">{cam.nome}</td>
                    <td className="td-monospace-code text-muted">{cam.ip}</td>
                    <td className="td-dimmed-text">{cam.zona}</td>
                    <td>
                      <div className="status-indicator-flex">
                        <span className={`status-led-dot ${cam.status === "Online" || cam.status === "ONLINE" ? "led-online" : "led-offline"}`}></span>
                        <span className={cam.status === "Online" || cam.status === "ONLINE" ? "text-success" : "td-dimmed-text"}>{cam.status}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: CONFIGURAÇÕES DA IA
// ==========================================
function ConfiguracoesIA() {
  const [confianca, setConfianca] = useState(65);
  const [regras, setRegras] = useState({ capacete: true, colete: true, luvas: false, zonaRisco: true });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const buscarConfiguracoesia = async (token) => {
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await api.get("/api/configuracoes-ia", config);
        if (response.data) {
          setConfianca(response.data.confianca_minima);
          setRegras(response.data.regras);
        }
      } catch (err) {
        console.error("Não foi possível carregar as configurações da IA.");
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        buscarConfiguracoesia(token);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      const user = auth.currentUser;
      if (!user) return alert("Sessão expirada.");
      const token = await user.getIdToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.post("/api/configuracoes-ia", { confianca_minima: parseInt(confianca), regras }, config);
      alert("Parâmetros sincronizados com sucesso!");
    } catch (err) {
      alert("Falha ao salvar parâmetros.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">⚙️ Ajustes de Parâmetros de Inferência</h2>
      </div>
      <div className="ia-settings-card-form">
        <form onSubmit={handleSalvarConfig}>
          <div className="form-group-slider">
            <label>Confiança Mínima: {confianca}%</label>
            <input type="range" min="35" max="95" value={confianca} onChange={(e) => setConfianca(e.target.value)} className="custom-range-input" />
          </div>
          <div className="form-group-checkboxes">
            <label><input type="checkbox" checked={regras.capacete} onChange={(e) => setRegras({ ...regras, capacete: e.target.checked })} /> Auditar Capacete</label>
            <label><input type="checkbox" checked={regras.colete} onChange={(e) => setRegras({ ...regras, colete: e.target.checked })} /> Auditar Colete</label>
          </div>
          <button type="submit" className="btn-submit-settings" disabled={salvando}>{salvando ? "Sincronizando..." : "Aplicar Parâmetros"}</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE MAESTRO PRINCIPAL
// ==========================================
function DashboardSeguranca() {
  const [telaAtiva, setTelaAtiva] = useState("monitoramento");
  const [dadosBI, setDadosBI] = useState(null);

  useEffect(() => {
    const carregarMetricas = async () => {
      try {
        const response = await api.get("/bi/metricas");
        if (response.data) {
          setDadosBI(response.data);
        }
      } catch (err) {
        console.error("Erro ao carregar dados analíticos na raiz:", err);
      }
    };
    carregarMetricas();
    // Atualização em tempo real a cada 8 segundos para manter os gráficos vivos
    const interval = setInterval(carregarMetricas, 8000);
    return () => clearInterval(interval);
  }, []);

  const renderizarTelaMestra = () => {
    switch (telaAtiva) {
      case "monitoramento": return <MonitoramentoAoVivo />;
      case "historico": return <HistoricoAlertas />; 
      case "relatorios": 
        // 🚀 AQUI ESTÁ A CORREÇÃO PRINCIPAL: Injeta o estado dadosBI via props
        return <RelatoriosBI data={dadosBI} />; 
      case "cameras": return <GerenciamentoCameras />;
      case "configuracoes": return <ConfiguracoesIA />;
      default: return <MonitoramentoAoVivo />;
    }
  };

  return (
    <div className="dashboard-seguranca-layout-master">
      <SidebarSeguranca telaAtiva={telaAtiva} setTelaAtiva={setTelaAtiva} />
      <main className="main-viewport-content">{renderizarTelaMestra()}</main>
    </div>
  );
}

export default DashboardSeguranca;