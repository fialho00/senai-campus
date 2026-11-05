// Backend do Senai Campus. Chaves privadas ficam apenas nas variáveis do Worker.
// O projeto serve o protótipo publicamente; entrar cria uma sessão somente
// quando um administrador configurar o OAuth institucional.
const encoder = new TextEncoder();
const MAX_MESSAGE_LENGTH = 500;
const MAX_BODY_BYTES = 8192;
const requestCounts = new Map();

const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});
const b64url = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const bytesFromB64url = str => Uint8Array.from(atob(str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - str.length % 4) % 4)), c => c.charCodeAt(0));
const randomToken = () => b64url(crypto.getRandomValues(new Uint8Array(32)));
const cookie = (name, value, maxAge) => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
const cookiesOf = req => Object.fromEntries((req.headers.get('cookie') || '').split(';').map(part => part.trim().split(/=(.*)/s).slice(0, 2)).filter(([name]) => name));
const authReady = env => Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_ALLOWED_HD && env.AUTH_SESSION_SECRET);
const geminiReady = env => Boolean(env.GEMINI_API_KEY);

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function signedSession(payload, secret) {
  const base = b64url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(secret), encoder.encode(base));
  return `${base}.${b64url(new Uint8Array(sig))}`;
}
async function verifySession(value, secret) {
  if (!value || !secret || !value.includes('.')) return null;
  try {
    const [base, sig] = value.split('.');
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), bytesFromB64url(sig), encoder.encode(base));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(bytesFromB64url(base)));
    return payload.exp > Date.now() / 1000 ? payload : null;
  } catch { return null; }
}
const htmlRedirect = (dest, headers = {}) => new Response(null, { status: 303, headers: { location: dest, 'cache-control': 'no-store', ...headers } });

async function validateGoogleIdToken(idToken, clientId, nonce, domains) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Token Google inválido');
  const head = JSON.parse(new TextDecoder().decode(bytesFromB64url(parts[0])));
  const body = JSON.parse(new TextDecoder().decode(bytesFromB64url(parts[1])));
  if (head.alg !== 'RS256' || !head.kid) throw new Error('Assinatura não suportada');
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(body.iss) || body.aud !== clientId || body.exp <= Date.now() / 1000 || body.iat > Date.now() / 1000 + 60 || body.nonce !== nonce || body.email_verified !== true) throw new Error('Identidade inválida');
  if (!body.hd || !domains.split(',').map(x => x.trim().toLowerCase()).filter(Boolean).includes(String(body.hd).toLowerCase())) throw new Error('Conta fora dos domínios institucionais permitidos');
  const keysResponse = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(8000) });
  if (!keysResponse.ok) throw new Error('Não foi possível verificar o Google');
  const jwks = await keysResponse.json();
  const jwk = jwks.keys.find(k => k.kid === head.kid && k.kty === 'RSA');
  if (!jwk) throw new Error('Chave de assinatura não reconhecida');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, bytesFromB64url(parts[2]), encoder.encode(parts[0] + '.' + parts[1]));
  if (!valid) throw new Error('Assinatura Google inválida');
  return { sub: String(body.sub), name: String(body.given_name || body.name || 'Estudante').slice(0, 80), hd: String(body.hd) };
}

async function handleGoogleLogin(request, env) {
  if (!authReady(env)) return htmlRedirect('/login.html?status=indisponivel');
  const state = randomToken(), nonce = randomToken();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  const redirect = new URL('/auth/google/callback', request.url).toString();
  url.search = new URLSearchParams({ client_id: env.GOOGLE_CLIENT_ID, redirect_uri: redirect, response_type: 'code', scope: 'openid email profile', state, nonce, hd: env.GOOGLE_ALLOWED_HD.split(',')[0].trim(), prompt: 'select_account' }).toString();
  const response = new Response(null, { status: 302, headers: { location: url.toString(), 'cache-control': 'no-store' } });
  response.headers.append('set-cookie', cookie('nexo_oauth_state', state, 600));
  response.headers.append('set-cookie', cookie('nexo_oauth_nonce', nonce, 600));
  return response;
}

