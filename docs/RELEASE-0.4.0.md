# DBD Build Companion 0.4.0

## Alterações

- Seleção por checkbox de killers e perks, selecionar todos os resultados filtrados, limpar seleção e feedback de gravação. As alterações são enviadas em um comando em lote por ação, sob as políticas RLS existentes. Os controles ficam bloqueados enquanto a gravação está em andamento; falhas preservam seleção e estado anterior para sincronizar/tentar novamente.
- Killers novos entram em P0. Os já adquiridos mantêm seu prestígio, inclusive com conflito de inserção no servidor. A edição individual continua disponível.
- Perks permanecem separadas da propriedade dos killers, por `(user_id, killer_id, perk_id)`. Marcar exige um killer adquirido, aplica nível mínimo I/II/III e preserva níveis superiores disponíveis. Desmarcar grava nível 0; Automático remove a exceção manual para recuperar as regras de prestígio. Nomes legados mantêm as regras existentes de equivalência de efeitos do recomendador.
- Remover killers continua usando o modelo atual de cascata: apaga desbloqueios manuais e favoritas vinculados. Há confirmação com nomes e contagens antes da remoção; não se altera o esquema remoto.
- Janela Tauri com `incognito:false`; Supabase com armazenamento persistente explícito, restauração por `getSession`, renovação automática e resposta a expiração/logout. Falha de leitura do catálogo não destrói uma sessão válida. Falha de revogação remota no logout informa a limitação depois de remover a sessão local, conforme o SDK 2.117.3.
- As 195 imagens locais da correção anterior foram preservadas. Nenhuma substituição do carregador de imagens.

## Armazenamento e privacidade

Usamos o localStorage do perfil WebView2 isolado pelo identificador `com.dbdcompanion.desktop` e pela origem do aplicativo. O perfil é persistente por usuário do Windows e não muda com a versão do instalador. A versão de desenvolvimento em localhost usa outro armazenamento. Uma sessão de uma versão anterior em modo anônimo não pode ser recuperada: é necessário entrar uma vez após a atualização.

Somente a sessão retornada pelo Supabase Auth é persistida: access token, refresh token e identidade da conta. Senha, coleção e favoritas não são gravadas em arquivos próprios. O SDK controla expiração, rotação e renovação dos tokens; não há timer de renovação paralelo. O modo visitante mantém as alterações apenas em memória.

O localStorage **não é um cofre criptografado**: processos com acesso ao perfil do usuário ou JavaScript comprometido na origem poderiam ler a sessão. O projeto mantém a CSP restritiva, não aceita scripts externos e não ganhou acesso ao sistema de arquivos nem permissões IPC. Utilize uma conta Windows protegida e saia da conta em um dispositivo compartilhado. Não há chave `service_role`, chave secreta ou credencial embutida; apenas configuração pública já usada pelo projeto.

Referências: [armazenamento de sessões do Supabase](https://supabase.com/docs/guides/auth/sessions), [renovação automática](https://supabase.com/docs/reference/javascript/auth-startautorefresh), [configuração de janela do Tauri](https://v2.tauri.app/reference/config/#windowconfig).

## Teste manual no Windows

1. Instale o **0.4.0** gerado deste código. Não use `windows/DBD-Build-Companion.exe`, que continua sendo 0.3.0.
2. Entre na conta existente. Em Minha coleção, use Selecionar vários, marque alguns killers e aplique Marcar como adquirido. Confira que os já adquiridos mantiveram seus prestígios.
3. Filtre a lista, use Selecionar todos e confira a quantidade; Limpar seleção deve zerar a contagem. Teste a edição individual de um prestígio.
4. Em Catálogo de perks, escolha um killer adquirido, selecione perks e marque no nível desejado. Troque de killer e confirme que os registros manuais não se propagaram. Confira Desmarcar e Voltar ao automático.
5. Feche **todas** as janelas do aplicativo e reabra. A conta e os dados devem ser restaurados sem senha. Repita após o access token expirar, para conferir a renovação real.
6. Desconecte a internet e reabra: a falha de carregamento deve permitir tentar novamente sem descartar uma sessão válida. Reconecte e use Tentar novamente.
7. Use Sair da conta, feche e reabra: deve aparecer a tela de entrada. Confira também uma sessão revogada/expirada, usando uma conta de teste apropriada.
8. Confira retratos e ícones em Minha coleção, Catálogo de perks e Builds temáticas.

## Validação automatizada e limites

Os testes usam PostgreSQL/PGlite local e respostas Supabase simuladas, sem escrever no Supabase remoto. Há cobertura de requisições em lote, RLS/cascata/atomicidade, seleção filtrada e paginada, falhas de gravação, níveis por killer, logout, refresh revogado, erro de hidratação e persistência entre processos Edge com perfil de teste.

O teste Edge usa o mesmo tipo de armazenamento web, mas **não substitui a validação do executável Tauri/WebView2 instalado nem de uma conta real**. Credenciais do usuário não foram solicitadas ou usadas. E-mail/SMTP e login real continuam exigindo o roteiro acima.

O ambiente local não tem Cargo/Rust. A compilação nativa e o instalador são responsabilidade do workflow Windows. `npm run build` pode emitir aviso de bundle acima de 500 kB; isso não impede a compilação. Veja `VALIDACAO.md` para os resultados registrados.

## Publicação

As versões de package.json, lockfiles, Cargo e Tauri são 0.4.0. O workflow verifica sua consistência, exige as variáveis públicas reais do Supabase e impede reutilizar uma release/rascunho existente com a mesma versão. A tag deve coincidir com a versão. O instalador é compilado do SHA do workflow e a release é criada como **rascunho**.

`RELEASE.json`, `SHA256SUMS.txt` e o executável em `windows/` descrevem o binário histórico 0.3.0 e não foram reetiquetados. Não reutilize esses arquivos como instalador 0.4.0. Releases e tags anteriores permanecem intactas. Nenhuma migração, mudança destrutiva de dados ou contratação de serviço foi realizada.
