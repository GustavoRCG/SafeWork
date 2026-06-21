import React, { useState, useEffect } from "react";
import api from "../../services/api"; // Sua instância configurada

function RelatoriosBI() {
  const [metricasBI, setMetricasBI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const buscarDadosBI = async () => {
      try {
        setLoading(true);
        
        // 🔐 Rota limpa. O backend sabe quem é o técnico pelo Token anexado à requisição
        const resposta = await api.get("/bi/metricas");
        
        setMetricasBI(resposta.data);
        setErro(null);
      } catch (err) {
        console.error("Erro ao carregar o BI do técnico:", err);
        setErro("Não foi possível carregar os dados de conformidade da sua empresa.");
      } finally {
        setLoading(false);
      }
    };

    buscarDadosBI();
  }, []);

  // Se estiver carregando
  if (loading) return <div className="seguranca-page-container"><p style={{color: '#94a3b8', textAlign: 'center', marginTop: '40px'}}>🔄 Carregando indicadores da sua empresa...</p></div>;

  // Se houver erro
  if (erro || !metricasBI) return <div className="seguranca-page-container"><p style={{color: '#ef4444', textAlign: 'center', marginTop: '40px'}}>⚠️ {erro || "Sem dados para exibir."}</p></div>;

  return (
    // ... O restante do layout HTML/JSX com os cards e as barras do gráfico que montamos antes
    <div className="seguranca-page-container">
      {/* Exemplo de uso dos dados reais nos cards: */}
      {/* {metricasBI.totalOcorrencias} */}
      {/* {metricasBI.turnos?.matutino ?? 0} */}
    </div>
  );
}

export default RelatoriosBI;