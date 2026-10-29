import { useEffect, useState } from "react";
import {
  HashRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  BookOpen,
  Leaf,
  Menu,
  X,
  ArrowUpRight,
  HardDrive,
  WifiOff,
  Download,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { DataProvider } from "./DataContext";
import { Painel } from "../pages/Painel";
import { Demandas } from "../pages/Demandas";
import { RotinaPreventiva } from "../pages/RotinaPreventiva";
import { CriteriosEUso } from "../pages/CriteriosEUso";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}
function Layout() {
  const [mobile, setMobile] = useState(window.innerWidth <= 700);
  const [menu, setMenu] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [install, setInstall] = useState<InstallEvent>();
  const [installError, setInstallError] = useState("");
  const location = useLocation();
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError() {
      setInstallError(
        "O cache offline não pôde ser preparado. Você pode continuar usando a versão online.",
      );
    },
  });
  useEffect(() => {
    setMenu(false);
    window.scrollTo({ top: 0 });
    document.title =
      ({
        "/": "Painel",
        "/demandas": "Demandas",
        "/rotinas": "Rotina preventiva",
        "/criterios": "Critérios e uso",
      }[location.pathname] || "Painel") + " · Gestão Ambiental Ivaiporã";
  }, [location.pathname]);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    const resize = () => setMobile(window.innerWidth <= 700);
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(false);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", escape);
    };
  }, []);
  const nav = [
    { to: "/", label: "Painel", icon: LayoutDashboard },
    { to: "/demandas", label: "Demandas", icon: ClipboardList },
    { to: "/rotinas", label: "Rotina preventiva", icon: CalendarDays },
    { to: "/criterios", label: "Critérios e uso", icon: BookOpen },
  ];
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("conteudo")?.focus();
          document.getElementById("conteudo")?.scrollIntoView();
        }}
      >
        Ir para o conteúdo
      </a>
      {menu && (
        <button
          className="mobile-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMenu(false)}
        />
      )}
      <aside
        inert={mobile && !menu}
        aria-hidden={mobile && !menu}
        className={`sidebar ${menu ? "open" : ""}`}
      >
        <Link to="/" className="brand">
          <div className="brand-icon">
            <Leaf size={25} />
          </div>
          <div>
            <strong>Gestão Ambiental</strong>
            <span>IVAIPORÃ</span>
          </div>
        </Link>
        <div className="sidebar-section-label">ÁREA DE TRABALHO</div>
        <nav aria-label="Navegação principal">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.to === "/"}>
              <n.icon size={19} />
              <span>{n.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="sidebar-leaf">
            <Leaf size={28} />
          </div>
          <strong>
            Pequenas ações.
            <br />
            Cuidado contínuo.
          </strong>
          <p>Organização para transformar observações em próximos passos.</p>
          <Link to="/criterios">
            Conheça o projeto
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <span className="status-dot" />
          Demonstração acadêmica<small>Dados fictícios · uso educacional</small>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button menu-toggle"
              aria-label={menu ? "Fechar menu" : "Abrir menu"}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              {menu ? <X size={21} /> : <Menu size={21} />}
            </button>
            <span>Ambiente de trabalho</span>
            <span>/</span>
            <strong>
              {nav.find((n) => n.to === location.pathname)?.label || "Painel"}
            </strong>
          </div>
          <div className="topbar-right">
            <span
              className="storage-status"
              title="Registros salvos somente neste navegador"
            >
              <HardDrive size={14} />
              Demonstração acadêmica
            </span>
            <span className="avatar" aria-label="Modo demonstração">
              GA
            </span>
          </div>
        </header>
        {!online && (
          <div className="offline-banner" role="status">
            <WifiOff size={16} />
            Você está offline. Os registros continuam neste navegador.
          </div>
        )}
        {(needRefresh || offlineReady || installError) && (
          <div className="pwa-banner" role="status">
            <span>
              {needRefresh
                ? "Uma nova versão está disponível. Salve formulários abertos antes de atualizar."
                : offlineReady
                  ? "Aplicação pronta para uso offline após este carregamento."
                  : installError}
            </span>
            {needRefresh && (
              <button
                className="secondary compact"
                onClick={() => updateServiceWorker(true)}
              >
                Atualizar agora
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Fechar aviso offline"
              onClick={() => {
                setNeedRefresh(false);
                setOfflineReady(false);
                setInstallError("");
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
        <main id="conteudo" className="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Painel />} />
            <Route path="/demandas" element={<Demandas />} />
            <Route path="/rotinas" element={<RotinaPreventiva />} />
            <Route path="/criterios" element={<CriteriosEUso />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="app-footer">
          <span>
            <Leaf size={14} />
            Gestão Ambiental · Ivaiporã
          </span>
          <span>Projeto acadêmico · Não é um canal oficial de atendimento</span>
          {install && (
            <button
              className="text-button"
              onClick={async () => {
                try {
                  await install.prompt();
                  await install.userChoice;
                  setInstall(undefined);
                } catch {
                  setInstallError(
                    "Use o menu do navegador para instalar a aplicação.",
                  );
                }
              }}
            >
              <Download size={14} />
              Instalar aplicativo
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
export function App() {
  return (
    <HashRouter>
      <DataProvider>
        <Layout />
      </DataProvider>
    </HashRouter>
  );
}
