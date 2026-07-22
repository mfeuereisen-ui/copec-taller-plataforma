// components/HomePage.js
import { defineComponent, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { store, isFavorite, toggleFavorite, getCategory } from '../store.js';
import { applyFilters, getAllTags } from '../services/filterEngine.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

// Sub-componente: card de protocolo principal
const ProtocolCard = defineComponent({
  name: 'ProtocolCard',
  components: { Icon, Badge },
  props: { protocol: Object },
  emits: ['open'],
  setup(props) {
    const cat = computed(() => getCategory(props.protocol.category));
    const isFav = computed(() => isFavorite(props.protocol.code));
    function fav(e) { e.stopPropagation(); toggleFavorite(props.protocol.code); }
    return { cat, isFav, fav };
  },
  template: `
    <article
      @click="$emit('open')"
      class="group cursor-pointer bg-white border border-ink-100 hover:border-brand-200 hover:shadow-cardH rounded-2xl p-5 transition relative overflow-hidden"
    >
      <!-- Lateral color por criticidad -->
      <div class="absolute left-0 top-0 bottom-0 w-1"
        :class="protocol.criticality === 'alto-riesgo' ? 'bg-warn-500' : protocol.criticality === 'medio' ? 'bg-brand-500' : 'bg-safe-500'"
      ></div>
      <div class="flex items-start justify-between gap-3 mb-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[12px] font-mono font-semibold text-brand-700">{{ protocol.code }}</span>
            <Badge v-if="protocol.criticality === 'alto-riesgo'" variant="warn" size="sm">Alto riesgo</Badge>
          </div>
          <h3 class="font-semibold text-ink-900 leading-snug text-[15px] line-clamp-2 group-hover:text-brand-700 transition">
            {{ protocol.shortTitle || protocol.title }}
          </h3>
        </div>
        <button @click="fav" class="opacity-50 hover:opacity-100" :class="{'opacity-100 text-warn-500': isFav}">
          <Icon :name="isFav ? 'star-filled' : 'star'" :size="18" :fill="isFav ? '#F59E0B' : 'none'" :stroke="isFav ? '#F59E0B' : '#94A3B8'" />
        </button>
      </div>
      <p v-if="protocol.objective" class="text-[12.5px] text-ink-500 line-clamp-2 mb-4">{{ protocol.objective }}</p>
      <div class="flex items-center justify-between text-[11px] text-ink-500">
        <div class="flex items-center gap-2">
          <Badge v-if="cat" variant="brand" size="sm">{{ cat.shortName }}</Badge>
          <span v-if="protocol.procedure?.steps?.length" class="inline-flex items-center gap-1">
            <Icon name="list" :size="12" stroke="#94A3B8" /> {{ protocol.procedure.steps.length }} pasos
          </span>
        </div>
        <span>{{ protocol.lastUpdated }}</span>
      </div>
    </article>
  `
});

// Sub-componente compacto para listas
const ProtocolCardCompact = defineComponent({
  name: 'ProtocolCardCompact',
  components: { Icon, Badge },
  props: { protocol: Object },
  emits: ['open'],
  template: `
    <button @click="$emit('open')"
      class="w-full text-left bg-white border border-ink-100 hover:border-brand-200 hover:bg-brand-50/30 rounded-xl px-4 py-3 transition flex items-center gap-3 group">
      <div class="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
        :class="protocol.criticality === 'alto-riesgo' ? 'bg-warn-50' : 'bg-brand-50'">
        <Icon name="shield" :size="16"
          :stroke="protocol.criticality === 'alto-riesgo' ? '#B45309' : '#1D4ED8'" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-[11.5px] font-mono font-semibold text-brand-700">{{ protocol.code }}</span>
          <Badge v-if="protocol.criticality === 'alto-riesgo'" variant="warn" size="sm">Alto riesgo</Badge>
        </div>
        <div class="text-sm text-ink-900 truncate">{{ protocol.shortTitle || protocol.title }}</div>
      </div>
      <Icon name="chevron" :size="16" stroke="#94A3B8" class="opacity-0 group-hover:opacity-100 transition" />
    </button>
  `
});

export default defineComponent({
  name: 'HomePage',
  components: { Icon, Badge, ProtocolCard, ProtocolCardCompact },
  setup() {
    const router = useRouter();
    const view = ref('grid'); // grid | category | risk | service
    const showFilters = ref(false);

    const protocols = computed(() => applyFilters(store.data?.protocols || [], store.filters));
    const allTags = computed(() => getAllTags(store.data?.protocols || []));

    const categories = computed(() => store.data?.catalog.categories || []);
    const riskFamilies = computed(() => store.data?.catalog.risks || []);

    // Intro / glosario (contenido editable en data/catalog/intro.json)
    const intro = computed(() => store.data?.catalog.intro?.intro || null);
    const glossary = computed(() => store.data?.catalog.intro?.glossary || []);
    const showIntro = ref(false);
    function toggleIntro() { showIntro.value = !showIntro.value; }

    // KPIs
    const totalProtocols = computed(() => store.data?.protocols.length || 0);
    const highRiskCount = computed(() => (store.data?.protocols || []).filter(p => p.criticality === 'alto-riesgo').length);
    const annexCount = computed(() => store.data?.annexes.length || 0);

    // Quick accesses
    const emergencyProtocols = computed(() => {
      const codes = ['P3-02', 'P1-05', 'P2-06', 'P1-03'];
      return codes.map(c => store.data?.indices.byCode.get(c)).filter(Boolean);
    });

    const criticalProtocols = computed(() =>
      (store.data?.protocols || []).filter(p => p.criticality === 'alto-riesgo').slice(0, 6)
    );

    const recentProtocols = computed(() => {
      return [...(store.data?.protocols || [])]
        .sort((a, b) => (b.lastUpdated || '').localeCompare(a.lastUpdated || ''))
        .slice(0, 5);
    });

    function openProtocol(p) {
      router.push(`/protocolo/${p.code}`);
    }

    function setView(v) { view.value = v; }
    function resetFilters() {
      store.filters.category = 'all';
      store.filters.service = 'all';
      store.filters.criticality = 'all';
      store.filters.riskFamily = 'all';
      store.filters.tag = null;
      store.filters.sortBy = 'code';
    }
    function hasActiveFilters() {
      const f = store.filters;
      return f.category !== 'all' || f.service !== 'all' || f.criticality !== 'all' ||
             f.riskFamily !== 'all' || f.tag !== null;
    }

    function categoryProtocols(catId) {
      return (store.data?.protocols || []).filter(p => p.category === catId);
    }

    function riskProtocols(family) {
      const codes = Array.from(store.data?.indices.riskIndex.get(family) || []);
      return codes.map(c => store.data?.indices.byCode.get(c)).filter(Boolean);
    }

    function serviceProtocols(service) {
      return store.data?.indices.byService[service] || [];
    }

    return {
      store, view, showFilters, protocols, allTags, categories, riskFamilies,
      intro, glossary, showIntro, toggleIntro,
      totalProtocols, highRiskCount, annexCount,
      emergencyProtocols, criticalProtocols, recentProtocols,
      openProtocol, setView, resetFilters, hasActiveFilters,
      categoryProtocols, riskProtocols, serviceProtocols,
      isFavorite, toggleFavorite, getCategory
    };
  },
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <!-- HERO -->
      <section class="mb-10">
        <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <div class="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-safe-700 font-semibold mb-3">
              <span class="w-1.5 h-1.5 bg-safe-500 rounded-full"></span>
              Mapa Operacional
            </div>
            <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 mb-2">
              Manual de Seguridad<span class="text-brand-700"> Operacional</span>
            </h1>
            <p class="text-ink-500 text-[15px] max-w-2xl">
              Tu herramienta de consulta operacional. Encuentra cualquier protocolo, comprende su flujo y accede a toda la documentación relacionada en segundos.
            </p>
          </div>
          <!-- KPIs -->
          <div class="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <div class="px-3 sm:px-4 py-3 bg-brand-50 rounded-xl">
              <div class="text-xl sm:text-2xl font-bold text-brand-900 leading-tight">{{ totalProtocols }}</div>
              <div class="text-[10.5px] sm:text-[11px] text-brand-700 mt-0.5">Protocolos</div>
            </div>
            <div class="px-3 sm:px-4 py-3 bg-warn-50 rounded-xl">
              <div class="text-xl sm:text-2xl font-bold text-warn-700 leading-tight">{{ highRiskCount }}</div>
              <div class="text-[10.5px] sm:text-[11px] text-warn-700 mt-0.5">Alto riesgo</div>
            </div>
            <div class="px-3 sm:px-4 py-3 bg-safe-50 rounded-xl">
              <div class="text-xl sm:text-2xl font-bold text-safe-700 leading-tight">{{ annexCount }}</div>
              <div class="text-[10.5px] sm:text-[11px] text-safe-700 mt-0.5">Anexos</div>
            </div>
          </div>
        </div>
      </section>

      <!-- INTRODUCCIÓN / GLOSARIO (colapsable) -->
      <section v-if="intro" class="mb-10">
        <button @click="toggleIntro"
          class="w-full flex items-center gap-3 px-4 py-3 bg-brand-50 hover:bg-brand-100 border border-brand-100 rounded-xl transition text-left"
          :aria-expanded="showIntro" aria-controls="intro-panel">
          <div class="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center flex-shrink-0">
            <Icon name="book" :size="18" stroke="white" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[14.5px] font-semibold text-ink-900">{{ intro.title }}</div>
            <div class="text-[12.5px] text-ink-500">{{ intro.subtitle }}</div>
          </div>
          <Icon :name="showIntro ? 'chevron-down' : 'chevron'" :size="18" stroke="#1D4ED8" class="flex-shrink-0" />
        </button>

        <transition name="slide-up">
          <div v-if="showIntro" id="intro-panel" class="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- FAQs -->
            <div class="space-y-3">
              <div v-for="(f, i) in intro.faqs" :key="i" class="p-4 bg-white border border-ink-100 rounded-xl">
                <h3 class="text-[13.5px] font-semibold text-ink-900 mb-1">{{ f.q }}</h3>
                <p class="text-[13px] text-ink-700 leading-relaxed">{{ f.a }}</p>
              </div>
            </div>
            <!-- Glosario -->
            <div class="p-4 bg-white border border-ink-100 rounded-xl">
              <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Glosario de siglas y términos</h3>
              <dl class="space-y-2.5">
                <div v-for="(g, i) in glossary" :key="i" class="flex gap-3">
                  <dt class="text-[12.5px] font-mono font-semibold text-brand-700 flex-shrink-0 w-28">{{ g.term }}</dt>
                  <dd class="text-[12.5px] text-ink-700 flex-1">{{ g.definition }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </transition>
      </section>

      <!-- MÓDULO DE CAPACITACIÓN (destacado) -->
      <section class="mb-10">
        <button @click="$router.push('/capacitacion')"
          class="w-full text-left rounded-2xl overflow-hidden bg-brand-900 hover:bg-brand-800 transition group relative">
          <div class="px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Icon name="graduation" :size="26" stroke="white" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[11px] uppercase tracking-[0.18em] text-brand-100 font-semibold mb-1">Formación continua</div>
              <h2 class="text-lg sm:text-xl font-bold text-white leading-snug">Módulo de Capacitación</h2>
              <p class="text-[13.5px] text-brand-100 mt-1 max-w-2xl">
                Recorre cada protocolo paso a paso y valida tu comprensión. Pensado para capacitar de forma continua a técnicos, supervisores y todo el personal de operaciones.
              </p>
            </div>
            <div class="flex items-center gap-2 text-white font-medium text-[14px] flex-shrink-0">
              Ir a capacitación
              <Icon name="arrow-right" :size="18" stroke="white" class="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </section>

      <!-- QUICK ACCESS -->
      <section class="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Emergencias -->
        <div class="rounded-2xl border border-danger-100 bg-gradient-to-br from-danger-50 to-white p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-danger-100 flex items-center justify-center">
              <Icon name="alert" :size="20" stroke="#B91C1C" />
            </div>
            <div>
              <h3 class="font-semibold text-ink-900 text-[15px]">Emergencias</h3>
              <p class="text-[12px] text-ink-500">Respuesta inmediata</p>
            </div>
          </div>
          <ul class="space-y-1">
            <li v-for="p in emergencyProtocols.slice(0,3)" :key="p.code">
              <button @click="openProtocol(p)" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-card transition flex items-center justify-between group">
                <div class="min-w-0">
                  <span class="text-[11.5px] font-mono font-semibold text-danger-700">{{ p.code }}</span>
                  <div class="text-sm text-ink-900 truncate">{{ p.shortTitle || p.title }}</div>
                </div>
                <Icon name="chevron" :size="16" stroke="#B91C1C" class="opacity-0 group-hover:opacity-100 transition" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Críticos -->
        <div class="rounded-2xl border border-warn-100 bg-gradient-to-br from-warn-50 to-white p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-warn-100 flex items-center justify-center">
              <Icon name="warning" :size="20" stroke="#B45309" />
            </div>
            <div>
              <h3 class="font-semibold text-ink-900 text-[15px]">Protocolos críticos</h3>
              <p class="text-[12px] text-ink-500">Alto riesgo / cumplimiento obligatorio</p>
            </div>
          </div>
          <ul class="space-y-1">
            <li v-for="p in criticalProtocols.slice(0,3)" :key="p.code">
              <button @click="openProtocol(p)" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-card transition flex items-center justify-between group">
                <div class="min-w-0">
                  <span class="text-[11.5px] font-mono font-semibold text-warn-700">{{ p.code }}</span>
                  <div class="text-sm text-ink-900 truncate">{{ p.shortTitle || p.title }}</div>
                </div>
                <Icon name="chevron" :size="16" stroke="#B45309" class="opacity-0 group-hover:opacity-100 transition" />
              </button>
            </li>
          </ul>
        </div>

        <!-- Recientes -->
        <div class="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center">
              <Icon name="clock" :size="20" stroke="#1D4ED8" />
            </div>
            <div>
              <h3 class="font-semibold text-ink-900 text-[15px]">Actualizados</h3>
              <p class="text-[12px] text-ink-500">Últimas modificaciones</p>
            </div>
          </div>
          <ul class="space-y-1">
            <li v-for="p in recentProtocols.slice(0,3)" :key="p.code">
              <button @click="openProtocol(p)" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-card transition flex items-center justify-between group">
                <div class="min-w-0">
                  <span class="text-[11.5px] font-mono font-semibold text-brand-700">{{ p.code }}</span>
                  <div class="text-sm text-ink-900 truncate">{{ p.shortTitle || p.title }}</div>
                </div>
                <span class="text-[10.5px] text-ink-500 flex-shrink-0 ml-2">{{ p.lastUpdated }}</span>
              </button>
            </li>
          </ul>
        </div>
      </section>

      <!-- VIEWS TOOLBAR -->
      <section>
        <div class="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div class="flex items-center gap-1.5 bg-ink-50 rounded-lg p-1">
            <button v-for="opt in [
              {id:'grid', label:'Todos', icon:'grid'},
              {id:'category', label:'Por categoría', icon:'list'},
              {id:'risk', label:'Por riesgo', icon:'warning'},
              {id:'service', label:'Por servicio', icon:'truck'}
            ]" :key="opt.id"
              @click="setView(opt.id)"
              :class="['px-3 py-1.5 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition',
                view === opt.id ? 'bg-white text-brand-700 shadow-card' : 'text-ink-500 hover:text-ink-900']">
              <Icon :name="opt.icon" :size="14" />
              {{ opt.label }}
            </button>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="hasActiveFilters()" @click="resetFilters" class="text-[12px] text-brand-700 hover:underline">
              Limpiar filtros
            </button>
            <button @click="showFilters = !showFilters" class="px-3 py-1.5 rounded-md text-[13px] font-medium border border-ink-100 hover:bg-ink-50 flex items-center gap-1.5">
              <Icon name="filter" :size="14" />
              Filtros
            </button>
          </div>
        </div>

        <!-- FILTERS PANEL -->
        <div v-if="showFilters" class="mb-6 p-4 bg-ink-50 rounded-xl border border-ink-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-slide-up">
          <div>
            <label class="text-[11px] font-medium text-ink-500 uppercase tracking-wider block mb-1">Categoría</label>
            <select v-model="store.filters.category" class="w-full text-sm px-3 py-1.5 rounded-md border border-ink-100 bg-white">
              <option value="all">Todas</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.id }} — {{ c.shortName }}</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] font-medium text-ink-500 uppercase tracking-wider block mb-1">Servicio</label>
            <select v-model="store.filters.service" class="w-full text-sm px-3 py-1.5 rounded-md border border-ink-100 bg-white">
              <option value="all">Todos</option>
              <option value="estacion">Estación</option>
              <option value="movil">Taller móvil</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] font-medium text-ink-500 uppercase tracking-wider block mb-1">Criticidad</label>
            <select v-model="store.filters.criticality" class="w-full text-sm px-3 py-1.5 rounded-md border border-ink-100 bg-white">
              <option value="all">Todas</option>
              <option value="alto-riesgo">Alto riesgo</option>
              <option value="medio">Medio</option>
              <option value="bajo">Bajo</option>
            </select>
          </div>
          <div>
            <label class="text-[11px] font-medium text-ink-500 uppercase tracking-wider block mb-1">Familia de riesgo</label>
            <select v-model="store.filters.riskFamily" class="w-full text-sm px-3 py-1.5 rounded-md border border-ink-100 bg-white">
              <option value="all">Todas</option>
              <option v-for="r in riskFamilies" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
        </div>

        <!-- === Vista GRID === -->
        <div v-if="view === 'grid'">
          <div v-if="protocols.length === 0" class="text-center py-12 text-ink-500">
            <template v-if="store.loadErrors && store.loadErrors.length > 0">
              No se pudo cargar el contenido de protocolos en esta sesión (posible problema de red). Recarga la página para reintentar.
            </template>
            <template v-else>
              No hay protocolos que coincidan con los filtros aplicados.
            </template>
          </div>
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ProtocolCard v-for="p in protocols" :key="p.code" :protocol="p" @open="openProtocol(p)" />
          </div>
        </div>

        <!-- === Vista por CATEGORÍA === -->
        <div v-else-if="view === 'category'" class="space-y-8">
          <div v-for="c in categories" :key="c.id">
            <div class="flex items-baseline gap-3 mb-3">
              <Badge variant="brand" size="md" rounded>{{ c.id }}</Badge>
              <h3 class="text-lg font-semibold tracking-tight">{{ c.name }}</h3>
              <span class="text-[12px] text-ink-500">{{ categoryProtocols(c.id).length }} protocolo(s)</span>
            </div>
            <p class="text-[13px] text-ink-500 mb-4">{{ c.description }}</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <ProtocolCard v-for="p in categoryProtocols(c.id)" :key="p.code" :protocol="p" @open="openProtocol(p)" />
            </div>
            <div v-if="categoryProtocols(c.id).length === 0" class="text-[13px] text-ink-500 italic">Sin protocolos cargados en esta categoría.</div>
          </div>
        </div>

        <!-- === Vista por RIESGO === -->
        <div v-else-if="view === 'risk'" class="space-y-8">
          <div v-for="rf in riskFamilies" :key="rf.id">
            <div class="flex items-baseline gap-3 mb-4">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center"
                :class="rf.severity === 'alta' ? 'bg-danger-50' : rf.severity === 'media' ? 'bg-warn-50' : 'bg-safe-50'">
                <Icon name="warning" :size="18"
                  :stroke="rf.severity === 'alta' ? '#B91C1C' : rf.severity === 'media' ? '#B45309' : '#15803D'" />
              </div>
              <div>
                <h3 class="text-base font-semibold">{{ rf.name }}</h3>
                <div class="text-[11.5px] text-ink-500">Severidad: {{ rf.severity }} · {{ riskProtocols(rf.id).length }} protocolo(s)</div>
              </div>
            </div>
            <div v-if="riskProtocols(rf.id).length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <ProtocolCard v-for="p in riskProtocols(rf.id)" :key="p.code" :protocol="p" @open="openProtocol(p)" />
            </div>
            <div v-else class="text-[13px] text-ink-500 italic ml-12">Sin protocolos asociados a esta familia de riesgo.</div>
          </div>
        </div>

        <!-- === Vista por SERVICIO === -->
        <div v-else-if="view === 'service'" class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div v-for="srv in [
            {id:'estacion', name:'Estación de servicio', icon:'building', subtitle:'Operaciones físicas con foso, elevadores y atención presencial.'},
            {id:'movil',    name:'Taller móvil',         icon:'truck',    subtitle:'Servicios automotrices a domicilio del cliente.'}
          ]" :key="srv.id">
            <div class="flex items-start gap-3 mb-4">
              <div class="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center">
                <Icon :name="srv.icon" :size="22" stroke="#1D4ED8" />
              </div>
              <div>
                <h3 class="text-lg font-semibold">{{ srv.name }}</h3>
                <p class="text-[13px] text-ink-500">{{ srv.subtitle }}</p>
              </div>
            </div>
            <div class="space-y-2">
              <ProtocolCardCompact v-for="p in serviceProtocols(srv.id)" :key="p.code" :protocol="p" @open="openProtocol(p)" />
            </div>
          </div>
        </div>
      </section>
    </div>
  `
});

