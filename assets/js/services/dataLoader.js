// dataLoader.js
// Único punto de carga de datos. Lee el manifest y descarga todos los JSON.
// No hay lógica de negocio hardcodeada — solo conoce la estructura del manifest.

const DATA_BASE = './data';

async function fetchJson(path) {
  const res = await fetch(path, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Error cargando ${path}: ${res.status}`);
  return res.json();
}

/**
 * Carga el manifest principal y luego en paralelo: protocolos, anexos, catálogos.
 * Devuelve un objeto consolidado con índices y mapas para consulta rápida.
 */
export async function loadAllData() {
  const manifest = await fetchJson(`${DATA_BASE}/manifest.json`);

  const [categories, risks, normatives, protocols, annexes] = await Promise.all([
    fetchJson(`${DATA_BASE}/catalog/categories.json`).then(d => d.categories),
    fetchJson(`${DATA_BASE}/catalog/risks.json`).then(d => d.riskFamilies),
    fetchJson(`${DATA_BASE}/catalog/normatives.json`).then(d => d.normatives),
    Promise.all(manifest.protocols.map(f => fetchJson(`${DATA_BASE}/protocols/${f}`).catch(err => {
      console.warn(`Protocolo no cargado: ${f}`, err);
      return null;
    }))),
    Promise.all(manifest.annexes.map(f => fetchJson(`${DATA_BASE}/annexes/${f}`).catch(err => {
      console.warn(`Anexo no cargado: ${f}`, err);
      return null;
    })))
  ]);

  // Filtrar nulos (archivos faltantes no rompen la app)
  const protocolList = protocols.filter(Boolean);
  const annexList    = annexes.filter(Boolean);

  // Índices para acceso O(1)
  const byCode  = new Map(protocolList.map(p => [p.code, p]));
  const anByCode = new Map(annexList.map(a => [a.code, a]));
  const byCategory = groupBy(protocolList, p => p.category);
  const byCriticality = groupBy(protocolList, p => p.criticality);
  const byService = {
    estacion: protocolList.filter(p => p.service.includes('estacion') || p.service.includes('ambos')),
    movil:    protocolList.filter(p => p.service.includes('movil')    || p.service.includes('ambos')),
    ambos:    protocolList.filter(p => p.service.includes('ambos'))
  };

  // Construir índice de riesgos cruzados
  const riskIndex = new Map(); // family -> [protocolCode]
  protocolList.forEach(p => {
    (p.risks || []).forEach(r => {
      if (!r.family) return;
      if (!riskIndex.has(r.family)) riskIndex.set(r.family, new Set());
      riskIndex.get(r.family).add(p.code);
    });
  });

  return {
    manifest,
    catalog: { categories, risks, normatives },
    protocols: protocolList,
    annexes: annexList,
    indices: {
      byCode,
      anByCode,
      byCategory,
      byCriticality,
      byService,
      riskIndex
    }
  };
}

function groupBy(arr, keyFn) {
  return arr.reduce((acc, x) => {
    const k = keyFn(x);
    if (!acc[k]) acc[k] = [];
    acc[k].push(x);
    return acc;
  }, {});
}
