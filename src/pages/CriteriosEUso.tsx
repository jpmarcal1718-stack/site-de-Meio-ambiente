import { useRef, useState } from "react";
import {
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Leaf,
  HardDrive,
  ArrowRight,
  Info,
} from "lucide-react";
import { useData } from "../app/DataContext";
import { project, priorityConfig } from "../config/project";
import type { AppData } from "../types";
import { validateBackup } from "../validation/schema";
import { createSeed } from "../data/seed";
import { exportBackup } from "../export/files";
import { Confirm } from "../components/Modal";
import { Badge } from "../components/Badge";
import { Share } from "../components/Share";
export function CriteriosEUso() {
  const { data, mutate, busy, notify } = useData();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<AppData>();
  const [restore, setRestore] = useState(false);
  const [error, setError] = useState("");
  async function read(file?: File) {
    if (!file) return;
    setError("");
    try {
      if (file.size > 10 * 1024 * 1024)
        throw new Error("O backup deve ter no máximo 10 MB.");
      setPending(validateBackup(JSON.parse(await file.text())));
    } catch (e) {
      setError(
        e instanceof SyntaxError
          ? "Arquivo JSON inválido. Seus dados atuais foram preservados."
          : (e as Error).message,
      );
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  async function replace() {
    try {
      const replacement = pending || createSeed();
      await mutate(() => replacement);
      setPending(undefined);
      setRestore(false);
      notify("Dados locais substituídos com sucesso.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">ENTENDER PARA USAR MELHOR</div>
          <h1>Critérios e uso</h1>
          <p>Conheça a proposta, a triagem e os cuidados com seus registros.</p>
        </div>
        <span className="demo-label">Demonstração acadêmica</span>
      </div>
      <section className="about-intro">
        <div>
          <span className="eyebrow">DO DESAFIO AO PLANEJAMENTO</span>
          <h2>
            Cuidar dos espaços começa
            <br />
            por organizar as demandas.
          </h2>
          <p>
            Inspirado nos desafios de gestão do Parque Urbano Jardim Botânico de
            Ivaiporã, o projeto organiza ocorrências, prioridades, responsáveis
            e ações preventivas.
          </p>
          <p>
            Uma equipe reduzida diante de muitas solicitações precisa de clareza
            para planejar. A ferramenta apoia esse trabalho; a disponibilidade
            de profissionais continua sendo uma condição essencial.
          </p>
        </div>
        <Leaf size={110} aria-hidden="true" />
      </section>
      <div className="guide-grid">
        <section className="panel guide-card span-2">
          <div className="section-icon">
            <ShieldCheck size={24} />
          </div>
          <h2>Como a prioridade é sugerida</h2>
          <p>
            Três critérios recebem de 1 a 3 pontos:{" "}
            <strong>
              risco às pessoas, dano ambiental e possibilidade de agravamento
            </strong>
            . Em cada critério, 1 significa baixo; 2, moderado; 3, alto.
          </p>
          <div className="priority-matrix">
            <div>
              <Badge value="Baixa" />
              <strong>3 a {priorityConfig.lowMax} pontos</strong>
            </div>
            <div>
              <Badge value="Média" />
              <strong>
                {priorityConfig.lowMax + 1} a {priorityConfig.mediumMax} pontos
              </strong>
            </div>
            <div>
              <Badge value="Alta" />
              <strong>
                {priorityConfig.mediumMax + 1} a {priorityConfig.highMax} pontos
              </strong>
            </div>
            <div>
              <Badge value="Crítica" />
              <strong>9 pontos ou risco alto às pessoas</strong>
            </div>
          </div>
          <div className="notice">
            <Info size={20} />
            <div>
              <strong>Regra de proteção às pessoas</strong>
              <p>
                Risco às pessoas igual a 3 eleva a sugestão para crítica,
                independentemente da soma. Como os outros dois critérios chegam
                a 6 pontos, o risco alto também é a única forma de alcançar 9.
              </p>
            </div>
          </div>
          <p>
            Sem avaliação completa, a demanda permanece{" "}
            <strong>“Não avaliada”</strong>. A decisão final é humana: a
            prioridade pode ser alterada com justificativa obrigatória e
            histórico. Esta matriz é demonstrativa e configurável; não é norma
            municipal e não estabelece prazos legais.
          </p>
        </section>
        <section className="panel guide-card">
          <h2>Um fluxo simples de acompanhamento</h2>
          <ol className="workflow-list">
            {[
              [
                "Registrar",
                "Descreva a ocorrência, o local e a área de atuação.",
              ],
              [
                "Fazer a triagem",
                "Avalie os critérios e confira a sugestão de prioridade.",
              ],
              ["Planejar", "Defina responsável, prazo e próxima ação."],
              ["Acompanhar", "Atualize a situação e registre observações."],
              ["Encerrar", "Informe o atendimento e a data de conclusão."],
            ].map(([title, text], index) => (
              <li key={title}>
                <span>{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel guide-card">
          <h2>Quatro telas, uma visão do trabalho</h2>
          <dl className="module-list">
            <dt>Painel</dt>
            <dd>
              Indicadores calculados, demandas que precisam de atenção e agenda
              preventiva.
            </dd>
            <dt>Demandas</dt>
            <dd>
              Registros, triagem, responsáveis, prazos, acompanhamentos e
              histórico.
            </dd>
            <dt>Rotina preventiva</dt>
            <dd>
              Vistorias recorrentes com checklist. Uma não conformidade pode
              gerar demanda vinculada, que passa pela triagem.
            </dd>
            <dt>Critérios e uso</dt>
            <dd>Regras, orientações, backup e compartilhamento.</dd>
          </dl>
          <p>
            Ao concluir uma vistoria, o histórico é preservado e a próxima data
            é calculada pela periodicidade da rotina.
          </p>
        </section>
        <section className="panel guide-card">
          <div className="section-icon">
            <HardDrive size={23} />
          </div>
          <h2>Seus dados ficam neste navegador</h2>
          <p>
            Os registros são salvos no{" "}
            <strong>navegador deste dispositivo</strong> e persistem ao
            atualizar a página. Cada visitante tem seus próprios dados:
            alterações não são compartilhadas automaticamente com outras pessoas
            ou dispositivos.
          </p>
          <p>
            Limpar os dados do navegador pode apagar os registros. No modo
            privado, eles podem ser removidos ao encerrar a sessão. Faça backups
            regulares para transferir os dados ou guardá-los com segurança.
          </p>
          <p>
            O backup JSON inclui demandas, critérios, acompanhamentos,
            histórico, rotinas, vistorias e seus vínculos. Esta versão não
            oferece anexos de fotos.
          </p>
          <p>
            Após o primeiro acesso online e a preparação do cache, as funções
            locais principais continuam disponíveis offline. O navegador
            indicará quando a interface estiver pronta. A instalação depende do
            suporte do navegador.
          </p>
        </section>
        <section className="panel guide-card">
          <h2>Backup e dados da demonstração</h2>
          <p>
            Exporte antes de importar ou restaurar. Uma importação válida
            substitui o conjunto local inteiro após sua confirmação.
          </p>
          <div className="backup-actions">
            <button className="secondary" onClick={() => exportBackup(data)}>
              <Download size={17} />
              Exportar backup JSON
            </button>
            <button
              className="secondary"
              onClick={() => input.current?.click()}
            >
              <Upload size={17} />
              Importar backup JSON
            </button>
            <button
              className="text-button destructive"
              onClick={() => {
                setError("");
                setRestore(true);
              }}
            >
              <RotateCcw size={17} />
              Restaurar demonstração
            </button>
            <input
              ref={input}
              aria-label="Arquivo de backup JSON"
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => read(e.target.files?.[0])}
            />
          </div>
          {error && (
            <p className="error-banner" role="alert">
              {error}
            </p>
          )}
          <p className="caption">
            A carga inicial acontece uma única vez. Atualizações da aplicação
            não substituem os registros do visitante. A restauração só afeta os
            dados locais desta aplicação.
          </p>
        </section>
        <Share />
        <section className="panel guide-card">
          <h2>Sobre o projeto</h2>
          <p>
            Projeto acadêmico para apresentação em feira de ciências. Os
            exemplos e responsáveis são fictícios e estão identificados como
            dados demonstrativos.
          </p>
          <dl className="module-list">
            <dt>Instituição</dt>
            <dd>{project.institution || "Não informada"}</dd>
            <dt>Integrantes</dt>
            <dd>{project.members.join(", ") || "Não informados"}</dd>
            <dt>Orientação</dt>
            <dd>{project.advisor || "Não informada"}</dd>
          </dl>
          <p>
            As informações de autoria serão adicionadas pela equipe do projeto.
          </p>
          <div className="notice column">
            <strong>Sem caráter oficial</strong>
            <p>
              Cadastros e vistorias feitos aqui não enviam solicitações à
              Prefeitura ou à Secretaria do Meio Ambiente. Para atendimento
              real, procure os canais oficiais do município.
            </p>
          </div>
        </section>
      </div>
      <p className="caption">
        Registrar
        <ArrowRight size={12} />
        Priorizar
        <ArrowRight size={12} />
        Planejar
        <ArrowRight size={12} />
        Acompanhar
      </p>
      {(pending || restore) && (
        <Confirm
          title={
            pending
              ? "Substituir dados pelo backup?"
              : "Restaurar demonstração?"
          }
          busy={busy}
          onCancel={() => {
            setPending(undefined);
            setRestore(false);
          }}
          onConfirm={replace}
        >
          <p>
            {pending
              ? `O arquivo validado contém ${pending.demands.length} demandas, ${pending.routines.length} rotinas e ${pending.inspections.length} vistorias.`
              : "Será criado um novo conjunto de exemplos fictícios com datas relativas a hoje."}
          </p>
          <p>
            Todos os registros atuais desta aplicação neste navegador serão
            substituídos. Exporte o backup para poder recuperá-los depois.
          </p>
          <button className="secondary" onClick={() => exportBackup(data)}>
            <Download size={16} />
            Exportar dados atuais antes
          </button>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
        </Confirm>
      )}
    </>
  );
}
