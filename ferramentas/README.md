# Ferramentas

## exportar-pecas.mjs
Exporta artboards do canvas "ReparoFit · Instagram" (.dc.html) para PNG com as fontes da marca (Archivo e JetBrains Mono, em `fontes/`, licença OFL).

    node ferramentas/exportar-pecas.mjs semana-3/png <arquivos.dc.html...>

- Tamanho lido do `$preview` de cada arquivo (feed 1080×1350, story 1080×1920).
- Peças em markup estático (sem `{{holes}}`). Imagens: arquivos do repositório por URL pública (raw.githubusercontent.com), não `/_blob/`.
- `--mapa mapa.json` troca uploads do canvas (`/_blob/<id>`) por arquivos do repositório: `{"/_blob/<id>": "cenas/x.png"}`.
- Sai com código 2 se alguma fonte não carregar.
