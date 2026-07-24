// components/FavoritesPage.js
import { defineComponent, computed } from 'vue';
import { useRouter } from 'vue-router';
import { store, getProtocol, isFavorite, toggleFavorite } from '../store.js';
import Icon from './shared/Icon.js';
import Badge from './shared/Badge.js';

export default defineComponent({
  name: 'FavoritesPage',
  components: { Icon, Badge },
  setup() {
    const router = useRouter();

    const favorites = computed(() =>
      store.favorites.map(c => getProtocol(c)).filter(Boolean)
    );

    const recentHistory = computed(() =>
      store.history.slice(0, 10).map(h => ({
        protocol: getProtocol(h.code),
        ts: h.ts
      })).filter(x => x.protocol)
    );

    function open(p) { router.push(`/protocolo/${p.code}`); }
    function removeFav(code) { toggleFavorite(code); }
    function formatDate(ts) {
      const d = new Date(ts);
      return d.toLocaleDateString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    return { favorites, recentHistory, open, removeFav, formatDate };
  },
  template: `
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
      <header class="mb-8">
        <div class="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-warn-700 font-semibold mb-3">
          <span class="w-1.5 h-1.5 bg-warn-500 rounded-full"></span>
          Mi espacio
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 mb-2">Favoritos y reciente</h1>
        <p class="text-ink-500 text-[15px]">Tus protocolos guardados y los últimos que has consultado.</p>
      </header>

      <!-- FAVORITOS -->
      <section class="mb-10">
        <div class="flex items-baseline gap-3 mb-4">
          <h2 class="text-[15px] font-semibold text-ink-900">Favoritos</h2>
          <span class="text-[12px] text-ink-500">{{ favorites.length }} guardado(s)</span>
        </div>
        <div v-if="favorites.length === 0" class="p-8 bg-ink-50 rounded-2xl text-center">
          <Icon name="star" :size="32" :stroke="$c.ink400" class="mx-auto mb-2" />
          <p class="text-[13.5px] text-ink-500">Aún no tienes protocolos marcados como favoritos.</p>
          <p class="text-[12.5px] text-ink-500 mt-1">Haz clic en la estrella ★ dentro de un protocolo para guardarlo aquí.</p>
        </div>
        <div v-else class="space-y-2">
          <article v-for="p in favorites" :key="p.code"
            class="flex items-center gap-3 p-4 bg-white border border-ink-100 hover:border-warn-100 hover:shadow-card rounded-xl transition group">
            <button @click="open(p)" class="flex-1 flex items-center gap-3 text-left min-w-0">
              <div class="w-10 h-10 rounded-lg bg-warn-50 flex items-center justify-center flex-shrink-0">
                <Icon name="star-filled" :size="20" :fill="$c.warn500" :stroke="$c.warn500" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[12px] font-mono font-semibold text-brand-700">{{ p.code }}</span>
                  <Badge v-if="p.criticality === 'alto-riesgo'" variant="warn" size="sm">Alto riesgo</Badge>
                </div>
                <div class="text-[14px] font-medium text-ink-900 truncate">{{ p.title }}</div>
              </div>
            </button>
            <button @click="removeFav(p.code)" class="p-2 hover:bg-ink-50 rounded text-ink-500" title="Quitar de favoritos">
              <Icon name="x" :size="16" />
            </button>
          </article>
        </div>
      </section>

      <!-- HISTORIAL -->
      <section v-if="recentHistory.length > 0">
        <div class="flex items-baseline gap-3 mb-4">
          <h2 class="text-[15px] font-semibold text-ink-900">Consultados recientemente</h2>
          <span class="text-[12px] text-ink-500">{{ recentHistory.length }} reciente(s)</span>
        </div>
        <div class="space-y-2">
          <button v-for="h in recentHistory" :key="h.protocol.code + h.ts" @click="open(h.protocol)"
            class="w-full text-left flex items-center gap-3 p-3 bg-white border border-ink-100 hover:border-brand-200 hover:shadow-card rounded-xl transition group">
            <div class="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
              <Icon name="clock" :size="16" :stroke="$c.brand700" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[11.5px] font-mono font-semibold text-brand-700">{{ h.protocol.code }}</div>
              <div class="text-[13.5px] text-ink-900 truncate">{{ h.protocol.shortTitle || h.protocol.title }}</div>
            </div>
            <span class="text-[11px] text-ink-500 flex-shrink-0">{{ formatDate(h.ts) }}</span>
          </button>
        </div>
      </section>
    </div>
  `
});
