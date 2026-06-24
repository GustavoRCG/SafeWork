import { useState, useEffect } from "react";
// Ícones correspondentes à nova interface (Lucide)
import { Search, SlidersHorizontal, AlertTriangle, X, Image } from "lucide-react";
import api from "../../services/api";
import { auth } from "../../firebaseConfig";
import "./historico_alertas.css";

function HistoricoAlertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  // 📸 Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState("");
  const [dadosOcorrencia, setDadosOcorrencia] = useState(null);

  // Fallback para a URL do backend do FastAPI
  const baseURL = api.defaults.baseURL || "http://localhost:8000";

  useEffect(() => {
    const buscarAlertasDoPostgres = async (token) => {
      try {
        setLoading(true);
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
        const response = await api.get("/api/alertas", config);
        setAlertas(response.data);
        setErro(null);
      } catch (err) {
        console.error("Erro ao buscar alertas:", err);
        setErro(err.response?.data?.detail || err.message || "Erro ao conectar ao PostgreSQL.");
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdToken();
        buscarAlertasDoPostgres(token);
      } else {
        setErro("Usuário não autenticado no Firebase.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔄 Função para abrir a imagem mapeando os campos dinamicamente
  const abrirEvidencia = (alerta) => {
  // 🔍 PASSO IMPORTANTE:
  // Abra o seu sistema no navegador, aperte a tecla F12, clique na aba "Console".
  // Depois, clique em qualquer linha da tabela e veja o objeto expandido que vai aparecer aqui!
  console.log("=== DIAGNÓSTICO DO ALERTA POSTGRES ===");
  console.log(alerta);
  console.log("======================================");

  // Tentativa ampla de mapeamento de propriedades comuns
  const nomeArquivo = alerta.foto_url || alerta.foto || alerta.evidencia || alerta.imagem || alerta.caminho;
  
  if (nomeArquivo) {
    setImagemSelecionada(`${baseURL}/static/alertas/${nomeArquivo}`);
  } else {
    // Mantém o ID como tentativa às cegas
    setImagemSelecionada(`${baseURL}/static/alertas/${alerta.id}.jpg`);
  }
  
  setDadosOcorrencia(alerta);
  setModalAberto(true);
};

  return (
    <div className="seguranca-page-container">
      {/* Header com os novos filtros */}
      <div className="page-header-flex-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div className="page-header-block">
          <h2 className="page-title-text">Evidências e Histórico de Alertas</h2>
          <p className="page-subtitle-text">Banco de dados de logs para conformidade com a NR-28.</p>
        </div>
        
        {/* Barra de pesquisa da nova interface */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input type="text" placeholder="Buscar log..." style={{ padding: "8px 12px 8px 38px", borderRadius: "6px", border: "1px solid #334155", backgroundColor: "#0f172a", color: "#fff" }} />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", borderRadius: "6px", backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155", cursor: "pointer" }}>
            <SlidersHorizontal size={16} /> Filtros Avançados
          </button>
        </div>
      </div>

      {loading && <p style={{ color: "#94a3b8" }}>Carregando logs...</p>}
      {erro && <p style={{ color: "#ef4444" }}>{erro}</p>}

      {!loading && !erro && (
        <div className="cameras-table-wrapper">
          <table className="cameras-data-table">
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
              {alertas.map((alerta) => (
                <tr 
                  key={alerta.id} 
                  onClick={() => abrirEvidencia(alerta)} 
                  className="linha-clicavel-auditoria"
                  style={{ cursor: "pointer" }}
                >
                  {/* Coluna da Miniatura com Ícone clicável */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "40px", height: "30px", backgroundColor: "#1e293b", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Image size={16} style={{ color: "#38bdf8" }} />
                      </div>
                      <span className="td-monospace-code" style={{ color: "#38bdf8" }}>{alerta.id}</span>
                    </div>
                  </td>
                  <td className="td-dimmed-text">{alerta.timestamp || alerta.data_hora}</td>
                  <td>
                    <div>{alerta.localizacao || alerta.camera || alerta.dispositivo}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>CAM-01</div>
                  </td>
                  <td>
                    <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f87171" }}>
                      <AlertTriangle size={14} /> {alerta.classe || alerta.infracao || alerta.infracao_detectada}
                    </span>
                  </td>
                  <td>
                    <span className={`badge-criticidade ${String(alerta.criticidade || alerta.severidade).toLowerCase() === "crítico" ? "critico" : "moderado"}`}>
                      {alerta.criticidade || alerta.severidade || "MODERADO"}
                    </span>
                  </td>
                  <td>
                    <div className="status-indicator-flex">
                      <span className={`status-led-dot ${alerta.status === "Pendente" ? "led-online" : "led-offline"}`}></span>
                      <span className={alerta.status === "Pendente" ? "text-danger" : "td-dimmed-text"}>
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

      {/* 🔍 MODAL DE EVIDÊNCIA */}
      {modalAberto && dadosOcorrencia && (
        <div className="modal-overlay-backdrop" onClick={() => setModalAberto(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div className="modal-content-wrapper" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "24px", width: "500px", maxWidth: "90%" }}>
            <div className="modal-header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ color: "#fff", margin: 0 }}>Evidência Tecnológica — {dadosOcorrencia.id}</h3>
              <button className="btn-close-modal" onClick={() => setModalAberto(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-media-container" style={{ width: "100%", height: "280px", backgroundColor: "#020617", borderRadius: "8px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <img 
                src={imagemSelecionada} 
                alt="Flagrante Detectado pela IA" 
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => {
                  // Caso dê 404 com o ID em caixa alta (ALT-792), tenta alternar para caixa baixa (alt-792) ou o ID numérico limpo
                  const apenasNumeros = String(dadosOcorrencia.id).replace(/\D/g, "");
                  const urlFallbackMinusculo = `${baseURL}/static/alertas/${String(dadosOcorrencia.id).toLowerCase()}.jpg`;
                  const urlFallbackNumerico = `${baseURL}/static/alertas/${apenasNumeros}.jpg`;

                  if (e.target.src !== urlFallbackMinusculo) {
                    e.target.src = urlFallbackMinusculo;
                  } else if (e.target.src !== urlFallbackNumerico && apenasNumeros) {
                    e.target.src = urlFallbackNumerico;
                  } else {
                    e.target.onerror = null; 
                    e.target.src = "https://via.placeholder.com/640x480/1e293b/94a3b8?text=Imagem+Nao+Encontrada+no+Servidor";
                  }
                }}
              />
            </div>

            <div className="modal-details-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "14px", color: "#94a3b8" }}>
              <div><strong>Dispositivo:</strong> <span style={{ color: "#fff" }}>{dadosOcorrencia.localizacao || dadosOcorrencia.camera || dadosOcorrencia.dispositivo}</span></div>
              <div><strong>Infração:</strong> <span style={{ color: "#f87171" }}>{dadosOcorrencia.classe || dadosOcorrencia.infracao || dadosOcorrencia.infracao_detectada}</span></div>
              <div><strong>Data/Hora:</strong> <span style={{ color: "#fff" }}>{dadosOcorrencia.timestamp || dadosOcorrencia.data_hora}</span></div>
              <div><strong>Status:</strong> <span style={{ color: dadosOcorrencia.status === "Pendente" ? "#f87171" : "#10b981" }}>⚠️ {dadosOcorrencia.status}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistoricoAlertas;