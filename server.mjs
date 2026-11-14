import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Set([
  'index.html', 'styles.css', 'commerce.css', 'account.css', 'app.js',
  'ui.js', 'catalog.js', 'illustrations.js', 'content.js', 'commerce.js', 'account.js',
]);
const contentTypes = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
};
const port = Number(process.env.SYH_SHOP_PORT || 4173);

createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const file = path === '/' ? 'index.html' : path.slice(1);
  if (!files.has(file)) {
    response.writeHead(404).end();
    return;
  }

  try {
    const data = await readFile(new URL(file, import.meta.url));
    response.writeHead(200, {
      'Content-Type': contentTypes[file.split('.').at(-1)],
      'Cache-Control': 'no-store',
    }).end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`SYH 商店 http://127.0.0.1:${port}`);
});
