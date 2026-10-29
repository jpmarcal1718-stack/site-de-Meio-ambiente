import { describe, it, expect } from "vitest";
import { suggestPriority, effectivePriority } from "../src/domain/priority";
import {
  addDays,
  closed,
  isDate,
  isOverdue,
  nextOccurrence,
} from "../src/domain/dates";
import {
  blankDemand,
  completeInspection,
  filterDemands,
  inspectionDemand,
  recordChanges,
} from "../src/domain/demands";
import { createSeed } from "../src/data/seed";
import { demandSchema, validateBackup } from "../src/validation/schema";
import { emptyFilters } from "../src/types";
import {
  csvCell,
  demandsCsv,
  filterDescription,
  pdfText,
} from "../src/export/files";
describe("Matriz demonstrativa", () => {
  it.each([
    [1, 1, 1, "Baixa"],
    [1, 1, 2, "Baixa"],
    [1, 2, 2, "Média"],
    [2, 2, 2, "Média"],
    [2, 2, 3, "Alta"],
    [2, 3, 3, "Alta"],
    [3, 3, 3, "Crítica"],
    [3, 1, 1, "Crítica"],
  ])(
    "classifica %i + %i + %i como %s",
    (people, environment, worsening, expected) => {
      expect(
        suggestPriority({
          people: Number(people),
          environment: Number(environment),
          worsening: Number(worsening),
        }).priority,
      ).toBe(expected);
    },
  );
  it("testa todas as 27 combinações válidas e a exceção de proteção", () => {
    for (let people = 1; people <= 3; people++)
      for (let environment = 1; environment <= 3; environment++)
        for (let worsening = 1; worsening <= 3; worsening++) {
          const r = suggestPriority({ people, environment, worsening });
          expect(r.score).toBe(people + environment + worsening);
          if (people === 3) expect(r.priority).toBe("Crítica");
        }
  });
  it("não transforma uma demanda não avaliada em prioridade baixa", () => {
    expect(suggestPriority(null)).toMatchObject({
      priority: null,
      score: null,
    });
    expect(effectivePriority(blankDemand())).toBeNull();
  });
  it("rejeita critérios fora dos limites", () => {
    expect(() =>
      suggestPriority({ people: 0, environment: 2, worsening: 3 }),
    ).toThrow();
  });
  it("exige justificativa manual e mantém a sugestão independente da decisão", () => {
    const d = {
      ...createSeed().demands[1],
      override: "Baixa" as const,
      justification: "",
    };
    expect(demandSchema.safeParse(d).success).toBe(false);
    d.justification = "Área isolada após avaliação da equipe fictícia.";
    expect(demandSchema.safeParse(d).success).toBe(true);
    expect(effectivePriority(d)).toBe("Baixa");
    expect(suggestPriority(d.assessment).priority).toBe("Alta");
    d.assessment = null;
    expect(demandSchema.safeParse(d).success).toBe(false);
  });
  it("preserva no histórico a avaliação anterior e alterações importantes", () => {
    const before = createSeed().demands[1];
    const after = recordChanges(before, {
      ...before,
      assessment: { people: 1, environment: 1, worsening: 1 },
      responsible: "Outra equipe",
      deadline: addDays(before.deadline, 2),
      status: "Planejada",
    });
    expect(after.history.length).toBeGreaterThan(before.history.length);
    expect(after.history.map((x) => x.text).join(" ")).toContain(
      JSON.stringify(before.assessment),
    );
    expect(before.history).not.toBe(after.history);
  });
});
describe("Datas locais e recorrência", () => {
  it("considera vencidas apenas demandas abertas com prazo anterior a hoje", () => {
    const d = { ...createSeed().demands[1], deadline: "2026-01-01" };
    expect(isOverdue(d, "2026-01-02")).toBe(true);
    expect(isOverdue(d, "2026-01-01")).toBe(false);
    expect(isOverdue({ ...d, status: "Concluída" }, "2026-01-02")).toBe(false);
    expect(isOverdue({ ...d, status: "Cancelada" }, "2026-01-02")).toBe(false);
    expect(isOverdue({ ...d, deadline: "" })).toBe(false);
    expect(closed({ ...d, status: "Cancelada" })).toBe(true);
  });
  it.each([
    ["2026-01-31", "Mensal", "2026-02-28"],
    ["2024-01-31", "Mensal", "2024-02-29"],
    ["2026-12-31", "Mensal", "2027-01-31"],
    ["2026-01-31", "Trimestral", "2026-04-30"],
    ["2026-12-28", "Semanal", "2027-01-04"],
    ["2026-10-25", "Quinzenal", "2026-11-08"],
    ["2026-12-31", "Diária", "2027-01-01"],
  ] as const)("%s %s -> %s", (date, freq, expected) =>
    expect(nextOccurrence(date, freq)).toBe(expected),
  );
  it("preserva o dia de referência na passagem por um mês curto", () =>
    expect(nextOccurrence("2026-02-28", "Mensal", 31)).toBe("2026-03-31"));
  it("valida calendário real e não desloca datas pela conversão UTC", () => {
    expect(isDate("2026-02-30")).toBe(false);
    expect(isDate("2024-02-29")).toBe(true);
    expect(addDays("2026-10-28", 1)).toBe("2026-10-29");
  });
});
describe("Fluxos e exportações", () => {
  it("produz rótulos de filtros e tipografia compatível com a fonte PDF", () => {
    expect(filterDescription(emptyFilters)).toBe("Todos os registros");
    expect(
      filterDescription({
        ...emptyFilters,
        from: "2026-10-01",
        dateKind: "completed",
      }),
    ).toContain("conclusão");
    expect(pdfText("Ivaiporã: Crítica → Alta “avaliação”")).toBe(
      'Ivaiporã: Crítica  ->  Alta "avaliação"',
    );
  });
  it("gera uma demanda sem avaliação vinculada à vistoria e à rotina", () => {
    const data = createSeed();
    const r = data.routines[0];
    const i = {
      ...data.inspections[0],
      items: [{ label: "Placas legíveis", result: "Não conforme" as const }],
    };
    const d = inspectionDemand(i, r);
    expect(d.assessment).toBeNull();
    expect(d.sourceInspectionId).toBe(i.id);
    expect(d.sourceRoutineId).toBe(r.id);
    expect(d.description).toContain("Placas legíveis");
    expect(completeInspection(r, i).nextDate).toBe(
      nextOccurrence(i.date, r.frequency, r.anchorDay),
    );
    expect(
      validateBackup({
        ...data,
        inspections: [i, ...data.inspections.slice(1)],
        demands: [...data.demands, recordChanges(undefined, d)],
      }).demands,
    ).toHaveLength(13);
  });
  it("mantém filtro de conclusão distinto do filtro de registro", () => {
    const data = createSeed("2026-10-28");
    const ds = filterDemands(data.demands, {
      ...emptyFilters,
      status: "Concluída",
      dateKind: "completed",
      from: "2026-10-27",
      to: "2026-10-27",
    });
    expect(ds).toHaveLength(2);
  });
  it("busca sem depender de acentos e combina filtros", () => {
    const d = createSeed("2026-10-28").demands;
    expect(filterDemands(d, { ...emptyFilters, q: "nascente" })).toHaveLength(
      1,
    );
    expect(
      filterDemands(d, { ...emptyFilters, priority: "urgentes" }).every(
        (x) => !closed(x),
      ),
    ).toBe(true);
  });
  it("rejeita backup com vínculo quebrado ou versão desconhecida", () => {
    const d = createSeed();
    expect(() => validateBackup({ ...d, formatVersion: 2 })).toThrow();
    expect(() =>
      validateBackup({
        ...d,
        inspections: [{ ...d.inspections[0], routineId: "inexistente" }],
      }),
    ).toThrow();
    expect(() =>
      validateBackup({ ...d, demands: [d.demands[0], d.demands[0]] }),
    ).toThrow();
  });
  it("neutraliza fórmulas e escapa aspas, delimitadores e quebras de linha no CSV", () => {
    expect(csvCell(' =HYPERLINK("teste")')).toBe('"\' =HYPERLINK(""teste"")"');
    expect(csvCell("@SUM(1)")).toContain("'");
    expect(csvCell('normal;"texto"\nlinha')).toBe('"normal;""texto""\nlinha"');
    expect(demandsCsv(createSeed().demands)).toContain("Protocolo");
  });
  it("exige atendimento e conclusão consistentes para encerrar", () => {
    const d = createSeed().demands[1];
    expect(demandSchema.safeParse({ ...d, status: "Concluída" }).success).toBe(
      false,
    );
    expect(
      demandSchema.safeParse({
        ...d,
        status: "Em execução",
        completedAt: "2026-01-01",
      }).success,
    ).toBe(false);
  });
});
