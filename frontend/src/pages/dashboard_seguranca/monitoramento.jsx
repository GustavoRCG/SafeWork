import { useState, useEffect } from "react";
import { Shield, Users, AlertTriangle, Zap, Loader2 } from "lucide-react";
import { auth } from "../../firebaseConfig"; // 💡 IMPORTANTE: Importamos o objeto auth do Firebase para pegar o token atualizado
import api from "../../services/api"; // Instância centralizada do Axios
import "./monitoramento.css";

function MonitoramentoAoVivo() {
  // Estado das métricas superiores
  const [metricas, setMetricas] = useState({
    camerasAtivas: "Buscando...",
    conformidade: "--%",
    alertasCriticos: 0,
    latenciaMedia: "0ms",
  });

  // Estado do feed lateral de eventos
  const [eventos, setEventos] = useState([]);

  // Estado para controlar se o streaming de vídeo está ativo
  const [streamOnline, setStreamOnline] = useState(false);

  useEffect(() => {
    console.log(
      "MonitoramentoAoVivo: Componente montado. Iniciando busca de dados...",
    );

    const atualizarDadosPainel = async () => {
  try {
    console.log("Buscando métricas e eventos no backend com FETCH nativo...");

    // 1️⃣ Força a captura do Token
    const user = auth.currentUser;
    let token = user ? await user.getIdToken() : localStorage.getItem("token_firebase");

    console.log("TOKEN CAPTURADO PELO FRONTEND:", token); // 🚩 OLHE ISSO NO CONSOLE!

    if (!token) {
      console.error("ERRO: Nenhum token foi encontrado no Firebase e nem no LocalStorage.");
      return;
    }

    // 2️⃣ Dispara usando FETCH nativo (elimina qualquer bug da instância do Axios)
    const headers = {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    };

    const [resMetricas, resEventos] = await Promise.all([
      fetch("http://localhost:8000/api/monitoramento/metricas", { method: "GET", headers }),
      fetch("http://localhost:8000/api/monitoramento/eventos", { method: "GET", headers })
    ]);

    // Se o backend der 401 aqui, o erro é 100% no Python (get_current_user)
    if (resMetricas.status === 401 || resEventos.status === 401) {
      console.error("O Backend recusou o token do Firebase com 401 mesmo via Fetch nativo!");
      return;
    }

    const dataMetricas = await resMetricas.json();
    const dataEventos = await resEventos.json();

    console.log("Dados do Fetch recebidos com sucesso!");
    setMetricas(dataMetricas);
    setEventos(dataEventos);
    setStreamOnline(true);

  } catch (err) {
    console.error("Erro crítico na sincronização do painel:", err);
    setStreamOnline(false);
  }
};

    // Executa a primeira carga imediatamente ao abrir o ecrã
    atualizarDadosPainel();

    // Configura o Polling contínuo a cada 3 segundos para manter em tempo real
    const intervalo = setInterval(atualizarDadosPainel, 3000);

    // Limpa o intervalo ao sair do ecrã para evitar vazamentos de memória
    return () => {
      console.log(
        "MonitoramentoAoVivo: Componente desmontado. Limpando intervalos.",
      );
      clearInterval(intervalo);
    };
  }, []);

  // Define a URL do streaming usando o endereço absoluto correto
  const URL_STREAMING_IA = "http://localhost:8000/api/video-stream";

  return (
    <div className="monitoramento-live-container">
      {/* 4 CARDS SUPERIORES DE MÉTRICAS */}
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
            <span className="metric-lbl">FPS YOLOv11</span>
            <span className="metric-val">{metricas.latenciaMedia}</span>
          </div>
        </div>
      </div>

      {/* PAINEL CENTRAL DIVIDIDO (VÍDEO / EVENTOS LATERAIS) */}
      <div className="live-workspace-split">
        <div className="video-stream-wrapper">
          <div className="video-overlay-header">
            <span className="badge-cam-id">
              <span
                className={`live-indicator ${streamOnline ? "online" : "offline"}`}
              ></span>
              {streamOnline ? "STREAMING ATIVO (YOLOv11)" : "AGUARDANDO IA"}
            </span>
            <span
              className={`badge-yolo-detect ${streamOnline ? "active" : "standby"}`}
            >
              {streamOnline ? "LIVE FEED" : "STANDBY"}
            </span>
          </div>

          <div className="mock-video-canvas canvas-placeholder-bg">
            {streamOnline ? (
              <img
                src={URL_STREAMING_IA}
                alt="Pipeline de Monitoramento SafeWork IA"
                className="video-live-feed-img"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => {
                  console.log(
                    "Erro ao renderizar stream de vídeo. Voltando para modo de espera.",
                  );
                  setStreamOnline(false);
                }}
              />
            ) : (
              <div className="waiting-ia-connect">
                <Loader2 className="animate-spin" size={32} color="#64748b" />
                <h3>Aguardando conexão com o pipeline do YOLOv11...</h3>
                <p>
                  O feed de vídeo da webcam será injetado automaticamente ao
                  iniciar o backend em Python.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FEED DE EVENTOS DIREITO */}
        <div className="events-feed-panel">
          <h3 className="feed-title">🛈 Feed de Eventos</h3>
          <div className="feed-scroll-area">
            {eventos.length === 0 ? (
              <p
                style={{
                  color: "#64748b",
                  fontSize: "14px",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                Nenhum evento registrado no momento.
              </p>
            ) : (
              eventos.map((ev) => (
                <div key={ev.id} className="feed-item-card">
                  <div className="feed-item-top">
                    <span
                      className={`badge-severity ${ev.tipo === "CRITICAL" ? "danger" : "warning"}`}
                    >
                      {ev.tipo}
                    </span>
                    <span className="feed-time">{ev.hora}</span>
                  </div>
                  <h4 className="feed-event-name">{ev.titulo}</h4>
                  <div className="feed-item-bottom">
                    <span className="feed-location">{ev.local}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonitoramentoAoVivo;