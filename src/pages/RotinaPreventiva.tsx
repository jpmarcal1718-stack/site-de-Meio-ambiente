import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Plus,
  MapPin,
  UserRound,
  Pencil,
  History,
  ClipboardCheck,
} from "lucide-react";
import { useData } from "../app/DataContext";
import { AREAS } from "../config/project";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { formatDate, inPeriod, localDate } from "../domain/dates";
import { RoutineForm } from "../features/rotinas/RoutineForm";
import {
  InspectionDetails,
  InspectionForm,
} from "../features/vistorias/InspectionForm";
import type { Inspection, Routine } from "../types";
export function RotinaPreventiva() {
  const { data } = useData();
  const [params, setParams] = useSearchParams();
  const [newRoutine, setNewRoutine] = useState(params.get("nova") === "1");
  const [editing, setEditing] = useState<Routine>();
  const [inspecting, setInspecting] = useState<Routine>();
  const [history, setHistory] = useState<Routine>();
  const [detail, setDetail] = useState<{ i: Inspection; r: Routine }>();
  const [status, setStatus] = useState("");
  const area = params.get("area") || "";
  const responsible = params.get("responsible") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const highlighted = params.get("rotina") || "";
  const today = localDate();
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  };
  const routines = data.routines
    .filter(
      (r) =>
        (!area || r.area === area) &&
        (!responsible || r.responsible === responsible) &&
        inPeriod(r.nextDate, from, to) &&
        (!status ||
          (status === "atrasadas" ? r.nextDate < today : r.nextDate >= today)),
    )
    .sort(
      (a, b) =>
        Number(b.id === highlighted) - Number(a.id === highlighted) ||
        a.nextDate.localeCompare(b.nextDate),
    );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">PREVENIR TAMBÉM É CUIDAR</div>
          <h1>Rotina preventiva</h1>
          <p>Vistorias recorrentes para observar, registrar e agir a tempo.</p>
        </div>
        <button onClick={() => setNewRoutine(true)}>
          <Plus size={18} />
          Agendar vistoria
        </button>
      </div>
      <div className="routine-overview">
        <div>
          <CalendarDays size={22} />
          <span>
            <b>{data.routines.length}</b> rotinas cadastradas
          </span>
        </div>
        <div>
          <span className="status-dot orange" />
          <span>
            <b>{data.routines.filter((r) => r.nextDate < today).length}</b>{" "}
            agendamentos atrasados
          </span>
        </div>
        <div>
          <ClipboardCheck size={22} />
          <span>
            <b>{data.inspections.length}</b> vistorias realizadas
          </span>
        </div>
      </div>
      <section className="panel routine-filter">
        <div className="filter-row">
          <select
            aria-label="Área das rotinas"
            value={area}
            onChange={(e) => setFilter("area", e.target.value)}
          >
            <option value="">Todas as áreas</option>
            {AREAS.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            aria-label="Responsável das rotinas"
            value={responsible}
            onChange={(e) => setFilter("responsible", e.target.value)}
          >
            <option value="">Todos os responsáveis</option>
            {[...new Set(data.routines.map((x) => x.responsible))].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            aria-label="Situação das rotinas"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todas as programadas</option>
            <option value="atrasadas">Atrasadas</option>
            <option value="programadas">Programadas sem atraso</option>
          </select>
        </div>
        <div className="routine-date-filters">
          <label>
            Próxima data a partir de
            <input
              type="date"
              value={from}
              onChange={(e) => setFilter("from", e.target.value)}
            />
          </label>
          <label>
            Próxima data até
            <input
              type="date"
              value={to}
              onChange={(e) => setFilter("to", e.target.value)}
            />
          </label>
          {(from || to || area || responsible || status) && (
            <button
              className="text-button"
              onClick={() => {
                setParams({});
                setStatus("");
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>
      <div className="routine-grid">
        {routines.map((r) => {
          const past = data.inspections
            .filter((i) => i.routineId === r.id)
            .sort((a, b) => b.date.localeCompare(a.date));
          return (
            <article
              className={`panel routine-card ${r.id === highlighted ? "highlight" : ""}`}
              key={r.id}
            >
              <div className="routine-top">
                <div className="routine-icon">
                  <ClipboardCheck size={23} />
                </div>
                <Badge value={r.nextDate < today ? "Atrasada" : "Programada"} />
              </div>
              <small className="eyebrow">{r.area}</small>
              <h2>{r.name}</h2>
              <p>
                <MapPin size={14} />
                {r.location}
              </p>
              <p>
                <UserRound size={14} />
                {r.responsible}
              </p>
              <div className="routine-schedule">
                <span>
                  Próxima vistoria
                  <strong className={r.nextDate < today ? "overdue" : ""}>
                    {formatDate(r.nextDate)}
                  </strong>
                </span>
                <span>
                  Periodicidade<strong>{r.frequency}</strong>
                </span>
              </div>
              <small>
                {r.checklist.length} itens de verificação · {past.length}{" "}
                vistoria(s) realizada(s)
              </small>
              <div className="routine-actions">
                <button onClick={() => setInspecting(r)}>
                  <ClipboardCheck size={16} />
                  Realizar vistoria
                </button>
                <button
                  className="icon-button"
                  aria-label={`Editar ${r.name}`}
                  onClick={() => setEditing(r)}
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Histórico de ${r.name}`}
                  onClick={() => setHistory(r)}
                >
                  <History size={18} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      {!routines.length && (
        <div className="panel empty">
          <CalendarDays size={34} />
          <h3>Nenhuma rotina neste recorte</h3>
          <p>Ajuste os filtros ou agende uma vistoria.</p>
        </div>
      )}
      <p className="caption">
        A próxima data é calculada a partir da vistoria realizada. Para meses
        mais curtos, o dia é ajustado ao último dia do mês, preservando o dia de
        referência nas próximas recorrências.
      </p>
      {newRoutine && (
        <RoutineForm
          onClose={() => {
            setNewRoutine(false);
            if (params.has("nova")) {
              const next = new URLSearchParams(params);
              next.delete("nova");
              setParams(next);
            }
          }}
        />
      )}
      {editing && (
        <RoutineForm initial={editing} onClose={() => setEditing(undefined)} />
      )}
      {inspecting && (
        <InspectionForm
          routine={inspecting}
          onClose={() => setInspecting(undefined)}
        />
      )}
      {history && (
        <Modal
          title={`Histórico · ${history.name}`}
          onClose={() => setHistory(undefined)}
        >
          <ul className="history-list">
            {data.inspections
              .filter((i) => i.routineId === history.id)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((i) => (
                <li key={i.id}>
                  <button
                    className="secondary"
                    onClick={() => setDetail({ i, r: history })}
                  >
                    <span>
                      {formatDate(i.date)} ·{" "}
                      {
                        i.items.filter((x) => x.result === "Não conforme")
                          .length
                      }{" "}
                      não conformidade(s)
                    </span>
                    <Badge value="Realizada" />
                  </button>
                </li>
              ))}
          </ul>
          {!data.inspections.some((i) => i.routineId === history.id) && (
            <p>
              Nenhuma vistoria realizada. O agendamento permanece disponível na
              lista de rotinas.
            </p>
          )}
        </Modal>
      )}
      {detail && (
        <InspectionDetails
          inspection={detail.i}
          routine={detail.r}
          onClose={() => setDetail(undefined)}
        />
      )}
    </>
  );
}
