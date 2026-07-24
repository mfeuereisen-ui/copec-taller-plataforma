// assets/js/services/stepOutline.js
// ---------------------------------------------------------------------------
// Convierte procedure.steps (que es un GRAFO con decisiones y ramas) en una
// lista ordenada para lectura secuencial, SIN aplanar las bifurcaciones.
//
// Por qué importa: un protocolo con decisiones no es una lista de pasos. Si se
// mostrara "1, 2, 3 ... 14" en fila, el lector podría entender que debe
// ejecutar todos los pasos, cuando en realidad una decisión lo enruta por UNA
// sola rama. En Primeros Auxilios eso implicaría sugerir que se aplican los
// seis tratamientos a la vez. Por eso los pasos condicionales se devuelven
// marcados y agrupados bajo la rama que los activa.
//
// Devuelve un array de items:
//   {
//     step,            // el objeto paso original
//     number,          // '1', '2', ... para la vía principal; null si es condicional
//     depth,           // 0 = vía principal, 1 = dentro de una rama
//     branchLabel,     // texto de la rama, solo en el primer paso de cada rama
//     conditional      // true si solo se ejecuta al tomar cierta rama
//   }
// ---------------------------------------------------------------------------

/** Devuelve los ids a los que apunta un paso, en orden. */
function outgoing(step) {
  if (!step) return [];
  if (step.type === 'decision') {
    const outs = [];
    if (step.yes) outs.push({ id: step.yes, label: step.yesLabel || 'Sí' });
    if (step.no) outs.push({ id: step.no, label: step.noLabel || 'No' });
    if (Array.isArray(step.branches)) {
      step.branches.forEach(b => outs.push({ id: b.next, label: b.label }));
    }
    return outs;
  }
  const next = Array.isArray(step.next) ? step.next : (step.next ? [step.next] : []);
  return next.map(id => ({ id, label: null }));
}

export function buildStepOutline(procedure) {
  const steps = (procedure && procedure.steps) || [];
  if (!steps.length) return [];

  const byId = new Map(steps.map(s => [s.id, s]));

  // Cuántos pasos apuntan a cada paso. Los que reciben más de una entrada son
  // puntos de convergencia: las ramas vuelven a juntarse ahí, así que
  // pertenecen a la vía principal y no deben repetirse dentro de cada rama.
  const inDegree = new Map(steps.map(s => [s.id, 0]));
  steps.forEach(s => outgoing(s).forEach(o => {
    if (inDegree.has(o.id)) inDegree.set(o.id, inDegree.get(o.id) + 1);
  }));

  const result = [];
  const visited = new Set();
  let counter = 0;

  function walk(startId, depth, firstBranchLabel) {
    let id = startId;
    let label = firstBranchLabel;

    while (id && byId.has(id) && !visited.has(id)) {
      // Un punto de convergencia alcanzado desde dentro de una rama corta la
      // rama: ese paso se emite después, en la vía principal.
      if (depth > 0 && inDegree.get(id) > 1) return id;

      const step = byId.get(id);
      visited.add(id);

      const conditional = depth > 0;
      if (!conditional) counter += 1;

      result.push({
        step,
        number: conditional ? null : String(counter),
        depth,
        branchLabel: label || null,
        conditional
      });
      label = null;

      if (step.type === 'decision') {
        const outs = outgoing(step);
        const multiway = Array.isArray(step.branches) && step.branches.length > 0;

        if (multiway) {
          // Clasificación de múltiples vías (ej. "¿qué tipo de lesión?"):
          // todas las ramas son alternativas entre pares, ninguna es "la
          // normal". Se muestran todas indentadas bajo la decisión.
          let rejoin = null;
          for (const o of outs) {
            const r = walk(o.id, depth + 1, o.label);
            if (r && !rejoin) rejoin = r;
          }
          if (rejoin) { id = rejoin; continue; }   // las ramas convergen: sigue la vía principal
          return null;
        }

        // Compuerta binaria (ej. "¿equipo apto?"): la vía afirmativa continúa
        // el procedimiento normal y la negativa es la excepción.
        const primary = outs.find(o => o.id === step.yes) || outs[0];
        let rejoin = null;
        for (const alt of outs.filter(o => o !== primary)) {
          const r = walk(alt.id, depth + 1, alt.label);
          if (r && !rejoin) rejoin = r;
        }
        if (primary) { id = primary.id; label = primary.label; continue; }
        if (rejoin && depth === 0) { id = rejoin; continue; }
        return rejoin;
      }

      const outs = outgoing(step);
      id = outs.length ? outs[0].id : null;
    }
    return null;
  }

  walk(steps[0].id, 0, null);

  // Cualquier paso no alcanzado por el recorrido se agrega al final para no
  // perder contenido (protege ante datos con enlaces incompletos).
  steps.forEach(s => {
    if (!visited.has(s.id)) {
      counter += 1;
      result.push({ step: s, number: String(counter), depth: 0, branchLabel: null, conditional: false });
    }
  });

  return result;
}

export default buildStepOutline;
