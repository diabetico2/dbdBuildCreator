# Pendências da versão 0.2.0

## Retratos e ícones

Os 44 retratos e os 151 ícones possuem registros individuais, identificadores e URLs de origem em `dbc_assets` e `src/catalog-data.json`. Nenhuma imagem foi incorporada ao executável nem publicada no Supabase Storage nesta entrega.

A política da Behaviour sobre conteúdo de fãs contém uma restrição específica a jogos, aplicativos e experiências interativas derivados de seus jogos. A autorização genérica para conteúdo não comercial não resolve o uso de imagens neste aplicativo. Conteúdo de franquias externas também depende dos respectivos titulares. Por isso todos os assets estão em `license_pending`, inclusive os personagens originais da BHVR. Isso não é uma declaração de aprovação oficial do aplicativo.

Referências consultadas em 15/10/2026:

- https://www.bhvr.com/fan-created-content/ — seção Games and applications e conteúdo de terceiros.
- https://www.bhvr.com/terms-of-use/ — seção V.E.

**Próximo passo necessário:** obter confirmação específica do escopo autorizado com a titular dos direitos. A autorização do usuário para desenvolver o programa não substitui a autorização de direitos autorais de terceiros. Não foi enviada nenhuma mensagem à BHVR.

Com autorização documentada, um administrador poderá publicar os arquivos correspondentes no bucket `dbc-assets`, nas pastas `killers/` e `perks/`, registrar a prova de autorização, preencher `storage_path` e mudar `status` para `ready`. O cliente já suporta PNG, WebP e JPG, carregamento sob demanda, cache em memória limitado e detecção de falhas. Não conceder permissão de upload do catálogo a usuários comuns. Não extrair arquivos da instalação do jogo.

`node scripts/check-assets.mjs` verifica os arquivos marcados como publicados e gera `docs/assets-check.json`. `--sources` também testa os links de origem com HEAD; não confirma direitos de uso e não copia imagens. O ambiente desta entrega não resolveu os domínios externos pelo runtime, portanto os links das imagens não foram validados por HTTP. O relatório não confunde ausência de verificação com link funcionando.

## Traduções e efeitos

O catálogo contém 44 assassinos, 151 nomes de perks e 145 efeitos distintos. Seis pares de nomes legados e atuais representam o mesmo efeito e não podem ser equipados juntos. São 132 entradas ligadas a assassinos e 19 gerais; isso não significa 151 efeitos diferentes.

25 nomes de perks ainda não tiveram tradução oficial PT-BR confirmada e aparecem em inglês. A relação está em `catalog-audit.json`. Os nomes de The Shape e The Cenobite também permanecem em inglês. As explicações e a interface são em português. Não inventamos traduções oficiais.

Os efeitos são resumos funcionais editoriais, sem todos os números por nível. Os pesos não foram calibrados por dados de partidas nem asseguram o melhor resultado competitivo. A cobertura do catálogo foi comparada com as referências capturadas em 15/10/2026; alterações posteriores exigem revisão.

## Testes e autenticação

O banco real foi validado com usuários sintéticos dentro de uma transação revertida. O fluxo completo de interface e a restauração de dados após novo login foram exercitados com API simulada. Não foi enviado e-mail de teste e não houve login com uma conta real nesta execução.

O envio padrão de e-mail do Supabase pode atender somente membros da organização e possui limites. Para outros destinatários, configure SMTP conforme a documentação. A verificação de senhas vazadas está desabilitada no projeto; não foi ativado plano pago para habilitar recursos. Referência: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Não houve medição de RAM/CPU do executável com DBD aberto nem validação interativa do WebView2 nativo. Os testes visuais e funcionais usam Chromium com os mesmos arquivos de produção.
