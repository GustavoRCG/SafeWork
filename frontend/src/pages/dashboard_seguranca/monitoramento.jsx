import { useState } from "react";
import { Shield, Users, AlertTriangle, Zap, Eye, Loader2 } from "lucide-react";
import "./monitoramento.css";

function MonitoramentoAoVivo() {
  const [metricas] = useState({
    camerasAtivas: "0/1 (Aguardando IA)",
    conformidade: "--%",
    alertasCriticos: 0,
    latenciaMedia: "0ms",
  });

  const [eventos] = useState([
    {
      id: 1,
      tipo: "WARNING",
      titulo: "Sistema Iniciado",
      local: "Servidor Local",
      hora: "Agora",
    },
  ]);

  return (
    <div className="monitoramento-live-container">
      <div className="live-metrics-grid">
        <div className="metric-glass-card">
          <div className="metric-icon-side green-circle">
            <Shield size={20} />
          </div>
          <div className="metric-data-side">
            <span className="metric-lbl">Dispositivos</span>
            <span className="metric-val">{metricas.camerasAtivas}</span>
          </div>
        </div>

        <div className="metric-glass-card">
          <div className="metric-icon-side blue-circle">
            <Users size={20} />
          </div>
          <div className="metric-data-side">
            <span className="metric-lbl">Conformidade</span>
            <span className="metric-val">{metricas.conformidade}</span>
          </div>
        </div>

        <div className="metric-glass-card">
          <div className="metric-icon-side red-circle">
            <AlertTriangle size={20} />
          </div>
          <div className="metric-data-side">
            <span className="metric-lbl">Alertas Críticos</span>
            <span className="metric-val">{metricas.alertasCriticos}</span>
          </div>
        </div>

        <div className="metric-glass-card">
          <div className="metric-icon-side yellow-circle">
            <Zap size={20} />
          </div>
          <div className="metric-data-side">
            <span className="metric-lbl">FPS YOLOv8</span>
            <span className="metric-val">{metricas.latenciaMedia}</span>
          </div>
        </div>
      </div>

      <div className="live-workspace-split">
        <div className="video-stream-wrapper">
          <div className="video-overlay-header">
            <span className="badge-cam-id">
              <span className="live-indicator offline"></span>
              STREAMING BACKEND (YOLOv8)
            </span>
            <span className="badge-yolo-detect standby">STANDBY</span>
          </div>

          {/* Container preparado: Quando sua dupla terminar, colocamos a tag <img src="http://localhost:8000/video_feed" /> aqui */}
          <div className="mock-video-canvas canvas-placeholder-bg">
            <div className="waiting-ia-connect">
              <Loader2 className="animate-spin" size={32} color="#64748b" />
              <h3>Aguardando conexão com o pipeline do YOLOv8...</h3>
              <p>
                O feed de vídeo da webcam será injetado automaticamente ao
                iniciar o backend em Python.
              </p>
            </div>
          </div>
        </div>

        <div className="events-feed-panel">
          <h3 className="feed-title">🛈 Feed de Eventos</h3>
          <div className="feed-scroll-area">
            {eventos.map((ev) => (
              <div key={ev.id} className="feed-item-card">
                <div className="feed-item-top">
                  <span className={`badge-severity warning`}>{ev.tipo}</span>
                  <span className="feed-time">{ev.hora}</span>
                </div>
                <h4 className="feed-event-name">{ev.titulo}</h4>
                <div className="feed-item-bottom">
                  <span className="feed-location">{ev.local}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitoramentoAoVivo;
