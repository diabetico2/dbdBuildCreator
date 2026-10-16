# Pendências e limites da versão 0.3.0

## Imagens

As 195 imagens reais agora estão incluídas no aplicativo. Fontes, créditos, transformações e hashes estão em `IMAGENS.md` e `src/asset-manifest.json`.

Duas artes atuais ainda não foram confirmadas: No Holds Barred e Scourge Hook: Weeping Wounds. Elas usam os ícones reais dos efeitos legados equivalentes (Deadlock e Gift of Pain), explicitamente identificados.

## Builds temáticas

As seis receitas são variações editoriais dos arquétipos citados, com referências e revisão em 15/10/2026. Add-ons não têm inventário próprio: o usuário precisa conferir os requisitos no jogo. O modelo de pontuação não calcula efeitos de add-ons. Não houve avaliação competitiva em partidas reais.

## Traduções e efeitos

O catálogo contém 44 assassinos, 151 nomes de perks e 145 efeitos distintos. Seis pares de nomes legados e atuais representam o mesmo efeito e não podem ser equipados juntos. São 132 entradas ligadas a assassinos e 19 gerais; isso não significa 151 efeitos diferentes.

25 nomes de perks ainda não tiveram tradução oficial PT-BR confirmada e aparecem em inglês. A relação está em `catalog-audit.json`. Os nomes de The Shape e The Cenobite também permanecem em inglês. As explicações e a interface são em português. Não inventamos traduções oficiais.

Os efeitos são resumos funcionais editoriais, sem todos os números por nível. Os pesos não foram calibrados por dados de partidas nem asseguram o melhor resultado competitivo. A cobertura do catálogo foi comparada com as referências capturadas em 15/10/2026; alterações posteriores exigem revisão.

## Testes e autenticação

Na versão 0.2, o banco real foi validado com usuários sintéticos dentro de uma transação revertida. A 0.3 não altera o schema nem os dados do catálogo remoto. O fluxo completo de interface e a restauração de dados após novo login foram exercitados com API simulada. Não foi enviado e-mail de teste e não houve login com uma conta real nesta execução.

O envio padrão de e-mail do Supabase pode atender somente membros da organização e possui limites. Para outros destinatários, configure SMTP conforme a documentação. A verificação de senhas vazadas está desabilitada no projeto; não foi ativado plano pago para habilitar recursos. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Não houve medição de RAM/CPU do executável com DBD aberto nem validação interativa do WebView2 nativo. Os testes visuais e funcionais usam Chromium com os mesmos arquivos de produção.
