import React, { useState, useEffect } from "react";
import { Settings, X } from "lucide-react";
import api from "../../services/api";

function CadastroSetor({ aoSalvar, aoFechar }) {
  const [nomeSetor, setNomeSetor] = useState("");
  const [nivelRisco, setNivelRisco] = useState("Baixo");
  // Alterado: Começa como null até recuperar o ID do usuário logado
  const [idEmpresa, setIdEmpresa] = useState(null); 
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    // RECUPERAÇÃO DO ID DA EMPRESA LOGADA
    // Tenta buscar as informações do usuário armazenadas no sistema durante o login
    const usuarioLogado = localStorage.getItem("usuario") || sessionStorage.getItem("usuario");
    
    if (usuarioLogado) {
      try {
        const dados = JSON.parse(usuarioLogado);
        // Ajuste a chave (.id_empresa) conforme a estrutura que seu backend devolve no login
        if (dados.id_empresa) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setIdEmpresa(Number(dados.id_empresa));
        } else {
          // Fallback seguro caso a chave mude ou não exista no primeiro nível do objeto
          setIdEmpresa(1); 
        }
      } catch (err) {
        console.error("Erro ao processar dados do usuário logado:", err);
        setIdEmpresa(1);
      }
    } else {
      // Caso não encontre nenhum usuário no storage (ambiente de teste/desenvolvimento)
      setIdEmpresa(1);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro("");

    if (!nomeSetor.trim()) {
      setErro("Por favor, insira o nome do setor.");
      return;
    }

    if (!idEmpresa) {
      setErro("Identificador da empresa não localizado. Refaça o login.");
      return;
    }

    try {
      setEnviando(true);
      
      // Envia os dados estruturados para a API do FastAPI
      await api.post("/api/setores/", {
        nome_setor: nomeSetor.trim(),
        nivel_risco: nivelRisco,
        id_empresa: idEmpresa
      });

      alert("Setor cadastrado com sucesso!");
      aoSalvar(); 
    } catch (err) {
      console.error("Erro ao cadastrar setor:", err);
      setErro("Falha ao comunicar com o servidor. Verifique a conexão.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div 
      className="modal-cadastro-setor-box"
      style={{
        backgroundColor: "#111827",
        padding: "32px",
        borderRadius: "12px",
        border: "1px solid #374151",
        color: "#f3f4f6",
        position: "relative",
        boxSizing: "border-box"
      }}
    >
      <button 
        onClick={aoFechar}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#9ca3af"
        }}
      >
        <X size={20} />
      </button>

      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ display: "inline-flex", padding: "12px", backgroundColor: "rgba(168, 85, 247, 0.1)", borderRadius: "50%", marginBottom: "12px" }}>
          <Settings size={28} color="#a855f7" />
        </div>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.4rem", fontWeight: "bold" }}>Cadastrar Novo Setor</h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>O ambiente será vinculado automaticamente à sua empresa.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Campo: Nome do Setor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>Nome do Setor / Ambiente</label>
          <input 
            type="text" 
            placeholder="Ex: Galpão de Logística, Canteiro A"
            value={nomeSetor}
            onChange={(e) => setNomeSetor(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #4b5563",
              backgroundColor: "#1f2937",
              color: "#fff",
              outline: "none"
            }}
            required
          />
        </div>

        {/* Campo: Nível de Risco */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label style={{ fontSize: "0.85rem", color: "#9ca3af", fontWeight: "500" }}>Grau de Risco Técnico</label>
          <select 
            value={nivelRisco}
            onChange={(e) => setNivelRisco(e.target.value)}
            style={{
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #4b5563",
              backgroundColor: "#1f2937",
              color: "#fff",
              outline: "none",
              cursor: "pointer"
            }}
          >
            <option value="Baixo">Baixo</option>
            <option value="Médio">Médio</option>
            <option value="Alto">Alto</option>
          </select>
        </div>

        {/* FEEDBACK VISUAL INVISÍVEL (Substituiu o Input anterior) */}
        <div style={{ fontSize: "0.75rem", color: "#4b5563", textAlign: "right" }}>
          Empresa Ativa: <span style={{ fontFamily: "monospace" }}>{idEmpresa || "Carregando..."}</span>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <p style={{ color: "#ef4444", fontSize: "0.85rem", margin: "0", fontWeight: "500" }}>
            {erro}
          </p>
        )}

        {/* Ações */}
        <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
          <button 
            type="button" 
            onClick={aoFechar}
            disabled={enviando}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "transparent",
              border: "1px solid #4b5563",
              color: "#9ca3af",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500"
            }}
          >
            Cancelar
          </button>
          
          <button 
            type="submit"
            disabled={enviando || !idEmpresa}
            style={{
              flex: 1,
              padding: "12px",
              backgroundColor: "#a855f7",
              border: "none",
              color: "#fff",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              opacity: (enviando || !idEmpresa) ? 0.7 : 1
            }}
          >
            {enviando ? "Salvando..." : "Salvar Setor"}
          </button>
        </div>

      </form>
    </div>
  );
}

export default CadastroSetor;