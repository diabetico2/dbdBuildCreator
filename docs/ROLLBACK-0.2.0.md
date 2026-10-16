# Recuperação da publicação acidental de 0.2.0

O commit `120e060dca5b3f7c3ebcce8273f5d889b9932d4a` substituiu o carregador de imagens locais pelo carregador antigo dependente de Storage e reduziu a versão para 0.2.0. Os 195 WebP continuavam presentes, mas a interface deixou de usá-los. Também desapareceu a integração das receitas temáticas.

Esta correção restaura de `fa8cb98` o carregador, a interface com receitas e créditos, os estilos, o verificador de assets e os testes visuais. Mantém os demais arquivos do commit, incluindo alterações de formatação, catálogo e serviços. Nenhum histórico ou tag é reescrito.

- A publicação v0.2.0 foi convertida em rascunho recuperável.
- A release e o instalador v0.3.0 devem permanecer intactos.
- O próximo instalador usa 0.3.1 e o workflow o prepara como rascunho para revisão.
- O executável avulso em `windows/` foi restaurado à versão 0.3.0 conhecida, com SHA-256 `9670a1139ec6428d15dd3abbb125ee2f36abc700d5d82c988fefb97df6f7e9e3`. `RELEASE.json` descreve esse executável avulso, não o novo instalador do Actions.

Validação: 17 testes de lógica/banco, 7 testes de interface sobre o build de produção, 195 imagens verificadas por hash e decodificadas no navegador (44 retratos e 151 ícones), nenhuma imagem quebrada. Os testes de autenticação usam configuração fictícia e APIs simuladas. O instalador Windows ainda deve ser gerado pelo Actions e revisado antes de publicar o rascunho.
