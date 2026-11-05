import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../dist/server/index.js', import.meta.url), 'utf8');
const moduleUrl = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const { default: worker } = await import(moduleUrl);
const request = (path, init) => new Request(`https://nexo.example${path}`, init);

test('Páginas públicas preservadas e com recursos novos', async () => {
  const landing = await worker.fetch(request('/'), {});
  assert.equal(landing.status, 200);
  assert.match(await landing.text(), /SENAI TAGUATINGA/);
  const campus = await worker.fetch(request('/campus.html'), {});
  const html = await campus.text();
  assert.match(html, /data-theme-toggle/);
  assert.match(html, /Planta publicada: CEUNI\/SENAI Blumenau/);
  assert.match(html, /SenAI · assistente do (NEXO|Senai Campus)/);
  const login = await worker.fetch(request('/login.html'), {});
  assert.equal(login.status, 200);
  assert.match(await login.text(), /Continuar com Google SENAI/);
  const favicon = await worker.fetch(request('/assets/favicon.svg'), {});
  assert.equal(favicon.headers.get('content-type'), 'image/svg+xml');
  assert.equal((await worker.fetch(request('/arquivo-inexistente'), {})).status, 404);
});

test('Sem credenciais, status honesto e chat retorna 503', async () => {
  const status = await (await worker.fetch(request('/api/status'), {})).json();
  assert.deepEqual(status, { gemini: false, googleSenai: false });
  const me = await (await worker.fetch(request('/api/me'), {})).json();
  assert.equal(me.authenticated, false);
  const chat = await worker.fetch(request('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'Olá!' }) }), {});
  assert.equal(chat.status, 503);
  const auth = await worker.fetch(request('/auth/google'), {});
  assert.equal(auth.status, 303);
  assert.match(auth.headers.get('location'), /indisponivel/);
});

test('Login prepara OAuth com state, nonce e domínio e rejeita callback forjado', async () => {
  const env = { GOOGLE_CLIENT_ID: 'fake.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'fake_secret', GOOGLE_ALLOWED_HD: 'alunos.exemplo.edu.br', AUTH_SESSION_SECRET: 'x'.repeat(50) };
  const response = await worker.fetch(request('/auth/google'), env);
  assert.equal(response.status, 302);
  const url = new URL(response.headers.get('location'));
  assert.equal(url.host, 'accounts.google.com');
  assert.equal(url.searchParams.get('hd'), 'alunos.exemplo.edu.br');
  assert.ok(url.searchParams.get('nonce'));
  assert.ok(url.searchParams.get('state'));
  const callback = await worker.fetch(request('/auth/google/callback?code=forged&state=forged'), env);
  assert.equal(callback.status, 303);
  assert.match(callback.headers.get('location'), /status=erro/);
});

test('Adapter Gemini: valida origem, entrada e retorno com provedor simulado', async () => {
  const env = { GEMINI_API_KEY: 'key_for_local_mock_only' };
  const wrongOrigin = await worker.fetch(request('/api/chat', { method: 'POST', headers: { origin: 'https://evil.invalid' }, body: '{}' }), env);
  assert.equal(wrongOrigin.status, 403);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.match(String(url), /generativelanguage.googleapis.com/);
    assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
    const body = JSON.parse(options.body);
    assert.match(body.systemInstruction.parts[0].text, /dados da interface são FICTÍCIOS/);
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Você pode explorar o Radar antes da próxima aula.' }] } }] });
  };
  try {
    const response = await worker.fetch(request('/api/chat', { method: 'POST', headers: { origin: 'https://nexo.example', 'content-type': 'application/json' }, body: JSON.stringify({ message: 'O que faço agora?', context: { course: 'Desenvolvimento de Sistemas', time: '10:20' } }) }), env);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.match(data.answer, /Radar/);
    assert.equal(data.provider, 'Gemini');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});
