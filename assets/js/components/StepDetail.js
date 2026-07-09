// components/StepDetail.js
import { defineComponent, computed } from 'vue';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'StepDetail',
  components: { Icon, Badge },
  props: {
    step: { type: Object, required: true },
    protocol: { type: Object, required: true }
  },
  emits: ['close'],
  setup(props) {
    const typeMeta = computed(() => {
      switch (props.step.type) {
        case 'decision': return { label: 'Punto de decisión', variant: 'warn', icon: 'filter', color: '#B45309' };
        case 'alert':    return { label: 'Alerta crítica',    variant: 'danger', icon: 'alert', color: '#B91C1C' };
        case 'end':      return { label: 'Cierre',            variant: 'safe', icon: 'check', color: '#15803D' };
        default:         return { label: 'Acción',            variant: 'brand', icon: 'arrow-right', color: '#1D4ED8' };
      }
    });

    return { typeMeta };
  },
  template: `
    <aside class="bg-white border-l border-ink-100 h-full flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-ink-100">
        <div class="flex items-start justify-between gap-3 mb-2">
          <Badge :variant="typeMeta.variant" size="md">
            <Icon :name="typeMeta.icon" :size="12" :stroke="typeMeta.color" />
            {{ typeMeta.label }}
          </Badge>
          <button @click="$emit('close')" class="p-1 hover:bg-ink-50 rounded text-ink-500 -mt-1 -mr-1">
            <Icon name="x" :size="18" />
          </button>
        </div>
        <h3 class="font-semibold text-ink-900 text-[17px] leading-snug">{{ step.title }}</h3>
        <p v-if="step.summary" class="text-[13px] text-ink-500 mt-1">{{ step.summary }}</p>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto p-5 space-y-5">
        <!-- Descripción -->
        <section v-if="step.description">
          <h4 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">Descripción</h4>
          <p class="text-[14px] text-ink-700 leading-relaxed">{{ step.description }}</p>
        </section>

        <!-- Decisión: ramas -->
        <section v-if="step.type === 'decision'">
          <h4 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">Bifurcación</h4>
          <ul class="space-y-1.5">
            <li v-if="step.yes" class="flex items-center gap-2 px-3 py-2 bg-safe-50 rounded-lg text-[13px]">
              <Badge variant="safe" size="sm">{{ step.yesLabel || 'Sí' }}</Badge>
              <span class="text-ink-700">→ paso <span class="font-mono">{{ step.yes }}</span></span>
            </li>
            <li v-if="step.no" class="flex items-center gap-2 px-3 py-2 bg-danger-50 rounded-lg text-[13px]">
              <Badge variant="danger" size="sm">{{ step.noLabel || 'No' }}</Badge>
              <span class="text-ink-700">→ paso <span class="font-mono">{{ step.no }}</span></span>
            </li>
            <li v-for="b in step.branches" :key="b.label" class="flex items-center gap-2 px-3 py-2 bg-ink-50 rounded-lg text-[13px]">
              <Badge variant="brand" size="sm">{{ b.label }}</Badge>
              <span class="text-ink-700">→ paso <span class="font-mono">{{ b.next }}</span></span>
            </li>
          </ul>
        </section>

        <!-- Alertas críticas -->
        <section v-if="step.criticalAlerts && step.criticalAlerts.length">
          <h4 class="text-[11px] uppercase tracking-wider text-danger-700 font-semibold mb-2">⚠ Alertas críticas</h4>
          <ul class="space-y-2">
            <li v-for="a in step.criticalAlerts" :key="a"
              class="px-3 py-2.5 bg-danger-50 border border-danger-100 rounded-lg text-[13px] text-danger-700">
              {{ a }}
            </li>
          </ul>
        </section>

        <!-- Verificaciones -->
        <section v-if="step.verifications && step.verifications.length">
          <h4 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">Verificaciones obligatorias</h4>
          <ul class="space-y-1.5">
            <li v-for="v in step.verifications" :key="v"
              class="flex items-start gap-2 text-[13px] text-ink-700">
              <Icon name="check" :size="14" stroke="#16A34A" class="mt-0.5 flex-shrink-0" />
              <span>{{ v }}</span>
            </li>
          </ul>
        </section>

        <!-- Duración -->
        <section v-if="step.duration" class="flex items-center gap-2 text-[12.5px] text-ink-500">
          <Icon name="clock" :size="14" stroke="#64748B" />
          <span>Duración estimada: <strong class="text-ink-900">{{ step.duration }}</strong></span>
        </section>

        <!-- EPP del protocolo aplicable -->
        <section v-if="protocol.epp && protocol.epp.length">
          <h4 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">EPP obligatorio (todo el protocolo)</h4>
          <ul class="space-y-1">
            <li v-for="e in protocol.epp.filter(x => x.obligatory)" :key="e.item"
              class="flex items-start gap-2 text-[12.5px] text-ink-700">
              <Icon name="check" :size="13" stroke="#16A34A" class="mt-0.5 flex-shrink-0" />
              <span>{{ e.item }}<span v-if="e.note" class="text-ink-500"> — {{ e.note }}</span></span>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  `
});
