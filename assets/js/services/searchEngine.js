// searchEngine.js
import Fuse from 'fuse.js';

/**
 * Construye un índice de búsqueda multi-campo sobre todos los protocolos.
 * Soporta búsqueda en código, título, tags, riesgos, EPP, normativa, pasos.
 */
export function buildSearchIndex(protocols, annexes) {
  // Documento aplanado por protocolo para indexar
  const protocolDocs = protocols.map(p => ({
    type: 'protocol',
    code: p.code,
    title: p.title,
    shortTitle: p.shortTitle,
    category: p.category,
    tags: (p.tags || []).join(' '),
    objective: p.objective,
    scope: p.scope,
    risks: (p.risks || []).map(r => r.description).join(' '),
    epp: (p.epp || []).map(e => e.item).join(' '),
    tools: (p.tools || []).map(t => t.name).join(' '),
    normatives: (p.normatives || []).join(' '),
    steps: (p.procedure?.steps || []).map(s => `${s.title} ${s.description || ''}`).join(' '),
    stopRules: (p.stopRules || []).join(' '),
    _ref: p
  }));

  const annexDocs = (annexes || []).map(a => ({
    type: 'annex',
    code: a.code,
    title: a.title,
    description: a.description,
    annexType: a.type,
    _ref: a
  }));

  const allDocs = [...protocolDocs, ...annexDocs];

  const fuse = new Fuse(allDocs, {
    keys: [
      { name: 'code',        weight: 0.30 },
      { name: 'title',       weight: 0.25 },
      { name: 'shortTitle',  weight: 0.20 },
      { name: 'tags',        weight: 0.15 },
      { name: 'objective',   weight: 0.10 },
      { name: 'risks',       weight: 0.10 },
      { name: 'steps',       weight: 0.08 },
      { name: 'description', weight: 0.10 },
      { name: 'normatives',  weight: 0.05 },
      { name: 'epp',         weight: 0.05 },
      { name: 'tools',       weight: 0.05 }
    ],
    includeScore: true,
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
    shouldSort: true
  });

  return {
    search(query, limit = 30) {
      if (!query || query.trim().length < 2) return [];
      return fuse.search(query, { limit }).map(r => ({
        item: r.item,
        score: r.score
      }));
    },
    countByType(query) {
      const results = fuse.search(query);
      return {
        protocols: results.filter(r => r.item.type === 'protocol').length,
        annexes:   results.filter(r => r.item.type === 'annex').length,
        total:     results.length
      };
    }
  };
}
