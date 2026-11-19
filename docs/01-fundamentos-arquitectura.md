# 01 — Fundamentos y arquitectura

## Objetivo

Dejar una base ejecutable para la plataforma editorial de noticias: portada responsive, aplicación Next.js, PostgreSQL, persistencia Prisma, roles seguros y un límite explícito para la futura verificación de imágenes. Esta etapa no afirma que un modelo IA esté integrado ni publica contenido de muestra.

## Alcance

- Next.js App Router, React y TypeScript estricto en un mismo proyecto.
- PostgreSQL como único servicio de Docker Compose; la aplicación corre localmente.
- Prisma ORM con migraciones versionadas.
- Roles `READER` y `JOURNALIST`, definidos en servidor; contraseñas con hash y sesión en cookie `HttpOnly`.
- Carga de JPEG, PNG y WebP a almacenamiento privado fuera de `public/`, con tamaño limitado y hash SHA-256.
- Puerto `ImageVerificationPort`; el adaptador inicial devuelve `NOT_CONFIGURED` y nunca aprueba una imagen.
- Crear borradores sin proveedor IA; impedir publicar si no existe aprobación para el hash actual de la imagen.
- Portada editorial celeste, mobile-first, accesible, con titulares en espacios reservados hasta recibir el contenido real.

## Estructura

```text
client/
  prisma/                 Esquema y migraciones PostgreSQL
  src/app/                Rutas, layout y Route Handlers delgados
  src/features/auth/      Registro, autenticación, roles y sesión
  src/features/images/    Contrato, caso de uso y almacenamiento privado
  src/shared/              Prisma y formato transversal de errores
docker-compose.yml         Solo PostgreSQL
```

Los Server Components son el valor por defecto. El código que depende de Prisma, archivos, cookies o claves se ejecuta solo en servidor. Los módulos se organizan por feature y las rutas HTTP validan entrada con Zod.

## Contratos iniciales

| Ruta | Contrato |
| --- | --- |
| `GET /api/health` | Estado de Next y conexión real a PostgreSQL. |
| `POST /api/auth/register` | Crea siempre un `READER`; ignora roles enviados en el cuerpo. |
| `POST /api/auth/register/journalist` | Registro de periodista sin aprobación humana; rol fijado por la ruta. |
| `POST /api/auth/login` | Verifica hash de contraseña y emite cookie de sesión `HttpOnly`, `SameSite=Lax`. |
| `GET /api/auth/session` / `POST /api/auth/logout` | Consulta o destruye la sesión. |
| `POST /api/images` | Requiere periodista; valida formato/tamaño, guarda fuera de `public/`, calcula SHA-256 y conserva resultado `NOT_CONFIGURED`. |
| `POST /api/articles` | Requiere periodista; crea un borrador de su propiedad. |
| `POST /api/articles/{id}/publish` | Requiere periodista propietario y aprobación `APPROVED` cuyo SHA-256 coincida con la imagen actual. |

Los errores usan `{ error: { code, message, correlationId } }`, mensajes en español y no exponen excepciones internas.

## Datos y verificación de imágenes

Prisma define `User`, `Article`, `ImageAsset` e `ImageVerification`. La aprobación se guarda junto al hash exacto del archivo y la ruta de publicación compara ambos valores. Reemplazar una imagen crea un nuevo registro/hash, por lo que las aprobaciones antiguas no sirven para publicarla. El adaptador sin proveedor produce `NOT_CONFIGURED`; no hay aprobación manual ni falso modo productivo.

Verificar una imagen solo evalúa el archivo según el proveedor disponible; no certifica la veracidad de la noticia.

## Arranque local

1. Copiar `.env.example` a `.env` y `client/.env.example` a `client/.env`; usar los mismos datos de PostgreSQL.
2. Desde la raíz ejecutar `docker compose up -d db`.
3. Desde `client`, ejecutar `npm ci`, `npm run db:generate`, `npm run db:migrate` y `npm run dev`.
4. Revisar `http://localhost:3000` y `http://localhost:3000/api/health`.

El servidor `next dev` mantiene hot reload. La portada usa ilustraciones locales y espacios vacíos para títulos, firmas y resúmenes que todavía no se han proporcionado; no muestra titulares inventados como noticias reales.

## Aceptación de etapa

- [x] Next.js compila y sirve la portada; responsive, accesible y sin encabezados ficticios.
- [x] Compose contiene solo PostgreSQL y usa volumen persistente.
- [x] Prisma genera cliente y aplica migración inicial a PostgreSQL limpio.
- [x] Health informa conexión real a la base.
- [x] Roles se fijan en servidor; el payload no puede elevar `READER` a `JOURNALIST`.
- [x] Sesiones no exponen tokens al JavaScript del navegador.
- [x] Archivos se validan y guardan fuera de `public/`; el proveedor ausente no aprueba.
- [x] La publicación requiere aprobación vigente del hash actual.
- [ ] Ejecutar lint, comprobación de tipos y build de producción tras los últimos cambios.
- [ ] Reiniciar PostgreSQL y confirmar que la migración y los datos sobreviven al reinicio.

## Límites

La integración del modelo/proveedor IA y los titulares/artículos reales dependen de los insumos editoriales que entregue el equipo. Hasta entonces, los envíos quedan como borrador y la publicación permanece bloqueada.
