import { Search, SlidersHorizontal, X } from "lucide-react";
import { AREAS, PRIORITIES, STATUSES } from "../config/project";
import type { Filters as FilterType } from "../types";
import { emptyFilters } from "../types";
import { useState } from "react";
export function Filters({
  value,
  onChange,
  responsibles,
}: {
  value: FilterType;
  onChange: (v: FilterType) => void;
  responsibles: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const set = (key: keyof FilterType, v: string) =>
    onChange({ ...value, [key]: v });
  const active = Object.entries(value).filter(
    ([k, v]) => k !== "sort" && k !== "dateKind" && v,
  ).length;
  return (
    <div className="filter-block">
      <div className="filter-row">
        <div className="search-input">
          <Search size={18} />
          <input
            aria-label="Buscar demandas"
            placeholder="Buscar protocolo, demanda ou local…"
            value={value.q}
            onChange={(e) => set("q", e.target.value)}
          />
        </div>
        <select
          aria-label="Filtrar situação"
          value={value.status}
          onChange={(e) => set("status", e.target.value)}
        >
          <option value="">Todas as situações</option>
          <option value="abertas">Todas as abertas</option>
          {STATUSES.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Filtrar prioridade"
          value={value.priority}
          onChange={(e) => set("priority", e.target.value)}
        >
          <option value="">Todas as prioridades</option>
          <option value="urgentes">Altas e críticas abertas</option>
          {[...PRIORITIES, "Não avaliada"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <button
          className="secondary"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <SlidersHorizontal size={16} />
          Filtros{active > 0 && <span className="count">{active}</span>}
        </button>
      </div>
      {expanded && (
        <div className="filter-extra">
          <label>
            Área de atuação
            <select
              value={value.area}
              onChange={(e) => set("area", e.target.value)}
            >
              <option value="">Todas as áreas</option>
              {AREAS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Responsável
            <select
              value={value.responsible}
              onChange={(e) => set("responsible", e.target.value)}
            >
              <option value="">Todos os responsáveis</option>
              {responsibles.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Registro a partir de
            <input
              type="date"
              value={value.from}
              onChange={(e) => set("from", e.target.value)}
            />
          </label>
          <label>
            Registro até
            <input
              type="date"
              value={value.to}
              onChange={(e) => set("to", e.target.value)}
            />
          </label>
          <label>
            Ordenação
            <select
              value={value.sort}
              onChange={(e) => set("sort", e.target.value)}
            >
              <option value="priority">Prioridade e prazo</option>
              <option value="deadline">Prazo mais próximo</option>
              <option value="newest">Registro mais recente</option>
            </select>
          </label>
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!value.overdue}
              onChange={(e) => set("overdue", e.target.checked ? "sim" : "")}
            />
            Somente atrasadas
          </label>
        </div>
      )}
      {expanded && (
        <label className="date-kind">
          Datas do período
          <select
            value={value.dateKind}
            onChange={(e) => set("dateKind", e.target.value)}
          >
            <option value="registered">Data de registro</option>
            <option value="completed">Data de conclusão</option>
          </select>
        </label>
      )}
      {active > 0 && (
        <div className="active-filters">
          <span>
            {active} filtro(s) aplicado(s) · período por{" "}
            {value.dateKind === "completed" ? "conclusão" : "registro"}
          </span>
          <button
            className="text-button"
            onClick={() => onChange({ ...emptyFilters })}
          >
            <X size={14} />
            Limpar filtros
          </button>
        </div>
      )}
      {value.from && value.to && value.from > value.to && (
        <p className="field-error" role="alert">
          O início do período deve ser anterior ao fim.
        </p>
      )}
    </div>
  );
}
