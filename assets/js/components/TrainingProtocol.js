// components/TrainingProtocol.js
import { defineComponent, computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, getProtocol, recordTraining } from '../store.js';
import { generateTraining } from '../services/trainingGenerator.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'TrainingProtocol',
  components: { Icon, Badge },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const protocol = computed(() => getProtocol(route.params.code));
    const training = computed(() => protocol.value ? generateTraining(protocol.value) : null);

    // Estado del wizard
    const stage = ref('intro'); // intro | steps | risks | stops | quiz | result
    const stepIdx = ref(0);
    const answers = ref({}); // questionId -> answer (index or [indices])
    const quizDone = ref(false);

    const totalSteps = computed(() => protocol.value?.procedure?.steps?.length || 0);
    const currentStep = computed(() => protocol.value?.procedure?.steps?.[stepIdx.value]);

    const score = computed(() => {
      if (!training.value) return 0;
      const qs = training.value.questions;
      if (qs.length === 0) return 100;
      let correct = 0;
      for (const q of qs) {
        const a = answers.value[q.id];
        if (q.type === 'single-choice' && a === q.correctIndex) correct++;
        else if (q.type === 'multi-choice' && Array.isArray(a) &&
                 a.length === q.correctIndices.length &&
                 a.every(i => q.correctIndices.includes(i))) correct++;
      }
      return Math.round((correct / qs.length) * 100);
    });

    function nextStage() {
      if (stage.value === 'intro') stage.value = 'steps';
      else if (stage.value === 'steps') {
        if (stepIdx.value < totalSteps.value - 1) stepIdx.value++;
        else stage.value = 'risks';
      }
      else if (stage.value === 'risks') stage.value = 'stops';
      else if (stage.value === 'stops') stage.value = 'quiz';
      else if (stage.value === 'quiz') {
        quizDone.value = true;
        stage.value = 'result';
        recordTraining(protocol.value.code, score.value);
      }
    }

    function prevStage() {
      if (stage.value === 'steps' && stepIdx.value > 0) stepIdx.value--;
      else if (stage.value === 'steps') stage.value = 'intro';
      else if (stage.value === 'risks') { stage.value = 'steps'; stepIdx.value = totalSteps.value - 1; }
      else if (stage.value === 'stops') stage.value = 'risks';
      else if (stage.value === 'quiz') stage.value = 'stops';
    }

    function answerSingle(qId, idx) { answers.value[qId] = idx; }
    function toggleMulti(qId, idx) {
      const cur = answers.value[qId] || [];
      const i = cur.indexOf(idx);
      if (i >= 0) cur.splice(i, 1);
      else cur.push(idx);
      answers.value[qId] = [...cur];
    }
    function isMultiSelected(qId, idx) { return (answers.value[qId] || []).includes(idx); }

    function restart() {
      stage.value = 'intro';
      stepIdx.value = 0;
      answers.value = {};
      quizDone.value = false;
    }

    function backToList() { router.push('/capacitacion'); }
    function goToProtocol() { router.push(`/protocolo/${protocol.value.code}`); }

    // Reset al cambiar de ruta
    watch(() => route.params.code, restart);

    return {
      protocol, training, stage, stepIdx, totalSteps, currentStep,
      answers, score, quizDone,
      nextStage, prevStage, answerSingle, toggleMulti, isMultiSelected,
      restart, backToList, goToProtocol
    };
  },
  template: `
    <div v-if="!protocol" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <Icon name="alert" :size="40" stroke="#94A3B8" class="mx-auto mb-3" />
      <h2 class="text-lg font-semibold text-ink-900 mb-1">Protocolo no encontrado</h2>
      <router-link to="/capacitacion" class="text-brand-700 text-sm hover:underline">← Volver a capacitación</router-link>
    </div>
    <div v-else class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header con código + título + stage indicator -->
      <header class="mb-6">
        <button @click="backToList" class="text-[12px] text-ink-500 hover:text-brand-700 mb-3 flex items-center gap-1">
          <Icon name="arrow-left" :size="12" /> Volver
        </button>
        <div class="flex items-center gap-2 mb-2">
          <Badge variant="brand" size="md" rounded>{{ protocol.code }}</Badge>
          <Badge v-if="protocol.criticality === 'alto-riesgo'" variant="warn" size="md">Alto riesgo</Badge>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-ink-900">{{ protocol.title }}</h1>

        <!-- Progress bar -->
        <div class="mt-4 flex items-center gap-1">
          <div v-for="s in ['intro','steps','risks','stops','quiz','result']" :key="s"
            :class="['flex-1 h-1 rounded-full',
              (s === stage || isPast(s, stage)) ? 'bg-brand-700' : 'bg-ink-100']"></div>
        </div>
        <div class="flex justify-between text-[10.5px] text-ink-500 mt-1.5 uppercase tracking-wider">
          <span>Intro</span><span>Pasos</span><span>Riesgos</span><span>Paradas</span><span>Quiz</span><span>Resultado</span>
        </div>
      </header>

      <!-- INTRO -->
      <section v-if="stage === 'intro'" class="bg-white border border-ink-100 rounded-2xl p-6 shadow-card">
        <Icon name="graduation" :size="36" stroke="#1D4ED8" class="mb-3" />
        <h2 class="text-xl font-semibold text-ink-900 mb-2">Capacitación en {{ protocol.shortTitle }}</h2>
        <p class="text-[14px] text-ink-700 leading-relaxed mb-4">{{ protocol.objective }}</p>
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="text-center p-3 bg-ink-50 rounded-lg">
            <div class="text-2xl font-bold text-ink-900">{{ totalSteps }}</div>
            <div class="text-[10.5px] text-ink-500 uppercase tracking-wider mt-0.5">Pasos</div>
          </div>
          <div class="text-center p-3 bg-ink-50 rounded-lg">
            <div class="text-2xl font-bold text-ink-900">{{ training?.questions.length || 0 }}</div>
            <div class="text-[10.5px] text-ink-500 uppercase tracking-wider mt-0.5">Preguntas</div>
          </div>
          <div class="text-center p-3 bg-ink-50 rounded-lg">
            <div class="text-2xl font-bold text-warn-700">{{ training?.stopRuleCards.length || 0 }}</div>
            <div class="text-[10.5px] text-ink-500 uppercase tracking-wider mt-0.5">Reglas de parada</div>
          </div>
        </div>
        <button @click="nextStage" class="w-full bg-brand-900 hover:bg-brand-700 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition">
          Comenzar capacitación
          <Icon name="arrow-right" :size="16" stroke="white" />
        </button>
      </section>

      <!-- STEPS -->
      <section v-if="stage === 'steps' && currentStep" class="bg-white border border-ink-100 rounded-2xl p-6 shadow-card">
        <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">
          Paso {{ stepIdx + 1 }} de {{ totalSteps }}
        </div>
        <h2 class="text-xl font-semibold text-ink-900 mb-3">{{ currentStep.title }}</h2>
        <p v-if="currentStep.description" class="text-[14px] text-ink-700 leading-relaxed mb-4">{{ currentStep.description }}</p>

        <div v-if="currentStep.criticalAlerts && currentStep.criticalAlerts.length" class="mb-4 p-4 bg-danger-50 border-l-4 border-danger-500 rounded-r-lg">
          <div class="text-[11px] uppercase tracking-wider font-semibold text-danger-700 mb-2">⚠ Alerta crítica</div>
          <ul class="space-y-1">
            <li v-for="a in currentStep.criticalAlerts" :key="a" class="text-[13.5px] text-ink-900">{{ a }}</li>
          </ul>
        </div>

        <div v-if="currentStep.verifications && currentStep.verifications.length" class="mb-2">
          <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-2">Debes verificar</div>
          <ul class="space-y-1.5">
            <li v-for="v in currentStep.verifications" :key="v" class="flex items-start gap-2 text-[13.5px] text-ink-700">
              <Icon name="check" :size="14" stroke="#16A34A" class="mt-0.5 flex-shrink-0" /> {{ v }}
            </li>
          </ul>
        </div>
      </section>

      <!-- RISKS -->
      <section v-if="stage === 'risks'" class="bg-white border border-ink-100 rounded-2xl p-6 shadow-card">
        <h2 class="text-xl font-semibold text-ink-900 mb-2">Riesgos críticos a tener presentes</h2>
        <p class="text-[13.5px] text-ink-500 mb-4">Estos son los riesgos identificados en este protocolo. Memorízalos.</p>
        <div class="space-y-2">
          <article v-for="r in protocol.risks" :key="r.id"
            :class="['p-3 border rounded-lg',
              r.severity === 'alta' ? 'bg-danger-50 border-danger-100' :
              r.severity === 'media' ? 'bg-warn-50 border-warn-100' :
              'bg-safe-50 border-safe-100']">
            <div class="flex items-start gap-3">
              <Badge :variant="r.severity === 'alta' ? 'danger' : r.severity === 'media' ? 'warn' : 'safe'" size="sm">{{ r.severity }}</Badge>
              <p class="text-[13.5px] text-ink-900">{{ r.description }}</p>
            </div>
          </article>
        </div>
      </section>

      <!-- STOPS -->
      <section v-if="stage === 'stops'" class="bg-white border border-ink-100 rounded-2xl p-6 shadow-card">
        <h2 class="text-xl font-semibold text-ink-900 mb-2">Cuándo DEBES detenerte</h2>
        <p class="text-[13.5px] text-ink-500 mb-4">Reglas no negociables. Si ocurre cualquiera de estas situaciones, detén la operación.</p>
        <div class="space-y-2">
          <article v-for="(rule, i) in protocol.stopRules" :key="i"
            class="flex items-start gap-3 p-3 bg-warn-50 border-l-4 border-warn-500 rounded-r-lg">
            <Icon name="alert" :size="18" stroke="#B45309" class="flex-shrink-0 mt-0.5" />
            <p class="text-[13.5px] text-ink-900">{{ rule }}</p>
          </article>
        </div>
      </section>

      <!-- QUIZ -->
      <section v-if="stage === 'quiz' && training" class="bg-white border border-ink-100 rounded-2xl p-6 shadow-card">
        <h2 class="text-xl font-semibold text-ink-900 mb-1">Quiz de comprensión</h2>
        <p class="text-[13.5px] text-ink-500 mb-5">Responde las {{ training.questions.length }} preguntas para validar tu aprendizaje.</p>

        <div class="space-y-6">
          <article v-for="(q, qi) in training.questions" :key="q.id" class="border-b border-ink-100 pb-5 last:border-0">
            <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1">
              Pregunta {{ qi + 1 }}<span v-if="q.type === 'multi-choice'"> · selección múltiple</span>
            </div>
            <h3 class="text-[14.5px] font-semibold text-ink-900 mb-3">{{ q.question }}</h3>
            <ul class="space-y-1.5">
              <li v-for="(opt, oi) in q.options" :key="oi">
                <label v-if="q.type === 'single-choice'"
                  :class="['flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition',
                    answers[q.id] === oi ? 'border-brand-700 bg-brand-50' : 'border-ink-100 hover:bg-ink-50']">
                  <input type="radio" :name="q.id" :checked="answers[q.id] === oi" @change="answerSingle(q.id, oi)" class="mt-0.5" />
                  <span class="text-[13.5px] text-ink-900">{{ opt }}</span>
                </label>
                <label v-else
                  :class="['flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition',
                    isMultiSelected(q.id, oi) ? 'border-brand-700 bg-brand-50' : 'border-ink-100 hover:bg-ink-50']">
                  <input type="checkbox" :checked="isMultiSelected(q.id, oi)" @change="toggleMulti(q.id, oi)" class="mt-0.5" />
                  <span class="text-[13.5px] text-ink-900">{{ opt }}</span>
                </label>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <!-- RESULT -->
      <section v-if="stage === 'result' && training" class="bg-white border border-ink-100 rounded-2xl p-6 shadow-card text-center">
        <div :class="['inline-flex items-center justify-center w-20 h-20 rounded-full mb-4',
          score >= 80 ? 'bg-safe-100' : score >= 60 ? 'bg-warn-100' : 'bg-danger-100']">
          <Icon name="check" :size="36"
            :stroke="score >= 80 ? '#15803D' : score >= 60 ? '#B45309' : '#B91C1C'" :stroke-width="2.5" />
        </div>
        <h2 class="text-2xl font-bold text-ink-900 mb-1">{{ score }}%</h2>
        <p class="text-[14.5px] text-ink-500 mb-6">
          {{ score >= 80 ? '¡Excelente! Tu nivel de comprensión es muy bueno.' :
             score >= 60 ? 'Aceptable, pero te recomendamos revisar el protocolo nuevamente.' :
             'Necesitas reforzar este protocolo. Repítelo cuando puedas.' }}
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <button @click="restart" class="px-4 py-2 border border-ink-100 hover:bg-ink-50 rounded-lg text-[13px] font-medium">
            Repetir capacitación
          </button>
          <button @click="goToProtocol" class="px-4 py-2 bg-brand-900 hover:bg-brand-700 text-white rounded-lg text-[13px] font-medium">
            Ver protocolo completo
          </button>
          <button @click="backToList" class="px-4 py-2 border border-ink-100 hover:bg-ink-50 rounded-lg text-[13px] font-medium">
            Volver a la lista
          </button>
        </div>
      </section>

      <!-- NAV BUTTONS -->
      <div v-if="stage !== 'intro' && stage !== 'result'" class="flex items-center justify-between mt-5">
        <button @click="prevStage" class="px-4 py-2 border border-ink-100 hover:bg-ink-50 rounded-lg text-[13px] font-medium text-ink-700 flex items-center gap-1.5">
          <Icon name="arrow-left" :size="14" /> Anterior
        </button>
        <button @click="nextStage" class="px-4 py-2 bg-brand-900 hover:bg-brand-700 text-white rounded-lg text-[13px] font-medium flex items-center gap-1.5">
          {{ stage === 'quiz' ? 'Ver resultado' : 'Siguiente' }}
          <Icon name="arrow-right" :size="14" stroke="white" />
        </button>
      </div>
    </div>
  `,
  methods: {
    isPast(s, currentStage) {
      const order = ['intro', 'steps', 'risks', 'stops', 'quiz', 'result'];
      return order.indexOf(s) < order.indexOf(currentStage);
    }
  }
});
