import type { AppData, Demand, Routine } from "../types";
import { AREAS, PEOPLE } from "../config/project";
import { addDays, localDate, parseDate } from "../domain/dates";
import { blankDemand, recordChanges } from "../domain/demands";
export function createSeed(today = localDate()): AppData {
  const examples: [string, number, string, string][] = [
    [
      "Galho instável junto à passagem",
      0,
      "Entrada do parque",
      "Exemplo fictício: avaliar um galho próximo da circulação de visitantes e sinalizar a passagem durante a avaliação.",
    ],
    [
      "Resíduos na margem da trilha",
      4,
      "Trilha das Araucárias",
      "Exemplo fictício: organizar recolhimento e revisar a localização das lixeiras.",
    ],
    [
      "Placa de orientação danificada",
      2,
      "Encontro das trilhas",
      "Exemplo fictício: verificar fixação, legibilidade e necessidade de reposição da sinalização.",
    ],
    [
      "Acompanhamento de nascente",
      1,
      "Setor de nascentes",
      "Exemplo fictício: observar as margens e registrar alterações na vegetação de proteção.",
    ],
    [
      "Revisão da irrigação do viveiro",
      3,
      "Viveiro demonstrativo",
      "Exemplo fictício: inspecionar mangueiras e revisar a rotina de irrigação de mudas.",
    ],
    [
      "Organização de oficina ambiental",
      6,
      "Espaço educativo",
      "Exemplo fictício: planejar materiais e atividades para uma oficina sobre resíduos.",
    ],
    [
      "Verificação de banco de uso público",
      2,
      "Área de convivência",
      "Exemplo fictício: conferir a estabilidade de um banco antes de liberar seu uso.",
    ],
    [
      "Recomposição de canteiro",
      0,
      "Jardim de entrada",
      "Exemplo fictício: planejar recomposição da cobertura vegetal e organização dos canteiros.",
    ],
    [
      "Separação de materiais recicláveis",
      4,
      "Ponto de coleta",
      "Exemplo fictício: revisar identificação dos recipientes e orientar a separação.",
    ],
    [
      "Registro de observação ambiental",
      5,
      "Setor demonstrativo",
      "Exemplo fictício: organizar informações para avaliação interna, sem caráter de fiscalização oficial.",
    ],
    [
      "Monitoramento de mudas",
      3,
      "Área de recomposição",
      "Exemplo fictício: registrar desenvolvimento das mudas e revisar seus tutores.",
    ],
    [
      "Revisão de material educativo",
      6,
      "Espaço educativo",
      "Exemplo fictício: atualizar material de apoio para atividades de educação ambiental.",
    ],
  ];
  const states: Demand["status"][] = [
    "Aguardando triagem",
    "Em execução",
    "Planejada",
    "Aguardando recurso",
    "Em execução",
    "Planejada",
    "Em execução",
    "Aguardando triagem",
    "Concluída",
    "Cancelada",
    "Concluída",
    "Planejada",
  ];
  const scores: Demand["assessment"][] = [
    null,
    { people: 1, environment: 3, worsening: 3 },
    { people: 2, environment: 1, worsening: 2 },
    { people: 1, environment: 3, worsening: 3 },
    { people: 1, environment: 2, worsening: 2 },
    { people: 1, environment: 1, worsening: 1 },
    { people: 3, environment: 1, worsening: 2 },
    null,
    { people: 1, environment: 2, worsening: 1 },
    { people: 1, environment: 1, worsening: 1 },
    { people: 1, environment: 2, worsening: 2 },
    { people: 1, environment: 1, worsening: 2 },
  ];
  const demands = examples.map(([title, area, location, description], index) =>
    recordChanges(
      undefined,
      blankDemand({
        protocol: `DEMO-${today.slice(0, 4)}-${String(index + 1).padStart(3, "0")}`,
        title,
        area: AREAS[area],
        location,
        description,
        registeredAt: addDays(today, -12 + index),
        status: states[index],
        assessment: scores[index],
        responsible: index === 7 ? "" : PEOPLE[index % 3],
        deadline: addDays(today, index - 4),
        nextAction:
          index === 7
            ? "Realizar triagem e definir o responsável."
            : "Organizar a avaliação e registrar o próximo atendimento.",
        completedAt: states[index] === "Concluída" ? addDays(today, -1) : "",
        resolution:
          states[index] === "Concluída"
            ? "Atendimento demonstrativo realizado e verificado pela equipe fictícia."
            : "",
        notes: [
          {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            text: "Dados demonstrativos: situação fictícia criada para a feira.",
          },
        ],
      }),
    ),
  );
  const routines: Routine[] = [
    {
      id: crypto.randomUUID(),
      name: "Trilhas e sinalização",
      area: AREAS[2],
      location: "Trilha das Araucárias",
      frequency: "Semanal",
      nextDate: addDays(today, -2),
      responsible: PEOPLE[0],
      checklist: [
        "Passagem livre e segura",
        "Placas legíveis e firmes",
        "Piso e drenagem observados",
      ],
      anchorDay: parseDate(today).getDate(),
    },
    {
      id: crypto.randomUUID(),
      name: "Nascentes e margens",
      area: AREAS[1],
      location: "Setor de nascentes",
      frequency: "Quinzenal",
      nextDate: today,
      responsible: PEOPLE[1],
      checklist: [
        "Margens sem resíduos",
        "Cobertura vegetal observada",
        "Alterações registradas",
      ],
      anchorDay: parseDate(today).getDate(),
    },
    {
      id: crypto.randomUUID(),
      name: "Resíduos e limpeza",
      area: AREAS[4],
      location: "Área de convivência",
      frequency: "Diária",
      nextDate: today,
      responsible: PEOPLE[2],
      checklist: [
        "Lixeiras em condições de uso",
        "Separação identificada",
        "Trilhas sem resíduos visíveis",
      ],
      anchorDay: parseDate(today).getDate(),
    },
    {
      id: crypto.randomUUID(),
      name: "Arborização e vegetação",
      area: AREAS[0],
      location: "Jardim de entrada",
      frequency: "Mensal",
      nextDate: addDays(today, 3),
      responsible: PEOPLE[0],
      checklist: [
        "Galhos e troncos observados",
        "Canteiros revisados",
        "Necessidade de avaliação registrada",
      ],
      anchorDay: parseDate(addDays(today, 3)).getDate(),
    },
    {
      id: crypto.randomUUID(),
      name: "Viveiro e recomposição",
      area: AREAS[3],
      location: "Viveiro demonstrativo",
      frequency: "Semanal",
      nextDate: addDays(today, 5),
      responsible: PEOPLE[1],
      checklist: [
        "Mudas e tutores observados",
        "Irrigação funcionando",
        "Insumos organizados",
      ],
      anchorDay: parseDate(today).getDate(),
    },
    {
      id: crypto.randomUUID(),
      name: "Equipamentos e estruturas",
      area: AREAS[2],
      location: "Área de uso público",
      frequency: "Mensal",
      nextDate: addDays(today, 7),
      responsible: PEOPLE[2],
      checklist: [
        "Bancos estáveis",
        "Estruturas sem danos aparentes",
        "Sinalização de restrição quando necessária",
      ],
      anchorDay: parseDate(addDays(today, 7)).getDate(),
    },
  ];
  return {
    formatVersion: 1,
    seededAt: new Date().toISOString(),
    demands,
    routines,
    inspections: routines
      .slice(0, 3)
      .map((r, index) => ({
        id: crypto.randomUUID(),
        routineId: r.id,
        date: addDays(today, -7 - index),
        notes:
          "Vistoria fictícia de exemplo. Nenhuma ocorrência real é representada.",
        items: r.checklist.map((label) => ({
          label,
          result: "Conforme" as const,
        })),
      })),
  };
}
