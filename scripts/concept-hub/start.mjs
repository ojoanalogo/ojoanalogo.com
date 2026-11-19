#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = '/Users/mxarc/orca/workspaces/ojoanalogo';

const concepts = [
  ['infinitefolio', 'Infinite Folio (elegido)', 5112],
  ['detent', 'Detent (reserva)', 5111],
];

const children = [];

function startPreview(slug, port) {
  const cwd = join(ROOT, `redesign-${slug}`);
  const child = spawn(
    'pnpm',
    ['exec', 'astro', 'preview', '--host', '127.0.0.1', '--port', String(port), '--force'],
    {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' },
    },
  );
  child.stdout.on('data', (buf) => {
    const line = buf.toString();
    if (line.includes('Local') || line.includes('preview')) {
      process.stdout.write(`[${slug}] ${line}`);
    }
  });
  child.stderr.on('data', (buf) => {
    const line = buf.toString();
    if (/error|Error|EADDRINUSE/i.test(line)) {
      process.stderr.write(`[${slug}] ${line}`);
    }
  });
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${slug}] exited ${code}`);
    }
  });
  children.push(child);
}

const indexHtml = readFileSync(join(__dirname, 'index.html'));
const hub = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(indexHtml);
});

hub.listen(3333, '127.0.0.1', () => {
  console.log('\nConcept hub: http://127.0.0.1:3333/\n');
  for (const [slug, , port] of concepts) {
    startPreview(slug, port);
  }
  console.log('Starting concept previews …\n');
});

function shutdown() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      /* ignore */
    }
  }
  hub.close();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
