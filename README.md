# Pulso — feed de noticias

Una página pública de noticias periodísticas con scroll infinito, filtros por tema y un flujo de demostración para crear noticias en un modal de tres pasos. No hay login ni registro. Los datos iniciales de Santo Domingo son ficticios y se marcan como contenido de prueba.

## Inicio local

Requisitos: Node.js 20.19 o posterior y npm.

Desde `client`, ejecuta:

```powershell
npm ci
npm run dev
```

Abre `http://localhost:3000`. Mantén `npm run dev` activo: Next.js refleja los cambios del front con hot reload. PostgreSQL no es necesario para revisar el feed; la creación de noticias de demostración solo dura en la sesión actual del navegador.

## Analizar una imagen con el modelo local

El modelo `modelo.keras` está en `services/image-verifier/`, fuera de `public`. Para usarlo, inicia el servicio en una terminal:

```powershell
cd services/image-verifier
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python server.py
```

En otra terminal, desde `client`, configura el adaptador y arranca Next.js:

```powershell
$env:IMAGE_VERIFICATION_URL = "http://127.0.0.1:8090/verify"
npm run dev
```

En `Crear noticia`, el paso de imagen permite cargar JPEG, PNG o WebP de hasta 10 MB. La app valida el formato real, calcula el SHA-256, analiza la imagen y elimina el archivo temporal al terminar. El borrador y su resultado viven solo en la sesión del navegador.

El modelo clasifica la imagen como **probablemente real** o **probablemente generada por IA**. Su puntaje no es una probabilidad calibrada y el resultado no verifica la veracidad de la noticia. Las métricas incluidas corresponden a Tiny-GenImage y no garantizan el mismo rendimiento con otras fuentes, generadores o ediciones.

## Experiencia

- Una sola página con feed continuo; a los lados hay filtros temáticos y contexto editorial.
- `Crear noticia` abre tres pasos: titular/tema, resumen/contenido/imagen y vista previa.
- Al agregar una noticia, aparece al inicio del feed sin cambiar el titular escrito.
- Las publicaciones sintéticas se identifican como prueba y no describen acontecimientos reales.

## Límites del MVP

El feed y las noticias creadas desde el modal viven solo en memoria del navegador; no se guardan ni se publican. Los artículos iniciales y las imágenes son material ficticio e ilustrativo. No hay proveedor ni modelo de IA conectado, y ninguna imagen o noticia se presenta como verificada.

## Calidad

Desde `client`: `npm run lint`, `npm run typecheck` y `npm run build`.
