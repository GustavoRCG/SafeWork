import { useState } from 'react';
import { Users, FileSpreadsheet, AlertTriangle, CheckCircle, LogOut, BarChart3 } from 'lucide-react';
import { auth } from '../../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './dashboard_rh.css';

function DashboardRH() {
  const navigate = useNavigate();
  const [historico] = useState([
    { id: 1, data: '10/06/2026', funcionario: 'Carlos Silva', setor: 'Produção', infração: 'Ausência de Capacete', status: 'Notificado' },
    { id: 2, data: '09/06/2026', funcionario: 'Ana Souza', setor: 'Logística', infração: 'Ausência de Colete', status: 'Pendente' },
    { id: 3, data: '08/06/2026', funcionario: 'Marcos Lima', setor: 'Manutenção', infração: 'Uso Incorreto de Luvas', status: 'Resolvido' },
  ]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/login'));
  };

  return (
    <div className="dash-rh-container">
      <header className="rh-header">
        <div className="rh-logo">
          <Users size={28} color="#2563eb" />
          <span>SafeWork <small className="badge-rh">Módulo RH</small></span>
        </div>
        <button onClick={handleLogout} className="btn-logout-rh">
          <LogOut size={18} /> Sair
        </button>
      </header>

      <main className="rh-content">
        {/* Cards de Métricas Rápidas */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Total de Colaboradores</span>
              <span className="metric-value">142</span>
            </div>
            <Users size={32} color="#2563eb" />
          </div>
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Infrações este Mês</span>
              <span className="metric-value text-danger">12</span>
            </div>
            <AlertTriangle size={32} color="#ef4444" />
          </div>
          <div className="metric-card">
            <div className="metric-info">
              <span className="metric-label">Índice de Conformidade</span>
              <span className="metric-value text-success">91.5%</span>
            </div>
            <CheckCircle size={32} color="#10b981" />
          </div>
        </div>

        {/* Tabela de Histórico de Infrações capturadas pela IA */}
        <div className="table-card">
          <div className="table-header">
            <h3>Histórico de Ocorrências e Auditoria (Mapeamento IA)</h3>
            <button className="btn-export">
              <FileSpreadsheet size={16} /> Exportar Relatório
            </button>
          </div>

          <table className="rh-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Funcionário</th>
                <th>Setor / Área</th>
                <th>Infração Detetada</th>
                <th>Status Administrativo</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((item) => (
                <tr key={item.id}>
                  <td>{item.data}</td>
                  <td className="font-bold">{item.funcionario}</td>
                  <td>{item.setor}</td>
                  <td>
                    <span className="rh-badge-infrax">{item.infração}</span>
                  </td>
                  <td>
                    <span className={`status-pill ${item.status.toLowerCase()}`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default DashboardRH;