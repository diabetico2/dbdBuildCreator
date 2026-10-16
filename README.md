# DBD Build Companion — 0.2.0

Aplicativo desktop pessoal para Windows x64, em Tauri 2, JavaScript e CSS, conectado ao projeto **DBD Build Companion** no Supabase. A entrega aproveita a arquitetura anterior e amplia o catálogo e os fluxos funcionais.

## Abrir

Este repositório contém o código-fonte da versão 0.2.0. Para executar a partir do Git, siga **Executar o código-fonte** abaixo. As instruções do executável se aplicam ao pacote Windows entregue separadamente.

Extraia o ZIP inteiro e abra **windows/DBD-Build-Companion.exe**. Não é necessário instalar Node.js ou Rust para usar o executável. Ele depende do Microsoft Edge WebView2 Runtime. O executável pessoal não possui assinatura digital.

Entre ou crie sua conta para salvar os dados. A sessão termina ao fechar o aplicativo. **Explorar catálogo** abre um modo visitante com coleção vazia: você pode experimentar os controles, mas as alterações desaparecem ao sair.

Para confirmar a conta, copie o endereço original do botão recebido por e-mail e cole no aplicativo, ou digite o código quando o template enviar um. Não abra o link antes de copiá-lo, pois o token é de uso único. Consulte `COMECE-AQUI.md`.

## O que funciona

- Início com totais reais da sua coleção, último assassino consultado e favoritas.
- Coleção com 44 assassinos, pesquisa PT/EN, filtros e prestígios de P0 a P100.
- Catálogo pesquisável com 151 nomes de perks e 145 efeitos distintos. Cada assassino possui três relações de perks; 19 entradas são gerais. Seis pares de nomes legados representam o mesmo efeito.
- Gerador com quatro efeitos únicos, três sugestões quando há diversidade suficiente e opção padrão de usar somente perks confirmadas.
- Substituição de uma perk com pesquisa, categoria e classificação pela pontuação da combinação completa.
- Detalhes, motivos, sinergias e limitações das builds.
- Favoritos com nome, notas, data, versão do catálogo, reabertura, edição das perks e exclusão.
- Menu recolhível, janela inicial de 1200 × 760 e layout compacto até 680 × 520.
- Persistência de coleção, níveis, ajustes e favoritos no Supabase, com RLS por proprietário.

## Pendência das imagens

**Esta versão não inclui os retratos nem os ícones reais.** Os 195 assets possuem registros individuais e origem catalogada, mas todos estão marcados como `license_pending`. A política da BHVR não concede autorização geral para incorporar conteúdo em aplicativos; a licença de conteúdo de fãs não foi tratada como autorização automática. Conteúdo de franquias externas também exige análise dos respectivos direitos.

O cliente está preparado para carregar imagens autorizadas do Supabase Storage sob demanda, manter cache limitado em memória e registrar falhas. Os espaços indicam a pendência explicitamente; não usam imagens genéricas como se fossem os retratos ou ícones corretos. Consulte **docs/PENDENCIAS.md** e o relatório em Configurações.

25 nomes de perks ainda aparecem em inglês por não haver tradução oficial confirmada no levantamento; The Shape e The Cenobite também permanecem em inglês. Os textos explicativos e a interface estão em português.

## Disponibilidade

P0 permite as perks pessoais no próprio assassino, inicialmente no nível I. P1, P2 e P3 compartilham os níveis I, II e III. Prestígios superiores não aumentam o nível das perks além de III.

O registro individual de uma perk para o assassino selecionado tem precedência: Automático, Indisponível ou nível I/II/III. Perks gerais não são presumidas desbloqueadas; confirme as obtidas na Teia de Sangue ou no Santuário. Com menos de quatro efeitos disponíveis, o app informa o que falta.

Desativar “Usar apenas perks disponíveis” permite planejar uma build futura; as perks não confirmadas ficam sinalizadas e usam nível III apenas como estimativa de pontuação. O aplicativo não desbloqueia nem equipa nada no jogo.

## Recomendador

A pontuação soma força editorial por nível, compatibilidade com características do assassino, preferência de estilo, sinergias, diversidade funcional e penalidade por redundância. Os pesos são ajustáveis de 0 a 5. Não há estatística de vitória nem promessa de build competitiva ótima.

