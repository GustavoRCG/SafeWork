import React, { useState } from "react";
import "./cadastro_empresa.css";
import logoSafeWork from "../../assets/logoSafeWork.jpeg"; 

export default function CadastroEmpresa() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingCnpj, setLoadingCnpj] = useState(false);
  const [metodoSelecionado, setMetodoSelecionado] = useState("");

  // Estados para as validações e controle de exibição de senha
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [senhaErro, setSenhaErro] = useState("");
  const [cnpjErro, setCnpjErro] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);

  // Estados dinâmicos de validação do cartão
  const [cartaoErro, setCartaoErro] = useState("");
  const [bandeira, setBandeira] = useState("");

  // Dados do formulário mapeados em conformidade com o Postgres + Pydantic
  const [formData, setFormData] = useState({
    razao_social: "",
    cnpj: "",
    email_contato: "",
    senha: "",
    id_plano: null,
    titular_nome: "",
    numero_mascarado: "",
    data_expiracao: "",
    cvv: "",
    banco_codigo: "",
    agencia: "",
    conta_corrente: "",
  });

  // MÁSCARA: Formatar e mascarar o CNPJ automaticamente
  const formatCnpj = (value) => {
    const rawValue = value.replace(/\D/g, "").slice(0, 14);
    return rawValue
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  };

  // MÁSCARA: Formatar número do cartão (separar de 4 em 4 números)
  const formatCartao = (value) => {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  // MÁSCARA: Formatar data de expiração (MM/AAAA) automaticamente ao digitar
  const formatDataExpiracao = (value) => {
    const clean = value.replace(/\D/g, "").slice(0, 6);
    if (clean.length >= 3) {
      return `${clean.slice(0, 2)}/${clean.slice(2, 6)}`;
    }
    return clean;
  };

  // 🏦 MÁSCARAS BANCÁRIAS ADICIONADAS:

  // Código do Banco: apenas números, máximo de 3 dígitos
  const formatBancoCodigo = (value) => {
    return value.replace(/\D/g, "").slice(0, 3);
  };

  // Agência: Limita a 5 caracteres (aceita número ou dígito X comum em agências do BB)
  const formatAgencia = (value) => {
    return value
      .replace(/[^0-9X-]/gi, "")
      .toUpperCase()
      .slice(0, 5);
  };

  // Conta Corrente: Coloca o hífen automaticamente antes do último dígito
  const formatContaCorrente = (value) => {
    // Remove tudo que não for número ou o caractere X/x (comum no dígito da conta)
    const clean = value.replace(/[^0-9Xx]/g, "").slice(0, 12);

    if (clean.length > 1) {
      // Separa o último caractere para ser o dígito verificador após o "-"
      return `${clean.slice(0, -1)}-${clean.slice(-1)}`.toUpperCase();
    }
    return clean.toUpperCase();
  };

  // ALGORITMO DE LUHN: Valida se o número do cartão é matematicamente válido
  const validarAlgoritmoLuhn = (num) => {
    let arr = String(num)
      .replace(/\s/g, "")
      .split("")
      .reverse()
      .map((x) => parseInt(x));
    let lastDigit = arr.shift();
    let sum = arr.reduce((acc, val, i) => {
      if (i % 2 === 0) {
        val = val * 2;
        if (val > 9) val -= 9;
      }
      return acc + val;
    }, 0);
    return (sum + lastDigit) % 10 === 0;
  };

  // DETECTAR BANDEIRA: Identifica a bandeira pelos primeiros dígitos (IIN)
  const descobrirBandeira = (num) => {
    const clean = num.replace(/\s/g, "");
    if (/^4/.test(clean)) return "Visa 🟦";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "Mastercard 🟥";
    if (/^3[47]/.test(clean)) return "Amex 🟩";
    if (/^(6011|622|64[4-9]|65)/.test(clean)) return "Discover 🟨";
    if (/^(5067|4576|4011)/.test(clean)) return "Elo 🟧";
    if (!clean) return "";
    return "Desconhecida 🌐";
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
    } else if (name === "numero_mascarado") {
      const maskedCartao = formatCartao(value);
      setBandeira(descobrirBandeira(maskedCartao));
      setFormData((prev) => ({ ...prev, numero_mascarado: maskedCartao }));

      const cleanNum = maskedCartao.replace(/\s/g, "");
      if (cleanNum.length === 16 && !validarAlgoritmoLuhn(cleanNum)) {
        setCartaoErro(
          "Número de cartão inválido (Falhou no teste de autenticidade).",
        );
      } else {
        setCartaoErro("");
      }
    } else if (name === "data_expiracao") {
      const maskedData = formatDataExpiracao(value);
      setFormData((prev) => ({ ...prev, data_expiracao: maskedData }));
    } else if (name === "cvv") {
      const cleanCvv = value.replace(/\D/g, "").slice(0, 4);
      setFormData((prev) => ({ ...prev, cvv: cleanCvv }));
    }
    // 🏦 TRATAMENTOS BANCÁRIOS INTERCEPTADOS NO HANDLE CHANGE:
    else if (name === "banco_codigo") {
      const maskedBanco = formatBancoCodigo(value);
      setFormData((prev) => ({ ...prev, banco_codigo: maskedBanco }));
    } else if (name === "agencia") {
      const maskedAgencia = formatAgencia(value);
      setFormData((prev) => ({ ...prev, agencia: maskedAgencia }));
    } else if (name === "conta_corrente") {
      const maskedConta = formatContaCorrente(value);
      setFormData((prev) => ({ ...prev, conta_corrente: maskedConta }));
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

  const handleAvancarEtapa1 = (e) => {
    e.preventDefault();
    setSenhaErro("");

    const cnpjLimpo = formData.cnpj.replace(/\D/g, "");
    if (cnpjLimpo.length !== 14) {
      setCnpjErro("Por favor, insira um CNPJ válido com 14 dígitos.");
      return;
    }

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

    if (formData.senha.trim() !== confirmarSenha.trim()) {
      setSenhaErro("As senhas não coincidem!");
      return;
    }

    if (cnpjErro) return;
    setStep(2);
  };

  const handleFinalizarContratacao = async (e) => {
    e.preventDefault();

    if (metodoSelecionado === "Cartao") {
      const cleanNum = formData.numero_mascarado.replace(/\s/g, "");
      if (cleanNum.length < 16) {
        alert("O número do cartão deve conter exatamente 16 dígitos.");
        return;
      }
      if (!validarAlgoritmoLuhn(cleanNum)) {
        alert("O número do cartão digitado é inválido. Verifique os dados.");
        return;
      }

      if (
        !formData.data_expiracao ||
        !/^\d{2}\/\d{4}$/.test(formData.data_expiracao)
      ) {
        alert("Insira a expiração no formato correto MM/AAAA.");
        return;
      }

      const [mes, ano] = formData.data_expiracao.split("/").map(Number);
      const hoje = new Date();
      const anoAtual = hoje.getFullYear();
      const mesAtual = hoje.getMonth() + 1;

      if (mes < 1 || mes > 12) {
        alert("Mês de expiração inválido.");
        return;
      }
      if (ano < anoAtual || (ano === anoAtual && mes < mesAtual)) {
        alert("Este cartão já está expirado.");
        return;
      }

      if (!formData.cvv || formData.cvv.length < 3) {
        alert("Insira um código de segurança (CVV) válido.");
        return;
      }
    }

    if (metodoSelecionado === "Debito") {
      if (!formData.banco_codigo || formData.banco_codigo.length !== 3) {
        alert(
          "O código de compensação do banco deve possuir exatamente 3 dígitos.",
        );
        return;
      }
      if (!formData.agencia || formData.agencia.length < 3) {
        alert("Por favor, preencha uma agência válida.");
        return;
      }
      if (!formData.conta_corrente || !formData.conta_corrente.includes("-")) {
        alert(
          "Por favor, preencha a conta corrente estruturada com o dígito verificador.",
        );
        return;
      }
    }

    setLoading(true);
    const cnpjLimpo = formData.cnpj.replace(/\D/g, "");

    const payloadCompleto = {
      razao_social: formData.razao_social,
      cnpj: cnpjLimpo,
      senha: formData.senha,
      emailContato: formData.email_contato,
      idPlano: formData.id_plano,
      tipoMetodo: metodoSelecionado === "Cartao" ? "CARTAO" : "DEBITO_CONTA",
      titularNome: formData.titular_nome.toUpperCase(),

      numeroMascarado:
        metodoSelecionado === "Cartao" ? formData.numero_mascarado : null,
      dataExpiracao:
        metodoSelecionado === "Cartao" ? formData.data_expiracao : null,
      cvv: metodoSelecionado === "Cartao" ? formData.cvv : null,

      bancoCodigo:
        metodoSelecionado === "Debito" ? formData.banco_codigo : null,
      agencia: metodoSelecionado === "Debito" ? formData.agencia : null,
      // Dica: Se seu backend espera a conta limpa (sem o hífen), você pode usar .replace("-", "") aqui:
      contaCorrente:
        metodoSelecionado === "Debito" ? formData.conta_corrente : null,
      tokenPagamento: "TOKEN_PROVISORIO_FRONT",
    };

    try {
      const response = await fetch("http://localhost:8000/empresas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadCompleto),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Onboarding concluído com sucesso! Assinatura Ativada.");
        window.location.href = "/login";
      } else {
        alert(
          `Erro no Onboarding: ${data.detail || "Falha ao processar o cadastro completo."}`,
        );
      }
    } catch (err) {
      alert("Não foi possível conectar ao servidor backend.");
    } finally {
      setLoading(false);
    }
  };

  const forcaSenha = avaliarForcaSenha(formData.senha);

  return (
    <div className="onboarding-container">
      <header className="onboarding-header">
        <div className="step-indicator">Etapa {step} de 3</div>
      </header>

      <main className="onboarding-main">
        {/* 🖼️ Bloco da Logo Atualizado para Imagem Oficial */}
        <div className="brand-logo" style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
          <img
            src={logoSafeWork}
            alt="SafeWork Visão Computacional"
            style={{
              width: "auto",
              maxHeight: "65px", // Altura padrão idêntica à do login para manter a identidade visual
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
        </div>

        {step === 1 && (
          <h2 className="page-title-external">
            Comece a proteger sua operação
          </h2>
        )}

        {/* 📦 PASSO 1: CADASTRO DA EMPRESA */}
        {step === 1 && (
          <div className="onboarding-card">
            <p className="form-subtitle-internal">
              Insira os dados cadastrais e defina uma senha de acesso master.
            </p>

            <form onSubmit={handleAvancarEtapa1} className="onboarding-form">
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

              <div className="form-group">
                <label className="form-label">
                  E-mail de Contato Comercial
                </label>
                <input
                  type="email"
                  name="email_contato"
                  value={formData.email_contato}
                  onChange={handleChange}
                  required
                  placeholder="diretoria@empresa.com"
                  className="form-input"
                />
              </div>

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
                    }}
                  >
                    {verConfirmarSenha ? "✕" : "👁"}
                  </button>
                </div>
              </div>

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
                disabled={loadingCnpj}
                className="btn-primary"
              >
                Avançar para Escolha do Plano
              </button>
            </form>
          </div>
        )}

        {/* PASSO 2: SELEÇÃO DE PLANO */}
        {step === 2 && (
          <div className="plans-container">
            <h2 className="plan-title-internal">Selecione o plano ideal</h2>
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

        {/* PASSO 3: MÉTODOS DE PAGAMENTO HÍBRIDOS */}
        {step === 3 && (
          <div className="onboarding-card max-w-md">
            <h2 className="payment-title-internal">Método de Pagamento</h2>
            <p className="payment-subtitle-internal">
              Sua assinatura será vinculada após a confirmação final.
            </p>

            {!metodoSelecionado ? (
              <div className="payment-options">
                <button
                  onClick={() => setMetodoSelecionado("Cartao")}
                  className="payment-btn group-blue"
                >
                  <div className="payment-text">
                    <p className="payment-title">Cartão de Crédito/Débito</p>
                    <p className="payment-desc">
                      Recorrência mensal direto na fatura
                    </p>
                  </div>
                  <span className="payment-icon">💳</span>
                </button>

                <button
                  onClick={() => setMetodoSelecionado("Debito")}
                  className="payment-btn group-emerald"
                >
                  <div className="payment-text">
                    <p className="payment-title">Débito em Conta Bancária</p>
                    <p className="payment-desc">
                      Cobrança automática em conta corrente
                    </p>
                  </div>
                  <span className="payment-icon text-emerald">🏦</span>
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
                <div className="form-group">
                  <label className="form-label">Nome Completo do Titular</label>
                  <input
                    type="text"
                    name="titular_nome"
                    required
                    value={formData.titular_nome}
                    onChange={handleChange}
                    placeholder="EMPRESA BRASIL LTDA"
                    className="form-input"
                  />
                </div>

                {metodoSelecionado === "Debito" ? (
                  /* 🏦 FORMULÁRIO DE DÉBITO EM CONTA REESTRUTURADO */
                  <>
                    <div className="form-group">
                      <label className="form-label">
                        Código do Banco (Ex: 341 - Itaú, 001 - BB)
                      </label>
                      <input
                        type="text"
                        name="banco_codigo"
                        required
                        value={formData.banco_codigo}
                        onChange={handleChange}
                        placeholder="341"
                        className="form-input"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Agência</label>
                        <input
                          type="text"
                          name="agencia"
                          required
                          value={formData.agencia}
                          onChange={handleChange}
                          placeholder="1234"
                          className="form-input"
                        />
                      </div>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">
                          Conta Corrente (com dígito)
                        </label>
                        <input
                          type="text"
                          name="conta_corrente"
                          required
                          value={formData.conta_corrente}
                          onChange={handleChange}
                          placeholder="56789-0"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* 💳 FORMULÁRIO DE CARTÃO DE CRÉDITO ADAPTADO */
                  <>
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
                        style={{ borderColor: cartaoErro ? "#ef4444" : "" }}
                      />
                      {bandeira && (
                        <p
                          style={{
                            color: "#22c55e",
                            fontSize: "12px",
                            marginTop: "4px",
                            fontWeight: "bold",
                          }}
                        >
                          Bandeira identificada: {bandeira}
                        </p>
                      )}
                      {cartaoErro && (
                        <p
                          style={{
                            color: "#ef4444",
                            fontSize: "12px",
                            marginTop: "4px",
                          }}
                        >
                          ❌ {cartaoErro}
                        </p>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Expiração</label>
                        <input
                          type="text"
                          name="data_expiracao"
                          required
                          value={formData.data_expiracao}
                          onChange={handleChange}
                          placeholder="MM/AAAA"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">CVV</label>
                        <input
                          type="text"
                          name="cvv"
                          required
                          value={formData.cvv}
                          onChange={handleChange}
                          placeholder="123"
                          className="form-input"
                        />
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading || !!cartaoErro}
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
        Acesso restrito. SafeWork AI © 2026 - Versão do Protótipo
      </footer>
    </div>
  );
}
