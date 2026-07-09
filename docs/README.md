# Plataforma de Seguridad Operacional — Copec Taller

Plataforma digital interactiva del **Manual de Seguridad Operacional**. Permite consultar protocolos en menos de 30 segundos, visualizar flujos paso a paso, y entrenar al personal en modo capacitación.

---

## Arranque rápido

La plataforma es **100% estática**. No requiere backend ni base de datos.

### Levantar localmente

```bash
# desde la carpeta del proyecto
python3 -m http.server 8080
# o
npx serve .
```

Luego abre `http://localhost:8080`.

> ⚠ No abras `index.html` directamente con doble click — los módulos ESM y `fetch` no funcionan con el protocolo `file://`. Usa siempre un servidor.

### Desplegar en producción

Copia toda la carpeta a:

- **SharePoint** — biblioteca de documentos con renderizado HTML habilitado
- **GitHub Pages** — push a una rama `gh-pages` o configurar el repo
- **Servidor web corporativo** — copiar al docroot (Apache, nginx, IIS)
- **CDN / blob storage** — Azure Blob, S3 con sitio estático

No requiere reglas de servidor especiales (usamos hash routing).

---

## Estructura del proyecto

```
copec-taller-plataforma/
├── index.html             # Entry point (SPA shell)
├── assets/
│   ├── css/theme.css      # Estilos + impresión
│   └── js/
│       ├── app.js         # Bootstrap (Vue + Router + Mermaid)
│       ├── store.js       # Estado global reactivo
│       ├── services/      # dataLoader, search, flow, filter, training
│       └── components/    # Vue components
├── data/                  # ★ ÚNICA FUENTE DE VERDAD
│   ├── manifest.json      # Lista de protocolos y anexos
│   ├── catalog/           # Categorías, riesgos, normativas
│   ├── protocols/         # Un JSON por protocolo
│   └── annexes/           # Un JSON por anexo
├── docs/
│   ├── EDITOR_GUIDE.md    # ★ Cómo crear/editar un protocolo
│   ├── JSON_SCHEMA.md     # Documentación del schema
│   └── CHANGELOG.md       # Historial de cambios
└── tools/
    ├── build-manifest.js  # Regenera data/manifest.json
    ├── validate-json.js   # Valida JSONs antes de publicar
    └── schema.json        # JSON Schema formal
```

---

## Agregar un protocolo

1. Crear el archivo JSON en `data/protocols/PX-NN_nombre.json` (ver `docs/EDITOR_GUIDE.md`).
2. Crear los anexos vinculados en `data/annexes/` si no existen.
3. Regenerar el manifest:
   ```bash
   node tools/build-manifest.js
   ```
4. Validar:
   ```bash
   node tools/validate-json.js
   ```
5. Subir los archivos al servidor.

El protocolo aparece automáticamente en la home, en los filtros y en el buscador. **Cero cambios al código.**

---

## Características

- **Mapa Operacional** con vistas por código, categoría, riesgo y servicio
- **Búsqueda global** difusa con atajo `Cmd/Ctrl + K`
- **Diagrama de flujo interactivo** auto-generado desde el JSON
- **Panel de detalle** al hacer clic en cualquier nodo del flujo
- **Modo capacitación** con quiz auto-generado + soporte para preguntas manuales
- **Favoritos e historial** persistentes (localStorage)
- **Impresión y PDF** vía navegador
- **Responsive** desktop, tablet y celular

---

## Stack técnico

- **Vue 3** (composition API, ESM via CDN)
- **Vue Router 4** (hash mode)
- **Tailwind CSS** (CDN play en dev; compilar para producción)
- **Mermaid 10** (diagramas)
- **Fuse.js 7** (búsqueda difusa)

No hay build step obligatorio. Para optimización productiva, ver `docs/PRODUCTION.md` (pendiente).

---

## Roadmap

- **v1.0** (actual): 5 protocolos de muestra, arquitectura completa
- **v1.1**: migración de los 27 protocolos del manual
- **v2.0** (futuro, opcional): SFC + Vite + TypeScript, manteniendo la misma arquitectura de datos

---

## Soporte

- Editor de protocolos: Área de Prevención de Riesgos
- Mantenimiento técnico: Área de Tecnología
- Reporte de incidencias: ver `docs/CHANGELOG.md` para template
