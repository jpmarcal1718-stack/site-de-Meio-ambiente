export const project = {
  name: "Gestão Ambiental · Ivaiporã",
  institution: "",
  members: [] as string[],
  advisor: "",
  publicUrl:
    import.meta.env.VITE_PUBLIC_URL ||
    "https://jpmarcal1718-stack.github.io/site-de-Meio-ambiente/",
};
export const AREAS = [
  "Áreas verdes e arborização",
  "Nascentes e recursos hídricos",
  "Trilhas e uso público",
  "Viveiro e recomposição vegetal",
  "Resíduos",
  "Fiscalização e licenciamento",
  "Educação ambiental",
  "Outros",
] as const;
export const STATUSES = [
  "Aguardando triagem",
  "Planejada",
  "Em execução",
  "Aguardando recurso",
  "Concluída",
  "Cancelada",
] as const;
export const PRIORITIES = ["Baixa", "Média", "Alta", "Crítica"] as const;
export const FREQUENCIES = [
  "Diária",
  "Semanal",
  "Quinzenal",
  "Mensal",
  "Trimestral",
] as const;
export const RESULTS = ["Conforme", "Não conforme", "Não se aplica"] as const;
export const PEOPLE = [
  "Equipe Semente (fictícia)",
  "Equipe Horizonte (fictícia)",
  "Equipe Araucária (fictícia)",
];
export const priorityConfig = {
  lowMax: 4,
  mediumMax: 6,
  highMax: 8,
  criticalPeopleRisk: 3,
};
