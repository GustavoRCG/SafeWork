import React, { useState, useEffect } from "react";
import api from "../../services/api";
import { Eye, EyeOff } from "lucide-react";
import "./cadastro_usuario.css"; // 💡 Altere o caminho para a sua pasta de estilos

function CadastroUsuario({ aoSalvar, aoFechar }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [idPerfil, setIdPerfil] = useState("");

  const [exibirSenha, setExibirSenha] = useState(false);
  const [exibirConfirmarSenha, setExibirConfirmarSenha] = useState(false);

  const [perfis, setPerfis] = useState([]);
  const [carregandoPerfis, setCarregandoPerfis] = useState(true);

  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    let ativo = true;

    const buscarPerfis = async () => {
      try {
        setCarregandoPerfis(true);
        const response = await api.get("/api/usuarios/perfis-acesso");

        if (ativo) {
          const dadosPerfis = response.data || [];
          setPerfis(dadosPerfis);
          if (dadosPerfis.length > 0) {
            setIdPerfil(dadosPerfis[0].id_perfil);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar perfis de acesso, usando fallback:", err);
        if (ativo) {
          setPerfis([
            { id_perfil: 1, nome_perfil: "Administrador" },
            { id_perfil: 2, nome_perfil: "Recursos Humanos" },
            { id_perfil: 3, nome_perfil: "Técnico de Segurança"},
           
          ]);
          setIdPerfil(1);
        }

      } finally {
        if (ativo) setCarregandoPerfis(false);
      }
    };

    buscarPerfis();
    return () => {
      ativo = false;
    };
  }, []);

  const calcularForcaSenha = (pwd) => {
    if (!pwd) return 0;
    if (pwd.length < 8) return 1;

    const temLetras = /[a-zA-Z]/.test(pwd);
    const temNumeros = /[0-9]/.test(pwd);
    const temMaiuscula = /[A-Z]/.test(pwd);
    const temEspecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

    if (temLetras && temNumeros && temMaiuscula && temEspecial) return 3;
    if (temLetras && temNumeros) return 2;
    return 1;
  };

  const forcaSenha = calcularForcaSenha(senha);

  const obtenerInfoBarra = (nivel) => {
    switch (nivel) {
      case 1:
        return { color: "#ef4444", label: "Senha Fraca" };
      case 2:
        return { color: "#eab308", label: "Senha Média" };
      case 3:
        return { color: "#10b981", label: "Senha Forte" };
      default:
        return { color: "transparent", label: "" };
    }
  };

  const infoBarra = obtenerInfoBarra(forcaSenha);

  const handleSubmeter = async (e) => {
    e.preventDefault();
    setMensagem({ tipo: "", texto: "" });

    if (!email || !senha || !confirmarSenha || !idPerfil) {
      setMensagem({
        tipo: "erro",
        texto: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem({
        tipo: "erro",
        texto: "As senhas digitadas não coincidem.",
      });
      return;
    }

    if (forcaSenha < 3) {
      setMensagem({
        tipo: "erro",
        texto:
          "A senha não atende aos requisitos de segurança (Mínimo: 8 caracteres, maiúscula, número e caractere especial).",
      });
      return;
    }

    try {
      setEnviando(true);
      const payload = {
        email: email,
        senha_hash: senha,
        id_perfil: parseInt(idPerfil, 10),
        status_usuario: true,
      };

      const response = await api.post("/api/usuarios/", payload);
      setMensagem({
        tipo: "sucesso",
        texto: "Usuário cadastrado com sucesso!",
      });

      setEmail("");
      setSenha("");
      setConfirmarSenha("");

      if (aoSalvar) aoSalvar(response.data);
    } catch (err) {
      console.error("Erro ao cadastrar usuário:", err);
      const msgErro =
        err.response?.data?.detail?.[0]?.msg ||
        err.response?.data?.detail ||
        err.message ||
        "Erro interno ao salvar.";
      setMensagem({ tipo: "erro", texto: `Falha no cadastro: ${msgErro}` });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="iam-register-card">
      <div className="iam-register-header">
        <h3 className="iam-register-title">Cadastrar Novo Usuário</h3>
        {aoFechar && (
          <button
            type="button"
            onClick={aoFechar}
            className="iam-register-close-btn"
          >
            ✕
          </button>
        )}
      </div>

      {mensagem.texto && (
        <div className={`iam-feedback-message ${mensagem.tipo}`}>
          {mensagem.texto}
        </div>
      )}

      <form onSubmit={handleSubmeter} className="iam-register-form">
        <div className="iam-form-group">
          <label className="iam-form-label">E-mail Corporativo</label>
          <input
            type="email"
            placeholder="exemplo@safework.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="iam-form-input"
            required
          />
        </div>

        <div className="iam-form-group">
          <label className="iam-form-label">Senha de Acesso</label>
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type={exibirSenha ? "text" : "password"}
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="iam-form-input"
              style={{ paddingRight: "260px" }}
              required
            />
            <button
              type="button"
              onClick={() => setExibirSenha(!exibirSenha)}
              style={{
                position: "absolute",
                right: "12px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {exibirSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {senha && (
            <div
              className="password-strength-wrapper"
              style={{ marginTop: "8px", width: "100%" }}
            >
              <div
                className="password-strength-segments"
                style={{ display: "flex", gap: "6px" }}
              >
                <div
                  style={{
                    height: "6px",
                    flex: 1,
                    borderRadius: "3px",
                    backgroundColor:
                      forcaSenha >= 1
                        ? forcaSenha === 1
                          ? "#ef4444"
                          : forcaSenha === 2
                            ? "#eab308"
                            : "#10b981"
                        : "#374151",
                    transition: "background-color 0.3s",
                  }}
                ></div>
                <div
                  style={{
                    height: "6px",
                    flex: 1,
                    borderRadius: "3px",
                    backgroundColor:
                      forcaSenha >= 2
                        ? forcaSenha === 2
                          ? "#eab308"
                          : "#10b981"
                        : "#374151",
                    transition: "background-color 0.3s",
                  }}
                ></div>
                <div
                  style={{
                    height: "6px",
                    flex: 1,
                    borderRadius: "3px",
                    backgroundColor: forcaSenha === 3 ? "#10b981" : "#374151",
                    transition: "background-color 0.3s",
                  }}
                ></div>
              </div>
              <span
                className="password-strength-label"
                style={{
                  color: infoBarra.color,
                  fontSize: "11px",
                  fontWeight: "600",
                  marginTop: "6px",
                  display: "block",
                }}
              >
                {infoBarra.label}
              </span>
            </div>
          )}
        </div>

        <div className="iam-form-group">
          <label className="iam-form-label">Confirme a Senha</label>
          <div
            style={{
              position: "relative",
              width: "100%",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type={exibirConfirmarSenha ? "text" : "password"}
              placeholder="••••••••"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              className="iam-form-input"
              style={{ paddingRight: "260px" }}
              required
            />
            <button
              type="button"
              onClick={() => setExibirConfirmarSenha(!exibirConfirmarSenha)}
              style={{
                position: "absolute",
                right: "12px",
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              {exibirConfirmarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="iam-form-group">
          <label className="iam-form-label">Perfil de Permissão</label>
          <select
            value={idPerfil}
            onChange={(e) => setIdPerfil(e.target.value)}
            className="iam-form-select"
            disabled={carregandoPerfis}
          >
            {perfis.map((p) => (
              <option key={p.id_perfil} value={p.id_perfil}>
                {p.nome_perfil}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="iam-submit-btn"
          style={{ width: "100%" }}
          disabled={enviando}
        >
          {enviando ? "Salvando ..." : "Confirmar Cadastro"}
        </button>
      </form>
    </div>
  );
}

export default CadastroUsuario;
