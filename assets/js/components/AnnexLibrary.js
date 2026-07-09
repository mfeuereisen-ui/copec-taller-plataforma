// components/AnnexLibrary.js
import { defineComponent, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { store } from '../store.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'AnnexLibrary',
  components: { Icon, Badge },
  setup() {
    const router = useRouter();
    const typeFilter = ref('all');
    const search = ref('');

    const types = computed(() => {
      const s = new Set();
      (store.data?.annexes || []).forEach(a => s.add(a.type));
      return Array.from(s).sort();
    });

    const annexes = computed(() => {
      let list = store.data?.annexes || [];
      if (typeFilter.value !== 'all') list = list.filter(a => a.type === typeFilter.value);
      if (search.value.trim()) {
        const q = search.value.toLowerCase();
        list = list.filter(a =>
          a.code.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          (a.description || '').toLowerCase().includes(q)
        );
      }
      return [...list].sort((a, b) => a.code.localeCompare(b.code));
    });

    function open(a) { router.push(`/anexo/${a.code}`); }

    return { annexes, types, typeFilter, search, open };
  },
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <header class="mb-8">
        <div class="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-safe-700 font-semibold mb-3">
          <span class="w-1.5 h-1.5 bg-safe-500 rounded-full"></span>
          Biblioteca documental
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 mb-2">Anexos operacionales</h1>
        <p class="text-ink-500 max-w-2xl text-[15px]">
          Listas de verificación, formularios y registros vinculados a los protocolos del manual.
        </p>
      </header>

      <div class="flex flex-col sm:flex-row gap-3 mb-6">
        <div class="flex-1 relative">
          <Icon name="search" :size="16" stroke="#94A3B8" class="absolute left-3 top-1/2 -translate-y-1/2" />
          <input v-model="search" type="text" placeholder="Buscar por código, nombre o descripción…"
            class="w-full pl-9 pr-3 py-2 border border-ink-100 rounded-lg text-sm bg-white" />
        </div>
        <select v-model="typeFilter" class="px-3 py-2 border border-ink-100 rounded-lg text-sm bg-white">
          <option value="all">Todos los tipos</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div v-if="annexes.length === 0" class="text-center py-16 text-ink-500 text-sm">
        No se encontraron anexos que coincidan con los criterios.
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <button v-for="a in annexes" :key="a.code" @click="open(a)"
          class="text-left p-4 bg-white border border-ink-100 hover:border-safe-300 hover:shadow-cardH rounded-xl transition group">
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-[12px] font-mono font-semibold text-safe-700">{{ a.code }}</span>
              <Badge variant="neutral" size="sm">{{ a.type }}</Badge>
            </div>
            <Icon name="chevron" :size="14" stroke="#94A3B8" class="opacity-0 group-hover:opacity-100 transition mt-0.5" />
          </div>
          <h3 class="text-[14.5px] font-semibold text-ink-900 leading-snug mb-1">{{ a.title }}</h3>
          <p v-if="a.description" class="text-[12.5px] text-ink-500 line-clamp-2">{{ a.description }}</p>
          <div class="text-[11px] text-ink-500 mt-3 flex items-center gap-2">
            <Icon name="clock" :size="12" stroke="#94A3B8" />
            <span>{{ a.frequency }}</span>
          </div>
        </button>
      </div>
    </div>
  `
});
