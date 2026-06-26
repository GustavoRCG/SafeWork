describe('Fluxo de Autenticação - Credenciais Inválidas', () => {
  
  beforeEach(() => {
    // 🧼 Limpa a sessão antes de começar o teste
    cy.clearLocalStorage();
    cy.clearCookies();

    // 1. Intercepta a API local simulando que o usuário Técnico existe no banco
    cy.intercept('GET', '**/api/usuarios?email=*', {
      statusCode: 200,
      body: { id_usuario: 1, email: 'tecnico@safework.com', id_perfil: 3 } // Técnico
    }).as('buscaUsuario');

    // 2. 🔥 SIMULA O ERRO DO FIREBASE: Força a API da Google a retornar Erro 400 (Senha Errada)
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
      statusCode: 400,
      body: {
        error: {
          code: 400,
          message: "INVALID_LOGIN_CREDENTIALS",
          errors: [{ message: "INVALID_LOGIN_CREDENTIALS" }]
        }
      }
    }).as('firebaseErro');

    // Inicializa na página de login do frontend
    cy.visit('http://localhost:5173/login'); 
  });

  it('Deve exibir aviso de erro e limpar apenas o campo de senha ao errar a autenticação no Firebase', () => {
    
    // Seleciona o card correto para o teste: "Técnico do Trabalho"
    cy.get('.profile-card', { timeout: 10000 }).contains('Técnico do Trabalho').should('be.visible').click();

    // Digita o e-mail correto, mas uma senha errada de propósito
    cy.get('input[type="email"]').should('be.visible').type('tecnico@safework.com');
    cy.get('input[type="password"]').type('SenhaTotalmenteErrada123');
    
    // Clica para enviar o formulário
    cy.get('button[type="submit"]').click();
    
    // Aguarda os interceptadores agirem
    cy.wait('@buscaUsuario');
    cy.wait('@firebaseErro');

    // 🛑 VALIDAÇÃO DO ERRO: A aplicação deve exibir o alerta de credenciais inválidas na tela
    cy.contains('E-mail ou senha incorretos.').should('be.visible');

    // 🧼 VALIDAÇÃO DO COMPORTAMENTO DOS INPUTS:
    // O e-mail DEVE continuar preenchido para o usuário não ter que digitar tudo de novo
    cy.get('input[type="email"]').should('have.value', 'tecnico@safework.com');
    
    // A senha DEVE ter sido limpa por segurança
    cy.get('input[type="password"]').should('have.value', '');
  });
});