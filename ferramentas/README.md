# Ferramentas

## exportar-pecas.mjs
Exporta artboards do canvas "ReparoFit · Instagram" (.dc.html) para PNG com as fontes da marca (Archivo e JetBrains Mono, em `fontes/`, licença OFL).

    node ferramentas/exportar-pecas.mjs semana-3/png <arquivos.dc.html...>

- Tamanho lido do `$preview` de cada arquivo (feed 1080×1350, story 1080×1920) e exportado em escala 4/3: **feed 1440×1800, story 1440×2560** (o Instagram exibe até 1440 px; em 1080 o texto chegava mais mole que no canvas). `--escala 1` volta para 1080; `--escala 2` gera 2160 px.
- Peças em markup estático (sem `{{holes}}`). Imagens: arquivos do repositório por URL pública (raw.githubusercontent.com), não `/_blob/`.
- `--mapa mapa.json` troca uploads do canvas (`/_blob/<id>`) por arquivos do repositório: `{"/_blob/<id>": "cenas/x.png"}`.
- Sai com código 2 se alguma fonte não carregar.
