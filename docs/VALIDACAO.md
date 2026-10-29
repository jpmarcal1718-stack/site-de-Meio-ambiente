# Verificação da entrega

## Resultado local

- TypeScript, ESLint e build de produção executados sem erros.
- 35 testes Vitest aprovados: regras, limites da matriz, exceção de risco às pessoas, alterações manuais, histórico, datas, recorrência, filtros, CSV, texto PDF e persistência.
- 15 testes de fluxo aprovados no Chrome instalado, em perfis isolados: cinco cenários em 390, 768 e 1440 px.
- Cenários: cadastro/triagem/edição/conclusão/PDF, vistoria com demanda vinculada, gravação e PDF offline após cache, importação inválida sem perda e importação válida confirmada, indicador com recorte correto e ausência de transbordamento horizontal nas quatro telas.
- Revisão visual adicional da prévia: painel a 1440 px, rotinas a 768 px e demandas/menu a 390 px.
- Relatório PDF individual e resumido baixados pela interface, renderizados com Poppler e inspecionados; acentos em português preservados, sem caracteres NUL ou rótulos indefinidos. Paginação e rodapés conferidos.
- Auditoria das dependências de produção retornou zero vulnerabilidades conhecidas na consulta realizada.
- Endereço local e endereço IPv4 de rede responderam HTTP 200. Isso verifica o computador anfitrião; o acesso físico de um celular pela rede depende da mesma rede e das permissões existentes.

## Acesso confirmado durante a entrega

- Local: http://localhost:5173/site-de-Meio-ambiente/
- Rede: http://192.168.1.138:5173/site-de-Meio-ambiente/ (o IP pode mudar)
- Produção local para testes PWA: porta 4173, iniciada e encerrada automaticamente pelos testes.

## Limites externos e decisões

- A referência original exibiu “Entre para acessar”; não houve inspeção das telas internas. A interface segue a especificação visual fornecida.
- O repositório GitHub foi criado privado. A criação do Pages foi recusada pela API com HTTP 422 e a mensagem de plano incompatível. O workflow verifica o projeto e mantém a publicação desabilitada enquanto privado, exceto quando a variável `PAGES_ENABLED=true` sinalizar um plano compatível.
- Não há endereço público confirmado nem QR Code público até concluir a publicação. A configuração e a interface estão preparadas. Autorizar tornar este repositório público permite habilitar Pages no plano atual.
- Os registros são independentes por origem/navegador/dispositivo, sem backend coletivo. Acesso público não muda essa característica.
- Autoria não fornecida permanece não informada e configurável. Não há imagens oficiais, brasões, dados pessoais ou fotos reais. Anexos fotográficos não fazem parte desta versão.

O README contém os comandos, a operação local/LAN, a publicação e atualização no Pages, o backup e o roteiro de apresentação da feira.
