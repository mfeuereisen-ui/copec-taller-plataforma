// store.js
// Estado global reactivo, sencillo (sin Pinia, suficiente para esta escala).

import { reactive, computed, watch } from 'vue';

const FAV_KEY = 'copec_taller_favs';
const HIST_KEY = 'copec_taller_history';
const TRAINING_KEY = 'copec_taller_training';

const initialFavs = JSON.parse(localStorage.getItem(FAV_KEY) || '[]');
const initialHist = JSON.parse(localStorage.getItem(HIST_KEY) || '[]');
const initialTrain = JSON.parse(localStorage.getItem(TRAINING_KEY) || '{}');

export const store = reactive({
  loading: true,
  error: null,
  data: null,             // resultado de loadAllData
  loadErrors: [],         // archivos individuales que fallaron al cargar (ver dataLoader.js)
  searchEngine: null,
  favorites: initialFavs,
  history: initialHist,   // [{ code, ts }]
  trainingProgress: initialTrain, // { [code]: { completed: true, score: 80, lastAt } }
  filters: {
    category: 'all',
    service: 'all',
    criticality: 'all',
    riskFamily: 'all',
    tag: null,
    text: '',
    sortBy: 'code'
  },
  ui: {
    searchOpen: false,
    sidebarOpen: false
  }
});

// Persistencia
watch(() => store.favorites, (v) => localStorage.setItem(FAV_KEY, JSON.stringify(v)), { deep: true });
watch(() => store.history, (v) => localStorage.setItem(HIST_KEY, JSON.stringify(v)), { deep: true });
watch(() => store.trainingProgress, (v) => localStorage.setItem(TRAINING_KEY, JSON.stringify(v)), { deep: true });

// Helpers
export function toggleFavorite(code) {
  const i = store.favorites.indexOf(code);
  if (i >= 0) store.favorites.splice(i, 1);
  else store.favorites.unshift(code);
}

export function isFavorite(code) {
  return store.favorites.includes(code);
}

export function pushHistory(code) {
  const list = store.history.filter(h => h.code !== code);
  list.unshift({ code, ts: Date.now() });
  store.history = list.slice(0, 20);
}

export function recordTraining(code, score) {
  store.trainingProgress[code] = {
    completed: true,
    score,
    lastAt: Date.now()
  };
}

// Computed útiles
export const getProtocol = (code) => store.data?.indices.byCode.get(code);
export const getAnnex = (code) => store.data?.indices.anByCode.get(code);
export const getCategory = (id) => store.data?.catalog.categories.find(c => c.id === id);
export const getRiskFamily = (id) => store.data?.catalog.risks.find(r => r.id === id);

export function findRelatedProtocols(code) {
  const p = getProtocol(code);
  if (!p) return [];
  return (p.linkedProtocols || [])
    .map(c => getProtocol(c))
    .filter(Boolean);
}

export function findUsingAnnex(annexCode) {
  if (!store.data) return [];
  return store.data.protocols.filter(p => (p.linkedAnnexes || []).includes(annexCode));
}
