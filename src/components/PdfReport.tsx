import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { download, demandPdf } from "../export/files";
import type { Demand, Filters } from "../types";
export function PdfReport({
  demands,
  filters,
  individual = false,
  onClose,
}: {
  demands: Demand[];
  filters: Filters;
  individual?: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<{ blob: Blob; url: string }>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let url = "";
    demandPdf(demands, filters, individual)
      .then((blob) => {
        if (active) {
          url = URL.createObjectURL(blob);
          setFile({ blob, url });
        }
      })
      .catch(() => {
        if (active) setError("Não foi possível gerar o PDF. Tente novamente.");
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [demands, filters, individual]);
  return (
    <Modal title="Relatório PDF" onClose={onClose} wide>
      {error ? (
        <p role="alert">{error}</p>
      ) : file ? (
        <>
          <div className="report-actions">
            <a
              className="button secondary"
              href={file.url}
              target="_blank"
              rel="noreferrer"
            >
              Abrir visualização
            </a>
            <button
              onClick={() =>
                download(
                  file.blob,
                  individual
                    ? `${demands[0].protocol}.pdf`
                    : "relatorio-demandas.pdf",
                )
              }
            >
              Baixar PDF
            </button>
          </div>
          <object className="pdf-viewer" data={file.url} type="application/pdf">
            <p>
              Use “Abrir visualização” ou “Baixar PDF” para consultar o
              relatório neste dispositivo.
            </p>
          </object>
        </>
      ) : (
        <p role="status">Gerando relatório…</p>
      )}
    </Modal>
  );
}
