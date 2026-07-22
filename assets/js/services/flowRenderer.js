// flowRenderer.js
// Convierte el array procedure.steps en sintaxis Mermaid (flowchart TD).
// Cada step se mapea a un nodo según su type:
//   action   -> [Texto]    (rectángulo)  class nodeStep
//   decision -> {Texto?}   (rombo)       class nodeDecision (con yes/no/branches)
//   alert    -> [Texto]    class nodeAlert
//   end      -> [Texto]    class nodeEnd
// Las relaciones se construyen desde next[], yes, no, branches[].

const escapeMermaid = (str) => {
  if (!str) return '';
  return String(str)
    .replace(/"/g, '#quot;')
    .replace(/[\[\]]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/[\r\n]+/g, ' ')
    .substring(0, 80); // límite razonable por nodo
};

const wrapText = (str, width = 28) => {
  if (!str) return '';
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).length > width && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.join('<br/>');
};

export function generateMermaidDefinition(procedure, currentStepId = null) {
  if (!procedure || !procedure.steps || !procedure.steps.length) {
    return 'flowchart TD\n  empty["Sin pasos definidos"]';
  }

  const lines = ['flowchart TD'];
  const styleDirectives = [];

  // Colores por tipo de nodo. Se aplican con "style <id> fill:..." porque en
  // Mermaid 10.9 eso genera un estilo INLINE sobre cada forma, que tiene mayor
  // prioridad que la regla CSS del tema base (.node polygon { fill: primaryColor }).
  // El enfoque class+classDef NO funciona aquí porque su selector es sobreescrito
  // por la regla genérica del tema.
  const NODE_STYLES = {
    nodeStep:     'fill:#DBEAFE,stroke:#1D4ED8,stroke-width:1.5px,color:#0F172A',
    nodeDecision: 'fill:#FEF3C7,stroke:#B45309,stroke-width:1.5px,color:#0F172A',
    nodeAlert:    'fill:#FEE2E2,stroke:#B91C1C,stroke-width:1.5px,color:#0F172A',
    nodeEnd:      'fill:#DCFCE7,stroke:#15803D,stroke-width:1.5px,color:#0F172A',
    nodeCurrent:  'fill:#DBEAFE,stroke:#0B3D91,stroke-width:3px,color:#0F172A'
  };

  for (const step of procedure.steps) {
    const id = step.id;
    const label = wrapText(escapeMermaid(step.title || ''), 30);

    let nodeStr;
    let styleKey;
    switch (step.type) {
      case 'decision':
        nodeStr = `${id}{"${label}"}`;
        styleKey = 'nodeDecision';
        break;
      case 'alert':
        nodeStr = `${id}["${label}"]`;
        styleKey = 'nodeAlert';
        break;
      case 'end':
        nodeStr = `${id}(["${label}"])`;
        styleKey = 'nodeEnd';
        break;
      case 'action':
      default:
        nodeStr = `${id}["${label}"]`;
        styleKey = 'nodeStep';
    }
    lines.push(`  ${nodeStr}`);
    styleDirectives.push(`  style ${id} ${NODE_STYLES[styleKey]}`);

    // Conexiones
    if (step.type === 'decision') {
      if (step.yes) {
        lines.push(`  ${id} -->|${escapeMermaid(step.yesLabel || 'Sí')}| ${step.yes}`);
      }
      if (step.no) {
        lines.push(`  ${id} -->|${escapeMermaid(step.noLabel || 'No')}| ${step.no}`);
      }
      if (Array.isArray(step.branches)) {
        for (const b of step.branches) {
          lines.push(`  ${id} -->|${escapeMermaid(b.label)}| ${b.next}`);
        }
      }
    } else if (Array.isArray(step.next)) {
      for (const target of step.next) {
        lines.push(`  ${id} --> ${target}`);
      }
    }
  }

  // Aplicar estilos por nodo (después de las conexiones)
  lines.push(...styleDirectives);

  // Resaltar paso actual: su "style" se declara al final para ganar prioridad
  if (currentStepId) {
    lines.push(`  style ${currentStepId} ${NODE_STYLES.nodeCurrent}`);
  }

  return lines.join('\n');
}

/**
 * Devuelve el objeto step dado un id.
 */
export function findStep(procedure, id) {
  return procedure?.steps?.find(s => s.id === id) || null;
}

/**
 * Calcula el "camino feliz" — primera ruta lineal desde el primer step hasta un end/dead-end.
 * Útil para el modo capacitación.
 */
export function computeHappyPath(procedure) {
  if (!procedure?.steps?.length) return [];
  const byId = new Map(procedure.steps.map(s => [s.id, s]));
  const visited = new Set();
  const path = [];
  let cur = procedure.steps[0];
  while (cur && !visited.has(cur.id)) {
    visited.add(cur.id);
    path.push(cur);
    let nextId = null;
    if (cur.type === 'decision') {
      nextId = cur.yes || (Array.isArray(cur.branches) && cur.branches[0]?.next);
    } else if (Array.isArray(cur.next) && cur.next.length) {
      nextId = cur.next[0];
    }
    cur = nextId ? byId.get(nextId) : null;
  }
  return path;
}
