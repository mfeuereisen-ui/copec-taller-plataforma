// app.js
// Bootstrap principal. Carga datos, monta Vue + Router, inicializa Mermaid.

import { createApp, h } from 'vue';
import { C } from './tokens.js';
import { createRouter, createWebHashHistory } from 'vue-router';
import mermaid from 'mermaid';

import { loadAllData } from './services/dataLoader.js';
import { buildSearchIndex } from './services/searchEngine.js';
import { store } from './store.js';

import AppShell from './components/AppShell.js';
import HomePage from './components/HomePage.js';
import ProtocolPage from './components/ProtocolPage.js';
import AnnexLibrary from './components/AnnexLibrary.js';
import AnnexPage from './components/AnnexPage.js';
import TrainingMode from './components/TrainingMode.js';
import TrainingProtocol from './components/TrainingProtocol.js';
import FavoritesPage from './components/FavoritesPage.js';

// === ROUTER ===
const routes = [
  { path: '/',                       name: 'home',          component: HomePage,        meta: { crumb: 'Mapa Operacional' } },
  { path: '/protocolo/:code',        name: 'protocol',      component: ProtocolPage,    meta: { crumb: 'Protocolo' } },
  { path: '/anexos',                 name: 'annexes',       component: AnnexLibrary,    meta: { crumb: 'Biblioteca de anexos' } },
  { path: '/anexo/:code',            name: 'annex',         component: AnnexPage,       meta: { crumb: 'Anexo' } },
  { path: '/capacitacion',           name: 'training',      component: TrainingMode,    meta: { crumb: 'Modo capacitación' } },
  { path: '/capacitacion/:code',     name: 'trainingProto', component: TrainingProtocol,meta: { crumb: 'Capacitación' } },
  { path: '/favoritos',              name: 'favorites',     component: FavoritesPage,   meta: { crumb: 'Favoritos' } },
  { path: '/:pathMatch(.*)*',        redirect: '/' }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    return { top: 0 };
  }
});

// === BOOTSTRAP ===
async function bootstrap() {
  try {
    // Inicializar Mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '13px',
        primaryColor: C.brand100,
        primaryBorderColor: C.brand700,
        primaryTextColor: C.ink900,
        lineColor: C.ink400,
        secondaryColor: C.warn100,
        tertiaryColor: C.safe100
      },
      flowchart: {
        useMaxWidth: true,
        curve: 'basis',
        padding: 16,
        nodeSpacing: 36,
        rankSpacing: 50
      },
      securityLevel: 'loose'
    });

    // Cargar datos
    const data = await loadAllData();
    store.data = data;
    store.loadErrors = data.loadErrors || [];
    store.searchEngine = buildSearchIndex(data.protocols, data.annexes);
    store.loading = false;

    // Crear app
    const app = createApp({
      render: () => h(AppShell)
    });
    app.config.globalProperties.$c = C;   // tokens de color disponibles en plantillas
    app.use(router);
    app.mount('#app');

    console.log('[Copec Taller] Plataforma cargada:', {
      protocolos: data.protocols.length,
      anexos: data.annexes.length,
      categorias: data.catalog.categories.length
    });
  } catch (err) {
    console.error('Error al inicializar la plataforma:', err);
    document.getElementById('app').innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-6">
        <div class="text-center max-w-md">
          <div class="text-5xl mb-4">⚠️</div>
          <h1 class="text-2xl font-semibold text-ink-900 mb-2">No se pudo cargar la plataforma</h1>
          <p class="text-ink-500 text-sm mb-4">${err.message}</p>
          <p class="text-ink-500 text-xs">
            Verifica que estés accediendo vía un servidor web (no abriendo el archivo directamente).
            En desarrollo: <code class="bg-ink-100 px-1.5 py-0.5 rounded">python -m http.server</code>
          </p>
        </div>
      </div>
    `;
  }
}

bootstrap();
