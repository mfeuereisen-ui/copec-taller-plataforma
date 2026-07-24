// components/AppShell.js
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { store } from '../store.js';
import Icon from './shared/Icon.js';

export default defineComponent({
  name: 'AppShell',
  components: { Icon },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const searchQuery = ref('');
    const searchResults = ref([]);
    const searchOpen = ref(false);
    const searchInput = ref(null);

    function runSearch() {
      const q = searchQuery.value.trim();
      if (!q || !store.searchEngine) {
        searchResults.value = [];
        return;
      }
      searchResults.value = store.searchEngine.search(q, 8);
    }

    function goToResult(r) {
      searchOpen.value = false;
      searchQuery.value = '';
      searchResults.value = [];
      if (r.item.type === 'protocol') {
        router.push(`/protocolo/${r.item.code}`);
      } else {
        router.push(`/anexo/${r.item.code}`);
      }
    }

    function openSearch() {
      searchOpen.value = true;
      setTimeout(() => searchInput.value?.focus(), 50);
    }

    function closeSearch() {
      searchOpen.value = false;
      searchQuery.value = '';
      searchResults.value = [];
    }

    const mobileMenuOpen = ref(false);
    function toggleMobileMenu() { mobileMenuOpen.value = !mobileMenuOpen.value; }
    function closeMobileMenu() { mobileMenuOpen.value = false; }
    watch(() => route?.path, () => closeMobileMenu());

    // Atajo de teclado Cmd/Ctrl + K
    onMounted(() => {
      window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault();
          openSearch();
        }
        if (e.key === 'Escape' && searchOpen.value) {
          closeSearch();
        }
        if (e.key === 'Escape' && mobileMenuOpen.value) {
          closeMobileMenu();
        }
      });
    });

    watch(searchQuery, () => runSearch());
    watch(() => route?.path, () => closeSearch());

    // Computed protegido: si route aún no está listo, asumimos home
    const isHome = computed(() => !route || route.path === '/');
    const crumb = computed(() => route?.meta?.crumb || route?.name || '');

    return { searchQuery, searchResults, searchOpen, searchInput, openSearch, closeSearch, goToResult, isHome, route, crumb, mobileMenuOpen, toggleMobileMenu, closeMobileMenu, loadErrors: computed(() => store.loadErrors || []) };
  },
  template: `
    <div class="min-h-screen flex flex-col bg-white">
      <!-- TOP NAV -->
      <header class="app-header sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-ink-100 no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="h-16 flex items-center gap-4">
            <!-- Logo -->
            <router-link to="/" class="flex items-center gap-2.5 group">
              <div class="w-9 h-9 rounded-lg bg-brand-900 flex items-center justify-center group-hover:scale-105 transition">
                <Icon name="shield" :size="20" stroke="white" />
              </div>
              <div class="hidden sm:block">
                <div class="text-[15px] font-semibold tracking-tight leading-tight">Copec Taller</div>
                <div class="text-[10.5px] text-ink-500 leading-tight">Seguridad Operacional</div>
              </div>
            </router-link>

            <!-- Nav links (desktop) -->
            <nav class="hidden md:flex items-center gap-1 ml-4" aria-label="Navegación principal">
              <router-link to="/" class="px-3 py-2 text-sm rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
                Mapa
              </router-link>
              <router-link to="/anexos" class="px-3 py-2 text-sm rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
                Anexos
              </router-link>
              <router-link to="/capacitacion" class="px-3 py-2 text-sm rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
                Capacitación
              </router-link>
              <router-link to="/favoritos" class="px-3 py-2 text-sm rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
                Favoritos
              </router-link>
            </nav>

            <!-- Hamburger trigger (mobile only) -->
            <button
              @click="toggleMobileMenu"
              class="md:hidden p-2 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-700"
              aria-label="Abrir menú de navegación"
              :aria-expanded="mobileMenuOpen"
              aria-controls="mobile-nav-panel"
            >
              <Icon :name="mobileMenuOpen ? 'x' : 'menu'" :size="20" />
            </button>

            <!-- Search trigger -->
            <button
              @click="openSearch"
              class="ml-auto flex items-center gap-2 px-3 py-1.5 bg-ink-50 hover:bg-ink-100 border border-ink-100 rounded-lg text-sm text-ink-500 transition w-full sm:w-80 max-w-md"
            >
              <Icon name="search" :size="16" :stroke="$c.ink500" />
              <span class="flex-1 text-left">Buscar protocolo, riesgo, EPP…</span>
              <kbd class="hidden md:inline-block text-[10px] px-1.5 py-0.5 bg-white border border-ink-100 rounded text-ink-500">⌘K</kbd>
            </button>
          </div>
        </div>
      </header>

      <!-- AVISO: fallas de carga de datos (distinto de "sin resultados por filtro") -->
      <div v-if="loadErrors.length > 0" class="bg-danger-50 border-b border-danger-100 no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5 text-[13px] text-danger-700">
          <Icon name="alert" :size="16" :stroke="$c.danger700" class="flex-shrink-0" />
          <span>
            No se pudieron cargar {{ loadErrors.length }} archivo(s) de contenido (posible problema de red).
            Es posible que falten protocolos o anexos en esta sesión — recarga la página para reintentar.
          </span>
        </div>
      </div>

      <!-- MOBILE NAV PANEL -->
      <transition name="slide-up">
        <nav v-if="mobileMenuOpen" id="mobile-nav-panel" class="md:hidden border-b border-ink-100 bg-white no-print" aria-label="Navegación principal (móvil)">
          <div class="px-4 py-2 flex flex-col">
            <router-link to="/" @click="closeMobileMenu" class="px-3 py-3 text-[15px] rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
              Mapa
            </router-link>
            <router-link to="/anexos" @click="closeMobileMenu" class="px-3 py-3 text-[15px] rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
              Anexos
            </router-link>
            <router-link to="/capacitacion" @click="closeMobileMenu" class="px-3 py-3 text-[15px] rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
              Capacitación
            </router-link>
            <router-link to="/favoritos" @click="closeMobileMenu" class="px-3 py-3 text-[15px] rounded-md hover:bg-ink-50 transition" active-class="text-brand-700 font-medium">
              Favoritos
            </router-link>
          </div>
        </nav>
      </transition>

      <!-- Breadcrumb -->
      <div v-if="!isHome" class="border-b border-ink-100 bg-ink-50/40 no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <nav class="flex items-center text-[12.5px] text-ink-500 gap-1.5">
            <router-link to="/" class="hover:text-brand-700">Inicio</router-link>
            <span>/</span>
            <span class="text-ink-900 font-medium truncate">{{ crumb }}</span>
          </nav>
        </div>
      </div>

      <!-- MAIN -->
      <main class="flex-1">
        <router-view v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- FOOTER -->
      <footer class="border-t border-ink-100 mt-12 py-6 no-print">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex flex-col sm:flex-row justify-between text-[12px] text-ink-500 gap-2">
            <div>Manual de Seguridad Operacional · Versión 1.0 · Mayo 2026</div>
            <div>Plataforma controlada · Documento de uso interno</div>
          </div>
        </div>
      </footer>

      <!-- GLOBAL SEARCH OVERLAY -->
      <div v-if="searchOpen" class="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm animate-fade-in no-print" @click="closeSearch">
        <div class="max-w-2xl mx-auto mt-24 p-4" @click.stop>
          <div class="bg-white rounded-2xl shadow-pop overflow-hidden">
            <div class="flex items-center px-4 py-3 border-b border-ink-100">
              <Icon name="search" :size="20" :stroke="$c.ink500" />
              <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Busca por código, palabra, riesgo, EPP…"
                class="flex-1 ml-3 outline-none text-[15px] bg-transparent placeholder:text-ink-500"
              />
              <button @click="closeSearch" class="ml-2 p-1.5 hover:bg-ink-100 rounded">
                <Icon name="x" :size="16" :stroke="$c.ink500" />
              </button>
            </div>
            <div v-if="searchResults.length === 0 && searchQuery" class="px-4 py-8 text-center text-sm text-ink-500">
              Sin resultados para "{{ searchQuery }}"
            </div>
            <div v-else-if="searchResults.length === 0" class="px-4 py-8 text-center text-sm text-ink-500">
              Empieza a escribir para buscar entre protocolos, anexos, riesgos y EPP.
            </div>
            <ul v-else class="max-h-[60vh] overflow-y-auto py-1">
              <li v-for="r in searchResults" :key="r.item.code">
                <button
                  @click="goToResult(r)"
                  class="w-full text-left px-4 py-3 hover:bg-ink-50 flex items-center gap-3"
                >
                  <span class="w-8 h-8 rounded-md flex items-center justify-center"
                    :class="r.item.type === 'protocol' ? 'bg-brand-50' : 'bg-safe-50'">
                    <Icon :name="r.item.type === 'protocol' ? 'shield' : 'file'" :size="16"
                      :stroke="r.item.type === 'protocol' ? $c.brand700 : $c.safe600" />
                  </span>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="text-[12px] font-mono font-semibold"
                        :class="r.item.type === 'protocol' ? 'text-brand-700' : 'text-safe-700'">
                        {{ r.item.code }}
                      </span>
                      <span class="text-[11px] text-ink-500 uppercase tracking-wider">{{ r.item.type === 'protocol' ? 'Protocolo' : 'Anexo' }}</span>
                    </div>
                    <div class="text-sm text-ink-900 truncate">{{ r.item.title }}</div>
                  </div>
                  <Icon name="chevron" :size="16" :stroke="$c.ink400" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `
});
