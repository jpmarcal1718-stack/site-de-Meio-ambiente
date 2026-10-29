import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppData, Snapshot } from "../types";
import { repository } from "../repositories/localRepository";
interface Context {
  data: AppData;
  busy: boolean;
  mutate: (change: (data: AppData) => AppData) => Promise<void>;
  notify: (text: string) => void;
}
const DataContext = createContext<Context | null>(null);
export function DataProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const ref = useRef<Snapshot | undefined>(undefined);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const load = () => {
    setError("");
    repository
      .load()
      .then((s) => {
        ref.current = s;
        setSnapshot(s);
      })
      .catch(() =>
        setError(
          "Não foi possível acessar os dados deste navegador. Libere o armazenamento local e tente novamente. Seus registros não foram apagados.",
        ),
      );
  };
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function mutate(change: (data: AppData) => AppData) {
    if (lock.current)
      throw new Error(
        "Há uma gravação em andamento. Aguarde e tente novamente.",
      );
    if (!ref.current)
      throw new Error("O armazenamento ainda não está disponível.");
    lock.current = true;
    setBusy(true);
    try {
      const next = await repository.save(
        change(ref.current.data),
        ref.current.revision,
      );
      ref.current = next;
      setSnapshot(next);
    } catch (e) {
      throw new Error(
        e instanceof Error
          ? e.message
          : "Falha ao salvar. Verifique o espaço disponível e tente novamente.",
      );
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  if (!snapshot)
    return (
      <main className="loading">
        <div className="brand-icon">♧</div>
        <h1>Gestão Ambiental</h1>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button onClick={load}>Tentar novamente</button>
          </>
        ) : (
          <p>Preparando seus registros locais…</p>
        )}
      </main>
    );
  return (
    <DataContext.Provider
      value={{ data: snapshot.data, busy, mutate, notify: setToast }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button aria-label="Fechar mensagem" onClick={() => setToast("")}>
            ×
          </button>
        </div>
      )}
    </DataContext.Provider>
  );
}
export function useData() {
  const c = useContext(DataContext);
  if (!c) throw new Error("Contexto indisponível.");
  return c;
}
