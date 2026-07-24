// components/StepDetail.js
import { defineComponent, computed } from 'vue';
import { C } from '../tokens.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'StepDetail',
  components: { Icon, Badge },
  props: {
    step: { type: Object, required: true },
    protocol: { type: Object, required: true },
    canGoBack: { type: Boolean, default: false }
  },
  emits: ['close', 'select-step', 'go-back'],
  setup(props, { emit }) {
    const typeMeta = computed(() => {
      switch (props.step.type) {
        case 'decision': return { label: 'Punto de decisión', variant: 'warn', icon: 'filter', color: C.warn700 };
        case 'alert':    return { label: 'Alerta crítica',    variant: 'danger', icon: 'alert', color: C.danger700 };
        case 'end':      return { label: 'Cierre',            variant: 'safe', icon: 'check', color: C.safe700 };
        default:         return { label: 'Acción',            variant: 'brand', icon: 'arrow-right', color: C.brand700 };
      }
    });

    function targetSummary(id) {
      const target = props.protocol?.procedure?.steps?.find(s => s.id === id);
      return target ? (target.summary || target.title || '') : '';
    }
    function goToStep(id) {
      emit('select-step', id);
    }

    return { typeMeta, targetSummary, goToStep };
  },
  template: `
    <aside class="bg-white border-l border-ink-100 h-full flex flex-col">
      <!-- Header -->
      <div class="px-5 py-4 border-b border-ink-100">
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex items-center gap-2">
            <button v-if="canGoBack" @click="$emit('go-back')"
              class="inline-flex items-center gap-1 px-2 py-1 -ml-1 rounded text-[12px] text-ink-500 hover:bg-ink-50 hover:text-ink-900 transition"
              title="Volver al paso anterior">
              <Icon name="arrow-left" :size="14" />
              Volver
            </button>
            <Badge :variant="typeMeta.variant" size="md">
              <Icon :name="typeMeta.icon" :size="12" :stroke="typeMeta.color" />
              {{ typeMeta.label }}
            </Badge>
          </div>
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
            <li v-if="step.yes">
              <button @click="goToStep(step.yes)" class="w-full flex items-center gap-2 px-3 py-2 bg-safe-50 hover:bg-safe-100 rounded-lg text-[13px] text-left transition group">
                <Badge variant="safe" size="sm">{{ step.yesLabel || 'Sí' }}</Badge>
                <span class="text-ink-700 flex-1 min-w-0 truncate">{{ targetSummary(step.yes) || ('→ paso ' + step.yes) }}</span>
                <Icon name="chevron" :size="14" :stroke="$c.safe700" class="opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
              </button>
            </li>
            <li v-if="step.no">
              <button @click="goToStep(step.no)" class="w-full flex items-center gap-2 px-3 py-2 bg-danger-50 hover:bg-danger-100 rounded-lg text-[13px] text-left transition group">
                <Badge variant="danger" size="sm">{{ step.noLabel || 'No' }}</Badge>
                <span class="text-ink-700 flex-1 min-w-0 truncate">{{ targetSummary(step.no) || ('→ paso ' + step.no) }}</span>
                <Icon name="chevron" :size="14" :stroke="$c.danger700" class="opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
              </button>
            </li>
            <li v-for="b in step.branches" :key="b.label">
              <button @click="goToStep(b.next)" class="w-full flex items-center gap-2 px-3 py-2 bg-ink-50 hover:bg-ink-100 rounded-lg text-[13px] text-left transition group">
                <Badge variant="brand" size="sm">{{ b.label }}</Badge>
                <span class="text-ink-700 flex-1 min-w-0 truncate">{{ targetSummary(b.next) || ('→ paso ' + b.next) }}</span>
                <Icon name="chevron" :size="14" :stroke="$c.brand700" class="opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
              </button>
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
              <Icon name="check" :size="14" :stroke="$c.safe600" class="mt-0.5 flex-shrink-0" />
              <span>{{ v }}</span>
            </li>
          </ul>
        </section>

        <!-- Duración -->
        <section v-if="step.duration" class="flex items-center gap-2 text-[12.5px] text-ink-500">
          <Icon name="clock" :size="14" :stroke="$c.ink500" />
          <span>Duración estimada: <strong class="text-ink-900">{{ step.duration }}</strong></span>
        </section>

        <!-- EPP del protocolo aplicable -->
        <section v-if="protocol.epp && protocol.epp.length">
          <h4 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">EPP obligatorio (todo el protocolo)</h4>
          <ul class="space-y-1">
            <li v-for="e in protocol.epp.filter(x => x.obligatory)" :key="e.item"
              class="flex items-start gap-2 text-[12.5px] text-ink-700">
              <Icon name="check" :size="13" :stroke="$c.safe600" class="mt-0.5 flex-shrink-0" />
              <span>{{ e.item }}<span v-if="e.note" class="text-ink-500"> — {{ e.note }}</span></span>
            </li>
          </ul>
        </section>
      </div>
    </aside>
  `
});
