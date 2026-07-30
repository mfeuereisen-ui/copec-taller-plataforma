// components/FillableAnnex.js
// ---------------------------------------------------------------------------
// Renderiza un anexo marcado como "fillable": true.
// Ofrece TRES acciones al usuario:
//   1. Rellenar en pantalla los campos definidos en annex.fields
//   2. Descargar / imprimir el formulario CON lo escrito (para enviar)
//   3. Imprimir el formulario EN BLANCO con espacios para llenar a mano
//
// No requiere backend: lo completado se imprime o se guarda como PDF desde el
// diálogo de impresión del navegador (el usuario elige "Guardar como PDF").
// Los datos viven solo en memoria de la sesión; no se almacenan en la app.
// ---------------------------------------------------------------------------
import { defineComponent, ref, computed } from 'vue';
import Icon from './shared/Icon.js';

export default defineComponent({
  name: 'FillableAnnex',
  components: { Icon },
  props: {
    annex: { type: Object, required: true }
  },
  setup(props) {
    // Estado del formulario: un valor por cada campo
    const values = ref({});
    (props.annex.fields || []).forEach(f => { values.value[f.id] = ''; });

    // Modo de impresión: 'filled' (con datos) o 'blank' (en blanco)
    const printMode = ref('filled');

    const hasFields = computed(() => Array.isArray(props.annex.fields) && props.annex.fields.length > 0);

    function printFilled() {
      printMode.value = 'filled';
      // esperar a que Vue actualice el DOM antes de imprimir
      setTimeout(() => window.print(), 60);
    }
    function printBlank() {
      printMode.value = 'blank';
      setTimeout(() => window.print(), 60);
    }
    function clearForm() {
      (props.annex.fields || []).forEach(f => { values.value[f.id] = ''; });
    }

    return { values, printMode, hasFields, printFilled, printBlank, clearForm };
  },
  template: `
    <div class="fillable-annex">
      <!-- BARRA DE ACCIONES (no se imprime) -->
      <div class="no-print flex flex-wrap items-center gap-2 mb-5 p-3 bg-brand-50 border border-brand-100 rounded-xl">
        <span class="text-[12.5px] text-ink-600 mr-auto">
          Completa el formulario y descárgalo, o imprímelo en blanco para llenarlo a mano.
        </span>
        <button @click="printFilled"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-lg text-[13px] font-medium">
          <Icon name="download" :size="15" stroke="white" />
          Descargar / imprimir completado
        </button>
        <button @click="printBlank"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-ink-50 border border-ink-200 text-ink-700 rounded-lg text-[13px] font-medium">
          <Icon name="print" :size="15" :stroke="'currentColor'" />
          Imprimir en blanco
        </button>
        <button @click="clearForm"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-ink-500 hover:text-ink-900 rounded-lg text-[12.5px]">
          Limpiar
        </button>
      </div>

      <!-- INSTRUCCIONES -->
      <p v-if="annex.instructions" class="text-[13px] text-ink-600 mb-5 leading-relaxed">
        {{ annex.instructions }}
      </p>

      <!-- FORMULARIO -->
      <div v-if="hasFields" class="annex-form" :class="'print-mode-' + printMode">
        <!-- Encabezado que solo aparece al imprimir -->
        <div class="print-only annex-print-header">
          <h1>{{ annex.code }} — {{ annex.title }}</h1>
          <p class="annex-print-sub">Copec Taller · Seguridad Operacional</p>
        </div>

        <div v-for="f in annex.fields" :key="f.id"
          :class="['annex-field', f.type === 'check' ? 'annex-field-check' : '']">

          <!-- CHECK: ítem de verificación con opciones Cumple / Falla / N/A -->
          <template v-if="f.type === 'check'">
            <div class="annex-check-row">
              <span class="annex-check-label">{{ f.label }}</span>
              <div v-if="printMode === 'filled'" class="annex-check-controls">
                <label v-for="opt in ['Cumple','Falla','N/A']" :key="opt" class="annex-check-radio">
                  <input type="radio" :name="f.id" :value="opt" v-model="values[f.id]" />
                  <span>{{ opt }}</span>
                </label>
              </div>
              <div v-else class="annex-check-controls">
                <span v-for="opt in ['Cumple','Falla','N/A']" :key="opt" class="annex-check-option">☐ {{ opt }}</span>
              </div>
            </div>
          </template>

          <template v-else>
            <label :for="f.id" class="annex-label">
              {{ f.label }}<span v-if="f.required" class="text-danger-700"> *</span>
            </label>

            <!-- textarea: relato con varias líneas -->
            <template v-if="f.type === 'textarea'">
              <textarea v-if="printMode === 'filled'" :id="f.id" v-model="values[f.id]"
                :rows="f.lines || 3"
                class="annex-input annex-textarea"
                :placeholder="'Escriba aquí…'"></textarea>
              <!-- En blanco: líneas para escribir a mano -->
              <div v-else class="annex-blank-lines" :style="{ '--lines': f.lines || 3 }"></div>
            </template>

            <!-- select: lista de opciones -->
            <template v-else-if="f.type === 'select'">
              <select v-if="printMode === 'filled'" :id="f.id" v-model="values[f.id]" class="annex-input">
                <option value="">— Seleccione —</option>
                <option v-for="o in f.options" :key="o" :value="o">{{ o }}</option>
              </select>
              <div v-else class="annex-blank-options">
                <span v-for="o in f.options" :key="o" class="annex-check-option">☐ {{ o }}</span>
              </div>
            </template>

            <!-- date, time, text: una línea -->
            <template v-else>
              <input v-if="printMode === 'filled'" :id="f.id" v-model="values[f.id]"
                :type="f.type === 'date' ? 'date' : (f.type === 'time' ? 'time' : 'text')"
                class="annex-input" placeholder="" />
              <div v-else class="annex-blank-line"></div>
            </template>
          </template>
        </div>

        <!-- Firma (solo impresión) -->
        <div class="print-only annex-signature">
          <div class="annex-sign-box">Firma de quien reporta</div>
          <div class="annex-sign-box">Firma de la jefatura</div>
        </div>
      </div>

      <!-- Anexo sin campos: mensaje de respaldo -->
      <div v-else class="text-[13px] text-ink-500">
        Este anexo no tiene campos definidos para rellenar.
      </div>
    </div>
  `
});
