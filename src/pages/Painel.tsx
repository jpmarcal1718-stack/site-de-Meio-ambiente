import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  CalendarDays,
  ClipboardList,
  Clock3,
  TriangleAlert,
  CircleCheck,
  ListFilter,
  Leaf,
  MapPin,
} from "lucide-react";
import { useData } from "../app/DataContext";
import { AREAS } from "../config/project";
import { emptyFilters, type Filters } from "../types";
import {
  closed,
  formatDate,
  inPeriod,
  isOverdue,
  localDate,
} from "../domain/dates";
import { effectivePriority, priorityRank } from "../domain/priority";
import { blankDemand, filterDemands } from "../domain/demands";
import { Badge } from "../components/Badge";
import { DemandForm } from "../features/demandas/DemandForm";
import { DemandDetails } from "../features/demandas/DemandDetails";
export function Painel() {
  const { data } = useData();
  const navigate = useNavigate();
  const [area, setArea] = useState("");
  const [responsible, setResponsible] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [newDemand, setNewDemand] = useState(false);
  const [detail, setDetail] = useState("");
  const filters = { ...emptyFilters, area, responsible, from, to };
  const ds = filterDemands(data.demands, filters);
  const completed = filterDemands(data.demands, {
    ...filters,
    status: "Concluída",
    dateKind: "completed",
  });
  const routines = data.routines
    .filter(
      (r) =>
        (!area || r.area === area) &&
        (!responsible || r.responsible === responsible) &&
        inPeriod(r.nextDate, from, to),
    )
    .sort((a, b) => a.nextDate.localeCompare(b.nextDate));
  const attention = ds.filter((d) => !closed(d));
  const today = localDate();
  const go = (more: Partial<Filters>) =>
    navigate(
      "/demandas?" +
        new URLSearchParams(
          Object.entries({ ...filters, ...more }).filter(([, v]) => !!v),
        ).toString(),
    );
  const cards = [
    {
      label: "Aguardando triagem",
      value: ds.filter((d) => d.status === "Aguardando triagem").length,
      icon: ClipboardList,
      color: "sage",
      hint: "Precisam de uma primeira avaliação",
      action: () => go({ status: "Aguardando triagem" }),
    },
    {
      label: "Em andamento",
      value: ds.filter((d) => d.status === "Em execução").length,
      icon: Clock3,
      color: "blue",
      hint: "Atendimentos em execução",
      action: () => go({ status: "Em execução" }),
    },
    {
      label: "Altas e críticas abertas",
      value: ds.filter(
        (d) => !closed(d) && priorityRank(effectivePriority(d)) >= 3,
      ).length,
      icon: TriangleAlert,
      color: "orange",
      hint: "Prioridade para atenção da equipe",
      action: () => go({ priority: "urgentes" }),
    },
    {
      label: "Demandas atrasadas",
      value: ds.filter((d) => isOverdue(d)).length,
      icon: Clock3,
      color: "rose",
      hint: "Prazo vencido e ainda em aberto",
      action: () => go({ overdue: "sim" }),
    },
    {
      label: "Concluídas no período",
      value: completed.length,
      icon: CircleCheck,
      color: "sage",
      hint: "Filtro pela data de conclusão",
      action: () => go({ status: "Concluída", dateKind: "completed" }),
    },
    {
      label: "Vistorias previstas",
      value: routines.length,
      icon: CalendarDays,
      color: "sand",
      hint: `${routines.filter((r) => r.nextDate < today).length} com agendamento atrasado`,
      action: () =>
        navigate(
          "/rotinas?" +
            new URLSearchParams({ area, responsible, from, to }).toString(),
        ),
    },
  ];
  const open = ds.filter((d) => !closed(d));
  const distribution = [
    "Aguardando triagem",
    "Planejada",
    "Em execução",
    "Aguardando recurso",
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">GESTÃO AMBIENTAL EM FOCO</div>
          <h1>Visão geral</h1>
          <p>Um olhar sobre as demandas e o cuidado com os espaços.</p>
        </div>
        <div className="toolbar">
          <Link className="button secondary" to="/rotinas?nova=1">
            <CalendarDays size={17} />
            Agendar vistoria
          </Link>
          <button onClick={() => setNewDemand(true)}>
            <Plus size={18} />
            Nova demanda
          </button>
        </div>
      </div>
      <div className="welcome-strip">
        <div className="welcome-symbol">
          <Leaf size={27} />
        </div>
        <div>
          <strong>Planejar hoje. Cuidar do amanhã.</strong>
          <p>
            Apoio à organização e à priorização do trabalho ambiental em
            Ivaiporã.
          </p>
        </div>
        <span className="demo-label">Demonstração acadêmica</span>
      </div>
      <div className="dashboard-filters">
        <span>
          <ListFilter size={17} />
          Visualizar
        </span>
        <select
          aria-label="Área do painel"
          value={area}
          onChange={(e) => setArea(e.target.value)}
        >
          <option value="">Todas as áreas</option>
          {AREAS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <select
          aria-label="Responsável do painel"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
        >
          <option value="">Todos os responsáveis</option>
          {[
            ...new Set(
              [...data.demands, ...data.routines]
                .map((d) => d.responsible)
                .filter(Boolean),
            ),
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label>
          De
          <input
            aria-label="Início do período"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Até
          <input
            aria-label="Fim do período"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
      </div>
      {from && to && from > to && (
        <p className="field-error" role="alert">
          Revise o período: a data inicial é posterior à final.
        </p>
      )}
      <div className="stats-grid">
        {cards.map((c) => (
          <button className="stat-card" key={c.label} onClick={c.action}>
            <div className="stat-top">
              <span>{c.label}</span>
              <div className={`stat-icon ${c.color}`}>
                <c.icon size={18} />
              </div>
            </div>
            <div className="stat-number">
              {c.value}
              <ArrowUpRight size={19} />
            </div>
            <small>{c.hint}</small>
          </button>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel attention-panel">
          <div className="panel-heading">
            <div>
              <h2>Primeiro, o que precisa de atenção</h2>
              <p>Demandas abertas, por prioridade e prazo</p>
            </div>
            <Link to="/demandas" className="text-button">
              Ver todas
              <ArrowRight size={15} />
            </Link>
          </div>
          {attention.length ? (
            <div className="attention-list">
              {attention.slice(0, 5).map((d) => (
                <button
                  className="attention-item"
                  key={d.id}
                  onClick={() => setDetail(d.id)}
                >
                  <span
                    className={`priority-marker p-${priorityRank(effectivePriority(d))}`}
                  />
                  <div className="attention-copy">
                    <small>{d.protocol}</small>
                    <strong>{d.title}</strong>
                    <span>
                      <MapPin size={12} />
                      {d.location}
                    </span>
                  </div>
                  <div className="attention-right">
                    <Badge value={effectivePriority(d) || "Não avaliada"} />
                    <small className={isOverdue(d) ? "overdue" : ""}>
                      {isOverdue(d) ? "Vencida em " : ""}
                      {formatDate(d.deadline)}
                    </small>
                  </div>
                  <ArrowUpRight className="item-arrow" size={17} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">
              <CircleCheck />
              <p>Nenhuma demanda aberta neste recorte.</p>
            </div>
          )}
        </section>
        <section className="panel agenda-panel">
          <div className="panel-heading">
            <div>
              <h2>Agenda preventiva</h2>
              <p>Próximas verificações programadas</p>
            </div>
            <CalendarDays size={20} />
          </div>
          <div className="agenda-list">
            {routines.length ? (
              routines.slice(0, 4).map((r) => (
                <Link
                  className="agenda-item"
                  key={r.id}
                  to={"/rotinas?rotina=" + r.id}
                >
                  <div
                    className={`date-tile ${r.nextDate < today ? "late" : ""}`}
                  >
                    <strong>{r.nextDate.slice(8)}</strong>
                    <span>
                      {new Date(
                        Number(r.nextDate.slice(0, 4)),
                        Number(r.nextDate.slice(5, 7)) - 1,
                        15,
                      )
                        .toLocaleDateString("pt-BR", { month: "short" })
                        .replace(".", "")}
                    </span>
                  </div>
                  <div>
                    <strong>{r.name}</strong>
                    <small>{r.location}</small>
                    <span className={r.nextDate < today ? "overdue" : "muted"}>
                      {r.nextDate < today
                        ? "Atrasada"
                        : r.nextDate === today
                          ? "Prevista para hoje"
                          : r.frequency}
                    </span>
                  </div>
                  <ArrowUpRight size={15} />
                </Link>
              ))
            ) : (
              <p className="empty">
                Nenhuma vistoria programada neste recorte.
              </p>
            )}
          </div>
          <Link className="panel-link" to="/rotinas">
            Abrir rotina preventiva
            <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <div className="bottom-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Distribuição do trabalho</h2>
              <p>{open.length} demanda(s) aberta(s) no recorte</p>
            </div>
          </div>
          <div className="distribution">
            {distribution.map((s, index) => {
              const n = open.filter((d) => d.status === s).length;
              return (
                <button key={s} onClick={() => go({ status: s })}>
                  <span>
                    <i className={"distribution-dot d" + index} />
                    {s}
                  </span>
                  <div>
                    <span
                      style={{
                        width: `${open.length ? (n / open.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <b>{n}</b>
                </button>
              );
            })}
          </div>
        </section>
        <div className="context-card">
          <span className="eyebrow">SOBRE ESTA FERRAMENTA</span>
          <h2>
            Mais clareza para
            <br />
            planejar o cuidado.
          </h2>
          <p>
            Uma demonstração inspirada nos desafios de gestão do Jardim Botânico
            de Ivaiporã.
          </p>
          <Link to="/criterios">
            Conhecer os critérios
            <ArrowUpRight size={17} />
          </Link>
          <Leaf className="context-leaf" aria-hidden="true" />
        </div>
      </div>
      <p className="caption">
        Os recortes de demandas usam a data de registro, exceto “Concluídas”,
        que usa a conclusão. Vistorias usam a próxima data. Dados
        demonstrativos, sem caráter oficial.
      </p>
      {newDemand && (
        <DemandForm
          initial={blankDemand()}
          onClose={() => setNewDemand(false)}
          onSaved={(d) => setDetail(d.id)}
        />
      )}
      {detail && <DemandDetails id={detail} onClose={() => setDetail("")} />}
    </>
  );
}
