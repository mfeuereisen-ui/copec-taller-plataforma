// components/shared/Badge.js
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'AppBadge',
  props: {
    variant: { type: String, default: 'neutral' }, // neutral | brand | safe | warn | danger
    size: { type: String, default: 'md' }, // sm | md
    rounded: { type: Boolean, default: false }
  },
  template: `
    <span :class="cls">
      <slot />
    </span>
  `,
  computed: {
    cls() {
      const base = 'inline-flex items-center gap-1 font-medium tracking-tight';
      const sizes = {
        sm: 'px-1.5 py-0.5 text-[10.5px]',
        md: 'px-2 py-0.5 text-[11px]'
      };
      const variants = {
        neutral: 'bg-ink-100 text-ink-700',
        brand:   'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100',
        safe:    'bg-safe-50 text-safe-700 ring-1 ring-inset ring-safe-100',
        warn:    'bg-warn-50 text-warn-700 ring-1 ring-inset ring-warn-100',
        danger:  'bg-danger-50 text-danger-700 ring-1 ring-inset ring-danger-100'
      };
      const radius = this.rounded ? 'rounded-full' : 'rounded';
      return [base, sizes[this.size], variants[this.variant] || variants.neutral, radius].join(' ');
    }
  }
});
