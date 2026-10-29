import { useState, type FormEvent } from "react";
import { Info, ShieldCheck } from "lucide-react";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { AREAS, PEOPLE, PRIORITIES, STATUSES } from "../../config/project";
import type { Assessment, Demand, Priority } from "../../types";
import { suggestPriority } from "../../domain/priority";
import { demandSchema } from "../../validation/schema";
import { recordChanges } from "../../domain/demands";
import { localDate } from "../../domain/dates";
import { useData } from "../../app/DataContext";
export function DemandForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Demand;
  onClose: () => void;
  onSaved?: (d: Demand) => void;
}) {
  const { data, mutate, busy, notify } = useData();
  const previous = data.demands.find((d) => d.id === initial.id);
  const [form, setForm] = useState<Demand>(structuredClone(initial));
  const [evaluated, setEvaluated] = useState(!!initial.assessment);
  const [criteria, setCriteria] = useState<Assessment>(
    initial.assessment || { people: 1, environment: 1, worsening: 1 },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const set = <K extends keyof Demand>(key: K, v: Demand[K]) =>
    setForm((f) => ({ ...f, [key]: v }));
  const suggestion = suggestPriority(evaluated ? criteria : null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const candidate = {
      ...form,
      assessment: evaluated ? criteria : null,
      override: evaluated ? form.override : null,
      justification: evaluated && form.override ? form.justification : "",
      completedAt: form.status === "Concluída" ? form.completedAt : "",
      resolution: form.status === "Concluída" ? form.resolution : "",
    };
    const result = demandSchema.safeParse(candidate);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const i of result.error.issues) next[String(i.path[0])] = i.message;
      setErrors(next);
      return;
    }
    setErrors({});
    const saved = recordChanges(previous, result.data);
    try {
      await mutate((s) => ({
        ...s,
        demands: previous
          ? s.demands.map((d) => (d.id === saved.id ? saved : d))
          : [...s.demands, saved],
      }));
      notify("Demanda salva neste navegador.");
      onSaved?.(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
    }
  }
  const fieldError = (name: string) =>
    errors[name] && (
      <span className="field-error" role="alert">
        {errors[name]}
      </span>
    );
  return (
    <Modal
      title={previous ? "Editar demanda" : "Nova demanda"}
      onClose={onClose}
      wide
    >
      <form onSubmit={submit} noValidate>
        <p className="form-intro">
          {form.protocol} · Registro demonstrativo, sem envio à Prefeitura.
        </p>
        {form.sourceInspectionId && (
          <p className="notice">
            <Info size={18} />
            Originada em vistoria preventiva. Faça a triagem abaixo antes de
            definir a prioridade.
          </p>
        )}
        <h3 className="form-section">
          01 <span>Registro da ocorrência</span>
        </h3>
        <div className="form-grid">
          <label className="span-2">
            Título *
            <input
              autoFocus
              value={form.title}
              maxLength={180}
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={!!errors.title}
            />
            {fieldError("title")}
          </label>
          <label>
            Área de atuação *
            <select
              value={form.area}
              onChange={(e) => set("area", e.target.value as Demand["area"])}
            >
              {AREAS.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Local ou setor *
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
            />
            {fieldError("location")}
          </label>
          <label className="span-2">
            Descrição da ocorrência *
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
            {fieldError("description")}
          </label>
          <label>
            Origem do registro *
            <input
              list="origins"
              value={form.origin}
              onChange={(e) => set("origin", e.target.value)}
            />
            <datalist id="origins">
              <option>Exemplo da feira</option>
              <option>Vistoria preventiva</option>
              <option>Observação da equipe</option>
            </datalist>
            {fieldError("origin")}
          </label>
          <label>
            Data de registro *
            <input
              type="date"
              max={localDate()}
              value={form.registeredAt}
              onChange={(e) => set("registeredAt", e.target.value)}
            />
            {fieldError("registeredAt")}
          </label>
        </div>
        <h3 className="form-section">
          02 <span>Triagem e prioridade</span>
        </h3>
        <label className="check-label evaluation-toggle">
          <input
            type="checkbox"
            checked={evaluated}
            onChange={(e) => {
              setEvaluated(e.target.checked);
              if (!e.target.checked) set("override", null);
            }}
          />
          Avaliar os três critérios agora
        </label>
        {evaluated && (
          <div className="criteria-grid">
            {(
              [
                ["people", "Risco às pessoas"],
                ["environment", "Dano ambiental"],
                ["worsening", "Possibilidade de agravamento"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  value={criteria[key]}
                  onChange={(e) =>
                    setCriteria((c) => ({
                      ...c,
                      [key]: Number(e.target.value),
                    }))
                  }
                >
                  <option value={1}>1 · Baixo</option>
                  <option value={2}>2 · Moderado</option>
                  <option value={3}>3 · Alto</option>
                </select>
              </label>
            ))}
          </div>
        )}
        <div className="priority-explanation">
          <ShieldCheck size={24} />
          <div>
            <strong>
              Sugestão: <Badge value={suggestion.priority || "Não avaliada"} />
              {suggestion.score !== null && (
                <span className="score">{suggestion.score}/9 pontos</span>
              )}
            </strong>
            <p>{suggestion.reason}</p>
            <small>
              Matriz demonstrativa; decisão final sujeita à triagem humana.
            </small>
          </div>
        </div>
        {fieldError("assessment")}
        {evaluated && (
          <div className="form-grid">
            <label>
              Prioridade final
              <select
                value={form.override || ""}
                onChange={(e) =>
                  set("override", (e.target.value || null) as Priority | null)
                }
              >
                <option value="">
                  Usar a sugestão ({suggestion.priority})
                </option>
                {PRIORITIES.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {form.override && (
              <label>
                Justificativa da alteração *
                <textarea
                  value={form.justification}
                  onChange={(e) => set("justification", e.target.value)}
                />
                {fieldError("justification")}
              </label>
            )}
          </div>
        )}
        <h3 className="form-section">
          03 <span>Planejamento do atendimento</span>
        </h3>
        <div className="form-grid">
          <label>
            Responsável
            <input
              list="people"
              value={form.responsible}
              onChange={(e) => set("responsible", e.target.value)}
              placeholder="Ainda não definido"
            />
            <datalist id="people">
              {PEOPLE.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </datalist>
          </label>
          <label>
            Situação
            <select
              value={form.status}
              onChange={(e) => {
                const status = e.target.value as Demand["status"];
                setForm((f) => ({
                  ...f,
                  status,
                  completedAt:
                    status === "Concluída" ? f.completedAt || localDate() : "",
                  resolution: status === "Concluída" ? f.resolution : "",
                }));
              }}
            >
              {STATUSES.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Prazo
            <input
              type="date"
              min={form.registeredAt}
              value={form.deadline}
              onChange={(e) => set("deadline", e.target.value)}
            />
            {fieldError("deadline")}
          </label>
          <label>
            Próxima ação
            <input
              value={form.nextAction}
              onChange={(e) => set("nextAction", e.target.value)}
            />
            {fieldError("nextAction")}
          </label>
          {form.status === "Concluída" && (
            <>
              <label>
                Data de conclusão *
                <input
                  type="date"
                  min={form.registeredAt}
                  max={localDate()}
                  value={form.completedAt}
                  onChange={(e) => set("completedAt", e.target.value)}
                />
                {fieldError("completedAt")}
              </label>
              <label>
                Descrição do atendimento *
                <textarea
                  value={form.resolution}
                  onChange={(e) => set("resolution", e.target.value)}
                />
                {fieldError("resolution")}
              </label>
            </>
          )}
        </div>
        {Object.keys(errors).length > 0 && (
          <p className="error-banner" role="alert">
            Revise os campos indicados antes de salvar.
          </p>
        )}
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
            {busy ? "Salvando…" : "Salvar demanda"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
