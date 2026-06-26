describe('Fluxo de Autenticação - Senha Incorreta', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    // Simula que o usuário existe no banco de dados
    cy.intercept('GET', '**/api/usuarios?email=*', {
      statusCode: 200,
      body: { id_usuario: 1, email: 'tecnico@safework.com', id_perfil: 3 }
    }).as('buscaUsuario');

    // 🔥 FORÇA O FIREBASE A RETORNAR ERRO 400 (Senha Errada)
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword**', {
      statusCode: 400,
      body: {
        error: { code: 400, message: "INVALID_LOGIN_CREDENTIALS" }
      }
    }).as('firebaseErro');

    cy.visit('http://localhost:5173/login');
  });

  it('Deve exibir aviso de erro e limpar apenas a senha se errar a autenticação', () => {
    cy.get('.profile-card').contains('Técnico do Trabalho').click();

    cy.get('input[type="email"]').type('tecnico@safework.com');
    cy.get('input[type="password"]').type('SenhaErrada123');
    cy.get('button[type="submit"]').click();

    cy.wait('@buscaUsuario');
    cy.wait('@firebaseErro');

    // 🛑 Valida se a mensagem de senha errada apareceu
    cy.contains('E-mail ou senha incorretos.').should('be.visible');

    // 🧼 Valida que o e-mail CONTINUA lá, mas a senha foi limpa
    cy.get('input[type="email"]').should('have.value', 'tecnico@safework.com');
    cy.get('input[type="password"]').should('have.value', '');
  });
});