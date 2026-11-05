import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.pdf': 'application/pdf'
};

const assets = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const relative = `${prefix}${entry.name}`;
    if (entry.isDirectory()) {
      if (entry.name !== 'server') await collect(path.join(directory, entry.name), relative + '/');
    } else {
      const ext = path.extname(entry.name);
      if (!mime[ext]) continue;
      assets['/' + relative] = { mime: mime[ext], base64: (await readFile(path.join(directory, entry.name))).toString('base64url') };
    }
  }
}
await collect(dist);
const worker = await readFile(path.join(root, 'worker/index.js'), 'utf8');
const target = path.join(dist, 'server');
await mkdir(target, { recursive: true });
await writeFile(path.join(target, 'index.js'), `const STATIC_ASSETS=${JSON.stringify(assets)};\n${worker}`);
await mkdir(path.join(dist, '.openai'), { recursive: true });
await writeFile(path.join(dist, '.openai', 'hosting.json'), await readFile(path.join(root, '.openai/hosting.json')));
console.log(`Worker gerado com ${Object.keys(assets).length} arquivos públicos.`);
