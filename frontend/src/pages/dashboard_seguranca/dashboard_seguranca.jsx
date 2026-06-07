import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Play,
  Square,
  AlertTriangle,
  Eye,
  LogOut,
} from "lucide-react";
import "./dashboard_seguranca.css";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";

function DashboardSeguranca() {
  const [monitorando, setMonitorando] = useState(false);
  const [alertas, setAlertas] = useState([
    {
      id: 1,
      hora: "14:22",
      local: "Zona de Carga - Hangar 2",
      mensagem: "Operador sem Capacete",
      gravidade: "Critico",
    },
    {
      id: 2,
      hora: "13:05",
      local: "Canteiro de Obras - Torre A",
      mensagem: "Uso incorreto do Colete Refletivo",
      gravidade: "Aviso",
    },
  ]);
  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/login");
    });
  };

  return (
    <div className="dashboard-seg-container">
      {/* Barra Superior */}
      <header className="dash-header">
        <div className="dash-logo">
          <ShieldCheck size={28} color="#0f766e" />
          <span>
            SafeWork <small className="badge-modulo">Módulo Segurança</small>
          </span>
        </div>
        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={18} /> Sair do Sistema
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="dash-content">
        <div className="grid-layout">
          {/* Lado Esquerdo: Player de Vídeo / Câmera (Preparado para o YOLO) */}
          <div className="video-card">
            <div className="card-header-status">
              <h3>Câmera em Tempo Real - Feed Principal</h3>
              <span
                className={`status-tag ${monitorando ? "ativo" : "inativo"}`}
              >
                {monitorando ? "IA PROCESSANDO (YOLO)" : "SISTEMA PAUSADO"}
              </span>
            </div>

            {/* Container da Transmissão */}
            <div className="video-stream-placeholder">
              {monitorando ? (
                <div className="video-active-simulation">
                  <div className="yolo-box-simulation">Capacete 98%</div>
                  <div className="yolo-box-error-simulation">
                    Sem Colete 94%
                  </div>
                  <p className="stream-text">Recebendo frames da API...</p>
                </div>
              ) : (
                <div className="video-idle">
                  <Eye size={48} color="#94a3b8" />
                  <p>
                    Inicie o monitoramento para ativar o processamento de visão
                    computacional.
                  </p>
                </div>
              )}
            </div>

            {/* Controles da Câmera */}
            <div className="video-controls">
              {!monitorando ? (
                <button
                  onClick={() => setMonitorando(true)}
                  className="btn-start"
                >
                  <Play size={18} /> Iniciar Monitoramento de EPIs
                </button>
              ) : (
                <button
                  onClick={() => setMonitorando(false)}
                  className="btn-stop"
                >
                  <Square size={18} /> Pausar Transmissão
                </button>
              )}
            </div>
          </div>

          {/* Lado Direito: Painel de Alertas em Tempo Real */}
          <div className="alerts-card">
            <h3>Feed de Ocorrências (IA)</h3>
            <p className="alerts-subtitle">
              Detecções automáticas de não conformidade com as NRs.
            </p>

            <div className="alerts-list">
              {alertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`alert-item ${alerta.gravidade.toLowerCase()}`}
                >
                  <AlertTriangle size={20} className="icon-alert" />
                  <div className="alert-details">
                    <span className="alert-msg">{alerta.mensagem}</span>
                    <span className="alert-meta">
                      {alerta.hora} - {alerta.local}
                    </span>
                  </div>
                  <span className="badge-gravidade">{alerta.gravidade}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardSeguranca;
