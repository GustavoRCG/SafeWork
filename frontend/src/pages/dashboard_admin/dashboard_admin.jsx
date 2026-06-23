import { useState, useEffect } from "react"; // ⚡ Adicionado useEffect
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Settings,
  Video,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { auth } from "../../firebaseConfig";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // ⚡ Adicionado Axios para conectar ao Backend
import "./dashboard_admin.css";
import logoSafeWork from "../../assets/logoSafeWork.jpeg";

function DashboardAdmin() {
  const navigate = useNavigate();
  
  // 🎯 Inicializa o estado de usuários vazio. Eles virão filtrados do Backend.
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cameras] = useState([
    { id: 1, local: "Canteiro Setor A", ip: "192.168.1.50", status: "Online" },
    {
      id: 2,
      local: "Galpão de Logística",
      ip: "192.168.1.51",
      status: "Online",
    },
  ]);

  // 🔐 Efeito para carregar os funcionários da empresa do usuário logado assim que a página abrir
  useEffect(() => {
    const buscarFuncionariosDaEmpresa = async () => {
      try {
        // 1. Recupera o token de autenticação JWT do Firebase atual
        const currentUser = auth.currentUser;
        
        // Se o Firebase ainda não carregou o estado do usuário, tenta buscar o token direto do cabeçalho do auth
        const token = currentUser 
          ? await currentUser.getIdToken() 
          : localStorage.getItem("token_firebase"); // Fallback caso salve em localStorage

        if (!token) {
          console.error("Token de autenticação não encontrado.");
          setLoading(false);
          return;
        }

        // 2. Consome a rota blindada do FastAPI (o backend vai ler o token e trazer só os funcionários daquela empresa)
        const response = await axios.get("http://localhost:8000/funcionarios/", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // 3. Alimenta o estado com a lista segura vinda do banco
        // Mapeia caso os campos do seu banco usem regras diferentes (ex: perfil ou cargo)
        const funcionariosFormatados = response.data.map(f => ({
          id: f.id || f.id_funcionario,
          nome: f.nome,
          email: f.email || `${f.nome.toLowerCase().replace(" ", "")}@empresa.com`, // Fallback de layout
          perfil: f.perfil || f.cargo || "Funcionário",
          status: "Ativo"
        }));

        setUsuarios(funcionariosFormatados);
      } catch (error) {
        console.error("Erro ao isolar e buscar os funcionários:", error);
      } finally {
        setLoading(false);
      }
    };

    // Executa a busca
    buscarFuncionariosDaEmpresa();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

 return (
    <div className="dash-admin-container">
      <header className="admin-header">
        
        {/* 🖼️ Bloco da Logo Atualizado para Imagem Oficial */}
        <div className="admin-logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={logoSafeWork}
            alt="SafeWork Visão Computacional"
            style={{
              width: "auto",
              maxHeight: "40px", // Altura menor e elegante para o header do dashboard
              objectFit: "contain",
              borderRadius: "4px",
            }}
          />
          <span>
            <small className="badge-admin">Módulo Admin</small>
          </span>
        </div>

        <button onClick={handleLogout} className="btn-logout-admin">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <main className="admin-content">
        {/* Grid de Configurações do Sistema */}
        <div className="admin-grid">
          {/* Coluna 1: Gerenciamento de Acessos */}
          <div className="admin-card">
            <div className="card-title-zone">
              <Key size={20} color="#a855f7" />
              <h3>Controle de Usuários e Permissões (IAM)</h3>
            </div>
            <div className="user-list">
              {loading ? (
                <p className="loading-text">Carregando dados com isolamento lógico...</p>
              ) : usuarios.length === 0 ? (
                <p className="loading-text">Nenhum funcionário cadastrado nesta empresa.</p>
              ) : (
                usuarios.map((user) => (
                  <div key={user.id} className="user-item">
                    <div>
                      <p className="user-name">{user.nome}</p>
                      <p className="user-email">
                        {user.email} •{" "}
                        <span className="user-role">{user.perfil}</span>
                      </p>
                    </div>
                    <span className="status-online">{user.status}</span>
                  </div>
                ))
              )}
            </div>
            <button className="btn-admin-action">Novo Usuário</button>
          </div>

          {/* Coluna 2: Integração de Hardware / Câmeras */}
          <div className="admin-card">
            <div className="card-title-zone">
              <Video size={20} color="#a855f7" />
              <h3>Gerenciamento de Câmeras (Streams RTSP)</h3>
            </div>
            <div className="camera-list">
              {cameras.map((cam) => (
                <div key={cam.id} className="camera-item">
                  <div>
                    <p className="camera-local">{cam.local}</p>
                    <p className="camera-ip">IP: {cam.ip}</p>
                  </div>
                  <span className="cam-status">{cam.status}</span>
                </div>
              ))}
            </div>
            <button className="btn-admin-action">Adicionar Câmera</button>
          </div>
        </div>

        {/* Status de Logs Globais */}
        <div className="admin-card wide-card">
          <div className="card-title-zone">
            <Settings size={20} color="#a855f7" />
            <h3>Logs de Auditoria do Sistema</h3>
          </div>
          <div className="logs-console">
            <p>
              <code>
                [10/06/2026 20:31:02] [VITE] Servidor reiniciado com sucesso.
                Cache limpo.
              </code>
            </p>
            <p>
              <code>
                [10/06/2026 18:45:12] [FASTAPI] Conexão estabelecida com sucesso
                com o modelo YOLOv8.
              </code>
            </p>
            <p>
              <code>
                [10/06/2026 14:22:03] [FIREBASE] Token de autenticação validado
                para o perfil Técnico de Segurança.
              </code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardAdmin;