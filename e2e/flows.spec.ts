import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("cadastro, persistência, triagem, conclusão e exportação", async ({
  page,
}) => {
  await page.goto("./#/demandas");
  await page.getByRole("button", { name: "Nova demanda", exact: true }).click();
  const form = page.getByRole("dialog", { name: "Nova demanda", exact: true });
  await form
    .getByLabel("Título *", { exact: true })
    .fill("Ocorrência criada no teste");
  await form.getByLabel("Local ou setor *").fill("Trilha demonstrativa");
  await form
    .getByLabel("Descrição da ocorrência *")
    .fill("Observação fictícia para validar o fluxo completo.");
  await form.getByLabel("Avaliar os três critérios agora").check();
  await form
    .getByRole("combobox", { name: "Risco às pessoas", exact: true })
    .selectOption("3");
  await expect(form.locator(".priority-explanation .badge")).toHaveText(
    "Crítica",
  );
  await form
    .getByRole("button", { name: "Salvar demanda", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Detalhes da demanda" })
    .getByRole("button", { name: "Fechar janela" })
    .click();
  await page.reload();
  await page
    .getByRole("textbox", { name: "Buscar demandas" })
    .fill("Ocorrência criada no teste");
  await page
    .getByRole("button", { name: /Ocorrência criada no teste/ })
    .click();
  await page
    .getByRole("button", { name: "Editar demanda", exact: true })
    .click();
  const edit = page.getByRole("dialog", {
    name: "Editar demanda",
    exact: true,
  });
  await edit
    .getByRole("combobox", { name: "Situação", exact: true })
    .selectOption("Concluída");
  await edit
    .getByLabel("Data de conclusão *")
    .fill(new Date().toLocaleDateString("sv-SE"));
  await edit
    .getByLabel("Descrição do atendimento *")
    .fill("Atendimento fictício finalizado e conferido.");
  await edit
    .getByRole("button", { name: "Salvar demanda", exact: true })
    .click();
  await expect(page.getByText(/Atendimento concluído em/)).toBeVisible();
  await page
    .getByRole("button", { name: "Relatório PDF", exact: true })
    .last()
    .click();
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeVisible();
});
test("não conformidade gera demanda vinculada sem prioridade automática", async ({
  page,
}) => {
  await page.goto("./#/rotinas");
  await page
    .getByRole("button", { name: "Realizar vistoria", exact: true })
    .first()
    .click();
  const form = page.getByRole("dialog", { name: "Registrar vistoria" });
  const items = form.locator("fieldset");
  for (let i = 0; i < (await items.count()); i++)
    await items
      .nth(i)
      .getByLabel(i === 0 ? "Não conforme" : "Conforme", { exact: true })
      .check();
  await form.getByRole("button", { name: "Concluir vistoria" }).click();
  await page
    .getByRole("button", { name: "Gerar demanda", exact: true })
    .click();
  const demand = page.getByRole("dialog", {
    name: "Nova demanda",
    exact: true,
  });
  await expect(demand.getByText("Não avaliada", { exact: true })).toBeVisible();
  await demand
    .getByRole("button", { name: "Salvar demanda", exact: true })
    .click();
  await expect(page.getByText(/Demanda vinculada:/)).toBeVisible();
});
test("produção permite consulta, gravação e PDF offline após cache inicial", async ({
  page,
  context,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page
    .getByText("Aplicação pronta para uso offline após este carregamento.")
    .waitFor();
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();
  await page.goto("./#/demandas");
  await expect(
    page.getByRole("heading", { name: "Demandas ambientais" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Galho instável junto/ }).click();
  await page
    .getByLabel("Nova observação")
    .fill("Observação gravada sem conexão.");
  await page.getByRole("button", { name: "Registrar acompanhamento" }).click();
  await expect(
    page.getByText("Observação gravada sem conexão.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("dialog", { name: "Detalhes da demanda" })
    .getByRole("button", { name: "Relatório PDF" })
    .click();
  await expect(page.getByRole("button", { name: "Baixar PDF" })).toBeVisible();
});
test("backup inválido preserva dados e substituição válida exige confirmação", async ({
  page,
}) => {
  await page.goto("./#/criterios");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Exportar backup JSON", exact: true })
    .click();
  const file = await (await downloadEvent).path();
  if (!file) throw new Error("Backup não foi baixado.");
  const original = JSON.parse(await readFile(file, "utf8"));
  expect(original.demands).toHaveLength(12);
  const input = page.getByLabel("Arquivo de backup JSON");
  await input.setInputFiles({
    name: "invalido.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"formatVersion":999}'),
  });
  await expect(page.getByRole("alert")).toContainText("Backup inválido");
  original.demands[0].title = "Título recuperado de backup";
  const backup = {
    name: "valido.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(original)),
  };
  await input.setInputFiles(backup);
  const dialog = page.getByRole("dialog", {
    name: "Substituir dados pelo backup?",
  });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Voltar", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await input.setInputFiles(backup);
  await dialog.getByRole("button", { name: "Confirmar", exact: true }).click();
  await page.goto("./#/demandas");
  await page
    .getByRole("textbox", { name: "Buscar demandas" })
    .fill("Título recuperado de backup");
  await expect(
    page.getByRole("button", { name: /Título recuperado de backup/ }),
  ).toBeVisible();
  await expect(
    page.getByText("1 demanda(s) encontrada(s)", { exact: true }),
  ).toBeVisible();
});
test("indicador abre recorte correto e páginas não transbordam na horizontal", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: /Concluídas no período/ }).click();
  await expect(
    page.getByRole("combobox", { name: "Filtrar situação" }),
  ).toHaveValue("Concluída");
  await expect(
    page.getByText("2 demanda(s) encontrada(s)", { exact: true }),
  ).toBeVisible();
  for (const path of ["#/demandas", "#/rotinas", "#/criterios", "#/"]) {
    await page.goto("./" + path);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});


test("compartilhamento usa endereço público e baixa QR Codes", async ({ page }) => {
  const address = "https://jpmarcal1718-stack.github.io/site-de-Meio-ambiente/";
  await page.goto("./#/criterios");
  await expect(page.getByRole("link", { name: address, exact: true })).toHaveAttribute("href", address);
  await expect(page.getByRole("img", { name: `QR Code para acessar ${address}`, exact: true })).toBeVisible();
  const pngEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "PNG", exact: true }).click();
  const pngPath = await (await pngEvent).path();
  if (!pngPath) throw new Error("QR Code PNG não foi baixado.");
  const png = await readFile(pngPath);
  expect(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true);
  const svgEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  const svgPath = await (await svgEvent).path();
  if (!svgPath) throw new Error("QR Code SVG não foi baixado.");
  expect(await readFile(svgPath, "utf8")).toContain("<svg");
});
