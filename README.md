# Pulso — feed de noticias

Una página pública de noticias periodísticas con scroll infinito y secciones Todo, Social, Económico, Político y Crónica. No hay login ni registro. Las noticias de muestra enlazan a sus fuentes periodísticas.

## Inicio local

Requisitos: Node.js 20.19 o posterior, npm y Docker Desktop.

Desde la raíz del repositorio, levanta los servicios locales de archivos e inferencia:

```powershell
docker compose up -d image-files image-verifier
```

Desde `client`, instala dependencias y arranca Next.js:

```powershell
npm ci
npm run dev
```

Abre `http://localhost:3000`. Mantén `npm run dev` activo: Next.js refleja los cambios del front con hot reload. PostgreSQL no es necesario para revisar el feed.

## Cargar imágenes en el borrador

Desde la raíz del proyecto, inicia el servidor ligero de archivos:

```powershell
docker compose up -d image-files
```

El servidor Nginx escucha solo en `127.0.0.1:8091` y sirve imágenes desde `var/private-images/`, una carpeta persistente fuera de `public/`. Next.js usa la ruta `/uploaded-images/...` para mostrarlas y valida el nombre de archivo antes de que el servidor las exponga. En `Crear noticia`, selecciona JPEG, PNG o WebP; se conserva en el almacenamiento local y queda asociada al borrador de la sesión.

## Analizar una imagen con el modelo local

El modelo `modelo.keras` está en `services/image-verifier/`, fuera de `public`. Compose carga el clasificador CNN en Docker y expone su API solo en `127.0.0.1:8090`. Comprueba que terminó de cargar:

```powershell
Invoke-RestMethod http://127.0.0.1:8090/health
```

Desde `client`, configura el adaptador y arranca Next.js:

```powershell
$env:IMAGE_VERIFICATION_URL = "http://127.0.0.1:8090/verify"
npm run dev
```

En `Crear noticia`, la app valida el formato real, calcula el SHA-256 y envía la imagen al clasificador local cuando está disponible. La noticia sigue siendo un borrador de la sesión; su imagen queda guardada localmente para que no desaparezca al cerrar el modal o recargar la vista.

El modelo clasifica la imagen como **probablemente real** o **probablemente generada por IA**. Su puntaje no es una probabilidad calibrada y el resultado no verifica la veracidad de la noticia. Las métricas incluidas corresponden a Tiny-GenImage y no garantizan el mismo rendimiento con otras fuentes, generadores o ediciones.

## Experiencia

- Una sola página con feed continuo; las secciones son Todo, Social, Económico, Político y Crónica.
- `Crear noticia` abre tres pasos: titular/tema, resumen/contenido/imagen y vista previa.
- Al agregar una noticia, aparece al inicio del feed sin cambiar el titular escrito.
- Las noticias que vienen en la muestra se basan en publicaciones verificables e incluyen un enlace a la fuente. Sus fotos externas solo se usan en esas muestras; no se guardan en el repositorio.

## Límites del MVP

El feed y las noticias creadas desde el modal viven solo en memoria del navegador; no se guardan ni se publican. Las imágenes que se cargan desde `Crear noticia` sí quedan en `var/private-images` hasta que se eliminen manualmente. Los artículos de muestra enlazan a su fuente original. El resultado del modelo solo clasifica la imagen y no demuestra la veracidad de la noticia.

## Calidad

Desde `client`: `npm run lint`, `npm run typecheck` y `npm run build`.
