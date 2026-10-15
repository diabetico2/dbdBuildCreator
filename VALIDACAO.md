# Validação — versão 0.2.0

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
