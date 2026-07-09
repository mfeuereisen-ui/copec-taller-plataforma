# Guía del Editor de Protocolos

Esta guía es para la persona responsable de mantener actualizado el contenido del manual. No requiere conocimientos de programación.

---

## Flujo de trabajo

### 1. Crear un protocolo nuevo

1. Copia un protocolo existente como plantilla: `data/protocols/P1-01_elevador.json` → `data/protocols/P1-03_nuevo.json`.
2. Edita los campos según el contenido del manual.
3. Crea anexos faltantes en `data/annexes/`.
4. Ejecuta:
   ```bash
   node tools/build-manifest.js
   node tools/validate-json.js
   ```
5. Sube los archivos al servidor.

### 2. Actualizar un protocolo

1. Abre el JSON correspondiente.
2. Modifica los campos necesarios.
3. **Incrementa la versión** en `version` (ej: `1.0` → `1.1`).
4. **Actualiza** `lastUpdated` con la fecha actual (formato `YYYY-MM-DD`).
5. Anota el cambio en `docs/CHANGELOG.md`.
6. Valida con `node tools/validate-json.js`.

### 3. Eliminar un protocolo

1. Elimina el archivo de `data/protocols/`.
2. Ejecuta `node tools/build-manifest.js` (lo quita del manifest).
3. Edita los protocolos que referenciaban al eliminado en su campo `linkedProtocols` para evitar enlaces rotos.

---

## Campos clave del JSON

### Identificación

```json
{
  "code": "P1-01",
  "version": "1.0",
  "lastUpdated": "2026-05-15",
  "title": "Subida y Bajada del Vehículo al Elevador",
  "shortTitle": "Subida y bajada al elevador",
  "category": "P1",
  "criticality": "alto-riesgo",
  "service": ["estacion"],
  "tags": ["elevador", "aplastamiento"]
}
```

- `code`: formato `PX-NN`, donde X es 1, 2 o 3.
- `category`: `P1` (estación), `P2` (taller móvil), `P3` (transversal).
- `criticality`: `alto-riesgo`, `medio` o `bajo`.
- `service`: array, puede tener `estacion`, `movil` o `ambos`.

### Procedimiento como flujo

El campo `procedure.steps[]` es lo que el sistema usa para generar el diagrama automáticamente. Cada paso tiene un `id`, un `type`, un `title` y conexiones a otros pasos.

**Tipos de paso:**

| type | Forma en el diagrama | Uso |
|---|---|---|
| `action` | Rectángulo azul | Paso normal del procedimiento |
| `decision` | Rombo amarillo | Punto de bifurcación |
| `alert` | Rectángulo rojo | Alerta crítica o ruta de emergencia |
| `end` | Estadio verde | Cierre del flujo |

**Conexiones:**

- `action` y `alert` usan `next: ["s2", "s3"]`
- `decision` usa `yes: "s5"`, `no: "s_stop"` (y opcionalmente `yesLabel`, `noLabel`)
- `decision` con varias ramas usa `branches: [{ label: "Quemadura", next: "s_quem" }, ...]`
- `end` no necesita salida

**Ejemplo mínimo:**

```json
"procedure": {
  "steps": [
    {
      "id": "s1",
      "type": "action",
      "title": "Inspección preoperacional",
      "summary": "Verificar elevador en posición baja.",
      "description": "Verifique que el elevador esté completamente abajo y los brazos limpios.",
      "verifications": ["Elevador abajo", "Brazos limpios"],
      "criticalAlerts": ["Si detecta fallas, NO USE el elevador."],
      "next": ["s2"]
    },
    {
      "id": "s2",
      "type": "decision",
      "title": "¿Equipo apto para operar?",
      "yes": "s3",
      "no": "s_stop"
    },
    {
      "id": "s3",
      "type": "action",
      "title": "Iniciar operación",
      "next": ["s_end"]
    },
    {
      "id": "s_stop",
      "type": "alert",
      "title": "Notificar al supervisor"
    },
    {
      "id": "s_end",
      "type": "end",
      "title": "Servicio finalizado"
    }
  ]
}
```

---

## Riesgos

Cada riesgo tiene severidad y, opcionalmente, una **familia** que lo agrupa con riesgos similares en otros protocolos (para la vista "Por riesgo").

```json
"risks": [
  {
    "id": "R1",
    "description": "Caída del vehículo por posicionamiento incorrecto",
    "severity": "alta",
    "family": "aplastamiento"
  }
]
```

Familias disponibles (ver `data/catalog/risks.json`): `aplastamiento`, `incendio`, `quimico`, `electrico`, `vial`, `derrame`, `ergonomico`, `personal`, `biologico`.

---

## Preguntas personalizadas (opcional)

El modo capacitación genera preguntas automáticamente. Si quieres añadir preguntas manuales, agrega un campo `customQuestions[]`:

```json
"customQuestions": [
  {
    "id": "q-cust-1",
    "type": "single-choice",
    "question": "¿Cuántos segundos debe sacudirse el vehículo a 30 cm para verificar estabilidad?",
    "options": ["No es necesario sacudirlo", "Sacudir levemente 1-2 veces", "Sacudir fuerte 5 veces", "Solo si está en pendiente"],
    "correctIndex": 1,
    "explanation": "Una sacudida suave permite detectar movimiento sin desestabilizar el vehículo."
  }
]
```

Tipos soportados: `single-choice` (con `correctIndex`) y `multi-choice` (con `correctIndices`).

---

## Vinculaciones cruzadas

```json
"linkedAnnexes": ["LV-ELE-01", "RI-01"],
"linkedProtocols": ["P3-02", "P3-03"]
```

La plataforma resuelve estos códigos automáticamente y genera los enlaces bidireccionales. Si un anexo o protocolo referenciado no existe, el validador lo reporta.

---

## Convenciones

- **Códigos de anexo**: `XX-YY-NN` (ej: `LV-ELE-01`, `RI-01`, `RPA-01`).
- **Códigos de paso**: cortos y mnemónicos (`s1`, `s2`, `s_stop`, `s_end`).
- **Fechas**: ISO `YYYY-MM-DD`.
- **Versionado**: `mayor.menor`. Subir mayor cuando cambia el procedimiento; menor cuando cambia un texto.
- **Mensajes de alerta y reglas de parada**: imperativos cortos. Ej: "Detener si...", "Activar SAMU 131".

---

## Herramientas

```bash
# Regenerar manifest después de añadir/quitar archivos
node tools/build-manifest.js

# Validar todos los JSON contra el schema
node tools/validate-json.js

# Levantar la plataforma localmente
python3 -m http.server 8080
```

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| "Protocolo no encontrado" | Manifest no actualizado | Ejecutar `build-manifest.js` |
| "Paso X referencia next Y que no existe" | Typo en el id | Revisar todos los `next`, `yes`, `no`, `branches[].next` |
| Diagrama vacío | `procedure.steps` vacío o malformado | Verificar que el primer paso exista y tenga `id`, `type`, `title` |
| Anexo vinculado no aparece | Falta el JSON del anexo en `data/annexes/` | Crear el anexo o quitar la referencia |
