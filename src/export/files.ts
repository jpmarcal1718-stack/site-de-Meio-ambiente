import type { AppData, Demand, Filters } from "../types";
import { effectivePriority, suggestPriority } from "../domain/priority";
import { formatDate } from "../domain/dates";
import { project } from "../config/project";
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function exportBackup(data: AppData) {
  download(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    `backup-gestao-ambiental-${Date.now()}.json`,
  );
}
export function csvCell(value: string) {
  const safe = /^[\s]*[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function demandsCsv(ds: Demand[]) {
  return (
    "\uFEFF" +
    [
      [
        "Protocolo",
        "Título",
        "Área",
        "Local",
        "Situação",
        "Prioridade",
        "Responsável",
        "Registro",
        "Prazo",
        "Próxima ação",
      ],
      ...ds.map((d) => [
        d.protocol,
        d.title,
        d.area,
        d.location,
        d.status,
        effectivePriority(d) || "Não avaliada",
        d.responsible,
        d.registeredAt,
        d.deadline,
        d.nextAction,
      ]),
    ]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n")
  );
}
export function exportCsv(ds: Demand[]) {
  download(
    new Blob([demandsCsv(ds)], { type: "text/csv;charset=utf-8" }),
    "demandas-filtradas.csv",
  );
}
export function filterDescription(filters: Filters) {
  const labels: Record<string, string> = {
    q: "Busca",
    area: "Área",
    status: "Situação",
    responsible: "Responsável",
    priority: "Prioridade",
    overdue: "Atrasadas",
    from: "A partir de",
    to: "Até",
  };
  const parts = Object.entries(filters)
    .filter(([k, v]) => v && k !== "sort" && k !== "dateKind")
    .map(([k, v]) => `${labels[k]}: ${v}`);
  if (filters.from || filters.to)
    parts.push(
      `Datas por ${filters.dateKind === "completed" ? "conclusão" : "registro"}`,
    );
  return parts.join(" · ") || "Todos os registros";
}
export function pdfText(value: string) {
  return value
    .normalize("NFC")
    .replace(/→/g, " -> ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[—–]/g, "-")
    .replace(/•/g, " · ")
    .replace(/[^\x20-\x7E\u00A0-\u00FF\n\r]/g, "?");
}
export async function demandPdf(
  ds: Demand[],
  filters: Filters,
  individual = false,
): Promise<Blob> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const pdf = new jsPDF();
  const width = 174;
  let y = 22;
  const text = (value: string, size = 10, bold = false) => {
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setFontSize(size);
    for (const line of pdf.splitTextToSize(
      pdfText(value || "Não informado"),
      width,
    )) {
      if (y > 272) {
        pdf.addPage();
        y = 20;
      }
      pdf.text(line, 18, y);
      y += size * 0.48 + 2;
    }
    y += 3;
  };
  pdf.setTextColor(22, 62, 50);
  text(project.name, 18, true);
  text("Demonstração acadêmica · Dados demonstrativos", 10);
  pdf.setTextColor(40, 45, 42);
  text(`Gerado em ${new Date().toLocaleString("pt-BR")}`);
  text(`Filtros: ${filterDescription(filters)}`);
  if (individual) {
    const d = ds[0];
    const s = suggestPriority(d.assessment);
    text(`${d.protocol} · ${d.title}`, 14, true);
    text(
      `Área: ${d.area}\nLocal: ${d.location}\nOrigem: ${d.origin}\nRegistro: ${formatDate(d.registeredAt)}`,
    );
    text(`Descrição: ${d.description}`);
    text(
      `Prioridade: ${effectivePriority(d) || "Não avaliada"} · Sugestão: ${s.priority || "Não avaliada"}\n${s.reason}`,
    );
    if (d.assessment)
      text(
        `Risco às pessoas: ${d.assessment.people} · Dano ambiental: ${d.assessment.environment} · Agravamento: ${d.assessment.worsening}`,
      );
    if (d.override) text(`Alteração manual: ${d.justification}`);
    text(
      `Responsável: ${d.responsible || "Não definido"}\nSituação: ${d.status}\nPrazo: ${formatDate(d.deadline)}\nPróxima ação: ${d.nextAction || "Não definida"}`,
    );
    if (d.completedAt)
      text(`Concluída em ${formatDate(d.completedAt)}: ${d.resolution}`);
    if (d.sourceInspectionId)
      text(
        `Vistoria de origem: ${d.sourceInspectionId}\nRotina de origem: ${d.sourceRoutineId}`,
      );
    text("Acompanhamentos", 12, true);
    for (const n of d.notes)
      text(`${new Date(n.date).toLocaleString("pt-BR")}: ${n.text}`);
    text("Histórico", 12, true);
    for (const n of d.history)
      text(`${new Date(n.date).toLocaleString("pt-BR")}: ${n.text}`);
  } else
    autoTable(pdf, {
      startY: y,
      rowPageBreak: "avoid",
      head: [
        [
          "Protocolo / demanda",
          "Local / responsável",
          "Prioridade / situação",
          "Prazo",
        ],
      ],
      body: ds.map((d) =>
        [
          `${d.protocol}\n${d.title}`,
          `${d.location}\n${d.responsible || "Não definido"}`,
          `${effectivePriority(d) || "Não avaliada"}\n${d.status}`,
          formatDate(d.deadline),
        ].map(pdfText),
      ),
      styles: { font: "helvetica", fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [22, 62, 50] },
      margin: { left: 18, right: 18, bottom: 24 },
    });
  const pages = pdf.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(90);
    pdf.text(
      `Demonstração acadêmica · Não constitui solicitação oficial · ${p}/${pages}`,
      18,
      286,
    );
  }
  return pdf.output("blob");
}
