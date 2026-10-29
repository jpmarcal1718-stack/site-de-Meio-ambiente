import { priorityConfig } from "../config/project";
import type { Assessment, Demand, Priority } from "../types";
export function suggestPriority(a: Assessment | null): {
  priority: Priority | null;
  score: number | null;
  reason: string;
} {
  if (!a)
    return {
      priority: null,
      score: null,
      reason: "Preencha os três critérios para realizar a triagem.",
    };
  if (Object.values(a).some((v) => !Number.isInteger(v) || v < 1 || v > 3))
    throw new Error("Cada critério deve receber de 1 a 3 pontos.");
  const score = a.people + a.environment + a.worsening;
  if (a.people === priorityConfig.criticalPeopleRisk)
    return {
      priority: "Crítica",
      score,
      reason:
        "Risco alto às pessoas: a regra de proteção eleva a sugestão para crítica.",
    };
  const priority: Priority =
    score <= priorityConfig.lowMax
      ? "Baixa"
      : score <= priorityConfig.mediumMax
        ? "Média"
        : score <= priorityConfig.highMax
          ? "Alta"
          : "Crítica";
  return {
    priority,
    score,
    reason: `Soma de ${score} pontos nos três critérios: prioridade ${priority.toLowerCase()}.`,
  };
}
export function effectivePriority(d: Pick<Demand, "assessment" | "override">) {
  return d.override || suggestPriority(d.assessment).priority;
}
export const priorityRank = (p: Priority | null) =>
  p === "Crítica"
    ? 4
    : p === "Alta"
      ? 3
      : p === "Média"
        ? 2
        : p === "Baixa"
          ? 1
          : 0;
