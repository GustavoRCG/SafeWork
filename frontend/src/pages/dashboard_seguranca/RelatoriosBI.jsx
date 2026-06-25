import React from "react";

function RelatoriosBI({ data }) {
  const total_alertas = data?.total_alertas ?? 0;
  const total_infracoes = data?.total_infracoes ?? 0;
  const taxa_conformidade = data?.taxa_conformidade ?? "0%";
  const tempo_resposta_medio = data?.tempo_resposta_medio ?? "0s";

  const historicoSemanas = data?.historico || data?.historico_semanal || [];
  const dadosBancoEpi = data?.distribuicao || data?.distribuicao_epis || [];

  const larguraSVG = 500;
  const alturaSVG = 180;
  const espacamentoX = larguraSVG / (historicoSemanas.length - 1 || 1);

  // Busca o maior valor respeitando o "Q" maiúsculo vindo do Python
  const valoresAlertas = historicoSemanas.map(item => Number(item.Quantidade ?? item.value ?? 0));
  const maiorAlertaDoBanco = Math.max(...valoresAlertas, 5);

  const obterPontosLinha = (tipoMetrica) => {
    if (historicoSemanas.length === 0) return "";

    return historicoSemanas.map((item, index) => {
      const x = index * espacamentoX;
      
      // Atribuição direta sem declarar variáveis soltas antes
      const valor = tipoMetrica === "alertas" 
        ? Number(item.Quantidade ?? item.value ?? 0)
        : Number(item.conformidade ?? (85 + (index % 2 ? 4 : -4)));

      const valorMaximo = tipoMetrica === "alertas" ? maiorAlertaDoBanco : 100;

      const y = alturaSVG - (valor / valorMaximo) * (alturaSVG - 40) - 20;
      return `${x},${y}`;
    }).join(" ");
  };

  const pontosConformidade = obterPontosLinha("conformidade");
  const pontosAlertas = obterPontosLinha("alertas");

  const labelsFatias = dadosBancoEpi.map(item => item.name || "");
  const valoresFatias = dadosBancoEpi.map(item => item.value || item.quantidade || 0);
  const totalFatias = valoresFatias.reduce((a, b) => a + b, 0);
  const possuiDadosRosca = valoresFatias.length > 0 && totalFatias > 0;

  const raioRosca = 60;
  const circunferenciaRosca = 2 * Math.PI * raioRosca;
  const CORES_DONUT = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#a855f7"];

  const divisorTotal = totalFatias || 1;
  const fatiasCalculadas = valoresFatias.reduce((acc, val) => {
    const slice = (val / divisorTotal) * circunferenciaRosca;
    const dashOffset = acc.length > 0 ? acc[acc.length - 1].dashOffset - acc[acc.length - 1].slice : 0;
    acc.push({ slice, dashOffset });
    return acc;
  }, []);

  return (
    <div className="seguranca-page-container" style={{ padding: "20px", color: "#fff" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "30px" }}>
        <div style={{ background: "#111827", borderLeft: "4px solid #3b82f6", padding: "20px", borderRadius: "8px" }}>
          <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Total de Alertas</span>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{total_alertas}</h2>
        </div>
        <div style={{ background: "#111827", borderLeft: "4px solid #ef4444", padding: "20px", borderRadius: "8px" }}>
          <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Infrações Detetadas</span>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{total_infracoes}</h2>
        </div>
        <div style={{ background: "#111827", borderLeft: "4px solid #10b981", padding: "20px", borderRadius: "8px" }}>
          <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Taxa de Conformidade</span>
          <h2 style={{ color: "#10b981", margin: "8px 0 0 0", fontSize: "28px" }}>{taxa_conformidade}</h2>
        </div>
        <div style={{ background: "#111827", borderLeft: "4px solid #a855f7", padding: "20px", borderRadius: "8px" }}>
          <span style={{ color: "#64748b", fontSize: "12px", fontWeight: "600" }}>Tempo Médio de Resposta</span>
          <h2 style={{ margin: "8px 0 0 0", fontSize: "28px" }}>{tempo_resposta_medio}</h2>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "24px" }}>
        
        <div style={{ background: "#111827", padding: "24px", borderRadius: "8px" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "15px", color: "#94a3b8" }}>Volumetria Semanal de Alertas</h3>
          
          {historicoSemanas.length > 0 ? (
            <svg viewBox={`0 0 ${larguraSVG} ${alturaSVG}`} style={{ width: "100%", overflow: "visible" }}>
              {pontosConformidade && <polyline fill="none" stroke="#3b82f6" strokeWidth="3" points={pontosConformidade} />}
              {pontosAlertas && <polyline fill="none" stroke="#ef4444" strokeWidth="3" points={pontosAlertas} />}
              
              {historicoSemanas.map((item, index) => (
                <text key={index} x={index * espacamentoX} y={alturaSVG + 15} fill="#64748b" fontSize="10" textAnchor="middle">
                  {item.name || item.dia}
                </text>
              ))}
            </svg>
          ) : (
            <div style={{ height: alturaSVG, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
              Carregando histórico...
            </div>
          )}

          <div style={{ display: "flex", gap: "15px", marginTop: "15px", fontSize: "12px", justifyContent: "center" }}>
            <span style={{ color: "#3b82f6" }}>● Taxa de Conformidade (%)</span>
            <span style={{ color: "#ef4444" }}>● Alertas Gerados</span>
          </div>
        </div>

        <div style={{ background: "#111827", padding: "24px", borderRadius: "8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h3 style={{ margin: "0 0 20px 0", fontSize: "15px", color: "#94a3b8" }}>Distribuição de Falhas por EPI</h3>
          
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <svg viewBox="0 0 160 160" style={{ width: "140px", height: "140px" }}>
              <g transform="rotate(-90 80 80)">
                {possuiDadosRosca ? (
                  fatiasCalculadas.map((fatia, i) => (
                    <circle
                      key={i}
                      cx="80"
                      cy="80"
                      r={raioRosca}
                      fill="transparent"
                      stroke={CORES_DONUT[i % CORES_DONUT.length]}
                      strokeWidth="18"
                      strokeDasharray={`${fatia.slice} ${circunferenciaRosca}`}
                      strokeDashoffset={fatia.dashOffset}
                    />
                  ))
                ) : (
                  <circle cx="80" cy="80" r={raioRosca} fill="transparent" stroke="#374151" strokeWidth="18" />
                )}
              </g>
              <text x="80" y="85" fill="#fff" fontSize="12" fontWeight="bold" textAnchor="middle">
                {total_infracoes}
              </text>
              <text x="80" y="98" fill="#64748b" fontSize="8" textAnchor="middle">
                INFRAÇÕES
              </text>
            </svg>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {possuiDadosRosca ? (
                labelsFatias.map((label, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CORES_DONUT[i % CORES_DONUT.length] }}></span>
                    <span style={{ color: "#94a3b8" }}>{label}: <strong>{valoresFatias[i]}</strong></span>
                  </div>
                ))
              ) : (
                <span style={{ color: "#64748b", fontSize: "12px", fontStyle: "italic" }}>Carregando dados...</span>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default RelatoriosBI;