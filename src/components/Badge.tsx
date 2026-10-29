export function Badge({ value }: { value: string }) {
  const classes: Record<string, string> = {
    Crítica: "critical",
    Alta: "high",
    Média: "medium",
    Baixa: "low",
    "Não avaliada": "neutral",
    "Aguardando triagem": "neutral",
    Planejada: "planned",
    "Em execução": "progress",
    "Aguardando recurso": "medium",
    Concluída: "low",
    Cancelada: "neutral",
    Atrasada: "high",
    Programada: "planned",
    Realizada: "low",
  };
  return (
    <span className={`badge ${classes[value] || "neutral"}`}>
      <span className="badge-dot" />
      {value}
    </span>
  );
}
