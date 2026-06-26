import React, { useState, useEffect } from "react";
import { Video, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import api from "../../services/api";

// Adicionada a propriedade 'cameraExistente' para suportar o modo Edição
function CadastroCamera({ setores, cameraExistente, aoSalvar, aoFechar }) {
  const [nomeCamera, setNomeCamera] = useState("");
  const [idSetor, setIdSetor] = useState(""); 
  const [urlRtsp, setUrlRtsp] = useState("");
  const [modeloIa, setModeloIa] = useState("YOLOv8");
  
  const [mostrarPreview, setMostrarPreview] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [erroStream, setErroStream] = useState("");

  // Efeito para carregar os dados atuais caso seja uma edição
  useEffect(() => {
    if (cameraExistente) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNomeCamera(cameraExistente.nome_camera || "");       
      setIdSetor(cameraExistente.id_setor || "");
      setUrlRtsp(cameraExistente.url_rtsp || "");
      setModeloIa(cameraExistente.modelo_ia_versao || "YOLOv8");
    }
    
   }, [cameraExistente,nomeCamera]);

    
-
  // Monitoramento da URL RTSP para geração do Live Feed via backend
    useEffect(() => {
        if (urlRtsp.toLowerCase() === "webcam" || (urlRtsp.startsWith("rtsp://") && urlRtsp.length > 15)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setErroStream("");
        const urlValidacaoBackend = `${api.defaults.baseURL}/api/cameras/preview?url=${encodeURIComponent(urlRtsp)}`;
        setStreamUrl(urlValidacaoBackend);
        setMostrarPreview(true);
        } else {
        setMostrarPreview(false);
        setStreamUrl("");
        if (urlRtsp.length > 0 && !urlRtsp.startsWith("rtsp://") && urlRtsp.toLowerCase() !== "webcam") {
            setErroStream("A URL deve iniciar obrigatoriamente com 'rtsp://' ou digite 'webcam' para testes.");
        }
        }
    }, [urlRtsp]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nomeCamera || !idSetor || !urlRtsp) {
      setErroStream("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      const payload = {
        id_setor: parseInt(idSetor, 10), 
        nome_camera: nomeCamera.trim(),
        url_rtsp: urlRtsp.trim(),
        status_camera: cameraExistente ? cameraExistente.status_camera : "Ativo", // Preserva status antigo ou inicia ativo
        modelo_ia_versao: modeloIa
      };

      if (cameraExistente) {
        //  Executa o PUT apontando para a ID correta do banco
        await api.put(`/api/cameras/${cameraExistente.id_camera}`, payload);
      } else {
        // MODO CRIAÇÃO: Executa o POST padrão
        await api.post("/api/cameras/", payload);
      }

      aoSalvar();
    } catch (err) {
      console.error("Erro ao persistir dados da câmera:", err);
      setErroStream(err.response?.data?.detail || "Erro ao conectar com o servidor.");
    }
  };

  return (
    <div className="modal-content" style={{
      backgroundColor: "#111827",
      padding: "32px",
      borderRadius: "12px",
      border: "1px solid #374151",
      width: "100%",
      maxWidth: "850px",
      color: "#f3f4f6",
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)"
    }}>
      
      {/* Cabeçalho dinâmico */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Video size={24} color="#a855f7" />
          <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "bold" }}>
            {cameraExistente ? "Editar Configurações da Câmera" : "Integrar Nova Câmera RTSP"}
          </h3>
        </div>
        <button onClick={aoFechar} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}>
          <X size={20} />
        </button>
      </div>

      <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
        
        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>Identificação / Local da Câmera</label>
            <input 
              type="text" 
              placeholder="Ex: Canteiro Setor A, Galpão B"
              value={nomeCamera}
              onChange={(e) => setNomeCamera(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #4b5563", backgroundColor: "#1f2937", color: "#fff", outline: "none" }}
              required
            />
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>Setor de Instalação</label>
              <select 
                value={idSetor}
                onChange={(e) => setIdSetor(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #4b5563", backgroundColor: "#1f2937", color: "#fff", outline: "none", cursor: "pointer" }}
                required
              >
                <option value="" disabled>Selecione um setor...</option>
                {setores && setores.length > 0 ? (
                  setores.map((setor) => (
                    <option key={setor.id_setor} value={setor.id_setor}>
                      {setor.nome_setor || `Setor ${setor.id_setor}`}
                    </option>
                  ))
                ) : (
                  <option disabled value="">Nenhum setor disponível no banco</option>
                )}
              </select>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>Versão do Modelo IA</label>
              <select 
                value={modeloIa}
                onChange={(e) => setModeloIa(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #4b5563", backgroundColor: "#1f2937", color: "#fff", outline: "none", cursor: "pointer" }}
              >
                <option value="YOLOv8">YOLOv8 (SafeWork Default)</option>
                <option value="YOLOv10">YOLOv10</option>
                <option value="Modelo EPI personalizado">Modelo EPI personalizado</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>Endereço de Rede (URL RTSP)</label>
            <input 
              type="text" 
              placeholder="rtsp://usuario:senha@ip_hardware:porta/stream"
              value={urlRtsp}
              onChange={(e) => setUrlRtsp(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "12px", 
                borderRadius: "6px", 
                border: erroStream ? "1px solid #ef4444" : "1px solid #4b5563", 
                backgroundColor: "#1f2937", 
                color: "#fff", 
                outline: "none",
                fontFamily: "monospace",
                fontSize: "0.85rem"
              }}
              required
            />
            {erroStream && (
              <span style={{ color: "#ef4444", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                <ShieldAlert size={14} /> {erroStream}
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
            <button 
              type="button" 
              onClick={aoFechar}
              style={{ flex: 1, padding: "12px", backgroundColor: "transparent", border: "1px solid #4b5563", color: "#9ca3af", borderRadius: "6px", cursor: "pointer", fontWeight: "500" }}
            >
              Cancelar
            </button>
            <button 
              type="submit"
              style={{ flex: 1, padding: "12px", backgroundColor: "#a855f7", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
            >
              {cameraExistente ? "Atualizar Câmera" : "Salvar e Ativar Câmera"}
            </button>
          </div>
        </form>

        {/* Painel da Transmissão */}
        <div style={{ 
          flex: 1, 
          minWidth: "320px", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          alignItems: "center",
          backgroundColor: "#0b0f19",
          borderRadius: "8px",
          border: mostrarPreview ? "2px solid #22c55e" : "1px dashed #374151",
          padding: "16px",
          minHeight: "260px",
          position: "relative"
        }}>
          {mostrarPreview ? (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "absolute", top: "12px", left: "12px", backgroundColor: "rgba(34, 197, 94, 0.2)", color: "#22c55e", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={12} /> Testando Conexão Live Feed
              </div>
              
              {/* 🟢 MODIFICADO: Atributo 'key' adicionado para re-renderizar o stream binário com precisão */}
              <img 
                key={streamUrl}
                src={streamUrl} 
                alt="Live Camera Stream Test" 
                style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "6px", backgroundColor: "#1f2937" }}
                onError={() => setErroStream("Falha ao se conectar à rota RTSP da câmera através do backend.")}
              />
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#9ca3af", textAlign: "center" }}>
                Verifique se os parâmetros de autenticação de hardware estão corretos.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: "#6b7280", padding: "20px" }}>
              <Video size={48} style={{ marginBottom: "12px", opacity: 0.4 }} />
              <p style={{ margin: "0 0 4px 0", fontWeight: "500" }}>Aguardando URL RTSP válida...</p>
              <p style={{ margin: 0, fontSize: "0.8rem" }}>Insira o endereço IP ou a rota de hardware completa para testar a comunicação em tempo real.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default CadastroCamera;