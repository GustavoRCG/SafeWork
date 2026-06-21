import React, { useState } from "react";
import "./cadastro_empresa.css";

export default function CadastroEmpresa() {
  const [step, setStep] = useState(1);
  const [idEmpresaCriada, setIdEmpresaCriada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [metodoSelecionado, setMetodoSelecionado] = useState("");

  // Estados para as validações e controle de exibição de senha
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaErro, setSenhaErro] = useState("");
  const [cnpjErro, setCnpjErro] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  // Dados do formulário mapeados em conformidade com o Postgres
  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj: "",
    senha: "",
    id_plano: null,
    titular_nome: "",
    numero_mascarado: "",
  });

  // Função para formatar e mascarar o CNPJ automaticamente
  const formatCnpj = (value) => {
    const rawValue = value.replace(/\D/g, "").slice(0, 14);
    return rawValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // FUNÇÃO QUE CONSULTA O CNPJ REAL NA API
  const consultarCnpjReal = async (cnpjLimpo) => {
    setLoadingCnpj(true);
    setCnpjErro("");
    try {
      const response = await fetch(
        `https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`,
      );

      if (response.ok) {
        const data = await response.json();
        setFormData((prev) => ({
          ...prev,
          razao_social:
            data.razao_social || data.nome_fantasia || prev.razao_social,
        }));
        setCnpjErro("");
      } else {
        setCnpjErro(
          "CNPJ válido estruturalmente, mas não encontrado na Receita Federal.",
        );
      }
    } catch (err) {
      console.error("Erro ao consultar BrasilAPI", err);
    } finally {
      setLoadingCnpj(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cnpj") {
      const maskedCnpj = formatCnpj(value);
      const cnpjLimpo = maskedCnpj.replace(/\D/g, "");

      setFormData((prev) => ({ ...prev, cnpj: maskedCnpj }));

      if (cnpjLimpo.length === 14) {
        if (/^(\d)\1+$/.test(cnpjLimpo)) {
          setCnpjErro("CNPJ Inválido (Sequência repetida).");
        } else {
          consultarCnpjReal(cnpjLimpo);
        }
      } else {
        setCnpjErro("");
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Avaliar a força da senha
  const avaliarForcaSenha = (senha) => {
    if (!senha) return { label: "", color: "", score: 0 };

    let score = 0;
    if (senha.length >= 8) score += 1;
    if (/[A-Za-z]/.test(senha) && /\d/.test(senha)) score += 1;
    if (/[^A-Za-z0-9]/.test(senha)) score += 1;

    if (senha.length < 8)
      return {
        label: "Muito Curta (mín. 8 caracteres)",
        color: "#ef4444",
        score: 1,
      };
    if (score === 1)
      return {
        label: "Fraca (misture letras e números)",
        color: "#f97316",
        score: 1,
      };
    if (score === 2) return { label: "Média", color: "#eab308", score: 2 };
    return { label: "Forte 🔒", color: "#22c55e", score: 3 };
  };

  // PASSO 1: Criar empresa e senha master no banco
  const handleCadastroEmpresa = async (e) => {
    e.preventDefault();
    setSenhaErro("");

    const cnpjLimpo = formData.cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      setCnpjErro("Por favor, insira um CNPJ válido com 14 dígitos.");
      return;
    }

    // Validação de segurança da senha
    if (
      formData.senha.length < 8 ||
      !/[A-Za-z]/.test(formData.senha) ||
      !/\d/.test(formData.senha)
    ) {
      setSenhaErro(
        "A senha deve conter pelo menos 8 caracteres, incluindo letras e números.",
      );
      return;
    }

    // ✅ VALIDAÇÃO CORRIGIDA: Comparação direta e limpa de strings
    if (formData.senha.trim() !== confirmarSenha.trim()) {
      setSenhaErro("As senhas não coincidem!");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razao_social: formData.razao_social,
          cnpj: cnpjLimpo,
          senha: formData.senha,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIdEmpresaCriada(data.id_empresa);
        setStep(2);
      } else {
        alert(`Erro: ${data.detail || "Falha ao cadastrar empresa."}`);
      }
    } catch (err) {
      alert("Não foi possível conectar ao servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  // PASSO 3: Salvar o plano e o método de pagamento no banco
  const handleFinalizarContratacao = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8000/empresas/${idEmpresaCriada}/vincular-pagamento`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_plano: formData.id_plano,
            tipo_metodo: metodoSelecionado,
            titular_nome:
              metodoSelecionado === "Cartao"
                ? formData.titular_nome
                : "CLIENTE PIX",
            numero_mascarado:
              metodoSelecionado === "Cartao"
                ? formData.numero_mascarado.slice(-4)
                : "PIX",
          }),
        },
      );

      if (response.ok) {
        alert("Assinatura Ativada com Sucesso!");
        window.location.href = "/login";
      } else {
        alert("Houve um problema ao processar seu pagamento.");
      }
    } catch (err) {
      alert("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const forcaSenha = avaliarForcaSenha(formData.senha);

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <div className="brand-logo">
          <span className="logo-text-top">
            SAFE<span style={{ color: "#dc2626" }}>WORK</span>
          </span>
          <span className="logo-sub">Visão Computacional</span>
        </div>
        <div className="step-indicator">Etapa {step} de 3</div>
      </header>

      <main className="onboarding-main">
        {/* PASSO 1: DADOS DA EMPRESA E SENHA MASTER */}
        {step === 1 && (
          <div className="onboarding-card">
            <h2 className="card-title">Comece a proteger sua operação</h2>
            <p className="card-subtitle">
              Insira os dados cadastrais e defina uma senha de acesso master.
            </p>

            <form onSubmit={handleCadastroEmpresa} className="onboarding-form">
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  required
                  placeholder="00.000.000/0001-00"
                  className="form-input"
                  style={{ borderColor: cnpjErro ? "#ef4444" : "" }}
                />
                {loadingCnpj && (
                  <p
                    style={{
                      color: "#38bdf8",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    🔍 Buscando dados na Receita Federal...
                  </p>
                )}
                {cnpjErro && (
                  <p
                    style={{
                      color: "#ef4444",
                      fontSize: "13px",
                      marginTop: "4px",
                    }}
                  >
                    ❌ {cnpjErro}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Razão Social / Nome Fantasia
                </label>
                <input
                  type="text"
                  name="razao_social"
                  value={formData.razao_social}
                  onChange={handleChange}
                  required
                  placeholder={
                    loadingCnpj ? "Buscando..." : "SafeWork Tecnologia LTDA"
                  }
                  className="form-input"
                  disabled={loadingCnpj}
                />
              </div>

              {/* 🔑 SENHA MASTER */}
              <div className="form-group">
                <label className="form-label">Senha Master de Acesso</label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type={verSenha ? "text" : "password"}
                    name="senha"
                    value={formData.senha}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 8 caracteres (Letras e Números)"
                    className="form-input"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha(!verSenha)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#94a3b8",
                      userSelect: "none",
                    }}
                  >
                    {verSenha ? "✕" : "👁"}
                  </button>
                </div>

                {formData.senha && (
                  <div style={{ marginTop: "6px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        color: forcaSenha.color,
                        fontWeight: "bold",
                      }}
                    >
                      Segurança: {forcaSenha.label}
                    </div>
                    <div
                      style={{ display: "flex", gap: "4px", marginTop: "4px" }}
                    >
                      <div
                        style={{
                          height: "4px",
                          flex: 1,
                          backgroundColor:
                            forcaSenha.score >= 1
                              ? forcaSenha.color
                              : "#1e293b",
                          borderRadius: "2px",
                        }}
                      ></div>
                      <div
                        style={{
                          height: "4px",
                          flex: 1,
                          backgroundColor:
                            forcaSenha.score >= 2
                              ? forcaSenha.color
                              : "#1e293b",
                          borderRadius: "2px",
                        }}
                      ></div>
                      <div
                        style={{
                          height: "4px",
                          flex: 1,
                          backgroundColor:
                            forcaSenha.score >= 3
                              ? forcaSenha.color
                              : "#1e293b",
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* 🔄 CONFIRMAÇÃO DE SENHA */}
              <div className="form-group">
                <label className="form-label">Confirme a Senha Master</label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type={verConfirmarSenha ? "text" : "password"}
                    name="confirmarSenha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="form-input"
                    style={{ paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setVerConfirmarSenha(!verConfirmarSenha)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "16px",
                      color: "#94a3b8",
                      userSelect: "none",
                    }}
                  >
                    {verConfirmarSenha ? "✕" : "👁"}
                  </button>
                </div>
              </div>

              {/* Erros Globais */}
              {senhaErro && (
                <p
                  style={{
                    color: "#ef4444",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    padding: "10px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  ⚠️ {senhaErro}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || loadingCnpj}
                className="btn-primary"
              >
                {loading ? "Processando..." : "Avançar para Escolha do Plano"}
              </button>
            </form>
          </div>
        )}

        {/* PASSO 2: SELEÇÃO DE PLANO */}
        {step === 2 && (
          <div className="plans-container">
            <h2 className="card-title text-center">Selecione o plano ideal</h2>
            <p className="card-subtitle text-center">
              Liberte o poder da IA para mitigar riscos operacionais.
            </p>

            <div className="plans-grid">
              <div className="plan-card recommended">
                <span className="badge">RECOMENDADO</span>
                <div>
                  <h3 className="plan-name">SafeWork Pro</h3>
                  <p className="plan-desc">
                    Ideal para plantas industriais e obras ativas.
                  </p>
                  <div className="plan-price">
                    R$ 1.490<span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features">
                    <li>🔹 Até 10 câmeras IP monitoradas</li>
                    <li>🔹 Detecção de capacete e colete</li>
                    <li>🔹 Dashboard para Técnico</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setFormData({ ...formData, id_plano: 1 });
                    setStep(3);
                  }}
                  className="btn-primary"
                >
                  Escolher Plano Pro
                </button>
              </div>

              <div className="plan-card">
                <div>
                  <h3 className="plan-name">SafeWork Advanced</h3>
                  <p className="plan-desc">
                    Controle total de grandes perímetros de risco.
                  </p>
                  <div className="plan-price">
                    R$ 2.990<span className="price-period">/mês</span>
                  </div>
                  <ul className="plan-features">
                    <li>🔹 Câmeras ilimitadas</li>
                    <li>🔹 Detecção de invasão de zona</li>
                    <li>🔹 Alertas via WhatsApp</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setFormData({ ...formData, id_plano: 2 });
                    setStep(3);
                  }}
                  className="btn-secondary"
                >
                  Escolher Plano Advanced
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: MÉTODOS DE PAGAMENTO */}
        {step === 3 && (
          <div className="onboarding-card max-w-md">
            <h2 className="card-title">Método de Pagamento</h2>
            <p className="card-subtitle">
              Sua assinatura será vinculada à empresa{" "}
              <span className="highlight-id">#{idEmpresaCriada}</span>
            </p>

            {!metodoSelecionado ? (
              <div className="payment-options">
                <button
                  onClick={() => setMetodoSelecionado("Pix")}
                  className="payment-btn group-emerald"
                >
                  <div className="payment-text">
                    <p className="payment-title">Pagar via PIX</p>
                    <p className="payment-desc">
                      Aprovação e liberação imediata
                    </p>
                  </div>
                  <span className="payment-icon text-emerald">⚡</span>
                </button>

                <button
                  onClick={() => setMetodoSelecionado("Cartao")}
                  className="payment-btn group-blue"
                >
                  <div className="payment-text">
                    <p className="payment-title">Cartão de Crédito</p>
                    <p className="payment-desc">
                      Recorrência mensal direta no sistema
                    </p>
                  </div>
                  <span className="payment-icon">💳</span>
                </button>

                <button onClick={() => setStep(2)} className="btn-back">
                  Voltar para planos
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleFinalizarContratacao}
                className="onboarding-form"
              >
                {metodoSelecionado === "Pix" ? (
                  <div className="pix-checkout text-center">
                    <div className="pix-qr-placeholder">QR CODE SIMULADO</div>
                    <p className="text-sm text-gray-400 mt-2">
                      Clique no botão abaixo para simular a confirmação do Pix
                      pela API.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        Nome do Titular (como no cartão)
                      </label>
                      <input
                        type="text"
                        name="titular_nome"
                        required
                        value={formData.titular_nome}
                        onChange={handleChange}
                        placeholder="JOÃO S SILVA"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Número do Cartão</label>
                      <input
                        type="text"
                        name="numero_mascarado"
                        required
                        value={formData.numero_mascarado}
                        onChange={handleChange}
                        placeholder="4444 5555 6666 7777"
                        className="form-input"
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary mt-4"
                >
                  {loading ? "Processando..." : "Confirmar e Ativar Sistema"}
                </button>

                <button
                  type="button"
                  onClick={() => setMetodoSelecionado("")}
                  className="btn-back"
                >
                  Mudar método de pagamento
                </button>
              </form>
            )}
          </div>
        )}
      </main>

      <footer className="onboarding-footer">
        Acesso restrito. Todas as atividades são monitoradas. SafeWork AI © 2026
        - Versão do Protótipo
      </footer>
    </div>
  );
}
