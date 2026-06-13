import { useState, useEffect } from "react";
import SidebarSeguranca from "./sidebar_seguranca";
import "./dashboard_seguranca.css";
import MonitoramentoAoVivo from "./monitoramento";

// ==========================================
// COMPONENTE: HISTÓRICO DE ALERTAS
// ==========================================
function HistoricoAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarAlertasDaAPI = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        const dadosSimulados = [
          {
            id: "ALT-9042",
            timestamp: "12/06/2026 21:14:02",
            camera: "Câmera Galpão C",
            classe: "Ausência de Capacete",
            criticidade: "Crítico",
            status: "Pendente",
          },
          {
            id: "ALT-9041",
            timestamp: "12/06/2026 20:45:18",
            camera: "Webcam Local",
            classe: "Ausência de Colete",
            criticidade: "Moderado",
            status: "Revisado",
          },
          {
            id: "ALT-9040",
            timestamp: "12/06/2026 18:22:10",
            camera: "Câmera Entrada",
            classe: "Ausência de Capacete",
            criticidade: "Crítico",
            status: "Revisado",
          },
        ];
        setAlertas(dadosSimulados);
        setErro(null);
      } catch (err) {
        setErro(err.message || "Erro ao conectar com o banco de dados.");
      } finally {
        setLoading(false);
      }
    };
    buscarAlertasDaAPI();
  }, []);

  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">
          🚨 Histórico de Alertas de Não-Conformidade
        </h2>
        <p className="page-subtitle-text">
          Logs de auditoria em tempo real sincronizados com o banco de dados.
        </p>
      </div>

      {loading && (
        <div className="api-status-container animate-pulse">
          <div className="spinner-tech"></div>
          <p>Buscando registros no banco de dados...</p>
        </div>
      )}

      {erro && (
        <div className="api-status-container status-erro">
          <p>❌ Erro de Conexão: {erro}</p>
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
              {alertas.map((alerta) => (
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
              ))}
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
  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">📊 Relatórios de Performance e BI</h2>
        <p className="page-subtitle-text">
          Métricas consolidadas de incidentes para apoio à conformidade.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: GERENCIAMENTO DE CÂMERAS
// ==========================================
function GerenciamentoCameras() {
  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">
          🎥 Gerenciamento de Câmeras Cadastradas
        </h2>
        <p className="page-subtitle-text">
          Status operacional dos dispositivos integrados.
        </p>
      </div>
    </div>
  );
}

// ==========================================
// COMPONENTE: CONFIGURAÇÕES DA IA
// ==========================================
function ConfiguracoesIA() {
  return (
    <div className="seguranca-page-container">
      <div className="page-header-block">
        <h2 className="page-title-text">
          ⚙️ Ajustes de Parâmetros de Inferência
        </h2>
        <p className="page-subtitle-text">
          Configurações dos limiares de acurácia da inteligência artificial.
        </p>
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
