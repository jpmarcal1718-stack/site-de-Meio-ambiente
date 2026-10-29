import { useState, type FormEvent } from "react";
import { CircleCheck, Link2 } from "lucide-react";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { RESULTS } from "../../config/project";
import { formatDate, localDate } from "../../domain/dates";
import { completeInspection, inspectionDemand } from "../../domain/demands";
import { inspectionSchema } from "../../validation/schema";
import { useData } from "../../app/DataContext";
import type { Inspection, Routine } from "../../types";
import { DemandForm } from "../demandas/DemandForm";
export function InspectionForm({
  routine,
  onClose,
}: {
  routine: Routine;
  onClose: () => void;
}) {
  const { mutate, busy, notify } = useData();
  const [date, setDate] = useState(localDate());
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<string[]>(
    routine.checklist.map(() => ""),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Inspection>();
  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = inspectionSchema.safeParse({
      id: crypto.randomUUID(),
      routineId: routine.id,
      date,
      notes,
      items: routine.checklist.map((label, index) => ({
        label,
        result: results[index],
      })),
    });
    if (!result.success) {
      setError(
        "Informe uma data válida, sem estar no futuro, e o resultado de todos os itens.",
      );
      return;
    }
    try {
      await mutate((s) => ({
        ...s,
        inspections: [...s.inspections, result.data],
        routines: s.routines.map((r) =>
          r.id === routine.id ? completeInspection(r, result.data) : r,
        ),
      }));
      notify("Vistoria salva e próxima data calculada.");
      setSaved(result.data);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  if (saved)
    return (
      <InspectionDetails
        inspection={saved}
        routine={routine}
        onClose={onClose}
      />
    );
  return (
    <Modal title="Registrar vistoria" onClose={onClose} wide>
      <form onSubmit={submit} noValidate>
        <div className="detail-heading">
          <span className="eyebrow">ROTINA PREVENTIVA</span>
          <h2>{routine.name}</h2>
          <p>
            {routine.location} · {routine.responsible}
          </p>
        </div>
        <label>
          Data da vistoria *
          <input
            type="date"
            max={localDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <h3>Lista de verificação</h3>
        <p className="muted">
          Selecione um resultado para cada item observado.
        </p>
        <div className="inspection-items">
          {routine.checklist.map((label, index) => (
            <fieldset key={index}>
              <legend>
                {index + 1}. {label}
              </legend>
              <div>
                {RESULTS.map((result) => (
                  <label className="radio-card" key={result}>
                    <input
                      type="radio"
                      name={"result-" + index}
                      value={result}
                      checked={results[index] === result}
                      onChange={() =>
                        setResults((rs) =>
                          rs.map((r, i) => (i === index ? result : r)),
                        )
                      }
                    />
                    {result}
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <label>
          Observações da vistoria
          <textarea
            rows={3}
            maxLength={10000}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {error && (
          <p className="error-banner" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancelar
          </button>
          <button disabled={busy}>
            {busy ? "Salvando…" : "Concluir vistoria"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function InspectionDetails({
  inspection: i,
  routine: r,
  onClose,
}: {
  inspection: Inspection;
  routine: Routine;
  onClose: () => void;
}) {
  const { data } = useData();
  const [generate, setGenerate] = useState(false);
  const nonConforming = i.items.filter((x) => x.result === "Não conforme");
  const linked = data.demands.filter((d) => d.sourceInspectionId === i.id);
  return (
    <>
      <Modal title="Vistoria realizada" onClose={onClose}>
        <div className="success-banner">
          <CircleCheck size={22} />
          <div>
            <strong>{r.name}</strong>
            <p>
              {formatDate(i.date)} · <Badge value="Realizada" />
            </p>
          </div>
        </div>
        <p>{r.location}</p>
        <ul className="inspection-summary">
          {i.items.map((x, index) => (
            <li key={index}>
              <span>{x.label}</span>
              <strong
                className={x.result === "Não conforme" ? "overdue" : "muted"}
              >
                {x.result}
              </strong>
            </li>
          ))}
        </ul>
        <h3>Observações</h3>
        <p className="preserve">
          {i.notes || "Nenhuma observação registrada."}
        </p>
        {linked.length > 0 && (
          <p className="notice">
            <Link2 size={18} />
            Demanda vinculada: {linked.map((d) => d.protocol).join(", ")}.
          </p>
        )}
        {nonConforming.length > 0 && linked.length === 0 && (
          <div className="notice column">
            <strong>{nonConforming.length} item(ns) não conforme(s)</strong>
            <p>
              Gere uma demanda vinculada e avalie os três critérios para fazer a
              triagem.
            </p>
            <button onClick={() => setGenerate(true)}>Gerar demanda</button>
          </div>
        )}
        <div className="form-actions">
          <button className="secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </Modal>
      {generate && (
        <DemandForm
          initial={inspectionDemand(i, r)}
          onClose={() => setGenerate(false)}
        />
      )}
    </>
  );
}
