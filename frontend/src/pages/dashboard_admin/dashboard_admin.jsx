import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Key,
  Settings,
  Video,
  LogOut,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  UserCheck,
} from "lucide-react";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "./dashboard_admin.css";

import api from "../../services/api";
import CadastroUsuario from "../dashboard_cadastro/cadastro_usuario";
import CadastroCamera from "../dashboard_cadastro/cadastro_camera";
import CadastroSetor from "../dashboard_cadastro/cadastro_setores";

const MAPA_PERFIS = {
  1: { nome: "Administrador", classe: "badge-admin-role" },
  2: { nome: "Recursos Humanos", classe: "badge-rh-role" },
  3: { nome: "Técnico de Segurança", classe: "badge-tecnico-role" },
};

function DashboardAdmin() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [setores, setSetores] = useState([]);
  const [cameras, setCameras] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showSetorModal, setShowSetorModal] = useState(false);

  // Estados de Edição de Setor
  const [showEditSetorModal, setShowEditSetorModal] = useState(false);
  const [setorSelecionado, setSetorSelecionado] = useState(null);

  // Estados para controle de edição de Câmera
  const [showEditCameraModal, setShowEditCameraModal] = useState(false);
  const [cameraSelecionada, setCameraSelecionada] = useState(null);

  // Estados de Edição de Usuário Integrado
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [statusUsuario, setStatusUsuario] = useState(true);
  const [erroValidacao, setErroValidacao] = useState("");
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState({
    exibir: false,
    mensagem: "",
    tipo: "sucesso",
  });

  const mostrarNotificacao = useCallback((mensagem, tipo = "sucesso") => {
    setToast({ exibir: true, mensagem, tipo });
    setTimeout(() => {
      setToast({ exibir: false, mensagem: "", tipo: "sucesso" });
    }, 4000);
  }, []);

  const buscarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/usuarios");
      setUsuarios(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarCameras = useCallback(async () => {
    try {
      const response = await api.get("/api/cameras/");
      setCameras(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar câmeras:", err);
    }
  }, []);

  const buscarSetores = useCallback(async () => {
    try {
      const response = await api.get("/api/setores/");
      setSetores(response.data || []);
    } catch (err) {
      console.error("Erro ao carregar setores:", err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscarUsuarios();
    buscarCameras();
    buscarSetores();
  }, [buscarUsuarios, buscarCameras, buscarSetores]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  const handleUsuarioSalvo = () => {
    buscarUsuarios();
    setShowModal(false);
    mostrarNotificacao("Usuário cadastrado com sucesso!");
  };

  const handleCameraSalva = () => {
    buscarCameras();
    setShowCameraModal(false);
    setShowEditCameraModal(false);
    mostrarNotificacao("Dispositivo de monitoramento atualizado com sucesso!");
  };

  const handleAbrirModalCamera = () => {
    setCameraSelecionada(null);
    setShowCameraModal(true);
  };

  const handleEditarCamera = (camera) => {
    // Garante que o objeto completo da câmera (incluindo id_setor) vai para o componente interno
    setCameraSelecionada(camera);
    setShowEditCameraModal(true);
  };

  const handleDeletarCamera = async (id_camera, nome_camera) => {
    if (
      window.confirm(
        `Tem certeza que deseja remover o monitoramento da câmera "${nome_camera}"?`,
      )
    ) {
      try {
        await api.delete(`/api/cameras/${id_camera}`);
        buscarCameras();
        mostrarNotificacao("Câmera removida do ecossistema SafeWork.");
      } catch (err) {
        console.error(err);
        mostrarNotificacao("Não foi possível excluir o dispositivo.", "erro");
      }
    }
  };

  const handleAbrirModalSetor = () => {
    setSetorSelecionado(null);
    setShowSetorModal(true);
  };

  const handleSetorSalvo = () => {
    buscarSetores();
    setShowSetorModal(false);
    setShowEditSetorModal(false);
    mostrarNotificacao("Ambiente industrial atualizado com sucesso!");
  };

  const handleEditarSetor = (setor) => {
    setSetorSelecionado(setor);
    setShowEditSetorModal(true);
  };

  const handleDeletarSetor = async (id_setor) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir permanentemente o setor #${id_setor}?`,
      )
    ) {
      try {
        await api.delete(`/api/setores/${id_setor}`);
        buscarSetores();
        mostrarNotificacao("Setor removido com sucesso.");
      } catch (err) {
        console.error(err);
        mostrarNotificacao(
          "Erro ao excluir setor. Verifique dependências.",
          "erro",
        );
      }
    }
  };

  const handleDeletarUsuario = async (id_usuario, email) => {
    if (
      window.confirm(
        `Tem certeza que deseja excluir permanentemente o usuário ${email}?`,
      )
    ) {
      try {
        await api.delete(`/api/usuarios/${id_usuario}`);
        buscarUsuarios();
        mostrarNotificacao(`Usuário ${email} deletado.`);
      } catch (err) {
        console.error(err);
        mostrarNotificacao("Erro ao remover credencial.", "erro");
      }
    }
  };

  const handleEditarUsuario = (user) => {
    setUsuarioSelecionado(user);
    setNovaSenha("");
    setStatusUsuario(user.status_usuario);
    setErroValidacao("");
    setShowEditModal(true);
  };

  const validarSenhaForte = (senha) => {
    const minLength = 8;
    const temMaiuscula = /[A-Z]/.test(senha);
    const temMinuscula = /[a-z]/.test(senha);
    const temNumero = /[0-9]/.test(senha);
    const temEspecial = /[!@#$%^&*(),.?":{}|<>_]/.test(senha);

    if (senha.length < minLength)
      return "A senha deve ter pelo menos 8 caracteres.";
    if (!temMaiuscula) return "A senha deve conter uma letra maiúscula.";
    if (!temMinuscula) return "A senha deve conter uma letra minúscula.";
    if (!temNumero) return "A senha deve conter um número.";
    if (!temEspecial) return "A senha deve conter um caractere especial.";
    return null;
  };

  const handleSalvarPerfilUsuario = async (e) => {
    e.preventDefault();
    setErroValidacao("");

    const payload = {
      status_usuario: statusUsuario,
    };

    if (novaSenha.trim() !== "") {
      const mensagemErro = validarSenhaForte(novaSenha);
      if (mensagemErro) {
        setErroValidacao(mensagemErro);
        return;
      }
      payload.senha = novaSenha;
    }

    try {
      await api.put(`/api/usuarios/${usuarioSelecionado.id_usuario}`, payload);

      setShowEditModal(false);
      buscarUsuarios();
      mostrarNotificacao("Credenciais e políticas de acesso atualizadas!");
    } catch (err) {
      console.error("Erro ao atualizar usuário:", err);
      setErroValidacao("Erro de comunicação com o servidor.");
    }
  };

  const estiloBotaoAcao = {
    background: "transparent",
    border: "none",
    padding: "6px",
    cursor: "pointer",
    color: "#a855f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    transition: "background 0.2s",
  };

  const estiloOverlayForcado = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  };

  return (
    <div className="dash-admin-container" style={{ position: "relative" }}>
      {toast.exibir && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            backgroundColor: "#1f2937",
            borderLeft:
              toast.tipo === "sucesso"
                ? "4px solid #22c55e"
                : "4px solid #ef4444",
            padding: "16px 20px",
            borderRadius: "8px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            zIndex: 10000,
            color: "#fff",
            minWidth: "300px",
          }}
        >
          {toast.tipo === "sucesso" ? (
            <CheckCircle size={20} color="#22c55e" />
          ) : (
            <XCircle size={20} color="#ef4444" />
          )}
          <span style={{ fontSize: "0.9rem", fontWeight: "500", flex: 1 }}>
            {toast.mensagem}
          </span>
          <button
            onClick={() => setToast({ ...toast, exibir: false })}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6b7280",
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      <header className="admin-header">
        <div className="admin-logo">
          <Shield size={28} color="#a855f7" />
          <span>
            SafeWork <small className="badge-admin">Módulo Admin</small>
          </span>
        </div>
        <button onClick={handleLogout} className="btn-logout-admin">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <main className="admin-content">
        <div
          className="admin-rows-layout"
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          {/* PRIMEIRO BLOCO: IAM */}
          <div className="admin-card full-width-card">
            <div className="card-title-zone">
              <Key size={20} color="#a855f7" />
              <h3>Controle de Usuários e Permissões (IAM)</h3>
            </div>
            <div className="user-list">
              {loading ? (
                <p className="loading-text">Buscando dados...</p>
              ) : usuarios.length === 0 ? (
                <p className="loading-text">Nenhum usuário localizado.</p>
              ) : (
                usuarios.map((user) => {
                  const perfilInfo = MAPA_PERFIS[user.id_perfil] || {
                    nome: `Perfil ID: ${user.id_perfil}`,
                    classe: "",
                  };
                  return (
                    <div key={user.id_usuario} className="user-item">
                      <div className="user-info-wrapper">
                        <p className="user-name">{user.email.split("@")[0]}</p>
                        <p className="user-email">
                          {user.email} •{" "}
                          <span
                            style={{
                              backgroundColor: "rgba(168, 85, 247, 0.15)",
                              color: "#c084fc",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: "600",
                            }}
                          >
                            {perfilInfo.nome}
                          </span>
                        </p>
                      </div>
                      <div
                        className="user-status-actions-wrapper"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        }}
                      >
                        {/*  "Suspenso" agora fica vermelhinho estilizado igual ao "Ativo" */}
                        <span
                          className={
                            user.status_usuario
                              ? "status-online"
                              : "status-offline"
                          }
                          style={{
                            color: user.status_usuario ? "#22c55e" : "#ef4444",
                            fontWeight: "600",
                          }}
                        >
                          {user.status_usuario ? "Ativo" : "Suspenso"}
                        </span>
                        <div
                          className="user-actions"
                          style={{ display: "flex", gap: "8px" }}
                        >
                          <button
                            onClick={() => handleEditarUsuario(user)}
                            title="Editar Configurações de Usuário"
                            style={estiloBotaoAcao}
                            className="btn-action-clean"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeletarUsuario(user.id_usuario, user.email)
                            }
                            title="Excluir usuário"
                            style={{ ...estiloBotaoAcao, color: "#ef4444" }}
                            className="btn-action-clean"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <button
              className="btn-admin-action"
              onClick={() => setShowModal(true)}
            >
              Novo Usuário
            </button>
          </div>

          {/* SEGUNDO BLOCO: GERENCIAMENTO DE CÂMERAS */}
          <div className="admin-card full-width-card">
            <div className="card-title-zone">
              <Video size={20} color="#a855f7" />
              <h3>Gerenciamento de Câmeras (Streams RTSP)</h3>
            </div>

            <div
              className="camera-list"
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {cameras && cameras.length > 0 ? (
                cameras.map((cam) => {
                  const isOnline =
                    cam.status_camera === "Ativo" ||
                    cam.status_camera === "Online";
                  return (
                    <div
                      key={cam.id_camera}
                      className="camera-item"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        padding: "16px",
                        backgroundColor: "#111827",
                        borderRadius: "8px",
                        border: "1px solid #1f2937",
                      }}
                    >
                      <div
                        className="camera-preview-box"
                        style={{
                          width: "120px",
                          height: "80px",
                          backgroundColor: "#1f2937",
                          borderRadius: "6px",
                          border: isOnline
                            ? "2px solid #22c55e"
                            : "2px solid #ef4444",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          overflow: "hidden",
                          flexShrink: 0,
                        }}
                      >
                        <Video
                          size={24}
                          color={isOnline ? "#22c55e" : "#ef4444"}
                          style={{ opacity: 0.7 }}
                        />
                      </div>

                      <div className="camera-info-wrapper" style={{ flex: 1 }}>
                        <p
                          className="camera-local"
                          style={{
                            margin: "0 0 4px 0",
                            fontWeight: "bold",
                            color: "#f3f4f6",
                          }}
                        >
                          {cam.nome_camera}
                        </p>
                        <p
                          className="camera-ip"
                          style={{
                            margin: 0,
                            fontSize: "0.85rem",
                            color: "#6b7280",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                          }}
                        >
                          {cam.url_rtsp}
                        </p>
                        <small style={{ color: "#a855f7", fontWeight: "500" }}>
                          Core IA: {cam.modelo_ia_versao || "YOLOv8"}
                        </small>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <span
                          className="cam-status"
                          style={{
                            fontWeight: "600",
                            color: isOnline ? "#22c55e" : "#ef4444",
                          }}
                        >
                          {cam.status_camera}
                        </span>

                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => handleEditarCamera(cam)}
                            title="Editar Câmera"
                            style={estiloBotaoAcao}
                            className="btn-action-clean"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeletarCamera(
                                cam.id_camera,
                                cam.nome_camera,
                              )
                            }
                            title="Excluir Câmera"
                            style={{ ...estiloBotaoAcao, color: "#ef4444" }}
                            className="btn-action-clean"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="loading-text" style={{ padding: "10px 0" }}>
                  Nenhuma câmera de monitoramento localizada.
                </p>
              )}
            </div>

            <div className="camera-form-row" style={{ marginTop: "20px" }}>
              <button
                className="btn-admin-action camera-submit-btn"
                onClick={handleAbrirModalCamera}
                style={{ width: "100%" }}
              >
                Cadastrar e Integrar Nova Câmera
              </button>
            </div>
          </div>

          {/* TERCEIRO BLOCO: GERENCIAMENTO DE SETORES */}
          <div className="admin-card full-width-card">
            <div
              className="card-title-zone"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Settings size={20} color="#a855f7" />
                <h3>Gerenciamento de Setores</h3>
              </div>
              <button
                className="btn-cadastrar-setor"
                onClick={handleAbrirModalSetor}
                style={{
                  backgroundColor: "#a855f7",
                  color: "#fff",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                + Novo Setor
              </button>
            </div>

            <div
              className="setores-table-container"
              style={{ marginTop: "15px", overflowX: "auto" }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  textAlign: "left",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid #3f3f46",
                      color: "#a1a1aa",
                    }}
                  >
                    <th style={{ padding: "10px" }}>Nome do Setor</th>
                    <th style={{ padding: "10px" }}>Nivel de Risco</th>
                  </tr>
                </thead>
                <tbody>
                  {setores && setores.length > 0 ? (
                    setores.map((setor) => (
                      <tr
                        key={setor.id_setor}
                        style={{
                          borderBottom: "1px solid #27272a",
                          color: "#e4e4e7",
                        }}
                      >
                        <td style={{ padding: "10px", fontWeight: "500" }}>
                          {setor.nome_setor}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "12px",
                              fontSize: "12px",
                              fontWeight: "bold",
                              backgroundColor:
                                setor.nivel_risco === "Alto"
                                  ? "#ef444422"
                                  : setor.nivel_risco === "Médio"
                                    ? "#f59e0b22"
                                    : "#10b98122",
                              color:
                                setor.nivel_risco === "Alto"
                                  ? "#f87171"
                                  : setor.nivel_risco === "Médio"
                                    ? "#fbbf24"
                                    : "#34d399",
                            }}
                          >
                            {setor.nivel_risco}
                          </span>
                        </td>

                        <td style={{ padding: "10px" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "center",
                              gap: "10px",
                            }}
                          >
                            <button
                              onClick={() => handleEditarSetor(setor)}
                              title="Editar Setor"
                              style={estiloBotaoAcao}
                              className="btn-action-clean"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletarSetor(setor.id_setor)}
                              title="Excluir Setor"
                              style={{ ...estiloBotaoAcao, color: "#ef4444" }}
                              className="btn-action-clean"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          color: "#71717a",
                        }}
                      >
                        Nenhum setor cadastrado até o momento.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* MODAIS DE CADASTRO/EDIÇÃO */}
      {showModal && (
        <div style={estiloOverlayForcado}>
          <div
            style={{
              width: "100%",
              maxWidth: "550px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CadastroUsuario
              aoSalvar={handleUsuarioSalvo}
              aoFechar={() => setShowModal(false)}
            />
          </div>
        </div>
      )}

      {showCameraModal && (
        <div style={estiloOverlayForcado}>
          <CadastroCamera
            setores={setores}
            aoSalvar={handleCameraSalva}
            aoFechar={() => setShowCameraModal(false)}
          />
        </div>
      )}

      {showEditCameraModal && (
        <div style={estiloOverlayForcado}>
          <div
            style={{
              width: "100%",
              maxWidth: "850px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CadastroCamera
              setores={setores}
              cameraExistente={cameraSelecionada}
              aoSalvar={handleCameraSalva}
              aoFechar={() => setShowEditCameraModal(false)}
            />
          </div>
        </div>
      )}

      {showSetorModal && (
        <div style={estiloOverlayForcado}>
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CadastroSetor
              aoSalvar={handleSetorSalvo}
              aoFechar={() => setShowSetorModal(false)}
            />
          </div>
        </div>
      )}

      {showEditSetorModal && (
        <div style={estiloOverlayForcado}>
          <div
            style={{
              width: "100%",
              maxWidth: "450px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CadastroSetor
              setorExistente={setorSelecionado}
              aoSalvar={handleSetorSalvo}
              aoFechar={() => setShowEditSetorModal(false)}
            />
          </div>
        </div>
      )}

      {/* MODAL GLOBAL: ALTERAR DADOS DO USUÁRIO */}
      {showEditModal && (
        <div style={estiloOverlayForcado}>
          <div
            className="modal-content"
            style={{
              backgroundColor: "#111827",
              padding: "32px",
              borderRadius: "12px",
              border: "1px solid #374151",
              width: "100%",
              maxWidth: "420px",
              color: "#f3f4f6",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <h3
                style={{
                  margin: "0 0 8px 0",
                  fontSize: "1.3rem",
                  fontWeight: "bold",
                }}
              >
                Gerenciar Usuário
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#9ca3af", margin: 0 }}>
                ID / Email:{" "}
                <strong style={{ color: "#a855f7" }}>
                  {usuarioSelecionado?.email}
                </strong>
              </p>
            </div>

            <form
              onSubmit={handleSalvarPerfilUsuario}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                width: "100%",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <label
                  style={{
                    fontSize: "0.85rem",
                    color: "#9ca3af",
                    fontWeight: "500",
                  }}
                >
                  Status de Acesso do Usuário
                </label>
                <select
                  value={statusUsuario ? "true" : "false"}
                  onChange={(e) => setStatusUsuario(e.target.value === "true")}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: "1px solid #4b5563",
                    backgroundColor: "#1f2937",
                    color: "#fff",
                    outline: "none",
                  }}
                >
                  <option value="true">Ativo (Acesso Liberado)</option>
                  <option value="false">Suspenso (Acesso Bloqueado)</option>
                </select>
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.85rem",
                      color: "#9ca3af",
                      fontWeight: "500",
                    }}
                  >
                    Nova Senha
                  </label>
                  <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                    Deixe em branco para manter a atual
                  </span>
                </div>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => {
                    setNovaSenha(e.target.value);
                    if (erroValidacao) setErroValidacao("");
                  }}
                  placeholder="Redefinir senha se necessário"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "6px",
                    border: erroValidacao
                      ? "1px solid #ef4444"
                      : "1px solid #4b5563",
                    backgroundColor: "#1f2937",
                    color: "#fff",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
                {erroValidacao && (
                  <span
                    style={{
                      color: "#ef4444",
                      fontSize: "0.8rem",
                      marginTop: "4px",
                      display: "block",
                      fontWeight: "500",
                    }}
                  >
                    {erroValidacao}
                  </span>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "16px",
                  marginTop: "8px",
                  width: "100%",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "transparent",
                    border: "1px solid #4b5563",
                    color: "#9ca3af",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px 16px",
                    backgroundColor: "#a855f7",
                    border: "none",
                    color: "#fff",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardAdmin;
