import { useState, useEffect } from "react";
import SidebarSeguranca from "./sidebar_seguranca";
import "./dashboard_seguranca.css";
import MonitoramentoAoVivo from "./monitoramento";
// Importação da sua instância centralizada do Axios
import api from "../../services/api";

// ==========================================
// COMPONENTE: HISTÓRICO DE ALERTAS (POSTGRESQL VIA AXIOS)
// ==========================================
function HistoricoAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarAlertasDoPostgres = async () => {
      try {
        setLoading(true);
        // GET alinhado com o prefixo '/api' do backend modular
        const response = await api.get("/api/alertas");
        setAlertas(response.data);
        setErro(null);
      } catch (err) {
        console.error("Erro ao buscar alertas:", err);
        const msg =
          err.response?.data?.detail ||
          err.message ||
          "Erro ao conectar ao PostgreSQL.";
        setErro(msg);
      } finally {
        setLoading(false);
      }
    };
    buscarAlertasDoPostgres();
  }, []);

  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">
          🚨 Histórico de Alertas de Não-Conformidade
        </h2>
        <p className="page-subtitle-text">
          Logs de auditoria sincronizados via Axios com o banco de dados
          PostgreSQL.
        </p>
      </div>

      {loading && (
        <div className="api-status-container animate-pulse">
          <div className="spinner-tech"></div>
          <p>Buscando registros no PostgreSQL...</p>
        </div>
      )}

      {erro && (
        <div className="api-status-container status-erro">
          <p>❌ Erro de Sistema: {erro}</p>
        </div>
      )}

      {!loading && !erro && (
        <div className="cameras-table-wrapper">
          <table className="cameras-data-table">
            <thead>
              <tr>
                <th>ID REGISTRO</th>
                <th>DATA / HORA</th>
                <th>DISPOSITIVO</th>
                <th>INFRAÇÃO DETECTADA</th>
                <th>CRITICIDADE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {alertas.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      color: "#64748b",
                      padding: "20px",
                    }}
                  >
                    Nenhum registro de infração encontrado no banco de dados.
                  </td>
                </tr>
              ) : (
                alertas.map((alerta) => (
                  <tr key={alerta.id}>
                    <td className="td-monospace-code">{alerta.id}</td>
                    <td className="td-dimmed-text">{alerta.timestamp}</td>
                    <td className="td-highlight-name">{alerta.camera}</td>
                    <td>
                      <span className="badge-infracao">{alerta.classe}</span>
                    </td>
                    <td>
                      <span
                        className={`badge-criticidade ${alerta.criticidade === "Crítico" ? "critico" : "moderado"}`}
                      >
                        {alerta.criticidade}
                      </span>
                    </td>
                    <td>
                      <div className="status-indicator-flex">
                        <span
                          className={`status-led-dot ${alerta.status === "Pendente" ? "led-online" : "led-offline"}`}
                        ></span>
                        <span
                          className={
                            alerta.status === "Pendente"
                              ? "text-danger"
                              : "td-dimmed-text"
                          }
                        >
                          {alerta.status}
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
// COMPONENTE: RELATÓRIOS & BI
// ==========================================
function RelatoriosBI() {
  const metricasBI = {
    totalOcorrencias: 142,
    taxaConformidade: "94.2%",
    tempoMedioResposta: "14 min",
    classeMaisFrequente: "Ausência de Capacete",
  };

  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">📊 Relatórios de Performance e BI</h2>
        <p className="page-subtitle-text">
          Métricas consolidadas de incidentes para apoio à conformidade e
          auditorias NR-28.
        </p>
      </div>

      <div className="bi-metrics-summary-grid">
        <div className="bi-summary-card">
          <span className="bi-card-label">Total de Ocorrências</span>
          <h3 className="bi-card-value text-danger">
            {metricasBI.totalOcorrencias}
          </h3>
        </div>
        <div className="bi-summary-card">
          <span className="bi-card-label">Índice de Conformidade</span>
          <h3 className="bi-card-value text-success">
            {metricasBI.taxaConformidade}
          </h3>
        </div>
        <div className="bi-summary-card">
          <span className="bi-card-label">Média de Resposta</span>
          <h3 className="bi-card-value text-warning">
            {metricasBI.tempoMedioResposta}
          </h3>
        </div>
        <div className="bi-summary-card">
          <span className="bi-card-label">Maior Recorrência</span>
          <h3
            className="bi-card-value text-danger"
            style={{ fontSize: "16px", marginTop: "14px" }}
          >
            {metricasBI.classeMaisFrequente}
          </h3>
        </div>
      </div>

      <div className="bi-chart-wrapper-box" style={{ marginTop: "24px" }}>
        <h3 className="chart-section-title">
          Volumetria de Não-Conformidades por Turno
        </h3>
        <div className="bi-mock-bar-chart">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              34
            </span>
            <div className="chart-bar bar-turno-a"></div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
            }}
          >
            <span
              style={{
                color: "#ef4444",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              88
            </span>
            <div className="chart-bar bar-turno-b"></div>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              20
            </span>
            <div className="chart-bar bar-turno-c"></div>
          </div>
        </div>
        <div className="chart-labels-row">
          <span>Turno Matutino (A)</span>
          <span>Turno Vespertino (B)</span>
          <span>Turno Noturno (C)</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: GERENCIAMENTO DE CÂMERAS (POSTGRESQL VIA AXIOS)
// ==========================================
function GerenciamentoCameras() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buscarCameras = async () => {
      try {
        setLoading(true);
        // GET atualizado com prefixo '/api'
        const response = await api.get("/api/cameras");
        setCameras(response.data);
      } catch (err) {
        console.error("Erro ao buscar câmeras do banco:", err);
      } finally {
        setLoading(false);
      }
    };
    buscarCameras();
  }, []);

  return (
    <div className="seguranca-page-container">
      <div className="page-header-flex-row">
        <div className="page-header-block">
          <h2 className="page-title-text">
            🎥 Gerenciamento de Câmeras Cadastradas
          </h2>
          <p className="page-subtitle-text">
            Status operacional e mapeamento de fluxos integrados vindos do
            PostgreSQL.
          </p>
        </div>
        <button
          className="btn-add-dispositivo"
          onClick={() =>
            alert("Abrir modal de cadastro para enviar POST /api/cameras")
          }
        >
          + Adicionar Câmera
        </button>
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
                  <td
                    colSpan="5"
                    style={{ textAlign: "center", color: "#64748b" }}
                  >
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
                        <span
                          className={`status-led-dot ${cam.status === "Online" || cam.status === "ONLINE" ? "led-online" : "led-offline"}`}
                        ></span>
                        <span
                          className={
                            cam.status === "Online" || cam.status === "ONLINE"
                              ? "text-success"
                              : "td-dimmed-text"
                          }
                        >
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

  // Busca as configurações atuais salvas ao carregar a tela
  useEffect(() => {
    const buscarConfiguracoesia = async () => {
      try {
        // Rota atualizada com prefixo '/api'
        const response = await api.get("/api/configuracoes-ia");
        if (response.data) {
          setConfianca(response.data.confianca_minima);
          setRegras(response.data.regras);
        }
      } catch (err) {
        console.error(
          "Não foi possível carregar as configurações salvas, usando padrão.",
        );
      }
    };
    buscarConfiguracoesia();
  }, []);

  const handleSalvarConfig = async (e) => {
    e.preventDefault();
    try {
      setSalvando(true);
      // POST atualizado para persistir via camada Repository na rota /api/configuracoes-ia
      await api.post("/api/configuracoes-ia", {
        confianca_minima: parseInt(confianca),
        regras: regras,
      });
      alert(
        `Parâmetros sincronizados com sucesso no PostgreSQL! Threshold fixado em ${confianca}%.`,
      );
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
        <h2 className="page-title-text">
          ⚙️ Ajustes de Parâmetros de Inferência
        </h2>
        <p className="page-subtitle-text">
          Configurações dos limiares de acurácia e parâmetros salvos diretamente
          no PostgreSQL.
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
              Filtra inferências do modelo. Valores maiores evitam falsos
              positivos.
            </p>
          </div>

          <div className="form-group-checkboxes">
            <h3 className="checkboxes-section-title">
              EPIs Mapeados no Pipeline Ativo
            </h3>
            <div className="checkbox-options-stack">
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.capacete}
                  onChange={(e) =>
                    setRegras({ ...regras, capacete: e.target.checked })
                  }
                />
                Auditar Uso de Capacete (Classe 0)
              </label>
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.colete}
                  onChange={(e) =>
                    setRegras({ ...regras, colete: e.target.checked })
                  }
                />
                Auditar Uso de Colete Refletivo (Classe 1)
              </label>
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.luvas}
                  onChange={(e) =>
                    setRegras({ ...regras, luvas: e.target.checked })
                  }
                />
                Detectar Luvas de Proteção Dedicadas
              </label>
              <label className="checkbox-option-item">
                <input
                  type="checkbox"
                  checked={regras.zonaRisco}
                  onChange={(e) =>
                    setRegras({ ...regras, zonaRisco: e.target.checked })
                  }
                />
                Alertar Invasão de Perímetro (Zonas de Risco)
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit-settings"
            disabled={salvando}
          >
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
        return <HistoricoAlertas />;
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