async function handleGoogleCallback(request, env) {
  const url = new URL(request.url), c = cookiesOf(request);
  const response = htmlRedirect('/login.html?status=erro');
  response.headers.append('set-cookie', cookie('nexo_oauth_state', '', 0));
  response.headers.append('set-cookie', cookie('nexo_oauth_nonce', '', 0));
  if (!authReady(env) || url.searchParams.has('error')) return response;
  if (!url.searchParams.get('code') || !c.nexo_oauth_state || c.nexo_oauth_state !== url.searchParams.get('state') || !c.nexo_oauth_nonce) return response;
  try {
    const redirect = new URL('/auth/google/callback', request.url).toString();
    const form = new URLSearchParams({ code: url.searchParams.get('code'), client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET, redirect_uri: redirect, grant_type: 'authorization_code' });
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: form, headers: { 'content-type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(10000) });
    if (!tokenResponse.ok) return response;
    const token = await tokenResponse.json();
    const student = await validateGoogleIdToken(token.id_token, env.GOOGLE_CLIENT_ID, c.nexo_oauth_nonce, env.GOOGLE_ALLOWED_HD);
    const session = await signedSession({ ...student, exp: Math.floor(Date.now() / 1000) + 86400 }, env.AUTH_SESSION_SECRET);
    response.headers.set('location', '/campus.html');
    response.headers.append('set-cookie', cookie('nexo_session', session, 86400));
    return response;
  } catch { return response; }
}

const safeContext = data => {
  const courses = ['Desenvolvimento de Sistemas', 'Eletrotécnica', 'Design Digital'];
  return {
    curso: courses.includes(data?.course) ? data.course : 'Desenvolvimento de Sistemas',
    horario: /^\d\d:\d\d$/.test(data?.time || '') ? data.time : '10:20',
    interesses: Array.isArray(data?.interests) ? data.interests.filter(x => typeof x === 'string').slice(0, 5) : []
  };
};

function limitReached(request) {
  const ip = request.headers.get('cf-connecting-ip') || 'local';
  const now = Date.now();
  // Limite por instância (não substitui proteção de produção na borda).
  for (const [key, val] of requestCounts) if (val.until < now) requestCounts.delete(key);
  const val = requestCounts.get(ip) || { hits: 0, until: now + 900000 };
  val.hits++;
  requestCounts.set(ip, val);
  return val.hits > 18;
}

async function handleGemini(request, env) {
  if (!geminiReady(env)) return json({ error: 'IA indisponível: chave Gemini ainda não configurada no servidor.' }, 503);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origem não permitida.' }, 403);
  if (limitReached(request)) return json({ error: 'Limite temporário de mensagens atingido. Tente mais tarde.' }, 429);
  const length = Number(request.headers.get('content-length') || 0);
  if (length > MAX_BODY_BYTES) return json({ error: 'Mensagem muito grande.' }, 413);
  let body;
  try { const raw = await request.text(); if (raw.length > MAX_BODY_BYTES) throw new Error(); body = JSON.parse(raw); } catch { return json({ error: 'Mensagem inválida.' }, 400); }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_LENGTH) return json({ error: 'Mensagem deve ter de 1 a 500 caracteres.' }, 400);
  const ctx = safeContext(body.context);
  const recent = Array.isArray(body.history) ? body.history.slice(-6).filter(m => ['user', 'model'].includes(m?.role) && typeof m?.text === 'string').map(m => ({ role: m.role, parts: [{ text: m.text.slice(0, MAX_MESSAGE_LENGTH) }] })) : [];
  const system = `Você é SenAI, assistente experimental do Senai Campus, protótipo independente criado por estudantes para o desafio Smart Campus SENAI Taguatinga. Responda em português brasileiro, com empatia e objetividade (até 110 palavras). Ajude com organização, estudos, programação e oportunidades acadêmicas. Não se apresente como sistema oficial do SENAI. Nunca invente notícias, horários, locais, ofertas, vagas ou regras oficiais. Os dados da interface são FICTÍCIOS. Se o usuário perguntar sobre uma informação real do SENAI, diga que precisa consultar a instituição. Contexto simulado: ${JSON.stringify(ctx)}. Recomende o Radar do Campus para combinar tempo e atividades e a agenda/mapa apenas como demonstração.`;
  try {
    const resp = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [...recent, { role: 'user', parts: [{ text: message }] }], generationConfig: { maxOutputTokens: 350, temperature: 0.45 } }),
      signal: AbortSignal.timeout(22000)
    });
    if (!resp.ok) return json({ error: resp.status === 429 ? 'Gemini temporariamente sem cota. Tente novamente.' : 'O Gemini está indisponível no momento.' }, 502);
    const data = await resp.json();
    const answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!answer) return json({ error: 'O Gemini não retornou uma resposta de texto.' }, 502);
    return json({ answer: answer.slice(0, 2000), provider: 'Gemini' });
  } catch { return json({ error: 'Não foi possível conectar ao Gemini. Tente novamente.' }, 502); }
}

const staticHeaders = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' };
function serveStatic(path) {
  const file = STATIC_ASSETS[path];
  if (!file) return new Response('Página não encontrada.', { status: 404 });
  const bytes = bytesFromB64url(file.base64);
  return new Response(bytes, { headers: { 'content-type': file.mime, 'cache-control': path.endsWith('.html') || path === '/' ? 'public, max-age=60' : 'public, max-age=3600', ...staticHeaders } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === 'GET' && path === '/api/status') return json({ gemini: geminiReady(env), googleSenai: authReady(env) });
    if (request.method === 'GET' && path === '/api/me') {
      const student = await verifySession(cookiesOf(request).nexo_session, env.AUTH_SESSION_SECRET);
      return json({ authenticated: Boolean(student), student: student ? { name: student.name, hd: student.hd } : null });
    }
    if (request.method === 'GET' && path === '/auth/google') return handleGoogleLogin(request, env);
    if (request.method === 'GET' && path === '/auth/google/callback') return handleGoogleCallback(request, env);
    if (request.method === 'POST' && path === '/auth/logout') return htmlRedirect('/login.html?status=saiu', { 'set-cookie': cookie('nexo_session', '', 0) });
    if (request.method === 'POST' && path === '/api/chat') return handleGemini(request, env);
    if (request.method === 'GET' || request.method === 'HEAD') return serveStatic(path === '/' ? '/index.html' : path);
    return json({ error: 'Método não permitido.' }, 405);
  }
};
