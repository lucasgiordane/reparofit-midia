// Exporta artboards do canvas (.dc.html) para PNG, com as fontes da marca embutidas.
// Uso: node ferramentas/exportar-pecas.mjs <pasta-de-saida> <arquivo1.dc.html> [arquivo2.dc.html ...]
// Tamanho: lido do "$preview" (data-props) de cada arquivo; padrão 1080x1350.
// As peças devem ser markup estático (sem {{holes}}); imagens /_blob/... não são resolvidas aqui
// (use URLs públicas ou arquivos do repositório nas peças que vão para o Metricool).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
// Procura o Playwright local, depois os globais (/opt/npm-tools, npm root -g).
function carregarPlaywright() {
  const bases = [aqui + '/', '/opt/npm-tools/'];
  try { bases.push(execSync('npm root -g').toString().trim() + '/../'); } catch {}
  for (const b of bases) { try { return createRequire(b)('playwright'); } catch {} }
  throw new Error('Playwright não encontrado (npm i -g playwright)');
}
const { chromium } = carregarPlaywright();
const fontes = path.join(aqui, 'fontes');
const ff = (f) => 'file://' + path.join(fontes, f);
const fontCss = `
@font-face{font-family:'Archivo';src:url('${ff('archivo-latin-wdth-normal.woff2')}') format('woff2');font-weight:100 900;font-stretch:62% 125%;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Archivo';src:url('${ff('archivo-latin-ext-wdth-normal.woff2')}') format('woff2');font-weight:100 900;font-stretch:62% 125%;unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}
@font-face{font-family:'JetBrains Mono';src:url('${ff('jetbrains-mono-latin-400-normal.woff2')}') format('woff2');font-weight:400}
@font-face{font-family:'JetBrains Mono';src:url('${ff('jetbrains-mono-latin-500-normal.woff2')}') format('woff2');font-weight:500}
@font-face{font-family:'JetBrains Mono';src:url('${ff('jetbrains-mono-latin-700-normal.woff2')}') format('woff2');font-weight:700}
body{margin:0}`;

let args = process.argv.slice(2);
// --mapa <json>: {"/_blob/<id>": "caminho/no/repositorio.png"} para trocar uploads do canvas por arquivos locais.
let mapa = {};
const im = args.indexOf('--mapa');
if (im >= 0) { mapa = JSON.parse(fs.readFileSync(args[im + 1], 'utf8')); args.splice(im, 2); }
const raiz = path.resolve(aqui, '..');
const [saida, ...arquivos] = args;
if (!saida || arquivos.length === 0) { console.error('uso: node exportar-pecas.mjs <saida> <arquivos.dc.html...>'); process.exit(1); }
fs.mkdirSync(saida, { recursive: true });

const browser = await chromium.launch();
let falhas = 0;
for (const arq of arquivos) {
  let html = fs.readFileSync(arq, 'utf8');
  let w = 1080, h = 1350;
  const m = html.match(/data-props='([^']*)'/);
  if (m) { try { const p = JSON.parse(m[1]); if (p.$preview) { w = p.$preview.width; h = p.$preview.height; } } catch {} }
  for (const [blob, local] of Object.entries(mapa)) html = html.split(blob).join('file://' + path.resolve(raiz, local));
  const semMapa = html.match(/\/_blob\/[A-Za-z0-9_-]+/g);
  if (semMapa) { console.warn(`aviso: ${arq} usa ${[...new Set(semMapa)].join(', ')} sem entrada no --mapa`); falhas++; }
  if (/\{\{[^}]+\}\}/.test(html)) console.warn(`aviso: ${arq} tem {{holes}}; o PNG mostrará o texto cru`);
  html = html
    .replace(/<script src="\.\/support\.js"><\/script>/, '')
    .replace(/<link[^>]+fonts\.googleapis\.com[^>]*>/g, '')
    .replace(/<link[^>]+fonts\.gstatic\.com[^>]*>/g, '')
    .replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/, '')
    .replace('</head>', `<style>${fontCss}</style></head>`);
  const tmp = path.join(path.dirname(path.resolve(arq)), `.render-${path.basename(arq)}.html`);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto('file://' + tmp, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const ok = await page.evaluate(() => document.fonts.check("800 40px 'Archivo'") && document.fonts.check("400 20px 'JetBrains Mono'"));
  if (!ok) { console.warn(`aviso: fontes não carregaram em ${arq}`); falhas++; }
  const nome = path.basename(arq).replace(/\.dc\.html$/, '.png');
  await page.screenshot({ path: path.join(saida, nome), clip: { x: 0, y: 0, width: w, height: h } });
  await page.close();
  fs.unlinkSync(tmp);
  console.log(`ok ${nome} ${w}x${h}`);
}
await browser.close();
process.exit(falhas ? 2 : 0);
