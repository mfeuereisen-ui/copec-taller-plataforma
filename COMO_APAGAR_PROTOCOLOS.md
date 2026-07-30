# Encender / apagar protocolos

## Cómo funciona

Cada protocolo tiene un campo `"activo"` en su archivo JSON:

```json
"activo": true      → el protocolo se muestra normalmente
"activo": false     → el protocolo se OCULTA por completo
```

Cuando un protocolo está en `false`:
- No aparece en el mapa operacional
- No aparece en los filtros (categoría, riesgo, servicio)
- No aparece en la búsqueda
- No se cuenta en las estadísticas del inicio
- No figura como "protocolo relacionado" en otros protocolos

Pero el archivo NO se borra: el trabajo queda intacto y el protocolo se puede
reactivar cuando quieras poniendo `true` de nuevo.

Además, si alguien tuviera un enlace directo a un protocolo apagado, verá un
aviso de "Protocolo no vigente" en vez de la ficha — no un error.

## Cómo apagar un protocolo (ejemplo: el foso)

1. Abre el archivo del protocolo, por ejemplo:
   `data/protocols/P1-02_foso.json`
2. Busca la línea:
   ```json
   "activo": true,
   ```
3. Cámbiala a:
   ```json
   "activo": false,
   ```
4. Guarda, y publica:
   ```powershell
   git add data/protocols/P1-02_foso.json
   git commit -m "Desactivar protocolo de foso (sin estaciones con foso por ahora)"
   git push origin master
   ```

El protocolo desaparece de la plataforma en 1-2 minutos.

## Cómo reactivarlo (cuando habilites una estación con foso)

Lo mismo, pero de `false` a `true`. Reaparece intacto.

## Por qué esto se controla por archivo y no por un panel en la plataforma

Un panel visual dentro de la plataforma dejaría el encendido/apagado al alcance
de cualquier usuario que la abra — algo peligroso en un sistema de seguridad
(alguien podría apagar Primeros Auxilios por error). Controlarlo por el archivo
significa que solo quien tiene acceso al repositorio (tú) puede hacerlo: es el
mismo candado que protege todo el contenido hoy.

El panel visual con interruptores sí tiene sentido MÁS ADELANTE, como función
del rol de administrador, una vez que exista el login. En ese momento el sistema
sabrá quién es cada usuario y podrá permitir el control solo a quien corresponda.
