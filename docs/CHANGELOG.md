# Changelog

Historial de cambios de la plataforma de seguridad operacional.

Formato: [versión] - YYYY-MM-DD

---

## [1.0.0] - 2026-05-15

### Plataforma inicial

- Arquitectura desacoplada: contenido en JSON, frontend Vue 3 + Tailwind.
- 5 protocolos iniciales cargados desde el manual: P1-01, P1-02, P1-05, P2-02, P3-02.
- 12 anexos vinculados: LV-ELE-01, LV-FOSO-01, RI-01, RE-01, RPA-01, IPTM-01, OS-MOV-01, BO-01, RMG-01, RB-01, CP-01, ATE-01.
- Capa 1 — Mapa Operacional con vistas por código, categoría, riesgo y servicio.
- Capa 2 — Diagrama de flujo interactivo (Mermaid) auto-generado.
- Capa 3 — Panel de detalle al hacer clic en cualquier paso.
- Búsqueda global con atajo Cmd/Ctrl + K (Fuse.js).
- Modo capacitación auto-generado con quiz.
- Favoritos e historial persistentes.
- Modo impresión / PDF vía navegador.
- Hash routing para máxima portabilidad (SharePoint, GitHub Pages, intranet).

---

## Template de cambio

```
## [vX.Y.Z] - YYYY-MM-DD

### Agregado
- ...

### Modificado
- P1-01: actualización del paso s7 según observaciones de ACHS (...).

### Corregido
- Fix typo en anexo LV-ELE-01 ítem 9.

### Eliminado
- ...
```
