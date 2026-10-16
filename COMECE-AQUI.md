# Comece aqui — DBD Build Companion 0.3.0

1. Extraia o ZIP inteiro.
2. Abra `windows/DBD-Build-Companion.exe`.
3. Entre ou crie uma conta. Use o e-mail associado à sua organização Supabase enquanto o projeto utilizar o envio padrão de e-mails.
4. Se for solicitado, copie o endereço original do botão de confirmação do e-mail e cole no aplicativo. Se recebeu um código, digite-o. Se já confirmou por fora, volte para Entrar.
5. Em **Minha coleção**, pesquise seus assassinos, abra cada card, marque **Possuo este assassino**, informe o prestígio e salve.
6. Em **Catálogo de perks**, selecione o assassino e confirme as vantagens gerais ou melhorias individuais obtidas na Teia de Sangue e no Santuário.
7. Abra **Gerador de builds**. Escolha o estilo, confira a estratégia, substitua perks se quiser e salve a favorita com nome e notas.

8. Em **Builds temáticas**, escolha Basement Trapper, M1 Nurse, Speedblitz Clown ou outra receita. Confira os add-ons obrigatórios e as perks não confirmadas antes de jogar. Você pode adaptar as quatro perks e salvar o plano nas notas da favorita.

O catálogo inclui 44 assassinos e 151 nomes de perks, com retratos e ícones reais. As imagens são locais e seus créditos ficam em Configurações → Ver imagens e créditos. Duas entradas usam arte do nome legado equivalente, identificada no relatório.

**Explorar catálogo** permite testar tudo sem conta, com coleção vazia. Alterações nesse modo são temporárias. Para salvar entre sessões, entre na conta. A sessão não fica gravada ao fechar: faça login novamente para recuperar seus dados.

O aplicativo já contém a configuração pública do Supabase. Não é necessário executar SQL nem instalar Node ou Rust para usar o executável. Nenhum recurso pago foi contratado.

O login real, a entrega dos e-mails e o recebimento dos seus dados devem ser conferidos no primeiro uso; a versão anterior validou o banco real; nesta atualização, os testes de login e persistência usam API simulada. Detalhes em `VALIDACAO.md`.
