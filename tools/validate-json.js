#!/usr/bin/env node
/**
 * tools/validate-json.js
 *
 * Valida todos los JSON de protocolos contra el schema (validación estructural ligera, sin AJV).
 * Detecta:
 *  - Campos obligatorios faltantes
 *  - Códigos duplicados
 *  - Referencias rotas a anexos y protocolos
 *  - Pasos con next inválido
 *  - Tipos de servicio o criticidad inválidos
 *
 * Uso:
 *   node tools/validate-json.js
 *
 * Salida: lista de errores agrupados por archivo + código de salida 0 / 1.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PROTOCOLS_DIR = path.join(ROOT, 'data/protocols');
const ANNEXES_DIR   = path.join(ROOT, 'data/annexes');

const VALID_CATEGORIES = new Set(['P1', 'P2', 'P3']);
const VALID_CRITICALITY = new Set(['alto-riesgo', 'medio', 'bajo']);
const VALID_SERVICES = new Set(['estacion', 'movil', 'ambos']);
const VALID_STEP_TYPES = new Set(['action', 'decision', 'alert', 'end']);
const VALID_SEVERITY = new Set(['alta', 'media', 'baja']);

function loadJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try {
        const content = fs.readFileSync(path.join(dir, f), 'utf-8');
        return { file: f, data: JSON.parse(content), error: null };
      } catch (e) {
        return { file: f, data: null, error: 'JSON inválido: ' + e.message };
      }
    });
}

function validateProtocol(p, allProtocolCodes, allAnnexCodes) {
  const errs = [];
  const need = (field) => { if (!p[field]) errs.push(`Falta campo obligatorio: ${field}`); };
  ['code','version','lastUpdated','title','category','criticality','service','objective','scope','procedure'].forEach(need);

  if (p.code && !/^P[1-3]-[0-9]{2}$/.test(p.code))
    errs.push(`Código con formato inválido: "${p.code}" (esperado P[1-3]-NN)`);
  if (p.category && !VALID_CATEGORIES.has(p.category))
    errs.push(`Categoría inválida: "${p.category}"`);
  if (p.criticality && !VALID_CRITICALITY.has(p.criticality))
    errs.push(`Criticidad inválida: "${p.criticality}"`);
  if (Array.isArray(p.service)) {
    p.service.forEach(s => {
      if (!VALID_SERVICES.has(s)) errs.push(`Servicio inválido: "${s}"`);
    });
  }

  // Risks
  (p.risks || []).forEach((r, i) => {
    if (!r.id || !r.description || !r.severity) errs.push(`Riesgo #${i+1}: campos incompletos`);
    if (r.severity && !VALID_SEVERITY.has(r.severity)) errs.push(`Riesgo ${r.id}: severidad inválida "${r.severity}"`);
  });

  // Procedure / steps
  if (p.procedure?.steps) {
    const stepIds = new Set(p.procedure.steps.map(s => s.id));
    const checkRef = (sourceId, target, label) => {
      if (target && !stepIds.has(target))
        errs.push(`Paso "${sourceId}" referencia ${label} "${target}" que no existe`);
    };
    p.procedure.steps.forEach(s => {
      if (!s.id || !s.type || !s.title) errs.push(`Paso sin id, type o title`);
      if (s.type && !VALID_STEP_TYPES.has(s.type)) errs.push(`Paso "${s.id}": tipo inválido "${s.type}"`);

      // Referencias entre pasos
      if (Array.isArray(s.next)) s.next.forEach(t => checkRef(s.id, t, 'next'));
      if (s.yes) checkRef(s.id, s.yes, 'yes');
      if (s.no)  checkRef(s.id, s.no, 'no');
      if (Array.isArray(s.branches)) s.branches.forEach(b => checkRef(s.id, b.next, `branch "${b.label}"`));

      // Decisión sin yes/no/branches → no se puede navegar
      if (s.type === 'decision' && !s.yes && !s.no && (!s.branches || s.branches.length === 0)) {
        errs.push(`Paso "${s.id}" (decision): debe definir yes/no o branches[]`);
      }
    });
  }

  // Anexos
  (p.linkedAnnexes || []).forEach(a => {
    if (!allAnnexCodes.has(a)) errs.push(`Anexo vinculado "${a}" no encontrado en data/annexes/`);
  });
  // Protocolos relacionados (solo warning — pueden estar pendientes de migrar)
  const warns = [];
  (p.linkedProtocols || []).forEach(c => {
    if (!allProtocolCodes.has(c)) warns.push(`Protocolo relacionado "${c}" aún no migrado`);
  });

  return { errors: errs, warnings: warns };
}

function validateAnnex(a) {
  const errs = [];
  ['code','title','type'].forEach(f => { if (!a[f]) errs.push(`Falta campo obligatorio: ${f}`); });
  if (a.code && !/^[A-Z]{2,5}-[A-Z0-9]{2,}-?[0-9]*$/.test(a.code) && !/^[A-Z]{2,5}-[0-9]+$/.test(a.code))
    errs.push(`Código de anexo con formato sospechoso: "${a.code}"`);
  return errs;
}

function main() {
  const protocols = loadJsonFiles(PROTOCOLS_DIR);
  const annexes   = loadJsonFiles(ANNEXES_DIR);

  const allProtocolCodes = new Set(protocols.filter(p => p.data).map(p => p.data.code));
  const allAnnexCodes    = new Set(annexes.filter(a => a.data).map(a => a.data.code));

  let errors = 0;
  let warnings = 0;
  const seenCodes = new Set();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' Validación de archivos JSON');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Protocolos
  console.log('\n▸ Protocolos:');
  protocols.forEach(p => {
    if (p.error) { console.log(`  ✗ ${p.file}: ${p.error}`); errors++; return; }
    if (seenCodes.has(p.data.code)) { console.log(`  ✗ ${p.file}: código duplicado "${p.data.code}"`); errors++; }
    seenCodes.add(p.data.code);
    const result = validateProtocol(p.data, allProtocolCodes, allAnnexCodes);
    const errs = Array.isArray(result) ? result : result.errors;
    const warns = Array.isArray(result) ? [] : result.warnings;
    if (errs.length === 0 && warns.length === 0) {
      console.log(`  ✓ ${p.file}`);
    } else if (errs.length === 0) {
      console.log(`  ⚠ ${p.file}`);
      warns.forEach(w => console.log(`      · ${w}`));
      warnings += warns.length;
    } else {
      console.log(`  ✗ ${p.file}`);
      errs.forEach(e => console.log(`      · ${e}`));
      warns.forEach(w => console.log(`      ⚠ ${w}`));
      errors += errs.length;
      warnings += warns.length;
    }
  });

  // Anexos
  console.log('\n▸ Anexos:');
  annexes.forEach(a => {
    if (a.error) { console.log(`  ✗ ${a.file}: ${a.error}`); errors++; return; }
    const errs = validateAnnex(a.data);
    if (errs.length === 0) {
      console.log(`  ✓ ${a.file}`);
    } else {
      console.log(`  ✗ ${a.file}`);
      errs.forEach(e => console.log(`      · ${e}`));
      errors += errs.length;
    }
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (errors === 0) {
    console.log(` ✓ Validación exitosa — ${protocols.length} protocolo(s), ${annexes.length} anexo(s)`);
    if (warnings > 0) console.log(` ⚠ ${warnings} advertencia(s) — referencias a protocolos pendientes de migrar`);
    process.exit(0);
  } else {
    console.log(` ✗ ${errors} error(es) encontrado(s)`);
    if (warnings > 0) console.log(` ⚠ ${warnings} advertencia(s)`);
    process.exit(1);
  }
}

main();
