# Validação — versão 0.3.0

Verificado em 16/10/2026 no Windows.

- **17 testes de lógica, imagens, confirmação e PostgreSQL/PGlite aprovados.** Cobrem disponibilidade por assassino, nomes equivalentes, bloqueios manuais, quatro efeitos únicos por receita, requisitos de add-ons, notas das favoritas, catálogo incompleto e as restrições/RLS existentes.
- **6 testes de interface aprovados no Chrome**, com os arquivos de produção. Incluem os fluxos anteriores, seis receitas, busca/filtros, adaptação, salvamento/reabertura do plano, retorno ao recomendador, decodificação real dos retratos/ícones e fallback de imagem ausente.
- Sete telas verificadas em **680 × 520** sem transbordamento horizontal. A página de temas foi revisada visualmente em capturas de 1000 × 720 e 680 × 520.
- **195 WebP verificados** por assinatura, tamanho e SHA-256: 44 retratos e 151 ícones, total de 3.542.254 bytes. Duas entradas usam arte legada equivalente, identificada nos créditos. Nenhum download externo de imagem durante o teste de uso.
- **Executável Windows x64 0.3.0 compilado** com Tauri 2.12.3 e Rust 1.99.0, perfil release, sem instalador. O arquivo em `windows/DBD-Build-Companion.exe` tem 6.673.408 bytes e versão de arquivo 0.3.0. Hash em `RELEASE.json` e `SHA256SUMS.txt`.
- Frontend Vite compilado: JavaScript principal 524,06 kB (108,75 kB gzip), worker 3,98 kB e CSS 24,05 kB. O aviso de chunk principal acima de 500 kB não impediu a compilação; não foi alterado o limite para ocultá-lo.
- Nenhuma migração ou alteração de dados remotos foi necessária. A 0.3 usa a coluna de notas existente nas favoritas; as imagens são incluídas localmente.
- `.env` ignorado e ausente dos arquivos versionados. A configuração incorporada ao executável contém apenas URL e chave publishable do projeto.

## Limites

Os testes de login, confirmação e restauração usam API simulada. Não houve envio de e-mail nem login com conta real nesta atualização. Recebimento de e-mails, SMTP e login real permanecem para conferir no primeiro uso.

Não houve teste interativo do WebView2 nativo nem medição de RAM/CPU com o DBD aberto. A compilação nativa e os testes do frontend no Chrome não substituem essas verificações.

As receitas são variações editoriais com referências, não resultados de partidas medidas. Add-ons não têm inventário próprio nem entram no modelo numérico. Mudanças de patch podem exigir revisão. As traduções pendentes e as duas artes legadas estão documentadas em `docs/PENDENCIAS.md`.

## Histórico da validação 0.2.0

O texto abaixo registra a versão anterior; suas pendências de imagens foram resolvidas conforme descrito acima.

### Registro anterior

Verificado em 15/10/2026.

- 11 testes de lógica, catálogo, confirmação por e-mail e banco PostgreSQL/PGlite aprovados. Cobrem 44 assassinos, 151 nomes, 145 efeitos, três perks por origem, 19 gerais, vínculos de assets, prestígio até P100, precedência de desbloqueios, pares legados, alternativas diversas e equivalência da busca exaustiva em um conjunto pequeno.
- 4 testes de interface aprovados no Chrome com os arquivos compilados. Cobrem coleção vazia no modo visitante, pesquisa PT/EN, filtros, carregamento progressivo, desbloqueios, substituição, criação/edição/reabertura/exclusão de favoritas, persistência após novo login com API simulada, confirmação restrita ao projeto correto e ausência de localStorage/sessionStorage.
- Todas as seis telas verificadas em 680 × 520 sem transbordamento horizontal. Gerador também verificado no tamanho de desenvolvimento. Layout revisado em capturas internas.
- Catálogo aplicado ao Supabase real: 44 assassinos, 151 perks, 21 sinergias editoriais e 195 registros de imagens. Todas as imagens estão em `license_pending`; zero arquivos de imagem publicados.
- Teste SQL remoto em transação revertida confirmou isolamento de usuários, proteção contra troca de proprietário, proteção do catálogo, rejeição de perks repetidas e rejeição de nomes diferentes com efeito equivalente. Consulta posterior confirmou zero coleções e favoritas de teste. As nove tabelas estão com RLS.
- Security Advisor: aviso de proteção contra senhas vazadas desabilitada no Auth. Não foram ativados serviços ou planos pagos. Orientação: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Build de produção do Vite concluído. JavaScript principal aproximadamente 465 kB antes de compressão, worker aproximadamente 4 kB e CSS aproximadamente 21 kB.
- Executável Windows x64 em release compilado com Tauri 2.12.3 e Rust 1.99.0. O tamanho do executável é registrado em `SHA256SUMS.txt` e no pacote.

## Limites

Os testes de interface de login e restauração usam API simulada. O teste remoto confirma o banco e suas políticas, não entrega de e-mails, SMTP ou login real. Nenhum e-mail de teste foi enviado. O ambiente de compilação não resolveu os domínios externos diretamente; o conector acessou o Supabase.

Não houve teste interativo do WebView2 nativo nem medição de RAM/CPU com DBD aberto. Tamanho de bundle ou executável não equivale a consumo de memória. A qualidade competitiva dos pesos não foi validada por partidas reais.

O catálogo tem cobertura de nomes e relações da referência consultada; efeitos são resumos editoriais, sem todos os números por nível. 25 traduções de nomes de perks e os nomes PT de The Shape/The Cenobite ainda não foram confirmados. As imagens reais permanecem pendentes de autorização específica; consulte `docs/PENDENCIAS.md`.
