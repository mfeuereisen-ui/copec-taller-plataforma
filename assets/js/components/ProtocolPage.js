// components/ProtocolPage.js
import { defineComponent, computed, ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { store, getProtocol, getCategory, isFavorite, toggleFavorite, pushHistory, findRelatedProtocols, getAnnex } from '../store.js';
import { findStep } from '../services/flowRenderer.js';
import { buildStepOutline } from '../services/stepOutline.js';
import FlowDiagram from './FlowDiagram.js';
import StepDetail from './StepDetail.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'ProtocolPage',
  components: { FlowDiagram, StepDetail, Icon, Badge },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const activeTab = ref('flow');
    const selectedStepId = ref(null);
    const stepHistory = ref([]); // pila de pasos visitados para el botón "volver"

    const protocol = computed(() => getProtocol(route.params.code));
    const category = computed(() => protocol.value ? getCategory(protocol.value.category) : null);
    const fav = computed(() => protocol.value ? isFavorite(protocol.value.code) : false);
    const selectedStep = computed(() => protocol.value ? findStep(protocol.value.procedure, selectedStepId.value) : null);
    const canGoBackStep = computed(() => stepHistory.value.length > 0);
    const related = computed(() => protocol.value ? findRelatedProtocols(protocol.value.code) : []);
    const stepOutline = computed(() => protocol.value ? buildStepOutline(protocol.value.procedure) : []);
    const linkedAnnexes = computed(() => {
      if (!protocol.value) return [];
      return (protocol.value.linkedAnnexes || []).map(c => getAnnex(c)).filter(Boolean);
    });

    function selectStep(id) {
      // Guarda el paso actual en el historial antes de saltar al nuevo
      if (selectedStepId.value && selectedStepId.value !== id) {
        stepHistory.value.push(selectedStepId.value);
      }
      selectedStepId.value = id;
    }
    function goBackStep() {
      const prev = stepHistory.value.pop();
      if (prev) selectedStepId.value = prev;
    }
    function closeDetail() { selectedStepId.value = null; stepHistory.value = []; }
    function toggleFav() { if (protocol.value) toggleFavorite(protocol.value.code); }
    function print() { window.print(); }
    function goToAnnex(a) { router.push(`/anexo/${a.code}`); }
    function goToProtocol(p) { router.push(`/protocolo/${p.code}`); }
    function goToTraining() { if (protocol.value) router.push(`/capacitacion/${protocol.value.code}`); }

    // Normativas: soportan string plano u objeto { text, url }
    function normativeText(n) { return typeof n === 'string' ? n : (n?.text || ''); }
    function normativeUrl(n) { return (n && typeof n === 'object' && n.url) ? n.url : null; }

    // Registrar en historial
    watch(protocol, (p) => {
      if (p) pushHistory(p.code);
    }, { immediate: true });

    // Resetear estado al cambiar de ruta
    watch(() => route.params.code, () => {
      selectedStepId.value = null;
      stepHistory.value = [];
      activeTab.value = 'flow';
    });

    return {
      route, protocol, category, fav, selectedStep, selectedStepId, activeTab,
      related, linkedAnnexes, canGoBackStep, stepOutline,
      selectStep, goBackStep, closeDetail, toggleFav, print, goToAnnex, goToProtocol, goToTraining,
      normativeText, normativeUrl
    };
  },
  template: `
    <div v-if="!protocol" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <Icon name="alert" :size="40" :stroke="$c.ink400" class="mx-auto mb-3" />
      <h2 class="text-lg font-semibold text-ink-900 mb-1">Protocolo no encontrado</h2>
      <p class="text-ink-500 text-sm mb-4">El protocolo {{ route.params.code }} no existe o no fue cargado.</p>
      <router-link to="/" class="text-brand-700 text-sm hover:underline">← Volver al inicio</router-link>
    </div>
    <div v-else class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <!-- HEADER PROTOCOLO -->
      <header class="mb-6">
        <div class="flex items-start justify-between gap-4 mb-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="brand" size="md" rounded>{{ protocol.code }}</Badge>
              <Badge v-if="category" variant="neutral" size="md">{{ category.shortName }}</Badge>
              <Badge v-if="protocol.criticality === 'alto-riesgo'" variant="warn" size="md">⚠ Alto riesgo</Badge>
              <span class="text-[11px] text-ink-500">v{{ protocol.version }} · {{ protocol.lastUpdated }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 leading-tight">{{ protocol.title }}</h1>
          </div>
          <!-- Acciones -->
          <div class="flex items-center gap-1.5 no-print">
            <button @click="toggleFav" :class="['p-2 rounded-lg border', fav ? 'border-warn-100 bg-warn-50 text-warn-700' : 'border-ink-100 hover:bg-ink-50 text-ink-500']" :title="fav ? 'Quitar de favoritos' : 'Agregar a favoritos'">
              <Icon :name="fav ? 'star-filled' : 'star'" :size="16" :fill="fav ? $c.warn500 : 'none'" :stroke="fav ? $c.warn500 : $c.ink500" />
            </button>
            <button @click="goToTraining" class="p-2 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-500" title="Modo capacitación">
              <Icon name="graduation" :size="16" />
            </button>
            <button @click="print" class="p-2 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-500" title="Imprimir">
              <Icon name="print" :size="16" />
            </button>
          </div>
        </div>

        <!-- Alert banner -->
        <div v-if="protocol.alertBanner && protocol.criticality === 'alto-riesgo'"
          class="mt-4 px-4 py-3 bg-warn-50 border-l-4 border-warn-500 rounded-r-lg flex items-start gap-3">
          <Icon name="alert" :size="20" :stroke="$c.warn700" class="flex-shrink-0 mt-0.5" />
          <div>
            <div class="text-[12px] uppercase tracking-wider font-semibold text-warn-700">Protocolo de cumplimiento obligatorio</div>
            <p class="text-[14px] text-ink-900 mt-0.5">{{ protocol.alertBanner }}</p>
          </div>
        </div>
      </header>

      <!-- RESUMEN -->
      <section class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 no-print">
        <div class="p-4 bg-ink-50 rounded-xl">
          <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">Objetivo</div>
          <p class="text-[13.5px] text-ink-700 leading-relaxed">{{ protocol.objective }}</p>
        </div>
        <div class="p-4 bg-ink-50 rounded-xl">
          <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">Alcance</div>
          <p class="text-[13.5px] text-ink-700 leading-relaxed">{{ protocol.scope }}</p>
        </div>
      </section>

      <!-- TABS -->
      <div class="border-b border-ink-100 mb-6 no-print">
        <nav class="flex gap-1 -mb-px overflow-x-auto" role="tablist" aria-label="Secciones del protocolo">
          <button v-for="t in [
            { id:'flow',       label:'Diagrama de flujo', icon:'grid' },
            { id:'steps',      label:'Paso a paso',      icon:'list', count: stepOutline.length },
            { id:'risks',      label:'Riesgos',           icon:'warning', count: protocol.risks?.length },
            { id:'epp',        label:'EPP y herramientas', icon:'shield' },
            { id:'responsibles', label:'Responsables',     icon:'person' },
            { id:'normatives', label:'Normativa',         icon:'book' },
            { id:'annexes',    label:'Anexos',            icon:'file', count: linkedAnnexes.length },
            { id:'stops',      label:'Reglas de parada',  icon:'alert', count: protocol.stopRules?.length },
            { id:'emergency',  label:'Emergencias',       icon:'medical' }
          ]" :key="t.id"
            @click="activeTab = t.id"
            role="tab"
            :id="'tab-' + t.id"
            :aria-selected="activeTab === t.id"
            :aria-controls="'panel-' + t.id"
            :tabindex="activeTab === t.id ? 0 : -1"
            :class="['flex items-center gap-1.5 px-3.5 py-2.5 text-[13px] font-medium border-b-2 whitespace-nowrap transition',
              activeTab === t.id ? 'border-brand-700 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-900']">
            <Icon :name="t.icon" :size="14" />
            {{ t.label }}
            <span v-if="t.count" :class="['ml-1 px-1.5 rounded text-[10px] font-mono',
              activeTab === t.id ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500']">{{ t.count }}</span>
          </button>
        </nav>
      </div>

      <!-- TAB CONTENT -->
      <div class="protocol-detail" role="tabpanel" :id="'panel-' + activeTab" :aria-labelledby="'tab-' + activeTab">
        <!-- FLOW -->
        <div v-if="activeTab === 'flow'" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div :class="['bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-card', selectedStep ? 'lg:col-span-2' : 'lg:col-span-3']">
            <FlowDiagram :procedure="protocol.procedure" :current-step-id="selectedStepId" @select-step="selectStep" />
          </div>
          <transition name="slide-up">
            <div v-if="selectedStep" class="bg-white border border-ink-100 rounded-2xl overflow-hidden shadow-card lg:max-h-[700px]">
              <StepDetail :step="selectedStep" :protocol="protocol" :can-go-back="canGoBackStep" @close="closeDetail" @select-step="selectStep" @go-back="goBackStep" />
            </div>
          </transition>
        </div>

        <!-- PASO A PASO -->
        <div v-if="activeTab === 'steps'" class="max-w-4xl">
          <p class="text-[13px] text-ink-500 mb-5">
            Procedimiento completo en orden de ejecución. Los pasos indentados son
            <span class="text-ink-700 font-medium">alternativas</span>: se aplican solo si se cumple la condición indicada, no se ejecutan todos.
          </p>

          <ol class="space-y-3">
            <li v-for="(it, i) in stepOutline" :key="it.step.id"
              :class="it.conditional ? 'ml-4 sm:ml-10' : ''">

              <!-- Etiqueta de la rama que activa este paso -->
              <div v-if="it.branchLabel" class="flex items-center gap-2 mb-1.5">
                <Icon name="arrow-right" :size="13" :stroke="$c.ink400" />
                <span class="text-[12px] text-ink-500">Si</span>
                <Badge :variant="it.conditional ? 'warn' : 'brand'" size="sm">{{ it.branchLabel }}</Badge>
              </div>

              <article :class="['rounded-xl border p-4',
                it.step.type === 'alert' ? 'bg-danger-50 border-danger-100'
                : it.step.type === 'decision' ? 'bg-warn-50 border-warn-100'
                : it.step.type === 'end' ? 'bg-safe-50 border-safe-100'
                : 'bg-white border-ink-100']">

                <div class="flex items-start gap-3">
                  <!-- Número o marca de alternativa -->
                  <div :class="['flex-shrink-0 flex items-center justify-center rounded-lg font-semibold',
                    it.number ? 'w-8 h-8 text-[13px]' : 'w-8 h-8 text-[11px]',
                    it.step.type === 'alert' ? 'bg-danger-100 text-danger-700'
                    : it.step.type === 'decision' ? 'bg-warn-100 text-warn-700'
                    : it.step.type === 'end' ? 'bg-safe-100 text-safe-700'
                    : 'bg-brand-50 text-brand-700']">
                    <span v-if="it.number">{{ it.number }}</span>
                    <Icon v-else name="arrow-right" :size="14" :stroke="$c.warn700" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="font-semibold text-ink-900 text-[15px] leading-snug">{{ it.step.title }}</h3>
                      <button @click="activeTab = 'flow'; selectStep(it.step.id)"
                        class="flex-shrink-0 text-[11.5px] text-ink-500 hover:text-brand-700 hover:underline no-print"
                        title="Ver este paso en el diagrama">ver en diagrama</button>
                    </div>

                    <p v-if="it.step.summary" class="text-[13px] text-ink-500 mt-0.5">{{ it.step.summary }}</p>
                    <p v-if="it.step.description" class="text-[13.5px] text-ink-700 leading-relaxed mt-2">{{ it.step.description }}</p>

                    <!-- Alertas críticas -->
                    <div v-if="it.step.criticalAlerts && it.step.criticalAlerts.length" class="mt-3 space-y-1.5">
                      <div v-for="(a, ai) in it.step.criticalAlerts" :key="ai"
                        class="flex items-start gap-2 px-3 py-2 bg-danger-100 rounded-lg">
                        <Icon name="alert" :size="15" :stroke="$c.danger700" class="flex-shrink-0 mt-0.5" />
                        <span class="text-[13px] text-danger-700 font-medium">{{ a }}</span>
                      </div>
                    </div>

                    <!-- Verificaciones -->
                    <div v-if="it.step.verifications && it.step.verifications.length" class="mt-3">
                      <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1.5">Verificar</div>
                      <ul class="space-y-1">
                        <li v-for="(v, vi) in it.step.verifications" :key="vi" class="flex items-start gap-2 text-[13px] text-ink-700">
                          <Icon name="check" :size="14" :stroke="$c.safe600" class="flex-shrink-0 mt-0.5" />
                          {{ v }}
                        </li>
                      </ul>
                    </div>

                    <!-- Opciones de una decisión -->
                    <div v-if="it.step.type === 'decision'" class="mt-3 flex flex-wrap gap-1.5">
                      <Badge v-if="it.step.yesLabel || it.step.yes" variant="safe" size="sm">{{ it.step.yesLabel || 'Sí' }}</Badge>
                      <Badge v-if="it.step.noLabel || it.step.no" variant="danger" size="sm">{{ it.step.noLabel || 'No' }}</Badge>
                      <Badge v-for="b in it.step.branches" :key="b.label" variant="warn" size="sm">{{ b.label }}</Badge>
                    </div>
                  </div>
                </div>
              </article>
            </li>
          </ol>
        </div>

        <!-- RISKS -->
        <div v-if="activeTab === 'risks'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <article v-for="r in protocol.risks" :key="r.id"
            class="p-4 bg-white border border-ink-100 rounded-xl">
            <div class="flex items-start gap-3">
              <div :class="['w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                r.severity === 'alta' ? 'bg-danger-50' : r.severity === 'media' ? 'bg-warn-50' : 'bg-safe-50']">
                <Icon name="warning" :size="18"
                  :stroke="r.severity === 'alta' ? $c.danger700 : r.severity === 'media' ? $c.warn700 : $c.safe700" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10.5px] font-mono text-ink-500">{{ r.id }}</span>
                  <Badge :variant="r.severity === 'alta' ? 'danger' : r.severity === 'media' ? 'warn' : 'safe'" size="sm">
                    Severidad {{ r.severity }}
                  </Badge>
                </div>
                <p class="text-[13.5px] text-ink-900">{{ r.description }}</p>
              </div>
            </div>
          </article>
        </div>

        <!-- EPP / TOOLS -->
        <div v-if="activeTab === 'epp'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Equipo de Protección Personal</h3>
            <ul class="space-y-2">
              <li v-for="e in protocol.epp" :key="e.item"
                class="flex items-start gap-3 p-3 bg-white border border-ink-100 rounded-lg">
                <Icon name="shield" :size="18" :stroke="$c.brand700" class="flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-0.5">
                    <span class="text-[13.5px] font-medium text-ink-900">{{ e.item }}</span>
                    <Badge v-if="e.obligatory" variant="brand" size="sm">Obligatorio</Badge>
                  </div>
                  <p v-if="e.note" class="text-[12px] text-ink-500">{{ e.note }}</p>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Herramientas y equipos</h3>
            <ul class="space-y-2">
              <li v-for="t in protocol.tools" :key="t.name"
                class="flex items-start gap-3 p-3 bg-white border border-ink-100 rounded-lg">
                <Icon name="zap" :size="18" :stroke="$c.brand700" class="flex-shrink-0 mt-0.5" />
                <div class="flex-1 min-w-0">
                  <div class="text-[13.5px] font-medium text-ink-900">{{ t.name }}</div>
                  <div v-if="t.verification" class="text-[11.5px] text-ink-500">Verificación: <code class="font-mono">{{ t.verification }}</code></div>
                  <div v-if="t.note" class="text-[11.5px] text-ink-500">{{ t.note }}</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- RESPONSIBLES -->
        <div v-if="activeTab === 'responsibles'" class="space-y-3">
          <article v-for="r in protocol.responsibles" :key="r.role"
            class="p-4 bg-white border border-ink-100 rounded-xl flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Icon name="person" :size="20" :stroke="$c.brand700" />
            </div>
            <div>
              <h4 class="text-[14.5px] font-semibold text-ink-900">{{ r.role }}</h4>
              <p class="text-[13px] text-ink-700 mt-0.5">{{ r.duty }}</p>
            </div>
          </article>
        </div>

        <!-- NORMATIVES -->
        <!-- Cada normativa puede ser un string (texto plano) o un objeto {text, url}.
             Si trae url, se muestra como enlace directo al documento. -->
        <div v-if="activeTab === 'normatives'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <template v-for="(n, i) in protocol.normatives" :key="i">
            <a v-if="normativeUrl(n)" :href="normativeUrl(n)" target="_blank" rel="noopener noreferrer"
              class="p-4 bg-white border border-ink-100 hover:border-brand-200 hover:shadow-card rounded-xl flex items-center gap-3 group transition">
              <div class="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                <Icon name="book" :size="20" :stroke="$c.brand700" />
              </div>
              <span class="text-[14px] text-brand-700 flex-1 group-hover:underline">{{ normativeText(n) }}</span>
              <Icon name="link" :size="15" :stroke="$c.brand700" class="opacity-0 group-hover:opacity-100 transition flex-shrink-0" />
            </a>
            <article v-else
              class="p-4 bg-white border border-ink-100 rounded-xl flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-ink-50 flex items-center justify-center flex-shrink-0">
                <Icon name="book" :size="20" :stroke="$c.brand700" />
              </div>
              <span class="text-[14px] text-ink-900">{{ normativeText(n) }}</span>
            </article>
          </template>
        </div>

        <!-- ANNEXES -->
        <div v-if="activeTab === 'annexes'" class="space-y-3">
          <div v-if="linkedAnnexes.length === 0" class="text-center py-8 text-ink-500 text-sm">
            Este protocolo no tiene anexos vinculados.
          </div>
          <div v-for="a in linkedAnnexes" :key="a.code">
            <button @click="goToAnnex(a)"
              class="w-full text-left p-4 bg-white border border-ink-100 hover:border-brand-200 hover:shadow-card rounded-xl flex items-start gap-3 group transition">
              <div class="w-10 h-10 rounded-lg bg-safe-50 flex items-center justify-center flex-shrink-0">
                <Icon name="file" :size="20" :stroke="$c.safe700" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[12px] font-mono font-semibold text-safe-700">{{ a.code }}</span>
                  <Badge variant="neutral" size="sm">{{ a.type }}</Badge>
                </div>
                <div class="text-[14px] font-medium text-ink-900">{{ a.title }}</div>
                <p v-if="a.description" class="text-[12.5px] text-ink-500 mt-1 line-clamp-2">{{ a.description }}</p>
              </div>
              <Icon name="chevron" :size="16" :stroke="$c.ink400" class="opacity-0 group-hover:opacity-100 transition mt-3" />
            </button>
          </div>
        </div>

        <!-- STOP RULES -->
        <div v-if="activeTab === 'stops'" class="space-y-2">
          <article v-for="(rule, i) in protocol.stopRules" :key="i"
            class="flex items-start gap-3 p-4 bg-warn-50 border-l-4 border-warn-500 rounded-r-lg">
            <Icon name="alert" :size="20" :stroke="$c.warn700" class="flex-shrink-0 mt-0.5" />
            <div>
              <div class="text-[11px] uppercase tracking-wider font-semibold text-warn-700 mb-1">DETENER inmediatamente</div>
              <p class="text-[13.5px] text-ink-900">{{ rule }}</p>
            </div>
          </article>
        </div>

        <!-- EMERGENCY -->
        <div v-if="activeTab === 'emergency'" class="space-y-3">
          <article v-for="(e, i) in protocol.emergencyActions" :key="i"
            class="p-4 bg-white border border-ink-100 rounded-xl">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center flex-shrink-0">
                <Icon name="medical" :size="20" :stroke="$c.danger700" />
              </div>
              <div class="flex-1">
                <h4 class="text-[14.5px] font-semibold text-ink-900 mb-1">{{ e.situation }}</h4>
                <p class="text-[13px] text-ink-700">{{ e.action }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- VERSIÓN DE IMPRESIÓN: solo visible al imprimir.               -->
      <!-- Renderiza TODO el protocolo en formato documento, sin tabs.  -->
      <!-- ============================================================ -->
      <div class="print-only protocol-print">
        <div class="print-section">
          <div class="print-h">Objetivo</div>
          <p>{{ protocol.objective }}</p>
        </div>
        <div class="print-section">
          <div class="print-h">Alcance</div>
          <p>{{ protocol.scope }}</p>
        </div>
        <div v-if="protocol.procedure && protocol.procedure.steps && protocol.procedure.steps.length" class="print-section">
          <div class="print-h">Procedimiento paso a paso</div>
          <ol class="print-steps">
            <li v-for="s in protocol.procedure.steps" :key="s.id">
              <strong>{{ s.title }}</strong>
              <template v-if="s.summary"> — {{ s.summary }}</template>
              <div v-if="s.description" class="print-sub">{{ s.description }}</div>
            </li>
          </ol>
        </div>
        <div v-if="protocol.risks && protocol.risks.length" class="print-section">
          <div class="print-h">Riesgos ({{ protocol.risks.length }})</div>
          <ul>
            <li v-for="r in protocol.risks" :key="r.id">[{{ r.id }} · Severidad {{ r.severity }}] {{ r.description }}</li>
          </ul>
        </div>
        <div v-if="protocol.epp && protocol.epp.length" class="print-section">
          <div class="print-h">EPP obligatorio</div>
          <ul>
            <li v-for="e in protocol.epp" :key="e.item">{{ e.item }}<template v-if="e.note"> — {{ e.note }}</template></li>
          </ul>
        </div>
        <div v-if="protocol.tools && protocol.tools.length" class="print-section">
          <div class="print-h">Herramientas y equipos</div>
          <ul>
            <li v-for="t in protocol.tools" :key="t.name">{{ t.name }}<template v-if="t.note"> — {{ t.note }}</template></li>
          </ul>
        </div>
        <div v-if="protocol.responsibles && protocol.responsibles.length" class="print-section">
          <div class="print-h">Responsables</div>
          <ul>
            <li v-for="r in protocol.responsibles" :key="r.role"><strong>{{ r.role }}:</strong> {{ r.duty }}</li>
          </ul>
        </div>
        <div v-if="protocol.stopRules && protocol.stopRules.length" class="print-section">
          <div class="print-h">Reglas de parada — DETENER inmediatamente si:</div>
          <ul>
            <li v-for="(rule, i) in protocol.stopRules" :key="i">{{ rule }}</li>
          </ul>
        </div>
        <div v-if="protocol.emergencyActions && protocol.emergencyActions.length" class="print-section">
          <div class="print-h">Acciones de emergencia</div>
          <ul>
            <li v-for="(e, i) in protocol.emergencyActions" :key="i"><strong>{{ e.situation }}:</strong> {{ e.action }}</li>
          </ul>
        </div>
        <div v-if="protocol.normatives && protocol.normatives.length" class="print-section">
          <div class="print-h">Normativa aplicable</div>
          <ul>
            <li v-for="(n, i) in protocol.normatives" :key="i">{{ normativeText(n) }}</li>
          </ul>
        </div>
        <div v-if="protocol.registry && protocol.registry.length" class="print-section">
          <div class="print-h">Registros obligatorios</div>
          <ul>
            <li v-for="(reg, i) in protocol.registry" :key="i">{{ reg }}</li>
          </ul>
        </div>
      </div>

      <!-- RELACIONADOS -->
      <section v-if="related.length > 0" class="mt-10 pt-8 border-t border-ink-100 no-print">
        <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-4">Protocolos relacionados</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button v-for="p in related" :key="p.code" @click="goToProtocol(p)"
            class="text-left p-3 bg-white border border-ink-100 hover:border-brand-200 hover:shadow-card rounded-xl transition">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[11px] font-mono font-semibold text-brand-700">{{ p.code }}</span>
              <Badge v-if="p.criticality === 'alto-riesgo'" variant="warn" size="sm">Alto riesgo</Badge>
            </div>
            <div class="text-[13.5px] text-ink-900">{{ p.shortTitle || p.title }}</div>
          </button>
        </div>
      </section>
    </div>
  `
});
