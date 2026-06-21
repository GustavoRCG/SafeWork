describe("CRUD, Fluxo de Auditoria e Segurança - SafeWork", () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();

    cy.visit("http://localhost:5173/");
    cy.wait(1000);

    cy.url().then((url) => {
      if (!url.includes("dashboard")) {
        cy.get("body").then(($body) => {
          if ($body.text().includes("Técnico do Trabalho")) {
            cy.contains("Técnico do Trabalho").click();
          }
          cy.get(
            'input[type="email"], input[placeholder*="email"], input[name*="email"]',
            { timeout: 5000 },
          ).type("gustavorodrigues@safework.com");
          cy.get(
            'input[type="password"], input[placeholder*="senha"], input[name*="senha"]',
          ).type("123456");
          cy.get('button[type="submit"], button')
            .contains("Entrar", { matchCase: false })
            .click();
        });
      }
    });

    cy.wait(4000);
  });

  it("Tipo 1: Teste de Integração UI - Deve carregar a listagem de alertas do banco de dados", () => {
    // 🧭 1. Garante que clica no menu lateral correto para abrir a tabela que criamos
    cy.contains("Histórico de Alertas", {
      matchCase: false,
      timeout: 10000,
    }).click();

    // Um pequeno fôlego para o Axios disparar a rota /api/alertas e renderizar os componentes
    cy.wait(2000);

    // 2. Agora sim, verifica se a tabela carregou os registros do banco com o prefixo correto
    cy.contains("ALT-", { timeout: 10000 }).should("exist");
  });

  it("Tipo 2: Teste E2E (Fim a Fim) - Deve navegar até as Configurações da IA", () => {
    // Simula a navegação do usuário pelo menu lateral para o CRUD de regras
    cy.contains("Configurações da IA", { matchCase: false }).click();
    cy.wait(2000);

    // Valida que a tela de configurações carregou com sucesso
    cy.contains("YOLO", { matchCase: false, timeout: 5000 }).should("exist");
  });
});
