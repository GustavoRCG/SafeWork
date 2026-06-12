import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../services/api";
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
  const navigate = useNavigate();
  const [alertas, setAlertas] = useState([]); // Começa com uma lista vazia
  const [carregandoApi, setCarregandoApi] = useState(true);

  // useEffect dispara a função assim que a tela é carregada no navegador
  useEffect(() => {
    async function buscarAlertasDaIA() {
      try {
        // Supondo que a sua rota no FastAPI seja '/alertas' ou '/ocorrencias'
        const resposta = await api.get("/alertas");
        setAlertas(resposta.data); // Atualiza a tela com os dados reais da API
      } catch (erro) {
        console.error("Erro ao conectar com o backend FastAPI:", erro);
      } finally {
        setCarregandoApi(false);
      }
    }

    buscarAlertasDaIA();

    // Configura uma atualização automática (polling) a cada 3 segundos para simular o tempo real da IA
    const intervalo = setInterval(buscarAlertasDaIA, 3000);
    return () => clearInterval(intervalo);
  }, []);

  // ... lógica de logout ...

  return (
    <div className="dash-seg-container">
      {/* ... seu cabeçalho ... */}

      <main className="seg-content">
        <div className="video-section">
          {/* O reprodutor de vídeo que exibe o feed processado pelo YOLO (ex: uma tag <img> consumindo um stream do FastAPI) */}
          <div className="video-card">
            <h3>Feed da Câmara Operacional - Análise YOLOv8</h3>
            <div className="video-placeholder">
              <img
                src="http://localhost:8000/video_feed"
                alt="Stream da IA"
                style={{ width: "100%", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>

        <div className="alerts-section">
          <h3>Alertas Recentes de Não-Conformidade</h3>

          {carregandoApi ? (
            <p>A sincronizar com a base de dados do FastAPI...</p>
          ) : alertas.length === 0 ? (
            <p className="no-alerts">
              Nenhum sinistro detectado pela IA neste momento.
            </p>
          ) : (
            <div className="alerts-list">
              {alertas.map((alerta) => (
                <div key={alerta.id} className="alert-item high-risk">
                  <div className="alert-info">
                    <p className="alert-title">{alerta.infracao} detectada!</p>
                    <p className="alert-meta">
                      Local: {alerta.local} • Horário: {alerta.horario}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default DashboardSeguranca;
