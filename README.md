# Pulso — plataforma editorial

Base de una web de noticias editorial en español. El repositorio usa Next.js App Router, TypeScript y Prisma; PostgreSQL es el único servicio dentro de Docker Compose.

## Requisitos

- Node.js 20.19 o posterior
- npm
- Docker Desktop con Docker Compose

## Inicio local

1. Copia `.env.example` como `.env` y cambia la contraseña local.
2. Copia `client/.env.example` como `client/.env` y usa los mismos datos de conexión.
3. Desde la raíz, inicia PostgreSQL: `docker compose up -d db`. El puerto predeterminado de desarrollo es `5433` para no chocar con instalaciones locales.
4. En `client`, instala dependencias: `npm ci`.
5. En `client`, genera Prisma y aplica la migración inicial: `npm run db:generate` y `npm run db:migrate`.
6. En `client`, inicia el front y los Route Handlers: `npm run dev`.

La portada de muestra queda en `http://localhost:3000`; el estado de la aplicación y la conexión a PostgreSQL se consulta en `http://localhost:3000/api/health`.

## Variables locales

`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_PORT` configuran el contenedor. `DATABASE_URL` y `SESSION_SECRET` se configuran para Next.js desde `client/.env`. `IMAGE_STORAGE_DIR` apunta a almacenamiento privado fuera de `public/`.

Los archivos `.env` no se versionan. Los archivos `.env.example` contienen únicamente valores de ejemplo.
Si cambias `POSTGRES_PORT` en el `.env` raíz, actualiza también el puerto de `DATABASE_URL` en `client/.env`.

## Estado de verificación de imágenes

La aplicación define una frontera `ImageVerificationPort`. No hay un proveedor ni un modelo conectados en esta base; por ello ningún resultado se marca como aprobado y la publicación debe permanecer bloqueada hasta que una verificación real, asociada al hash SHA-256 vigente de la imagen, resulte aprobada. Verificar una imagen no representa verificar toda la noticia.

El contenido visible de la portada es ilustrativo para revisar el diseño y está señalado como contenido de muestra; no constituye noticia publicada ni verificada.

## Comandos de calidad

Desde `client`: `npm run lint`, `npm run typecheck` y `npm run build`.

## Límite actual

La base incluye registro, inicio/cierre de sesión, roles, carga privada de imágenes y guardado de borradores. Aún no incluye proveedor IA real ni gestión editorial completa; sin aprobación real por hash, los borradores no se publican.
