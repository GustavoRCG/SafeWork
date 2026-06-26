describe('Fluxo E2E - Administrador do Sistema (SafeWork)', () => {
  
  beforeEach(() => {
    cy.visit('http://localhost:5173/'); 
  });

  it('Deve logar como Administrador, cadastrar um usuário fictício e depois excluí-lo', () => {
    cy.contains('Já sou Cliente').click();
    cy.wait(800);
    
    cy.contains('Administrador do Sistema').click();
    cy.wait(800);

    cy.get('input[type="email"]').type('gustavo@gmail.com'); 
    cy.get('input[type="password"]').type('Gustavo@123');
    cy.get('button[type="submit"]').click();

    cy.url().should('include', '/dashboard-admin');
    cy.contains('Controle de Usuários e Permissões (IAM)').should('be.visible');

    cy.contains('Novo Usuário').click();
    cy.contains('h3', 'Cadastrar Novo Usuário').should('be.visible');

    cy.get('input[placeholder="exemplo@safework.com"]').type('banca.tcc@safework.com');
    cy.get('input[type="password"]').eq(0).type('TesteBanca@123'); 
    cy.get('input[type="password"]').eq(1).type('TesteBanca@123'); 
    
    cy.get('select').select('Admin SafeWork'); 
    cy.wait(1000);

    cy.contains('Confirmar Cadastro').click();

    cy.url().should('include', '/dashboard-admin');
    
    cy.contains('.user-item', 'banca.tcc').should('be.visible');
    cy.wait(2000); 

    // Alvo cirúrgico baseado no seu HTML: busca a linha correta e o botão por título exato
    cy.contains('.user-item', 'banca.tcc')
      .find('button[title="Excluir usuário"]')
      .click({ force: true }); 

    cy.wait(3000); 

    cy.contains('.user-item', 'banca.tcc').should('not.exist');
    cy.contains('banca.tcc@safework.com').should('not.exist');
    cy.wait(1500);
  });
});