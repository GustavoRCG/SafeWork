import { useState } from "react";
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
import "./dashboard_admin.css";

function DashboardAdmin() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([
    {
      id: 1,
      nome: "Wagner Silva",
      email: "wagner.seg@safework.com",
      perfil: "Segurança",
      status: "Ativo",
    },
    {
      id: 2,
      nome: "Mariana Costa",
      email: "mariana.rh@safework.com",
      perfil: "RH",
      status: "Ativo",
    },
  ]);

  const [cameras] = useState([
    { id: 1, local: "Canteiro Setor A", ip: "192.168.1.50", status: "Online" },
    {
      id: 2,
      local: "Galpão de Logística",
      ip: "192.168.1.51",
      status: "Online",
    },
  ]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate("/login"));
  };

  return (
    <div className="dash-admin-container">
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
        {/* Grid de Configurações do Sistema */}
        <div className="admin-grid">
          {/* Coluna 1: Gerenciamento de Acessos */}
          <div className="admin-card">
            <div className="card-title-zone">
              <Key size={20} color="#a855f7" />
              <h3>Controle de Usuários e Permissões (IAM)</h3>
            </div>
            <div className="user-list">
              {usuarios.map((user) => (
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
              ))}
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
