import { useState, type FormEvent } from "react";
import { Modal } from "../../components/Modal";
import { AREAS, FREQUENCIES, PEOPLE } from "../../config/project";
import { localDate, parseDate } from "../../domain/dates";
import type { Routine } from "../../types";
import { routineSchema } from "../../validation/schema";
import { useData } from "../../app/DataContext";
export function RoutineForm({
  initial,
  onClose,
}: {
  initial?: Routine;
  onClose: () => void;
}) {
  const { mutate, busy, notify } = useData();
  const [form, setForm] = useState<Routine>(
    initial || {
      id: crypto.randomUUID(),
      name: "",
      area: AREAS[0],
      location: "",
      frequency: "Semanal",
      nextDate: localDate(),
      responsible: "",
      checklist: [],
      anchorDay: parseDate(localDate()).getDate(),
    },
  );
  const [items, setItems] = useState(form.checklist.join("\n"));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const set = <K extends keyof Routine>(k: K, v: Routine[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    const result = routineSchema.safeParse({
      ...form,
      checklist: items
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      anchorDay:
        initial && initial.nextDate === form.nextDate
          ? initial.anchorDay
          : parseDate(form.nextDate).getDate(),
    });
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.map((i) => [i.path[0], i.message]),
        ),
      );
      return;
    }
    try {
      await mutate((s) => ({
        ...s,
        routines: initial
          ? s.routines.map((r) => (r.id === form.id ? result.data : r))
          : [...s.routines, result.data],
      }));
      notify("Rotina preventiva salva.");
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const err = (k: string) =>
    errors[k] && (
      <span className="field-error" role="alert">
        {errors[k]}
      </span>
    );
  return (
    <Modal
      title={
        initial ? "Editar rotina preventiva" : "Agendar vistoria preventiva"
      }
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate>
        <p className="form-intro">
          Defina uma rotina e sua primeira data. Cada vistoria realizada será
          preservada no histórico.
        </p>
        <div className="form-grid">
          <label className="span-2">
            Nome da rotina *
            <input
              autoFocus
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
            {err("name")}
          </label>
          <label>
            Área *
            <select
              value={form.area}
              onChange={(e) => set("area", e.target.value as Routine["area"])}
            >
              {AREAS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Local *
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
            {err("location")}
          </label>
          <label>
            Periodicidade
            <select
              value={form.frequency}
              onChange={(e) =>
                set("frequency", e.target.value as Routine["frequency"])
              }
            >
              {FREQUENCIES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Próxima data *
            <input
              type="date"
              value={form.nextDate}
              onChange={(e) => set("nextDate", e.target.value)}
            />
            {err("nextDate")}
          </label>
          <label className="span-2">
            Responsável fictício *
            <input
              list="routine-people"
              value={form.responsible}
              onChange={(e) => set("responsible", e.target.value)}
            />
            <datalist id="routine-people">
              {PEOPLE.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </datalist>
            {err("responsible")}
          </label>
          <label className="span-2">
            Lista de verificações *
            <textarea
              rows={5}
              value={items}
              onChange={(e) => setItems(e.target.value)}
              placeholder={"Um item por linha\nEx.: Placas legíveis e firmes"}
            />
            <small>Um item por linha, até 50 itens.</small>
            {err("checklist")}
          </label>
        </div>
        {error && (
          <p role="alert" className="error-banner">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button disabled={busy}>
            {busy ? "Salvando…" : "Salvar rotina"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
