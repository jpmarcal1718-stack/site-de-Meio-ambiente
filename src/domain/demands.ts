import type { Demand, Filters, Inspection, Routine } from "../types";
import {
  closed,
  inPeriod,
  isOverdue,
  localDate,
  nextOccurrence,
} from "./dates";
import { effectivePriority, priorityRank } from "./priority";
export function filterDemands(ds: Demand[], f: Filters): Demand[] {
  const norm = (v: string) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return ds
    .filter(
      (d) =>
        (!f.q ||
          norm(
            [
              d.protocol,
              d.title,
              d.location,
              d.area,
              d.status,
              d.responsible,
              effectivePriority(d) || "Não avaliada",
            ].join(" "),
          ).includes(norm(f.q))) &&
        (!f.area || d.area === f.area) &&
        (!f.status ||
          (f.status === "abertas" ? !closed(d) : d.status === f.status)) &&
        (!f.responsible || d.responsible === f.responsible) &&
        (!f.priority ||
          (f.priority === "urgentes"
            ? !closed(d) && priorityRank(effectivePriority(d)) >= 3
            : (effectivePriority(d) || "Não avaliada") === f.priority)) &&
        (!f.overdue || isOverdue(d)) &&
        (f.dateKind !== "completed" || !!d.completedAt) &&
        inPeriod(
          f.dateKind === "completed" ? d.completedAt : d.registeredAt,
          f.from,
          f.to,
        ),
    )
    .sort((a, b) =>
      f.sort === "newest"
        ? b.registeredAt.localeCompare(a.registeredAt)
        : f.sort === "deadline"
          ? (a.deadline || "9999").localeCompare(b.deadline || "9999")
          : Number(closed(a)) - Number(closed(b)) ||
            priorityRank(effectivePriority(b)) -
              priorityRank(effectivePriority(a)) ||
            (a.deadline || "9999").localeCompare(b.deadline || "9999"),
    );
}
export function blankDemand(partial: Partial<Demand> = {}): Demand {
  const id = crypto.randomUUID();
  return {
    id,
    protocol: `DEMO-${localDate().slice(0, 4)}-${id.slice(0, 8).toUpperCase()}`,
    title: "",
    area: "Áreas verdes e arborização",
    location: "",
    description: "",
    origin: "Exemplo da feira",
    registeredAt: localDate(),
    assessment: null,
    override: null,
    justification: "",
    responsible: "",
    status: "Aguardando triagem",
    deadline: "",
    nextAction: "",
    notes: [],
    completedAt: "",
    resolution: "",
    history: [],
    sourceInspectionId: null,
    sourceRoutineId: null,
    ...partial,
  };
}
export function recordChanges(
  previous: Demand | undefined,
  next: Demand,
): Demand {
  const events: string[] = [];
  if (!previous) events.push("Demanda demonstrativa cadastrada.");
  else {
    for (const key of [
      "title",
      "area",
      "location",
      "description",
      "origin",
      "registeredAt",
      "deadline",
      "responsible",
      "status",
      "nextAction",
      "completedAt",
      "resolution",
    ] as const) {
      const labels: Record<string, string> = {
        title: "Título",
        area: "Área",
        location: "Local",
        description: "Descrição",
        origin: "Origem",
        registeredAt: "Data de registro",
        deadline: "Prazo",
        responsible: "Responsável",
        status: "Situação",
        nextAction: "Próxima ação",
        completedAt: "Data de conclusão",
        resolution: "Atendimento",
      };
      if (previous[key] !== next[key])
        events.push(
          `${labels[key]}: “${previous[key] || "Não definido"}” → “${next[key] || "Não definido"}”.`,
        );
    }
    if (JSON.stringify(previous.assessment) !== JSON.stringify(next.assessment))
      events.push(
        `Avaliação dos critérios: ${JSON.stringify(previous.assessment)} → ${JSON.stringify(next.assessment)}.`,
      );
    if (
      previous.override !== next.override ||
      previous.justification !== next.justification
    )
      events.push(
        `Alteração manual: ${previous.override || "Sugestão"} → ${next.override || "Sugestão"}. Justificativa anterior: ${previous.justification || "Nenhuma"}. Justificativa atual: ${next.justification || "Nenhuma"}.`,
      );
    if (effectivePriority(previous) !== effectivePriority(next))
      events.push(
        `Prioridade: ${effectivePriority(previous) || "Não avaliada"} → ${effectivePriority(next) || "Não avaliada"}.`,
      );
  }
  return {
    ...next,
    history: [
      ...(previous?.history || []),
      ...events.map((text) => ({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        text,
      })),
    ],
  };
}
export function inspectionDemand(i: Inspection, r: Routine): Demand {
  return blankDemand({
    title: `Não conformidade: ${r.name}`,
    area: r.area,
    location: r.location,
    responsible: r.responsible,
    origin: "Vistoria preventiva",
    description: `Vistoria de ${i.date}. Itens não conformes: ${i.items
      .filter((x) => x.result === "Não conforme")
      .map((x) => x.label)
      .join("; ")}. ${i.notes}`,
    sourceInspectionId: i.id,
    sourceRoutineId: r.id,
  });
}
export function completeInspection(r: Routine, i: Inspection): Routine {
  return { ...r, nextDate: nextOccurrence(i.date, r.frequency, r.anchorDay) };
}
