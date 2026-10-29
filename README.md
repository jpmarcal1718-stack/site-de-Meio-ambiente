# Gestão Ambiental · Ivaiporã

Aplicação estática, responsiva e interativa para feira de ciências. Apoia a organização, a priorização e o acompanhamento de demandas ambientais, inspirada nos desafios do Parque Urbano Jardim Botânico de Ivaiporã. A ferramenta auxilia o planejamento; a disponibilidade de profissionais continua sendo essencial.

**Demonstração acadêmica.** Registros, responsáveis e vistorias são fictícios. Cadastros não enviam solicitações à Prefeitura ou à Secretaria do Meio Ambiente. Não inserir dados pessoais, denúncias ou documentos reais.

## Executar no computador

Requer Node.js 24 LTS com npm (também aceita Node 22 a partir de 22.12). Se `npm` não for reconhecido, instale pelo [site oficial do Node](https://nodejs.org/pt) e reabra o terminal. Abra esta pasta no VS Code e execute em **Terminal > Novo Terminal**:

```sh
npm ci
npm run dev
```

Abra <http://localhost:5173/site-de-Meio-ambiente/> no Chrome. A porta é fixa (`strictPort`): encerre outro processo na porta se houver conflito. Mantenha o terminal em execução; `Ctrl+C` encerra e `npm run dev` inicia novamente. Também há tarefas em **Terminal > Executar Tarefa > Iniciar site** e **Iniciar site na rede**.

## Acesso na mesma rede

```sh
npm run dev:lan
```

Use o endereço mostrado na linha **Network** do Vite. Na verificação local desta sessão, respondeu <http://192.168.1.138:5173/site-de-Meio-ambiente/>. O IPv4 pode mudar. Celular e computador precisam estar na mesma rede, o computador ligado e o acesso permitido pelas regras de rede existentes. O projeto não altera o firewall. Não use `0.0.0.0` como endereço. O cache offline e a instalação PWA exigem HTTPS ou localhost; o acesso LAN por HTTP pode não oferecer esses recursos.

## Publicação no GitHub Pages

Repositório: <https://github.com/jpmarcal1718-stack/site-de-Meio-ambiente>.

O workflow `.github/workflows/deploy.yml` instala pelo lockfile, executa lint, TypeScript, testes, build e fluxos Chromium em três tamanhos de tela antes da publicação. Usa ações oficiais fixadas por SHA, com as versões anotadas. A aplicação usa `HashRouter`, base `/site-de-Meio-ambiente/` e escopo PWA correspondente; telas internas podem ser atualizadas sem rotas de servidor.

**Site publicado e verificado, sem login:** <https://jpmarcal1718-stack.github.io/site-de-Meio-ambiente/>.

O proprietário autorizou tornar o repositório público e o Pages foi habilitado com publicação por GitHub Actions. A publicação inicial foi concluída com sucesso, seguida de verificação HTTP sem autenticação da página, JavaScript, CSS, manifesto, ícones e service worker. A tela interna foi recarregada no navegador sem erro 404.

Para acompanhar ou repetir a publicação:

1. **Settings > Pages > Build and deployment > Source** já está configurado para **GitHub Actions**.
2. Envie um novo commit à branch `main` ou use **Actions > Verificar e publicar no GitHub Pages > Run workflow**.
3. Aguarde os jobs `build` e `deploy`. O endereço público é o retornado pelo ambiente `github-pages`.
4. Se futuramente usar um repositório privado em plano compatível, defina `PAGES_ENABLED=true` nas variáveis de Actions para habilitar o job de publicação.

Ao abrir a aplicação por HTTPS no domínio real `jpmarcal1718-stack.github.io`, **Critérios e uso > Compartilhar a demonstração** identifica o endereço servido e disponibiliza QR Code para baixar em PNG ou SVG. Não gera QR para visitantes com localhost ou IP privado.

Para um domínio diferente **já publicado e verificado**, copie `.env.example` para `.env.local`, preencha `VITE_PUBLIC_URL` com a URL HTTPS confirmada e gere novo build. O valor é público, não é segredo. Se mudar o caminho, ajuste `base`, `start_url`, `scope` e `navigateFallbackAllowlist` em `vite.config.ts`.

Para atualizar o site:

```sh
git add .
git commit -m "Atualiza a aplicação"
git push origin main
```

Cada push verifica e, com Pages habilitado, publica. A PWA avisa quando há nova versão: salve os formulários antes de **Atualizar agora**. Atualizar o cache não limpa o banco local.

## As quatro telas

| Tela              | Recursos                                                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Painel            | Indicadores calculados, lista de atenção, agenda, distribuição e filtros. Indicadores abrem listagens já filtradas.                                                      |
| Demandas          | Cadastro, edição, busca, filtros, ordenação, detalhes, responsável, situação, prazo, próxima ação, acompanhamento, conclusão, exclusão confirmada, histórico, CSV e PDF. |
| Rotina preventiva | Agenda, cadastro/edição de rotinas e checklists, vistoria por item, histórico, recorrência e demanda vinculada à não conformidade.                                       |
| Critérios e uso   | Proposta, matriz, fluxo, armazenamento local, autoria configurável, backup, restauração e compartilhamento.                                                              |

Períodos de demandas usam a **data de registro** por padrão. O indicador de concluídas usa a **data de conclusão** e transmite esse filtro à listagem. A agenda usa a **próxima data da rotina**. Área e responsável são aplicados aos recortes do painel.

## Regras de prioridade e recorrência

`src/domain/priority.ts` contém as regras, com limites em `src/config/project.ts`:

- Risco às pessoas, dano ambiental e possibilidade de agravamento recebem 1 (baixo), 2 (moderado) ou 3 (alto).
- Soma 3–4: baixa; 5–6: média; 7–8: alta; 9: crítica.
- **Risco às pessoas igual a 3: crítica, independentemente da soma.**
- Sem avaliação completa: **Não avaliada**, sem pontuação ou prioridade baixa automática.
- Alteração manual exige avaliação e justificativa; sugestão e decisão permanecem distintas e o histórico preserva os valores anteriores.

Esta matriz é demonstrativa, sem caráter de norma municipal ou prazos legais. A decisão continua sendo humana.

Recorrências diária, semanal e quinzenal avançam 1, 7 e 14 dias. Mensal e trimestral avançam 1 ou 3 meses a partir da vistoria realizada, preservando o dia de referência e ajustando meses curtos (31/01 → 28/02 → 31/03, se a referência for 31). Uma vistoria antiga pode deixar o próximo agendamento ainda atrasado. Checklists antigos ficam preservados mesmo ao editar a rotina.

Datas de calendário usam `YYYY-MM-DD` interpretado localmente, sem conversão indevida para UTC. Instantes do histórico usam ISO com horário, apresentados no fuso local do visitante.

## Armazenamento, backups e exportação

A interface `Repository` em `src/repositories/localRepository.ts` permite substituir o IndexedDB por backend futuramente. O conjunto é validado e salvo em transação atômica; só há confirmação após o commit. Controle de revisão impede sobrescrita por outra aba. Em falhas, o formulário permanece aberto. Em conflito entre abas, recarregue e reaplique a edição.

O banco versão 1 tem carga inicial atômica única: 12 demandas, seis rotinas e três vistorias fictícias, com datas relativas à primeira inicialização. Recarregar e atualizar não repõem os exemplos. Futuras migrações precisam ser explícitas: formato desconhecido gera erro, sem apagamento silencioso.

**Cada origem/navegador/dispositivo mantém seus próprios registros.** Localhost, 127.0.0.1, IP de rede e domínio público também são origens diferentes. Não há login nem sincronização. Para transferir registros, exporte e importe. Limpar o navegador ou encerrar uma sessão privada pode removê-los; guarde backups.

- **JSON versão 1:** inclui demandas, avaliações, ajustes manuais, histórico, acompanhamentos, rotinas, vistorias e vínculos. Arquivos até 10 MB; validação antes da confirmação de substituição integral. Arquivo inválido não altera os dados atuais.
- **Restaurar demonstração:** confirmação e opção de exportar antes; substitui apenas esta aplicação, com novos exemplos relativos ao dia atual.
- **CSV:** lista filtrada em UTF-8 com BOM, delimitador `;`, aspas escapadas e neutralização de células que possam ser interpretadas como fórmulas.
- **PDF individual:** ocorrência, critérios e prioridade, responsável, situação, prazo, próxima ação, conclusão, acompanhamentos e histórico.
- **PDF resumido:** conjunto filtrado. Ambos têm cabeçalho, filtros, data, indicação acadêmica, paginação, visualização e download. A fonte padrão suporta português; símbolos incompatíveis são convertidos para representação simples.
- Esta versão não inclui anexos fotográficos; o backup não precisa incorporar imagens.

## Offline e instalação

`vite-plugin-pwa` gera manifesto, ícones neutros e service worker apenas em produção. A interface, as bibliotecas de PDF/QR e demais recursos essenciais são hospedados com a aplicação e precacheados, no escopo `/site-de-Meio-ambiente/`.

```sh
npm run build
npm run preview
```

Abra <http://127.0.0.1:4173/site-de-Meio-ambiente/>, aguarde **Aplicação pronta para uso offline**, recarregue e teste desconectado. Consulta, edição, vistorias e relatórios locais continuam disponíveis. Primeira abertura em outro dispositivo e links externos exigem internet. Instalação depende do suporte do navegador. O servidor de desenvolvimento não registra service worker de produção.

## Verificação

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Para usar Chrome instalado no PowerShell, defina `$env:PLAYWRIGHT_CHANNEL = 'chrome'` antes dos testes de fluxo.

Testes unitários cobrem matriz/exceção, justificativa, histórico, atrasos, datas, recorrência, vínculos, CSV e texto PDF. `fake-indexeddb` cobre carga única, persistência, importação inválida sem perda, substituição atômica e conflito entre abas. Playwright usa perfis isolados em **390, 768 e 1440 px**, validando cadastro, persistência, conclusão, PDF, vistoria com demanda vinculada e produção offline.

## Roteiro para a feira (3–5 minutos)

1. **0:00–0:40:** apresentar a demanda de manutenção diante de equipe reduzida e o objetivo de apoiar o planejamento, com caráter acadêmico.
2. **0:40–1:20:** mostrar indicadores, prioridades, prazos e agenda; clicar num indicador para abrir o recorte.
3. **1:20–2:10:** cadastrar exemplo, avaliar os critérios, demonstrar risco alto às pessoas e definir responsável/próxima ação.
4. **2:10–3:10:** realizar vistoria, marcar não conformidade e gerar demanda vinculada, ainda aguardando triagem.
5. **3:10–4:00:** registrar acompanhamento, concluir atendimento com data/descrição e abrir PDF.
6. **4:00–5:00:** compartilhar o endereço público confirmado/QR e explicar o armazenamento individual e o backup.

Antes da feira, exporte os dados, teste a URL pública em janela anônima e em um celular fora de sua rede, prepare o cache no notebook e baixe o QR do endereço real para o banner. Rede local e servidor de desenvolvimento não substituem publicação pública.

## Código e autoria

`src/app` organiza contexto/navegação; `components` reúne interface comum; `pages` contém as quatro telas; `features` os formulários/detalhes; `domain` as regras; `repositories` o armazenamento; `validation` os contratos; `data` os exemplos; `export` os relatórios; `config` identidade e limites; `styles` o layout. `tests` contém regras/persistência e `e2e` os fluxos de navegador.

Preencha instituição, integrantes e orientação em `src/config/project.ts`. Nenhum nome foi inventado. Ícones são neutros, sem brasão, foto ou logotipo oficial.

A [referência fornecida](https://gestao-ambiental-ivaipora.wry-tiger-6016.chatgpt.site/) mostrou apenas “Entre para acessar”. As telas internas não foram inspecionadas; a identidade implementada segue os requisitos visuais do documento. Não se afirma reprodução de telas inacessíveis.

## Documentação técnica consultada

- [Vite: publicação estática e Pages](https://vite.dev/guide/static-deploy.html)
- [Vite: servidor e rede](https://vite.dev/config/server-options)
- [GitHub Pages: funcionamento e disponibilidade](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Pages: workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite PWA](https://vite-pwa-org.netlify.app/guide/)
