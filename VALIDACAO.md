# Validação — versão 0.4.0

Verificado em 16/10/2026, a partir do commit-base `a9a03a1` (correção dos retratos).

- **22 testes de lógica/banco aprovados**: catálogo, recomendação, regras de propriedade, P0–P100, lotes, manutenção dos níveis, parâmetros PostgREST, RLS entre usuários, cascata e rollback de lote inválido em PostgreSQL/PGlite local.
- **13 testes de interface aprovados sobre build de produção**: coleção/perks em massa, checkboxes, filtros, seleção de páginas não exibidas, tratamento de falha de gravação, níveis separados por killer, edição individual, favoritas, imagens e layout de 680 × 520.
- **Sessão**: API simulada com SDK real, restauração após reiniciar o processo Edge com perfil persistente, refresh de token vencido, refresh revogado, logout, falha de logout remoto com remoção local e recuperação após erro de leitura. Nenhuma senha persistida pelo app.
- **195 imagens locais** verificadas por hash (44 retratos e 151 ícones), zero arquivos quebrados, 3.542.254 bytes. Teste de navegador decodifica todas as imagens do build.
- **Build Vite aprovado**, com aviso de tamanho do JavaScript principal acima de 500 kB. Conferência de versões npm/Cargo/Tauri aprovada.
- **CSP preservada**: scripts locais, sem unsafe-inline/unsafe-eval em produção e sem novas permissões Tauri.
- **Compilação Tauri local indisponível**: Cargo/Rust não instalado. O workflow Windows gera um instalador novo do commit e cria rascunho de release; o resultado deve ser conferido no Actions.

## Limites

Não houve autenticação em uma conta real nem teste interativo do aplicativo Tauri/WebView2 instalado. Persistência entre processos Edge é evidência do funcionamento do armazenamento web e do SDK, não certificação do instalador. Siga o roteiro de fechamento/reabertura e expiração em [docs/RELEASE-0.4.0.md](docs/RELEASE-0.4.0.md).

Não foram executadas migrações, alterações de configurações ou gravações de teste no Supabase remoto. Nenhum e-mail foi enviado ou serviço pago contratado. Não houve medição de desempenho com DBD aberto nem validação competitiva por partidas reais.

O executável versionado em `windows/`, `RELEASE.json` e `SHA256SUMS.txt` ainda correspondem à versão histórica 0.3.0. Não são artefatos da versão 0.4.0.

## Reproduzir

```powershell
npm ci
npm test
node scripts/check-release.mjs
node scripts/check-assets.mjs
$env:VITE_SUPABASE_URL='https://dbc-test.supabase.co'
$env:VITE_SUPABASE_PUBLISHABLE_KEY='sb_publishable_test_fixture'
npm run build
$env:DBC_STATIC_TEST='1'
npm run test:ui
```

Os testes usam Edge instalado, perfis temporários exclusivos e endpoints interceptados. Para compilar o aplicativo de uso, utilize as variáveis públicas reais do Supabase e a toolchain Rust/C++/Windows SDK, ou o workflow de release. Não distribua um build com as variáveis fictícias de teste.
