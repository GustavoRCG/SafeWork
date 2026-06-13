import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./historico_alertas.css";

function HistoricoAlertas() {
  const [logs] = useState([
    {
      id: "LOG-0824-A",
      data: "28 Mar 2026",
      hora: "14:32:01",
      local: "Frente A",
      cam: "CAM-04",
      infracao: "Falta de Capacete, Falta de Colete",
      severidade: "CRÍTICA",
      status: "Pendente",
    },
    {
      id: "LOG-0823-B",
      data: "28 Mar 2026",
      hora: "11:15:42",
      local: "Galpão C",
      cam: "CAM-02",
      infracao: "Falta de Óculos de Proteção",
      severidade: "ATENÇÃO",
      status: "Tratado",
    },
    {
      id: "LOG-0822-A",
      data: "27 Mar 2026",
      hora: "16:45:12",
      local: "Pátio B",
      cam: "CAM-05",
      infracao: "Acesso à Zona Restrita (Sem Autorização)",
      severidade: "CRÍTICA",
      status: "Tratado",
    },
    {
      id: "LOG-0821-C",
      data: "27 Mar 2026",
      hora: "09:30:00",
      local: "Portaria",
      cam: "CAM-01",
      infracao: "Falta de Máscara de Proteção",
      severidade: "ATENÇÃO",
      status: "Tratado",
    },
  ]);

  return (
    <div className="historico-container">
      <div className="historico-header">
        <div>
          <h2>Evidências e Histórico de Alertas</h2>
          <p className="sub-txt">
            Banco de dados de logs para conformidade com a NR-28.
          </p>
        </div>
        <div className="filter-actions-row">
          <div className="search-bar-wrapper">
            <Search size={16} color="#64748b" />
            <input type="text" placeholder="Buscar log..." />
          </div>
          <button className="btn-filtros-avancados">
            <SlidersHorizontal size={16} /> Filtros Avançados
          </button>
        </div>
      </div>

      <div className="table-glass-wrapper">
        <table className="safework-custom-table">
          <thead>
            <tr>
              <th>EVIDÊNCIA</th>
              <th>DATA/HORA</th>
              <th>LOCALIZAÇÃO</th>
              <th>INFRAÇÃO DETECTADA</th>
              <th>SEVERIDADE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="col-evidencia">
                  <div className="mini-frame-placeholder">🖼️</div>
                  <span className="log-id-txt">{log.id}</span>
                </td>
                <td>
                  <span className="main-td-txt">{log.data}</span>
                  <span className="sub-td-txt">{log.hora}</span>
                </td>
                <td>
                  <span className="main-td-txt">{log.local}</span>
                  <span className="sub-td-txt">{log.cam}</span>
                </td>
                <td className="col-infracao">
                  {log.severidade === "CRÍTICA" ? (
                    <AlertCircle size={14} color="#ef4444" />
                  ) : (
                    <AlertCircle size={14} color="#f59e0b" />
                  )}
                  <span className="main-td-txt">{log.infracao}</span>
                </td>
                <td>
                  <span
                    className={`badge-severity-table ${log.severidade === "CRÍTICA" ? "critica" : "atencao"}`}
                  >
                    {log.severidade}
                  </span>
                </td>
                <td>
                  <div className="status-cell-flex">
                    <span
                      className={`status-dot ${log.status === "Pendente" ? "bg-red" : "bg-green"}`}
                    ></span>
                    <span className="main-td-txt">{log.status}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer-pagination">
          <span>1 a 4 de 128 registros</span>
          <div className="pagination-btns">
            <button disabled>Ant</button>
            <button className="active-page">1</button>
            <button>2</button>
            <button>3</button>
            <button>Próx</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoricoAlertas;
