# Documentación del JSON Schema

Referencia completa del schema de los protocolos. Para una guía de edición práctica, ver `EDITOR_GUIDE.md`.

## Schema de protocolo

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `code` | string | ✓ | Código formato `P[1-3]-NN` (ej. `P1-01`) |
| `version` | string | ✓ | Versión semántica `mayor.menor` |
| `lastUpdated` | string | ✓ | Fecha ISO `YYYY-MM-DD` |
| `title` | string | ✓ | Título completo |
| `shortTitle` | string | — | Título corto para tarjetas |
| `category` | enum | ✓ | `P1` \| `P2` \| `P3` |
| `criticality` | enum | ✓ | `alto-riesgo` \| `medio` \| `bajo` |
| `service` | array | ✓ | Subset de `["estacion", "movil", "ambos"]` |
| `tags` | array | — | Tags libres para búsqueda |
| `icon` | string | — | Nombre del ícono (ver `Icon.js`) |
| `alertBanner` | string | — | Mensaje destacado para protocolos de alto riesgo |
| `objective` | string | ✓ | Propósito del protocolo |
| `scope` | string | ✓ | Aplicabilidad |
| `risks` | array | — | Riesgos identificados |
| `responsibles` | array | — | Roles y responsabilidades |
| `epp` | array | — | EPP requerido |
| `tools` | array | — | Herramientas necesarias |
| `normatives` | array | — | Normativas aplicables |
| `procedure` | object | ✓ | Procedimiento como grafo de pasos |
| `stopRules` | array | — | Reglas de parada inmediata |
| `emergencyActions` | array | — | Acciones ante emergencias |
| `linkedAnnexes` | array | — | Códigos de anexos vinculados |
| `linkedProtocols` | array | — | Códigos de protocolos relacionados |
| `registry` | array | — | Registros y trazabilidad |
| `customQuestions` | array | — | Preguntas manuales para el quiz |

## Schema de paso (procedure.steps[])

| Campo | Tipo | Aplica a | Descripción |
|---|---|---|---|
| `id` | string | todos | Identificador único en el protocolo |
| `type` | enum | todos | `action` \| `decision` \| `alert` \| `end` |
| `title` | string | todos | Título mostrado en el nodo |
| `summary` | string | todos | Resumen breve (1 línea) |
| `description` | string | todos | Descripción extendida |
| `duration` | string | action | Duración estimada |
| `criticalAlerts` | array | action, alert | Alertas críticas del paso |
| `verifications` | array | action | Verificaciones obligatorias |
| `next` | array | action, alert | Pasos siguientes |
| `yes` | string | decision | Paso si la decisión es positiva |
| `no` | string | decision | Paso si la decisión es negativa |
| `yesLabel` | string | decision | Etiqueta del camino "sí" |
| `noLabel` | string | decision | Etiqueta del camino "no" |
| `branches` | array | decision | Múltiples ramas (alternativa a yes/no) |

## Schema de anexo

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `code` | string | ✓ | Código del anexo |
| `version` | string | ✓ | Versión |
| `title` | string | ✓ | Título completo |
| `type` | string | ✓ | Tipo (`checklist`, `registro-evento`, `inspeccion-preoperacional`, `permiso-trabajo`, etc.) |
| `frequency` | string | — | Frecuencia de uso |
| `archivalYears` | number | — | Años de archivo legal |
| `usedInProtocols` | array | — | Protocolos que lo usan |
| `description` | string | — | Descripción del propósito |
| `headerFields` | array | — | Campos del encabezado del formulario |
| `checks` | array | — | Ítems de verificación |
| `sections` | array | — | Secciones del formulario |
| `stopRule` | string | — | Regla de parada asociada |

## Validación

El validador en `tools/validate-json.js` chequea:

1. **Estructura**: campos obligatorios presentes y bien tipados
2. **Códigos**: formato y unicidad
3. **Enums**: valores permitidos en `category`, `criticality`, `service`, `severity`, `step.type`
4. **Referencias**: `next`/`yes`/`no`/`branches[].next` apuntan a pasos existentes
5. **Cross-refs**: `linkedAnnexes` y `linkedProtocols` apuntan a JSONs existentes
6. **Decision sin salida**: un `decision` sin `yes`/`no`/`branches` es error

## Schema formal

Ver `tools/schema.json` para el JSON Schema draft-07. Compatible con AJV si se quiere validar en CI.