A primeira sugestão maximiza a pontuação no conjunto avaliado. A segunda usa estilo equilibrado e a terceira outro estilo; cada alternativa deve trocar pelo menos duas perks em relação às anteriores. Com poucas candidatas, podem ser retornadas menos de três sugestões. As notas de estilos distintos não devem ser interpretadas como uma classificação global entre eles.

Até 48 candidatas, a enumeração é exaustiva. Acima disso, cada estilo usa as 48 melhores candidatas pela pontuação individual: o resultado é aproximado e pode perder sinergias fora desse recorte. “Gerar nova combinação” alterna uma preferência secundária para sugerir variações, mantendo a pontuação original visível.

O cálculo roda em Web Worker, encerrado após o resultado; até 24 respostas ficam em memória. Não há cálculo contínuo, Realtime ou consultas periódicas. O worker de produção tem cerca de 4 kB, sem duplicar o catálogo estático.

## Dados e segurança

As nove tabelas usam RLS. Clientes autenticados leem o catálogo e os assets; apenas administradores os modificam. Coleção, desbloqueios, preferências e favoritos são privados por `user_id`. Restrições impedem referências inexistentes, prestígio inválido e quatro perks que repitam o mesmo efeito.

O repositório inclui apenas `.env.example`, com valores de exemplo. O arquivo `.env` local não é versionado e deve conter somente URL e chave **publishable**; nunca use uma chave secreta ou `service_role` no cliente. Auth usa `persistSession:false` e `detectSessionInUrl:false`; consultas usam `cache:'no-store'`. A janela é privada. O app não grava perfis em localStorage, sessionStorage, IndexedDB, SQLite ou arquivos locais.

O app não lê memória, processos, partidas ou arquivos do DBD e não implementa overlay, automação ou exportação de builds para o jogo. Sua independência técnica não equivale a aprovação oficial da BHVR.

## Executar o código-fonte

Com Node 22.12 ou posterior, clone o repositório e prepare a configuração:

```powershell
git clone https://github.com/diabetico2/dbdBuildCreator.git
cd dbdBuildCreator
Copy-Item .env.example .env
```

Edite `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` com a URL e a chave pública do seu projeto Supabase. Depois execute:

```powershell
npm.cmd ci
npm.cmd run dev
```

Acesse http://127.0.0.1:1420. Se mudar `.env`, reinicie o desenvolvimento ou compile novamente. Os testes de interface usam Microsoft Edge instalado e a configuração pública desse arquivo; o teste de persistência simula as respostas da API.

```powershell
npm.cmd test
npm.cmd run test:ui
npm.cmd run build
npm.cmd run tauri -- build --no-bundle
```

A compilação nativa exige Rust, Microsoft C++ Build Tools, Windows SDK e WebView2. `tauri build --no-bundle` gera o executável direto; o comando sem essa opção tenta gerar o instalador NSIS. Esta entrega inclui o executável, sem instalador.

## Atualizar o catálogo

O projeto Supabase atual já foi atualizado. Não execute novamente os scripts de criação nele.

Para um banco novo, execute `supabase/schema.sql`, depois `supabase/upgrade-v2.sql` e finalmente `supabase/seed.sql`, nessa ordem. Configure a URL e chave pública antes de compilar.

A fonte editorial completa está em `src/catalog-data.json`. `npm.cmd run db:seed` gera SQL de atualização dos dados editoriais e não altera coleções ou favoritas. Revise o SQL antes de aplicá-lo como administrador. Dados extras do catálogo ficam em `metadata`; `cloud.js` reconstrói o mesmo formato usado pelo gerador.

O importador `scripts/build-catalog.mjs DIRETORIO` espera `official-characters.json`, `wiki-perks.json` e `wiki-roster.json` coletados de fontes atuais. Os arquivos brutos de terceiros não são distribuídos. O script valida a correspondência de origens e não fixa a quantidade de personagens; novos personagens também precisam de revisão editorial. `scripts/legacy-catalog.mjs` preserva IDs históricos para não quebrar favoritos.

`node scripts/check-assets.mjs` gera o relatório dos assets publicados; `--sources` também verifica os links de origem. A verificação HTTP não é autorização de uso.

## Referências do catálogo

- https://deadbydaylight.com/pt-br/jogo/personagens/
- https://deadbydaylight.wiki.gg/wiki/Killer
- https://deadbydaylight.wiki.gg/wiki/Perks
- https://docs.nightlight.gg/icon-packs/resources/icon-changelog

Os registros individuais mantêm URLs de referência. Consulte `VALIDACAO.md` para os testes executados e seus limites.
