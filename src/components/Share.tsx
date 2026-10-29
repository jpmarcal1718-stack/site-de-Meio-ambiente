import { useEffect, useState } from "react";
import { Copy, Download, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { project } from "../config/project";
import { download } from "../export/files";
import { useData } from "../app/DataContext";
export function publicAddress(): string {
  const value =
    project.publicUrl ||
    (location.protocol === "https:" &&
    location.hostname === "jpmarcal1718-stack.github.io"
      ? new URL(import.meta.env.BASE_URL, location.origin).href
      : "");
  if (!value) return "";
  try {
    const u = new URL(value);
    if (
      u.protocol !== "https:" ||
      u.username ||
      u.password ||
      !u.hostname.includes(".") ||
      /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(
        u.hostname,
      ) ||
      /\.(local|test|invalid)$/.test(u.hostname) ||
      u.hostname.includes(":")
    )
      return "";
    return u.href;
  } catch {
    return "";
  }
}
export function Share() {
  const { notify } = useData();
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const url = publicAddress();
  useEffect(() => {
    if (url)
      QRCode.toDataURL(url, {
        width: 640,
        margin: 3,
        color: { dark: "#163e32", light: "#ffffff" },
        errorCorrectionLevel: "M",
      })
        .then(setImage)
        .catch(() => setError("Não foi possível gerar o QR Code."));
  }, [url]);
  async function svg() {
    try {
      const value = await QRCode.toString(url, {
        type: "svg",
        margin: 3,
        errorCorrectionLevel: "M",
        color: { dark: "#163e32", light: "#ffffff" },
      });
      download(
        new Blob([value], { type: "image/svg+xml" }),
        "qr-gestao-ambiental.svg",
      );
    } catch {
      setError("Não foi possível baixar o QR Code.");
    }
  }
  return (
    <section className="panel guide-card">
      <div className="section-icon">
        <QrCode size={23} />
      </div>
      <h2>Compartilhar a demonstração</h2>
      {url ? (
        <>
          <p>
            Endereço público da aplicação, independente do computador do
            apresentador.
          </p>
          <a className="public-url" href={url} target="_blank" rel="noreferrer">
            {url}
          </a>
          {image && (
            <img
              className="qr-image"
              src={image}
              alt={`QR Code para acessar ${url}`}
              width={220}
              height={220}
            />
          )}
          <div className="toolbar">
            <button
              className="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  notify("Endereço copiado.");
                } catch {
                  setError("Copie o endereço exibido acima.");
                }
              }}
            >
              <Copy size={16} />
              Copiar link
            </button>
            <a
              className="button secondary"
              href={image || undefined}
              download="qr-gestao-ambiental.png"
              aria-disabled={!image}
            >
              <Download size={16} />
              PNG
            </a>
            <button className="secondary" onClick={svg}>
              <Download size={16} />
              SVG
            </button>
          </div>
        </>
      ) : (
        <div className="notice column">
          <strong>Endereço público ainda não confirmado</strong>
          <p>
            O QR Code ficará disponível depois que a aplicação estiver publicada
            em um endereço público confirmado.
          </p>
          <p>
            O QR Code para visitantes não é gerado com localhost ou endereços de
            rede privada.
          </p>
        </div>
      )}
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
