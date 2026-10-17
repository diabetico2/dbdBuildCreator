# Comece aqui — DBD Build Companion 0.4.0

1. Use o instalador **DBD Build Companion_0.4.0_x64-setup.exe** da nova release. O executável em `windows/` continua sendo 0.3.0 e não inclui estas melhorias.
2. Entre na sua conta. Depois disso, pode fechar e reabrir o aplicativo sem digitar a senha novamente. Use **Configurações → Sair da conta** para remover o acesso deste dispositivo.
3. Em **Minha coleção → Selecionar vários**, marque os killers, use **Selecionar todos** ou **Limpar seleção** e clique em **Marcar como adquirido**. Os novos entram em P0; os anteriores preservam o prestígio. Clique no card para editar individualmente.
4. Em **Catálogo de perks**, escolha um killer adquirido e use **Selecionar vários**. Escolha o nível mínimo e marque as perks adquiridas. A alteração vale somente para esse killer; níveis superiores são preservados.
5. **Desmarcar** uma perk a torna indisponível. **Voltar ao automático** recupera as regras de prestígio. Desmarcar killers pede confirmação porque remove seus desbloqueios manuais e favoritos.
6. **Selecionar todos** inclui os resultados filtrados ainda não exibidos. Mudar busca, filtros, página ou killer limpa a seleção.
7. Abra o gerador ou as builds temáticas para montar a combinação e salvar favoritas.

Os 44 retratos e 151 ícones locais estão incluídos. Créditos em Configurações → Ver imagens e créditos.

**Explorar catálogo** continua sem conta e com alterações temporárias. A atualização não recupera uma sessão antiga que foi aberta em modo anônimo: entre uma vez na nova versão.

Para confirmar e-mail, copie o link original do botão de confirmação ou digite o código no aplicativo. Não é necessário executar SQL no Supabase existente. O instalador incorpora somente sua configuração pública do Supabase; não exige Node.js ou Rust no computador de uso.

Os testes automatizados de autenticação usam API simulada. Confira o roteiro de login real no Windows em [docs/RELEASE-0.4.0.md](docs/RELEASE-0.4.0.md).
