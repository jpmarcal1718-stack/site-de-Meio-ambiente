import { z } from "zod";
import {
  AREAS,
  STATUSES,
  PRIORITIES,
  FREQUENCIES,
  RESULTS,
} from "../config/project";
import { isDate } from "../domain/dates";
z.config(z.locales.ptBR());
const date = z.string().refine(isDate, "Informe uma data válida.");
const optionalDate = z.union([z.literal(""), date]);
const text = z
  .string()
  .trim()
  .min(1, "Campo obrigatório.")
  .max(10000, "Texto muito longo (máximo 10.000 caracteres).");
const note = z.object({ id: z.string().min(1), date: z.iso.datetime(), text });
export const demandSchema = z
  .object({
    id: z.string().min(1),
    protocol: text,
    title: text.max(180),
    area: z.enum(AREAS),
    location: text.max(300),
    description: text,
    origin: text,
    registeredAt: date,
    assessment: z
      .object({
        people: z.number().int().min(1).max(3),
        environment: z.number().int().min(1).max(3),
        worsening: z.number().int().min(1).max(3),
      })
      .nullable(),
    override: z.enum(PRIORITIES).nullable(),
    justification: z.string().max(10000),
    responsible: z.string().max(300),
    status: z.enum(STATUSES),
    deadline: optionalDate,
    nextAction: z.string().max(10000),
    notes: z.array(note).max(10000),
    completedAt: optionalDate,
    resolution: z.string().max(10000),
    history: z.array(note).max(10000),
    sourceInspectionId: z.string().nullable(),
    sourceRoutineId: z.string().nullable(),
  })
  .superRefine((d, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    if (d.override && !d.assessment)
      issue(
        "assessment",
        "Avalie os três critérios antes de alterar a prioridade.",
      );
    if (d.override && !d.justification.trim())
      issue("justification", "Justifique a alteração manual da prioridade.");
    if (d.status === "Concluída" && (!d.completedAt || !d.resolution.trim()))
      issue(
        "resolution",
        "Informe a data de conclusão e descreva o atendimento.",
      );
    if (d.status !== "Concluída" && (d.completedAt || d.resolution))
      issue(
        "completedAt",
        "Remova os dados de conclusão ao reabrir a demanda.",
      );
    if (d.completedAt && d.completedAt < d.registeredAt)
      issue("completedAt", "A conclusão não pode anteceder o registro.");
    if (d.completedAt && d.completedAt > new Date().toLocaleDateString("sv-SE"))
      issue("completedAt", "A conclusão não pode estar no futuro.");
    if (d.registeredAt > new Date().toLocaleDateString("sv-SE"))
      issue("registeredAt", "O registro não pode estar no futuro.");
    if (d.deadline && d.deadline < d.registeredAt)
      issue("deadline", "O prazo não pode anteceder o registro.");
  });
export const routineSchema = z.object({
  id: z.string().min(1),
  name: text.max(180),
  location: text,
  area: z.enum(AREAS),
  frequency: z.enum(FREQUENCIES),
  nextDate: date,
  responsible: text.max(300),
  checklist: z.array(text).min(1, "Inclua ao menos um item.").max(50),
  anchorDay: z.number().int().min(1).max(31),
});
export const inspectionSchema = z
  .object({
    id: z.string().min(1),
    routineId: z.string().min(1),
    date,
    notes: z.string().max(10000),
    items: z
      .array(z.object({ label: text, result: z.enum(RESULTS) }))
      .min(1)
      .max(50),
  })
  .refine((i) => i.date <= new Date().toLocaleDateString("sv-SE"), {
    path: ["date"],
    message: "A vistoria realizada não pode estar no futuro.",
  });
export const backupSchema = z
  .object({
    formatVersion: z.literal(1),
    seededAt: z.iso.datetime(),
    demands: z.array(demandSchema).max(20000),
    routines: z.array(routineSchema).max(2000),
    inspections: z.array(inspectionSchema).max(20000),
  })
  .superRefine((data, ctx) => {
    const ids = new Set<string>();
    const protocols = new Set<string>();
    for (const x of [...data.demands, ...data.routines, ...data.inspections]) {
      if (ids.has(x.id))
        ctx.addIssue({
          code: "custom",
          message: "Há identificadores duplicados no backup.",
        });
      ids.add(x.id);
    }
    for (const d of data.demands) {
      if (protocols.has(d.protocol))
        ctx.addIssue({ code: "custom", message: "Há protocolos duplicados." });
      protocols.add(d.protocol);
    }
    const routines = new Set(data.routines.map((x) => x.id));
    const inspections = new Map(data.inspections.map((x) => [x.id, x]));
    for (const i of data.inspections)
      if (!routines.has(i.routineId))
        ctx.addIssue({
          code: "custom",
          message: "Vistoria sem rotina de origem.",
        });
    for (const d of data.demands)
      if (
        (d.sourceRoutineId && !routines.has(d.sourceRoutineId)) ||
        (d.sourceInspectionId &&
          (!inspections.has(d.sourceInspectionId) ||
            inspections.get(d.sourceInspectionId)?.routineId !==
              d.sourceRoutineId))
      )
        ctx.addIssue({
          code: "custom",
          message: "Demanda com vínculo de vistoria inválido.",
        });
  });
export function validateBackup(input: unknown) {
  const result = backupSchema.safeParse(input);
  if (!result.success)
    throw new Error(
      `Backup inválido. ${result.error.issues[0]?.message || "Formato não reconhecido."}`,
    );
  return result.data;
}
