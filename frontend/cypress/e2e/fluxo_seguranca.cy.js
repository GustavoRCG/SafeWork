describe('Fluxo E2E - SafeWork (Apresentação TCC)', () => {
  
  beforeEach(() => {
    // Acessa a porta oficial do seu Vite/React
    cy.visit('http://localhost:5173/'); 
  });

  it('Deve interagir com as telas iniciais, escolher perfil técnico, logar e navegar pelo ecossistema', () => {
    
    // --- PASSO 1: ENTRAR COMO CLIENTE JÁ REGISTRADO ---
    cy.contains('Já sou Cliente').click();
    cy.wait(1000); 

    // --- PASSO 2: SELECIONAR PERFIL DE ACESSO ---
    cy.contains('Técnico do Trabalho').click();
    cy.wait(1000);

    // --- PASSO 3: AUTENTICAÇÃO ---
    cy.get('input[type="email"]').type('gustavo@gmail.com');
    cy.get('input[type="password"]').type('Gustavo@123');
    cy.get('button[type="submit"]').click();

    // Valida o redirecionamento inicial com base na rota real das imagens
    cy.url().should('include', '/dashboard-seguranca');

    // --- PASSO 4: PÁGINA 1 — MONITORAMENTO AO VIVO ---
    cy.contains('Monitoramento ao Vivo').click();
    // Como ele permanece na rota base ou altera query params, validamos a rota ativa
    cy.url().should('include', '/dashboard-seguranca');
    cy.wait(1500);

    // --- PASSO 5: PÁGINA 2 — HISTÓRICO DE ALERTAS ---
    cy.contains('Histórico de Alertas').click();
    cy.url().should('include', '/dashboard-seguranca');
    
    // Garante que a tabela está visível na tela
    cy.get('.cameras-data-table').should('be.visible');
    
    // Clica no primeiro registro da tabela de auditoria para exibir o Modal com o funcionário
    cy.get('.linha-clicavel-auditoria').first().click();
    
    // Valida a presença do modal e das informações tratadas
    cy.get('.modal-content-wrapper').should('be.visible');
    cy.contains('Funcionário:').should('be.visible');
    cy.wait(2000); 

    // Fecha a janela de evidências clicando no botão fechar (X)
    cy.get('.btn-close-modal').click();

    // --- PASSO 6: PÁGINA 3 — RELATÓRIOS DE BI ---
    cy.contains('Relatórios de BI').click();
    cy.url().should('include', '/dashboard-seguranca');
    
    // Valida que o container principal ainda responde corretamente
    cy.get('.seguranca-page-container').should('exist');
    cy.wait(2000); 
  });
});