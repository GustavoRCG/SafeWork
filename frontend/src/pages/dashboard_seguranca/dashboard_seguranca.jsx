import { useState, useEffect } from "react";
import SidebarSeguranca from "./sidebar_seguranca";
import MonitoramentoAoVivo from "./monitoramento";
import HistoricoAlertas from "./historico_alertas"; // 👈 IMPORTANTE: Certifique-se de que o arquivo tem esse nome na mesma pasta
import RelatoriosBI from "./RelatoriosBI";         // 👈 IMPORTANTE: Se o seu arquivo de relatórios estiver separado, importe-o assim
import api from "../../services/api";
import { auth } from "../../firebaseConfig";
import "./dashboard_seguranca.css";

// ==========================================
// COMPONENTE: GERENCIAMENTO DE CÂMERAS (POSTGRESQL VIA AXIOS)
// ==========================================
function GerenciamentoCameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarCameras = async (token) => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
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
          <p className="page-subtitle-text">
            Status operacional e mapeamento de fluxos integrados vindos do PostgreSQL.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="api-status-container">
          <p>Carregando fluxos de vídeo...</p>
        </div>
      ) : (
        <div className="cameras-table-wrapper">
          <table className="cameras-data-table">
            <thead>
              <tr>
                <th>ID FLUXO</th>
                <th>IDENTIFICAÇÃO</th>
                <th>ENDEREÇO DE REDE (IP/RTSP)</th>
                <th>ZONA DE AUDITORIA</th>
                <th>STATUS DE CAPTURA</th>
              </tr>
            </thead>
            <tbody>
              {cameras.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "#64748b" }}>
                    Nenhuma câmera registrada.
                  </td>
                </tr>
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
                        <span className={cam.status === "Online" || cam.status === "ONLINE" ? "text-success" : "td-dimmed-text"}>
                          {cam.status}
                        </span>
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
// COMPONENTE: CONFIGURAÇÕES DA IA (POST VIA AXIOS)
// ==========================================
function ConfiguracoesIA() {
  const [confianca, setConfianca] = useState(65);
  const [regras, setRegras] = useState({
    capacete: true,
    colete: true,
    luvas: false,
    zonaRisco: true,
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const buscarConfiguracoesia = async (token) => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await api.get("/api/configuracoes-ia", config);
        if (response.data) {
          setConfianca(response.data.confianca_minima);
          setRegras(response.data.regras);
        }
      } catch (err) {
        console.error("Não foi possível carregar as configurações salvas, usando padrão.");
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
      if (!user) {
        alert("Sessão expirada. Faça login novamente.");
        return;
      }
      const token = await user.getIdToken();
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await api.post("/api/configuracoes-ia", {
        confianca_minima: parseInt(confianca),
        regras: regras,
      }, config);

      alert(`Parâmetros sincronizados com sucesso no PostgreSQL! Threshold fixado em ${confianca}%.`);
    } catch (err) {
      console.error("Erro ao salvar parâmetros da IA:", err);
      alert("Falha ao salvar parâmetros no servidor.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">⚙️ Ajustes de Parâmetros de Inferência</h2>
        <p className="page-subtitle-text">
          Configurações dos limiares de acurácia e parâmetros salvos diretamente no PostgreSQL.
        </p>
      </div>

      <div className="ia-settings-card-form">
        <form onSubmit={handleSalvarConfig}>
          <div className="form-group-slider">
            <div className="slider-labels-flex">
              <label>Confiança Mínima de Detecção (Confidence Threshold)</label>
              <span className="slider-badge-value">{confianca}%</span>
            </div>
            <input
              type="range"
              min="35"
              max="95"
              value={confianca}
              onChange={(e) => setConfianca(e.target.value)}
              className="custom-range-input"
            />
            <p className="form-input-help-text">
              Filtra inferências do modelo. Valores maiores evitam falsos positivos.
            </p>
          </div>

          <div className="form-group-checkboxes">
            <h3 className="checkboxes-section-title">EPIs Mapeados no Pipeline Ativo</h3>
            <div className="checkbox-options-stack">
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.capacete}
                  onChange={(e) => setRegras({ ...regras, capacete: e.target.checked })}
                />
                Auditar Uso de Capacete (Classe 0)
              </label>
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.colete}
                  onChange={(e) => setRegras({ ...regras, colete: e.target.checked })}
                />
                Auditar Uso de Colete Refletivo (Classe 1)
              </label>
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.luvas}
                  onChange={(e) => setRegras({ ...regras, luvas: e.target.checked })}
                />
                Detectar Luvas de Proteção Dedicadas
              </label>
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.zonaRisco}
                  onChange={(e) => setRegras({ ...regras, zonaRisco: e.target.checked })}
                />
                Alertar Invasão de Perímetro (Zonas de Risco)
              </label>
            </div>
          </div>

          <button type="submit" className="btn-submit-settings" disabled={salvando}>
            {salvando ? "Sincronizando..." : "Aplicar Parâmetros no Pipeline"}
          </button>
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

  const renderizarTelaMestra = () => {
    switch (telaAtiva) {
      case "monitoramento":
        return <MonitoramentoAoVivo />;
      case "historico":
        return <HistoricoAlertas />; // 👈 Vai renderizar o componente dinâmico importado do arquivo isolado
      case "relatorios":
        return <RelatoriosBI />;
      case "cameras":
        return <GerenciamentoCameras />;
      case "configuracoes":
        return <ConfiguracoesIA />;
      default:
        return <MonitoramentoAoVivo />;
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