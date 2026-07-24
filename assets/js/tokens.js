// assets/js/tokens.js
// ---------------------------------------------------------------------------
// Tokens de color para JavaScript.
//
// Lee los valores definidos en assets/css/theme.css (:root), de modo que exista
// UNA sola fuente de verdad. Si cambias la identidad de marca, edita únicamente
// theme.css: los íconos, los diagramas de flujo y el tema de Mermaid tomarán
// los nuevos colores automáticamente.
//
// Uso en plantillas Vue (está registrado como propiedad global $c):
//     <Icon name="shield" :stroke="$c.brand700" />
//
// Uso en código JS:
//     import { C } from '../tokens.js';
//     const azul = C.brand700;
// ---------------------------------------------------------------------------

/**
 * Lee una variable CSS de :root y la devuelve como color usable.
 *
 * Las variables de theme.css están en canales RGB ("29 78 216") para que
 * Tailwind pueda aplicar opacidad, así que aquí se envuelven en rgb(...).
 * Si la variable no existe, se usa el fallback en hexadecimal.
 */
function readVar(name, fallback = '#000000') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(`--${name}`);
  const v = raw && raw.trim();
  if (!v) return fallback;
  // "29 78 216" -> "#1D4ED8".
  // IMPORTANTE: se devuelve HEXADECIMAL, no rgb(). Mermaid no sabe interpretar
  // rgb(...) dentro de sus directivas "style <id> fill:..." (el paréntesis rompe
  // su parser), y el hex funciona igual de bien en atributos SVG.
  const m = v.match(/^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/);
  if (!m) return v; // ya venía en otro formato (hex, nombre, etc.)
  const toHex = (n) => Number(n).toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(m[1])}${toHex(m[2])}${toHex(m[3])}`;
}

/**
 * Paleta expuesta a JS. Se resuelve una vez al cargar el módulo, que ocurre
 * después de que theme.css ya fue aplicado.
 */
export const C = {
  brand50:  readVar('brand-50',  '#EFF6FF'),
  brand100: readVar('brand-100', '#DBEAFE'),
  brand200: readVar('brand-200', '#BFDBFE'),
  brand300: readVar('brand-300', '#93C5FD'),
  brand500: readVar('brand-500', '#3B82F6'),
  brand600: readVar('brand-600', '#2563EB'),
  brand700: readVar('brand-700', '#1D4ED8'),
  brand800: readVar('brand-800', '#1E40AF'),
  brand900: readVar('brand-900', '#0B3D91'),

  safe50:  readVar('safe-50',  '#F0FDF4'),
  safe100: readVar('safe-100', '#DCFCE7'),
  safe300: readVar('safe-300', '#86EFAC'),
  safe500: readVar('safe-500', '#22C55E'),
  safe600: readVar('safe-600', '#16A34A'),
  safe700: readVar('safe-700', '#15803D'),

  warn50:  readVar('warn-50',  '#FFFBEB'),
  warn100: readVar('warn-100', '#FEF3C7'),
  warn500: readVar('warn-500', '#F59E0B'),
  warn700: readVar('warn-700', '#B45309'),

  danger50:  readVar('danger-50',  '#FEF2F2'),
  danger100: readVar('danger-100', '#FEE2E2'),
  danger500: readVar('danger-500', '#EF4444'),
  danger700: readVar('danger-700', '#B91C1C'),

  ink50:  readVar('ink-50',  '#F8FAFC'),
  ink100: readVar('ink-100', '#F1F5F9'),
  ink200: readVar('ink-200', '#E2E8F0'),
  ink300: readVar('ink-300', '#CBD5E1'),
  ink400: readVar('ink-400', '#94A3B8'),
  ink500: readVar('ink-500', '#64748B'),
  ink600: readVar('ink-600', '#475569'),
  ink700: readVar('ink-700', '#334155'),
  ink900: readVar('ink-900', '#0F172A')
};

export default C;
