import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, FileDown, Download, ClipboardList } from "lucide-react";
import { useData } from "../app/DataContext";
import { Filters } from "../components/Filters";
import { emptyFilters, type Filters as FilterType } from "../types";
import { filterDemands, blankDemand } from "../domain/demands";
import { DemandForm } from "../features/demandas/DemandForm";
import { DemandDetails, DemandRow } from "../features/demandas/DemandDetails";
import { PdfReport } from "../components/PdfReport";
import { exportCsv } from "../export/files";
export function Demandas() {
  const { data } = useData();
  const [params, setParams] = useSearchParams();
  const [details, setDetails] = useState("");
  const [newDemand, setNewDemand] = useState(false);
  const [pdf, setPdf] = useState(false);
  const [page, setPage] = useState(0);
  const filters = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(emptyFilters).map(([k, v]) => [k, params.get(k) ?? v]),
      ) as unknown as FilterType,
    [params],
  );
  const filtered = useMemo(
    () => filterDemands(data.demands, filters),
    [data.demands, filters],
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const current = Math.min(page, pages - 1);
  const update = (f: FilterType) => {
    setParams(
      Object.fromEntries(
        Object.entries(f).filter(
          ([k, v]) => v && v !== emptyFilters[k as keyof FilterType],
        ),
      ),
    );
    setPage(0);
  };
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ORGANIZAR E ACOMPANHAR</div>
          <h1>Demandas ambientais</h1>
          <p>Da observação ao atendimento, cada etapa em um só lugar.</p>
        </div>
        <button onClick={() => setNewDemand(true)}>
          <Plus size={18} />
          Nova demanda
        </button>
      </div>
      <section className="panel demands-panel">
        <div className="panel-heading">
          <div>
            <h2>
              Registro de demandas{" "}
              <span className="count">{data.demands.length}</span>
            </h2>
            <p>Dados demonstrativos · salvos neste navegador</p>
          </div>
          <div className="toolbar">
            <button
              className="secondary compact"
              onClick={() => exportCsv(filtered)}
              disabled={!filtered.length}
            >
              <Download size={16} />
              CSV
            </button>
            <button
              className="secondary compact"
              onClick={() => setPdf(true)}
              disabled={!filtered.length}
            >
              <FileDown size={16} />
              Relatório PDF
            </button>
          </div>
        </div>
        <Filters
          value={filters}
          onChange={update}
          responsibles={[
            ...new Set(data.demands.map((d) => d.responsible).filter(Boolean)),
          ]}
        />
        {filtered.length ? (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Demanda</th>
                    <th className="hide-small">Área e local</th>
                    <th>Prioridade</th>
                    <th className="status-cell">Situação</th>
                    <th className="hide-small">Responsável</th>
                    <th>Prazo</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(current * 10, current * 10 + 10).map((d) => (
                    <DemandRow
                      d={d}
                      key={d.id}
                      onOpen={() => setDetails(d.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="table-footer">
              <span>{filtered.length} demanda(s) encontrada(s)</span>
              <div>
                <button
                  className="secondary compact"
                  disabled={current === 0}
                  onClick={() => setPage(current - 1)}
                >
                  Anterior
                </button>
                <span>
                  {current + 1} de {pages}
                </span>
                <button
                  className="secondary compact"
                  disabled={current >= pages - 1}
                  onClick={() => setPage(current + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty">
            <ClipboardList size={32} />
            <h3>Nenhuma demanda neste recorte</h3>
            <p>Ajuste os filtros ou registre uma nova ocorrência.</p>
            <button
              className="secondary"
              onClick={() => update({ ...emptyFilters })}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </section>
      {newDemand && (
        <DemandForm
          initial={blankDemand()}
          onClose={() => setNewDemand(false)}
          onSaved={(d) => setDetails(d.id)}
        />
      )}
      {details && <DemandDetails id={details} onClose={() => setDetails("")} />}
      {pdf && (
        <PdfReport
          demands={filtered}
          filters={filters}
          onClose={() => setPdf(false)}
        />
      )}
    </>
  );
}
