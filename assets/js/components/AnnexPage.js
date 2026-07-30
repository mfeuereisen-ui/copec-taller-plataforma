// components/AnnexPage.js
import { defineComponent, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAnnex, findUsingAnnex, getProtocol } from '../store.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';
import FillableAnnex from './FillableAnnex.js';

export default defineComponent({
  name: 'AnnexPage',
  components: { Icon, Badge, FillableAnnex },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const annex = computed(() => getAnnex(route.params.code));
    const using = computed(() => annex.value ? findUsingAnnex(annex.value.code) : []);

    function goToProtocol(p) { router.push(`/protocolo/${p.code}`); }
    function print() { window.print(); }
    function goBack() {
      if (window.history.length > 1) router.back();
      else router.push('/anexos');
    }

    return { route, annex, using, goToProtocol, print, goBack };
  },
  template: `
    <div v-if="!annex" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
      <Icon name="alert" :size="40" :stroke="$c.ink400" class="mx-auto mb-3" />
      <h2 class="text-lg font-semibold text-ink-900 mb-1">Anexo no encontrado</h2>
      <p class="text-ink-500 text-sm mb-4">El anexo {{ route.params.code }} no existe o no fue cargado.</p>
      <router-link to="/anexos" class="text-brand-700 text-sm hover:underline">← Volver a la biblioteca</router-link>
    </div>
    <div v-else class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <!-- VOLVER -->
      <button @click="goBack"
        class="no-print inline-flex items-center gap-1.5 mb-4 text-[13px] text-ink-500 hover:text-ink-900 transition">
        <Icon name="arrow-left" :size="15" />
        Volver
      </button>

      <!-- HEADER -->
      <header class="mb-6">
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="safe" size="md" rounded>{{ annex.code }}</Badge>
              <Badge variant="neutral" size="md">{{ annex.type }}</Badge>
              <span class="text-[11px] text-ink-500">v{{ annex.version }}</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 leading-tight">{{ annex.title }}</h1>
            <p v-if="annex.description" class="text-ink-500 mt-2 text-[14.5px] leading-relaxed">{{ annex.description }}</p>
          </div>
          <button @click="print" class="p-2 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-500 no-print" title="Imprimir">
            <Icon name="print" :size="16" />
          </button>
        </div>
      </header>

      <!-- META -->
      <section class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div class="p-3 bg-ink-50 rounded-xl">
          <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Frecuencia</div>
          <div class="text-[13.5px] text-ink-900">{{ annex.frequency }}</div>
        </div>
        <div class="p-3 bg-ink-50 rounded-xl">
          <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Archivo</div>
          <div class="text-[13.5px] text-ink-900">{{ annex.archivalYears }} año(s)</div>
        </div>
        <div class="p-3 bg-ink-50 rounded-xl">
          <div class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-1">Vinculado a</div>
          <div class="text-[13.5px] text-ink-900">{{ using.length }} protocolo(s)</div>
        </div>
      </section>

      <!-- FORMULARIO RELLENABLE (anexos con fillable: true) -->
      <FillableAnnex v-if="annex.fillable" :annex="annex" class="mb-6" />

      <!-- CAMPOS DE CABECERA (solo para anexos NO rellenables) -->
      <section v-if="!annex.fillable && annex.headerFields && annex.headerFields.length" class="mb-6">
        <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Campos de cabecera</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div v-for="f in annex.headerFields" :key="f"
            class="px-3 py-2 bg-white border border-ink-100 rounded-lg text-[13px] text-ink-700 flex items-center gap-2">
            <span class="w-1 h-1 bg-brand-700 rounded-full"></span>
            {{ f }}
          </div>
        </div>
      </section>

      <!-- CHECKS -->
      <section v-if="!annex.fillable && annex.checks && annex.checks.length" class="mb-6">
        <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Ítems a verificar</h3>
        <ol class="space-y-2 counter-reset-item">
          <li v-for="(c, i) in annex.checks" :key="i"
            class="flex items-start gap-3 p-3 bg-white border border-ink-100 rounded-lg">
            <span class="w-6 h-6 bg-brand-50 text-brand-700 rounded-full flex items-center justify-center text-[11px] font-mono font-semibold flex-shrink-0">{{ i + 1 }}</span>
            <span class="text-[13.5px] text-ink-900">{{ c }}</span>
          </li>
        </ol>
      </section>

      <!-- SECTIONS -->
      <section v-if="!annex.fillable && annex.sections && annex.sections.length" class="mb-6">
        <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Secciones del formulario</h3>
        <ul class="space-y-2">
          <li v-for="(s, i) in annex.sections" :key="i"
            class="flex items-start gap-3 p-3 bg-white border border-ink-100 rounded-lg">
            <Icon name="check" :size="16" :stroke="$c.safe600" class="mt-0.5 flex-shrink-0" />
            <span class="text-[13.5px] text-ink-900">{{ s }}</span>
          </li>
        </ul>
      </section>

      <!-- STOP RULE -->
      <section v-if="annex.stopRule" class="mb-6 p-4 bg-warn-50 border-l-4 border-warn-500 rounded-r-lg flex items-start gap-3">
        <Icon name="alert" :size="20" :stroke="$c.warn700" class="flex-shrink-0 mt-0.5" />
        <div>
          <div class="text-[11px] uppercase tracking-wider font-semibold text-warn-700 mb-1">Regla de parada</div>
          <p class="text-[13.5px] text-ink-900">{{ annex.stopRule }}</p>
        </div>
      </section>

      <!-- USING -->
      <section v-if="using.length > 0">
        <h3 class="text-[11px] uppercase tracking-wider text-ink-500 font-semibold mb-3">Protocolos que utilizan este anexo</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <button v-for="p in using" :key="p.code" @click="goToProtocol(p)"
            class="text-left p-3 bg-white border border-ink-100 hover:border-brand-200 hover:shadow-card rounded-xl transition">
            <div class="text-[11px] font-mono font-semibold text-brand-700 mb-1">{{ p.code }}</div>
            <div class="text-[13.5px] text-ink-900">{{ p.shortTitle || p.title }}</div>
          </button>
        </div>
      </section>
    </div>
  `
});
