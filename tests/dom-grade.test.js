'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const ESTILO = fs.readFileSync(require('path').join(__dirname, '..', 'css', 'estilo.css'), 'utf8');
const APP = fs.readFileSync(require('path').join(__dirname, '..', 'js', 'app.js'), 'utf8');

test('editar célula não escurece a coluna de resultados; ajuda de n não cita 2 a 800', () => {
  const regra = (ESTILO.match(/\.resultado-desatualizado\s*\{[^}]*\}/) || [''])[0];
  assert.doesNotMatch(regra, /opacity|filter/);
  assert.doesNotMatch(APP, /n inteiro de/);
  assert.match(APP, /Até n = ' \+ GE\.MAX_GRADE \+ ' a grade é editável/);
});

function get(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

test('DOM: reduzir n pede confirmação e o resumo de erros foca a célula', { timeout: 60000 }, async () => {
  const port = 9400 + Math.floor(Math.random() * 500);
  const perfil = '/tmp/chrome-dom-' + port;
  fs.rmSync(perfil, { recursive: true, force: true });
  const chrome = spawn('google-chrome', [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage',
    '--remote-debugging-port=' + port, '--user-data-dir=' + perfil, 'about:blank',
  ], { stdio: 'ignore' });
  let ws;
  try {
    let version = '';
    for (let i = 0; i < 40 && !version; i++) {
      try { version = await get('http://127.0.0.1:' + port + '/json/version'); }
      catch (e) { await sleep(100); }
    }
    assert.ok(version, 'Chrome não abriu o depurador');
    const lista = JSON.parse(await get('http://127.0.0.1:' + port + '/json/list'));
    const pagina = lista.find((t) => t.type === 'page');
    ws = new WebSocket(pagina.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve);
      ws.addEventListener('error', reject);
    });
    let seq = 0;
    const pend = new Map();
    const eventos = [];
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pend.has(msg.id)) { pend.get(msg.id)(msg); pend.delete(msg.id); }
      else if (msg.method) eventos.push(msg);
    });
    function send(method, params) {
      const id = ++seq;
      return new Promise((resolve) => {
        pend.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }
    await send('Page.enable');
    await send('Runtime.enable');
    const nav = send('Page.navigate', { url: require('url').pathToFileURL(require('path').join(__dirname, '..', 'index.html')).href });
    await nav;
    for (let i = 0; i < 50; i++) {
      const pronto = await send('Runtime.evaluate', {
        expression: '!!(document.getElementById("n-gauss") && document.querySelector("#rolagem-entrada input[data-l]") && document.getElementById("confirma-n"))',
        returnByValue: true,
      });
      if (pronto.result && pronto.result.result && pronto.result.result.value) break;
      await sleep(100);
    }
    const aval = await send('Runtime.evaluate', {
      expression: `(async () => {
        const erros = [];
        window.addEventListener('error', (e) => erros.push(String(e.message)));
        const espera = (ms) => new Promise((r) => setTimeout(r, ms));
        document.getElementById('aba-gauss').click();
        await espera(30);
        function cel(i, j) { return document.querySelector('#rolagem-entrada [data-l="' + i + '"][data-c="' + j + '"]'); }
        function preencher(n, valores) {
          for (let i = 0; i < n; i++) for (let j = 0; j <= n; j++) {
            const inp = cel(i, j);
            inp.focus();
            inp.value = String(valores[i][j]);
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
          }
        }
        function ler(n) {
          const M = [];
          for (let i = 0; i < n; i++) {
            M.push([]);
            for (let j = 0; j <= n; j++) {
              const inp = cel(i, j);
              M[i].push(inp ? inp.dataset.valor : null);
            }
          }
          return M;
        }
        const base = [[11, 12, 13, 14], [21, 22, 23, 24], [31, 32, 33, 34]];
        preencher(3, base);
        const nCampo = document.getElementById('n-gauss');
        const dialog = document.getElementById('confirma-n');
        function estado() { return { n: nCampo.value, dialog: !dialog.hidden, grade: ler(3), erros: erros.slice() }; }

        document.getElementById('n-menos').click();
        const aposMenos = { dialog: !dialog.hidden, n: nCampo.value, tem31: !!cel(2, 0) && cel(2, 0).dataset.valor };
        document.getElementById('confirma-n-cancelar').click();
        const aposCancelarBotao = { n: nCampo.value, dialog: dialog.hidden, grade: ler(3) };

        nCampo.focus();
        nCampo.value = '2';
        nCampo.dispatchEvent(new Event('input', { bubbles: true }));
        nCampo.dispatchEvent(new Event('change', { bubbles: true }));
        nCampo.blur();
        const aposChange = { dialog: !dialog.hidden, n: nCampo.value, tem31: !!cel(2, 0) };
        document.getElementById('confirma-n-cancelar').click();
        const aposCancelarChange = { n: nCampo.value, grade: ler(3), dialog: dialog.hidden };

        nCampo.focus();
        nCampo.value = '2';
        nCampo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        nCampo.blur();
        const aposEnter = { dialog: !dialog.hidden, n: nCampo.value };
        document.getElementById('confirma-n-cancelar').click();

        document.getElementById('n-menos').click();
        document.getElementById('confirma-n-ok').click();
        await espera(20);
        const aposConfirmar = { n: nCampo.value, dialog: dialog.hidden, someuLinha: !cel(2, 0), a11: cel(0, 0) && cel(0, 0).dataset.valor };
        const a11 = cel(0, 0);
        a11.focus(); a11.value = '99';
        a11.dispatchEvent(new Event('input', { bubbles: true }));
        a11.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
        document.getElementById('n-mais').click();
        await espera(20);
        const restaurada = ler(3);

        nCampo.focus();
        nCampo.value = '10';
        nCampo.dispatchEvent(new Event('change', { bubbles: true }));
        nCampo.blur();
        await espera(20);
        preencher(10, Array.from({ length: 10 }, () => Array.from({ length: 11 }, () => '1')));
        const ultima = cel(9, 10);
        ultima.focus();
        ultima.value = '1e-999';
        ultima.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('calcular-grade').click();
        await espera(30);
        const botao = document.querySelector('#resumo-erros button[data-l="9"][data-c="10"]');
        if (botao) botao.click();
        const foco = document.activeElement;
        return {
          aposMenos, aposCancelarBotao, aposChange, aposCancelarChange, aposEnter,
          aposConfirmar, restaurada, erros,
          resumo: document.getElementById('resumo-erros').hidden,
          focoL: foco && foco.dataset ? foco.dataset.l : null,
          focoC: foco && foco.dataset ? foco.dataset.c : null,
          focoValor: foco && foco.dataset ? foco.dataset.valor : null,
        };
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (aval.result && aval.result.exceptionDetails) {
      throw new Error(JSON.stringify(aval.result.exceptionDetails));
    }
    const r = aval.result.result.value;
    assert.equal(r.aposMenos.dialog, true);
    assert.equal(r.aposMenos.n, '3');
    assert.equal(r.aposMenos.tem31, '31');
    assert.deepEqual(r.aposCancelarBotao.grade, [['11', '12', '13', '14'], ['21', '22', '23', '24'], ['31', '32', '33', '34']]);
    assert.equal(r.aposCancelarBotao.n, '3');
    assert.equal(r.aposCancelarBotao.dialog, true);
    assert.equal(r.aposChange.dialog, true);
    assert.equal(r.aposChange.n, '3');
    assert.equal(r.aposChange.tem31, true);
    assert.deepEqual(r.aposCancelarChange.grade, [['11', '12', '13', '14'], ['21', '22', '23', '24'], ['31', '32', '33', '34']]);
    assert.equal(r.aposEnter.dialog, true);
    assert.equal(r.aposConfirmar.n, '2');
    assert.equal(r.aposConfirmar.someuLinha, true);
    assert.equal(r.aposConfirmar.dialog, true);
    assert.deepEqual(r.restaurada, [['99', '12', '13', '14'], ['21', '22', '23', '24'], ['31', '32', '33', '34']]);
    assert.equal(r.resumo, false);
    assert.equal(r.focoL, '9');
    assert.equal(r.focoC, '10');
    assert.equal(r.focoValor, '1e-999');
    assert.deepEqual(r.erros, []);
  } finally {
    try { if (ws) ws.close(); } catch (e) {}
    try { chrome.kill('SIGKILL'); } catch (e) {}
    await sleep(200);
    try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch (e) {}
  }
});
