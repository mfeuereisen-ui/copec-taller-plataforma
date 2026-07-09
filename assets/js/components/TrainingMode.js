// components/TrainingMode.js
import { defineComponent, computed } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../store.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'TrainingMode',
  components: { Icon, Badge },
  setup() {
    const router = useRouter();
    const protocols = computed(() => store.data?.protocols || []);

    function startTraining(p) {
      router.push(`/capacitacion/${p.code}`);
    }

    function progressFor(code) {
      return store.trainingProgress[code];
    }

    return { protocols, startTraining, progressFor };
  },
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <header class="mb-8">
        <div class="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-safe-700 font-semibold mb-3">
          <span class="w-1.5 h-1.5 bg-safe-500 rounded-full"></span>
          Modo capacitación
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 mb-2">Entrenamiento e inducción</h1>
        <p class="text-ink-500 max-w-2xl text-[15px]">
          Recorre cada protocolo paso a paso, revisa los riesgos críticos y valida tu comprensión con un quiz.
          Ideal para inducciones, refrescos y certificaciones internas.
        </p>
      </header>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <article v-for="p in protocols" :key="p.code"
          class="bg-white border border-ink-100 hover:border-safe-300 hover:shadow-cardH rounded-xl p-4 transition group">
          <div class="flex items-start justify-between gap-2 mb-3">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-[12px] font-mono font-semibold text-brand-700">{{ p.code }}</span>
                <Badge v-if="p.criticality === 'alto-riesgo'" variant="warn" size="sm">Alto riesgo</Badge>
              </div>
              <h3 class="text-[14.5px] font-semibold text-ink-900 leading-snug">{{ p.shortTitle || p.title }}</h3>
            </div>
            <div v-if="progressFor(p.code)" class="flex-shrink-0">
              <Badge variant="safe" size="sm">{{ progressFor(p.code).score }}%</Badge>
            </div>
          </div>
          <div class="flex items-center justify-between text-[11.5px] text-ink-500 mb-4">
            <span>{{ p.procedure?.steps?.length || 0 }} pasos</span>
            <span>{{ p.risks?.length || 0 }} riesgos</span>
          </div>
          <button @click="startTraining(p)"
            class="w-full bg-brand-900 hover:bg-brand-700 text-white text-[13px] font-medium py-2 rounded-lg flex items-center justify-center gap-1.5 transition">
            <Icon name="graduation" :size="14" stroke="white" />
            {{ progressFor(p.code) ? 'Repetir' : 'Iniciar' }} capacitación
          </button>
        </article>
      </div>
    </div>
  `
});
