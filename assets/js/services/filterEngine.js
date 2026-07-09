// filterEngine.js
// Combina filtros sobre la lista de protocolos.

export function applyFilters(protocols, filters) {
  let result = [...protocols];

  if (filters.category && filters.category !== 'all') {
    result = result.filter(p => p.category === filters.category);
  }
  if (filters.service && filters.service !== 'all') {
    result = result.filter(p => p.service.includes(filters.service) || p.service.includes('ambos'));
  }
  if (filters.criticality && filters.criticality !== 'all') {
    result = result.filter(p => p.criticality === filters.criticality);
  }
  if (filters.riskFamily && filters.riskFamily !== 'all') {
    result = result.filter(p => (p.risks || []).some(r => r.family === filters.riskFamily));
  }
  if (filters.tag) {
    result = result.filter(p => (p.tags || []).includes(filters.tag));
  }
  if (filters.text) {
    const q = filters.text.toLowerCase();
    result = result.filter(p =>
      p.code.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q))
    );
  }

  // Orden
  if (filters.sortBy === 'criticality') {
    const order = { 'alto-riesgo': 0, 'medio': 1, 'bajo': 2 };
    result.sort((a, b) => (order[a.criticality] ?? 9) - (order[b.criticality] ?? 9));
  } else if (filters.sortBy === 'updated') {
    result.sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''));
  } else {
    result.sort((a, b) => a.code.localeCompare(b.code));
  }

  return result;
}

export function getAllTags(protocols) {
  const set = new Set();
  protocols.forEach(p => (p.tags || []).forEach(t => set.add(t)));
  return Array.from(set).sort();
}
