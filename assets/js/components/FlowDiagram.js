// components/FlowDiagram.js
import { defineComponent, ref, watch, onMounted, nextTick } from 'vue';
import mermaid from 'mermaid';
import { generateMermaidDefinition } from '../services/flowRenderer.js';
import Icon from './shared/Icon.js';

export default defineComponent({
  name: 'FlowDiagram',
  components: { Icon },
  props: {
    procedure: { type: Object, required: true },
    currentStepId: { type: String, default: null }
  },
  emits: ['select-step'],
  setup(props, { emit }) {
    const container = ref(null);
    const renderError = ref(null);
    const zoom = ref(1);
    let renderToken = 0;

    async function renderDiagram() {
      if (!container.value) return;
      const token = ++renderToken;
      const definition = generateMermaidDefinition(props.procedure, props.currentStepId);
      const uid = 'mermaid-' + Math.random().toString(36).slice(2, 9);

      try {
        const { svg } = await mermaid.render(uid, definition);
        if (token !== renderToken) return; // ignorar render obsoleto
        container.value.innerHTML = svg;

        // Adjuntar listeners a cada nodo
        await nextTick();
        const nodes = container.value.querySelectorAll('.node');
        nodes.forEach(node => {
          // El ID Mermaid es algo como "flowchart-s1-0"; necesitamos extraer "s1"
          const idAttr = node.getAttribute('id') || '';
          const match = idAttr.match(/flowchart-([^-]+)-/);
          const stepId = match ? match[1] : null;
          if (stepId) {
            node.addEventListener('click', () => emit('select-step', stepId));
            node.style.cursor = 'pointer';
          }
        });
        renderError.value = null;
      } catch (err) {
        console.error('Error renderizando Mermaid:', err);
        renderError.value = err.message || 'Error al renderizar el diagrama.';
      }
    }

    onMounted(renderDiagram);
    watch(() => [props.procedure, props.currentStepId], renderDiagram, { deep: true });

    function zoomIn()  { zoom.value = Math.min(2,    zoom.value + 0.15); }
    function zoomOut() { zoom.value = Math.max(0.5,  zoom.value - 0.15); }
    function zoomReset() { zoom.value = 1; }

    return { container, renderError, zoom, zoomIn, zoomOut, zoomReset };
  },
  template: `
    <div class="relative">
      <!-- Toolbar -->
      <div class="absolute right-3 top-3 z-10 flex items-center gap-1 bg-white border border-ink-100 rounded-lg shadow-card no-print">
        <button @click="zoomOut" class="px-2 py-1.5 hover:bg-ink-50 rounded-l-lg text-ink-500" title="Alejar">
          <span class="text-sm font-bold">−</span>
        </button>
        <button @click="zoomReset" class="px-2 py-1.5 hover:bg-ink-50 text-[11px] text-ink-500 font-mono w-12" title="Restablecer zoom">
          {{ Math.round(zoom * 100) }}%
        </button>
        <button @click="zoomIn" class="px-2 py-1.5 hover:bg-ink-50 rounded-r-lg text-ink-500" title="Acercar">
          <span class="text-sm font-bold">+</span>
        </button>
      </div>

      <!-- Leyenda -->
      <div class="absolute left-3 top-3 z-10 flex items-center gap-3 bg-white/95 backdrop-blur border border-ink-100 rounded-lg px-3 py-1.5 shadow-card no-print">
        <span class="flex items-center gap-1 text-[10.5px] text-ink-700">
          <span class="w-2.5 h-2.5 rounded-sm bg-brand-100 border border-brand-700"></span> Acción
        </span>
        <span class="flex items-center gap-1 text-[10.5px] text-ink-700">
          <span class="w-2.5 h-2.5 rotate-45 bg-warn-100 border border-warn-700"></span> Decisión
        </span>
        <span class="flex items-center gap-1 text-[10.5px] text-ink-700">
          <span class="w-2.5 h-2.5 rounded-sm bg-danger-100 border border-danger-700"></span> Alerta
        </span>
        <span class="flex items-center gap-1 text-[10.5px] text-ink-700">
          <span class="w-2.5 h-2.5 rounded-full bg-safe-100 border border-safe-700"></span> Fin
        </span>
      </div>

      <div class="w-full overflow-auto bg-white p-6 pt-16 min-h-[500px]" style="border-radius: inherit;">
        <div ref="container" class="mermaid-container origin-top transition-transform duration-200 mx-auto"
          :style="{ transform: 'scale(' + zoom + ')' }">
        </div>
        <div v-if="renderError" class="text-center text-sm text-danger-700 py-6">
          {{ renderError }}
        </div>
      </div>

      <p class="px-6 py-3 text-[11.5px] text-ink-500 italic border-t border-ink-100 no-print">
        💡 Haz clic en cualquier paso del diagrama para ver su detalle operacional completo.
      </p>
    </div>
  `
});
