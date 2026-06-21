import React from 'react';
import { useNavigate } from 'react-router-dom';
import './dashboard_inicial.css'; 

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        
        {/* Cabeçalho com a Logo Oficial da Marca */}
        <div className="welcome-header">
          <div className="onboarding-header">
            <div className="brand-logo">
              <h1 className="logo-red">
                 SAFE<span style={{ color: "#dc2626" }}>WORK</span>
              </h1>
              <span className="logo-sub">SISTEMA DE MONITORAMENTO</span>
            </div>
          </div>
          <p className="welcome-subtitle">
            Visão computacional e inteligência artificial aplicadas à gestão de segurança e monitoramento de EPIs.
          </p>
        </div>

        {/* Grid de Cards de Direcionamento */}
        <div className="welcome-grid">
          
          {/* Opção 1: Já sou Cliente (Login) */}
          <div 
            onClick={() => navigate('/login')} 
            className="welcome-card card-login"
          >
            <div className="card-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            </div>
            <h3>Já sou Cliente</h3>
            <p>Área restrita para técnicos de segurança e administradores realizarem o login no painel de controle.</p>
          </div>

          {/* Opção 2: Nova Empresa / Cadastro */}
          <div 
            onClick={() => navigate('/empresa')} 
            className="welcome-card card-empresa"
          >
            <div className="card-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3>Nova Empresa</h3>
            <p>Registre sua empresa e contrate um plano para começar a monitorar seus canteiros e frentes de trabalho.</p>
          </div>

        </div>

        {/* Rodapé */}
        <div className="welcome-footer">
          SafeWork © 2026 · Tecnologia em prol da vida do trabalhador.
        </div>

      </div>
    </div>
  );
}