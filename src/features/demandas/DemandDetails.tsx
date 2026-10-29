import { useState } from "react";
import { Pencil, FileDown, Trash2, MessageSquare, Link2 } from "lucide-react";
import type { Demand } from "../../types";
import { emptyFilters } from "../../types";
import { Modal, Confirm } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { formatDate } from "../../domain/dates";
import { effectivePriority, suggestPriority } from "../../domain/priority";
import { useData } from "../../app/DataContext";
import { DemandForm } from "./DemandForm";
import { PdfReport } from "../../components/PdfReport";
export function DemandDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data, mutate, notify, busy } = useData();
  const d = data.demands.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [remove, setRemove] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  if (!d) return null;
  const s = suggestPriority(d.assessment);
  const source = data.inspections.find((i) => i.id === d.sourceInspectionId);
  const routine = data.routines.find((r) => r.id === d.sourceRoutineId);
  async function addNote() {
    if (!d || !note.trim()) return;
    try {
      await mutate((state) => ({
        ...state,
        demands: state.demands.map((x) =>
          x.id === id
            ? {
                ...x,
                notes: [
                  ...x.notes,
                  {
                    id: crypto.randomUUID(),
                    date: new Date().toISOString(),
                    text: note.trim(),
                  },
                ],
              }
            : x,
        ),
      }));
      setNote("");
      notify("Acompanhamento salvo.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function deleteDemand() {
    try {
      await mutate((s) => ({
        ...s,
        demands: s.demands.filter((x) => x.id !== id),
      }));
      notify("Exemplo excluído deste navegador.");
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setRemove(false);
    }
  }
  return (
    <>
      <Modal title="Detalhes da demanda" onClose={onClose} wide>
        <div className="detail-heading">
          <span className="eyebrow">{d.protocol}</span>
          <h2>{d.title}</h2>
          <div className="badge-row">
            <Badge value={d.status} />
            <Badge value={effectivePriority(d) || "Não avaliada"} />
          </div>
        </div>
        <div className="toolbar">
          <button className="secondary" onClick={() => setEditing(true)}>
            <Pencil size={16} />
            Editar demanda
          </button>
          <button className="secondary" onClick={() => setPdf(true)}>
            <FileDown size={16} />
            Relatório PDF
          </button>
          <button
            className="text-button destructive"
            onClick={() => setRemove(true)}
          >
            <Trash2 size={16} />
            Excluir exemplo
          </button>
        </div>
        <dl className="details-grid">
          <div>
            <dt>Área de atuação</dt>
            <dd>{d.area}</dd>
          </div>
          <div>
            <dt>Local / setor</dt>
            <dd>{d.location}</dd>
          </div>
          <div>
            <dt>Responsável</dt>
            <dd>{d.responsible || "Não definido"}</dd>
          </div>
          <div>
            <dt>Prazo</dt>
            <dd>{formatDate(d.deadline)}</dd>
          </div>
          <div>
            <dt>Origem</dt>
            <dd>{d.origin}</dd>
          </div>
          <div>
            <dt>Registro</dt>
            <dd>{formatDate(d.registeredAt)}</dd>
          </div>
        </dl>
        <h3>Ocorrência</h3>
        <p className="preserve">{d.description}</p>
        <h3>Prioridade e critérios</h3>
        <p>{s.reason}</p>
        {d.assessment && (
          <div className="criteria-values">
            <span>
              Risco às pessoas <b>{d.assessment.people}/3</b>
            </span>
            <span>
              Dano ambiental <b>{d.assessment.environment}/3</b>
            </span>
            <span>
              Agravamento <b>{d.assessment.worsening}/3</b>
            </span>
          </div>
        )}
        {d.override && (
          <p className="notice">
            Prioridade manual: {d.override}. Justificativa: {d.justification}
          </p>
        )}
        <h3>Próxima ação</h3>
        <p>{d.nextAction || "Ainda não definida."}</p>
        {source && (
          <p className="notice">
            <Link2 size={18} />
            Vínculo: {routine?.name} · vistoria de {formatDate(source.date)}.
          </p>
        )}
        {d.completedAt && (
          <div className="success-banner">
            <strong>
              Atendimento concluído em {formatDate(d.completedAt)}
            </strong>
            <p>{d.resolution}</p>
          </div>
        )}
        <h3>
          <MessageSquare size={18} />
          Acompanhamento
        </h3>
        <ul className="timeline">
          {d.notes.map((n) => (
            <li key={n.id}>
              <time>{new Date(n.date).toLocaleString("pt-BR")}</time>
              <p>{n.text}</p>
            </li>
          ))}
        </ul>
        <label>
          Nova observação
          <textarea
            rows={2}
            maxLength={10000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <button
          className="secondary"
          onClick={addNote}
          disabled={!note.trim() || busy}
        >
          Registrar acompanhamento
        </button>
        <h3>Histórico de alterações</h3>
        <ul className="timeline">
          {[...d.history].reverse().map((n) => (
            <li key={n.id}>
              <time>{new Date(n.date).toLocaleString("pt-BR")}</time>
              <p>{n.text}</p>
            </li>
          ))}
        </ul>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
      </Modal>
      {editing && <DemandForm initial={d} onClose={() => setEditing(false)} />}
      {pdf && (
        <PdfReport
          demands={[d]}
          filters={emptyFilters}
          individual
          onClose={() => setPdf(false)}
        />
      )}
      {remove && (
        <Confirm
          title="Excluir este exemplo?"
          busy={busy}
          onCancel={() => setRemove(false)}
          onConfirm={deleteDemand}
        >
          <p>
            A demanda {d.protocol} e seu acompanhamento serão removidos do
            armazenamento local. Esta ação não poderá ser desfeita sem um
            backup.
          </p>
        </Confirm>
      )}
    </>
  );
}
export function DemandRow({ d, onOpen }: { d: Demand; onOpen: () => void }) {
  return (
    <tr>
      <td>
        <button className="row-title" onClick={onOpen}>
          <small>{d.protocol}</small>
          <strong>{d.title}</strong>
        </button>
        <span className="mobile-meta">{d.location}</span>
      </td>
      <td className="hide-small">
        <span>{d.area}</span>
        <small>{d.location}</small>
      </td>
      <td>
        <Badge value={effectivePriority(d) || "Não avaliada"} />
      </td>
      <td className="status-cell">
        <Badge value={d.status} />
      </td>
      <td className="hide-small">{d.responsible || "Não definido"}</td>
      <td className="deadline-cell">{formatDate(d.deadline)}</td>
    </tr>
  );
}
