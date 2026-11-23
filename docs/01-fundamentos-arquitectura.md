# 01 — Fundamentos del feed

## Objetivo

Construir una página pública de noticias periodísticas, de una sola ruta y con scroll infinito. La experiencia toma el ritmo de un feed social como Facebook: publicaciones en una columna, imagen protagonista, lectura continua y sin navegación a otras páginas. No hay login, registro, perfiles, roles de lector ni controles que dependan de una cuenta.

## Decisiones de producto

- El contenido corresponde a noticias escritas por periodistas; el feed se puede leer sin identificarse.
- El feed incluye datos sintéticos de prueba de Santo Domingo, identificados como ficticios y no correspondientes a hechos reales. Conservar literalmente cualquier titular real que entregue el usuario.
- No superponer ni duplicar títulos. Mantener literalmente los títulos que entregue el usuario.
- Una sola página pública; acciones como secciones, búsqueda, newsletter, comentarios o páginas de detalle quedan fuera hasta que se soliciten.
- Scroll infinito: cargar el siguiente bloque al acercarse al final, con estado de carga visible.
- Botón `Crear noticia` abre un modal de tres pasos: titular y tema; resumen, contenido e imagen; vista previa y agregar al feed.
- La creación de noticias es una demostración local en memoria, sin login ni persistencia.
- Mantener diseño responsive, contraste suficiente, foco visible y respeto por `prefers-reduced-motion`.

## Base técnica

- Next.js App Router, React y TypeScript estricto.
- Organizar por features y capas solo cuando haya lógica real que separar.
- Server Components por defecto; la portada compone el feed interactivo desde la feature `news`.
- PostgreSQL y Prisma quedan disponibles para una etapa posterior que defina la fuente real del feed. Compose solo ejecuta PostgreSQL.
- No exponer autenticación, registro, sesiones, cuentas de lectores ni rutas editoriales en esta etapa.
- No conectar IA ni marcar noticias como verificadas. La verificación de imágenes se define solo cuando exista proveedor y flujo editorial acordados.
- El servidor `npm run dev` debe permanecer activo mientras se revisa el diseño; los cambios del front deben reflejarse con hot reload.

## Estructura prevista

```text
client/src/app/                 Única página y estilos globales
client/src/features/news/       Feed y componentes de publicaciones
client/public/images/           Recursos visuales locales
docker-compose.yml              PostgreSQL solo cuando se use persistencia
```

Las imágenes SVG locales son ilustrativas. Los datos sintéticos y los borradores creados desde el modal se identifican en pantalla; no se presentan como publicaciones reales.

## Arranque local

1. Desde `client`, ejecutar `npm ci` una sola vez.
2. Ejecutar `npm run dev`.
3. Abrir `http://localhost:3000`; el servidor debe seguir activo para recibir cambios en caliente.
4. PostgreSQL no es requisito para revisar esta página estática.

## Aceptación de etapa

- [x] El sitio tiene una sola página pública y no ofrece login, registro ni navegación a otras páginas.
- [x] El feed muestra publicaciones en una columna y carga más al desplazarse hasta el final.
- [x] El scroll funciona en escritorio y móvil, y respeta movimiento reducido y accesibilidad por teclado.
- [x] Las noticias sintéticas de Santo Domingo llevan marca visible de prueba y no se presentan como hechos.
- [x] `Crear noticia` abre un modal de tres pasos y agrega la vista previa al inicio del feed.
- [x] Los titulares que escribe el usuario se muestran sin cambios.
- [x] Los cambios del código se reflejan en `http://localhost:3000` mediante hot reload.
- [x] `npm run lint`, `npm run typecheck` y `npm run build` terminan correctamente.

La comprobación manual en navegador confirmó el feed, la carga al desplazarse, la vista previa, el titular literal, la marca de borrador local y el ciclo de foco del modal. Lint, tipos y build se ejecutaron después de los cambios finales.

## Fuera de alcance

Login, cuentas, perfiles, panel editorial, publicación de noticias, comentarios reales, persistencia del feed, proveedor IA y verificación de imágenes. Acordar su alcance antes de abrir la siguiente etapa.
