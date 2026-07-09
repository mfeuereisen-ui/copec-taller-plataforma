#!/usr/bin/env node
/**
 * tools/build-manifest.js
 *
 * Escanea data/protocols/ y data/annexes/ y regenera data/manifest.json.
 * Ejecutar cada vez que se añade o elimina un JSON.
 *
 * Uso:
 *   node tools/build-manifest.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const PROTOCOLS_DIR = path.join(DATA, 'protocols');
const ANNEXES_DIR   = path.join(DATA, 'annexes');
const MANIFEST_OUT  = path.join(DATA, 'manifest.json');

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort();
}

function loadManualMeta() {
  // Si existe un manifest previo, conservamos los metadatos de plataforma
  try {
    const cur = JSON.parse(fs.readFileSync(MANIFEST_OUT, 'utf-8'));
    return cur.platform;
  } catch {
    return {
      name: 'Plataforma de Seguridad Operacional',
      owner: 'Copec Taller',
      manualVersion: '1.0',
      manualDate: 'Mayo 2026'
    };
  }
}

function main() {
  const protocols = listJsonFiles(PROTOCOLS_DIR);
  const annexes   = listJsonFiles(ANNEXES_DIR);

  const manifest = {
    version: '1.0',
    generated: new Date().toISOString(),
    platform: loadManualMeta(),
    protocols,
    annexes
  };

  fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');

  console.log(`✓ Manifest regenerado en data/manifest.json`);
  console.log(`  · ${protocols.length} protocolo(s) detectado(s)`);
  console.log(`  · ${annexes.length} anexo(s) detectado(s)`);
}

main();
