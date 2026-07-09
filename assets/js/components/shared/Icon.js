// components/shared/Icon.js
// Set de íconos SVG inline. Stroke-based, peso uniforme.

import { defineComponent, h } from 'vue';

const ICONS = {
  search: 'M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  home: 'M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10',
  shield: 'M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z',
  fire: 'M12 2c1 3 0 5-2 7s-3 4-3 7a5 5 0 0 0 10 0c0-2-1-3-1-5 2 1 3 3 3 5a7 7 0 1 1-14 0c0-5 4-8 7-14z',
  truck: 'M3 7h13v10H3zM16 10h4l3 3v4h-7zM6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM19 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  building: 'M4 21V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16M4 21h16M8 7h2M8 11h2M8 15h2M14 7h2M14 11h2M14 15h2',
  warning: 'M12 2l11 19H1L12 2zM12 9v6M12 18h.01',
  flask: 'M9 3h6M10 3v8L4 21h16L14 11V3',
  bolt: 'M13 2L3 14h8l-1 8 10-12h-8l1-8z',
  car: 'M5 17h14M3 13l2-7h14l2 7M5 13h14v4H5zM7 17v2H5v-2M19 17v2h-2v-2',
  droplet: 'M12 2s-7 9-7 13a7 7 0 0 0 14 0c0-4-7-13-7-13z',
  person: 'M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a8 8 0 0 1 16 0v1',
  'user-shield': 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1c0-4 4-7 8-7M19 14l4 2v3a4 4 0 0 1-4 4 4 4 0 0 1-4-4v-3l4-2z',
  medical: 'M9 3v6H3v6h6v6h6v-6h6V9h-6V3z',
  lift: 'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M5 21h14M9 7l3-3 3 3M15 17l-3 3-3-3',
  check: 'M5 12l5 5L20 7',
  'arrow-right': 'M5 12h14M13 5l7 7-7 7',
  'arrow-left': 'M19 12H5M11 5l-7 7 7 7',
  x: 'M6 6l12 12M6 18L18 6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  filter: 'M4 4h16l-6 8v6l-4 2v-8z',
  star: 'M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z',
  'star-filled': 'M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z',
  print: 'M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  book: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  zap: 'M13 2L3 14h8l-1 8 10-12h-8l1-8z',
  clock: 'M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20zM12 6v6l4 2',
  chevron: 'M9 6l6 6-6 6',
  'chevron-down': 'M6 9l6 6 6-6',
  link: 'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M9 13h6M9 17h6',
  graduation: 'M22 10L12 4 2 10l10 6 10-6zM6 12v5c2 2 4 3 6 3s4-1 6-3v-5',
  alert: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'
};

export default defineComponent({
  name: 'AppIcon',
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 20 },
    stroke: { type: String, default: 'currentColor' },
    strokeWidth: { type: [Number, String], default: 1.75 },
    fill: { type: String, default: 'none' }
  },
  render() {
    const d = ICONS[this.name];
    if (!d) return null;
    return h('svg', {
      width: this.size,
      height: this.size,
      viewBox: '0 0 24 24',
      fill: this.fill,
      stroke: this.stroke,
      'stroke-width': this.strokeWidth,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: 'inline-block flex-shrink-0'
    }, [h('path', { d })]);
  }
});
