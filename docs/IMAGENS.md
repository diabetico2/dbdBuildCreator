# Imagens do catálogo — 0.3.0

O aplicativo inclui 44 retratos e 151 ícones reais, em WebP transparente. Os arquivos ficam em `public/catalog/` e são incorporados à distribuição. Não há hotlink para a wiki durante o uso, nem leitura da instalação do DBD.

## Origem e créditos

Arte de Dead by Daylight: Behaviour Interactive e respectivos licenciantes das franquias. Aplicativo pessoal independente, sem afiliação ou aprovação oficial. A disponibilidade de uma imagem em uma wiki ou repositório não significa licença livre; os créditos registram a procedência e não concedem direitos adicionais.

- Repositório público `Zawgalicious/DBDImages`, revisão `931465172edf01c5277f0ffbc3e32f0ddeadecad`: retratos e ícones com correspondência por personagem/perk.
- Site oficial de Dead by Daylight: retratos e seis ícones de The Judgment e The Slasher.
- `DanteASC4/dbd-assets`, revisão fixada no manifesto: arte genérica de Keep Them Waiting.
- As referências originais da wiki e do site oficial continuam em `src/catalog-data.json` e no campo `catalog_source_url` do manifesto.

`src/asset-manifest.json` documenta cada arquivo: URL exata de origem, transformação, dimensões, bytes e SHA-256. `src/asset-index.json` é o índice compacto usado pelo aplicativo. Configurações → **Ver imagens e créditos** mostra a origem por imagem.

## Duas artes legadas identificadas

| Nome atual | Arte do efeito equivalente |
| --- | --- |
| No Holds Barred | Deadlock |
| Scourge Hook: Weeping Wounds | Scourge Hook: Gift of Pain |

Essas entradas usam a marca `legacy_equivalent`, visível no tooltip e nos créditos. Não são apresentadas como a arte atual confirmada. Os nomes e as regras de disponibilidade continuam seguindo o catálogo, sem duplicar efeitos na build.

## Manutenção

`node scripts/check-assets.mjs` verifica formato, tamanho e hash e atualiza `docs/assets-check.json`. A opção `--sources` também consulta os links, sem modificar imagens. Falha HTTP e autorização de uso são assuntos distintos.

Para restaurar arquivos ausentes a partir das fontes fixadas, instale `Pillow==12.3.0` num ambiente Python e execute `python scripts/sync-assets.py`. O script interrompe se o hash da conversão mudar. As imagens já estão incluídas no Git; Python não é necessário para executar ou compilar o app.

O cliente dá prioridade ao índice local mesmo quando o banco ainda contém os registros históricos `license_pending`. Isso não altera status de licenciamento no banco. As imagens usam carregamento sob demanda, cache limitado em memória e fallback em caso de falha.
