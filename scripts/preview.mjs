import http from 'node:http';
import worker from '../dist/server/index.js';

const port = Number(process.env.PORT || 4173);
const hostname = process.env.HOST || '0.0.0.0';

http.createServer(async (req, res) => {
  try {
    const origin = `http://${req.headers.host || `localhost:${port}`}`;
    const url = new URL(req.url || '/', origin);
    const body = ['GET', 'HEAD'].includes(req.method) ? undefined : req;
    const request = new Request(url, { method: req.method, headers: req.headers, body, ...(body ? { duplex: 'half' } : {}) });
    const response = await worker.fetch(request, {});
    const headers = Object.fromEntries(response.headers);
    const setCookies = response.headers.getSetCookie?.();
    if (setCookies?.length) headers['set-cookie'] = setCookies;
    res.writeHead(response.status, headers);
    if (req.method === 'HEAD') res.end();
    else res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('[NEXO preview]', error);
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Erro ao executar o protótipo.');
  }
}).listen(port, hostname, () => console.log(`NEXO Campus preview: http://${hostname}:${port}`));
