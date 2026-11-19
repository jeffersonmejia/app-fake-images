AGENTS.md — Reglas generales para agentes de desarrollo
Contexto del producto
Web de noticias editorial, Next.js App Router + React + TypeScript, frontend y backend en un único repositorio, PostgreSQL mediante Docker (solo BD), Prisma, autenticación por rol READER/`JOURNALIST`, imágenes locales, verificación IA mediante puertos/adaptadores. Diseño celeste pastel inspirado en la fluidez de iOS, pero web-first. Consultar las etapas 01-fundamentos-arquitectura.md a 04-integracion-ia-y-entrega.md antes de trabajar.
Orden de trabajo
1. Leer los documentos de requerimientos y comprobar el estado real del repositorio.
2. Trabajar en el alcance de la etapa actual; terminar funcionalidad y validaciones antes de comenzar la siguiente.
3. Identificar archivos afectados y respetar contratos existentes; no cambiar APIs, nombres públicos ni esquemas compartidos sin necesidad documentada.
4. Priorizar la experiencia visual y el flujo real de verificación de imágenes. No afirmar que un modelo está integrado si no lo está.
5. Al cerrar cada tarea, informar cambios, comandos ejecutados, resultados y limitaciones. No crear commits ni hacer push: el responsable se encarga.
Arquitectura y calidad
- Organizar primero por feature y dentro por capas domain, application, infrastructure, presentation según necesidad.
- src/app solo enrutamiento/composición y handlers delgados; lógica del negocio en casos de uso.
- Aplicar SOLID con criterio: dependencias hacia contratos, interfaces para fronteras externas o alternativas reales; prohibida la sobreingeniería (interfaces vacías, factories ceremoniales, archivos placeholder sin utilidad).
- Respetar límites entre features y evitar importaciones de implementación interna de features ajenas.
- Código y mensajes al usuario en español; símbolos de código en inglés coherente; nomenclatura consistente.
- TypeScript estricto, Zod en fronteras, manejo central de errores y logs útiles sin secretos ni stack traces expuestos.
- Reutilizar componentes cuando haya reutilización real, evitar duplicación y cambios masivos ajenos al alcance.
- Usar Server Components por defecto y Client Components solo para interactividad real.
Diseño UX/UI (prioridad del producto)
- Estética editorial moderna de sitio web, no prototipo de aplicación móvil.
- Celeste pastel como acento, fondo claro, texto legible, fotos protagonistas, espaciado amplio.
- No duplicar títulos ni apilar encabezados redundantes.
- No inventar titulares promocionales ni superponer texto sobre los titulares del usuario; conservar sus títulos tal cual y, si todavía no están disponibles, dejar ese espacio sin titular.
- No abusar de bordes, sombras, tarjetas, iconos ni badges. Priorizar espacios, tipografía y contraste suave.
- CSS Modules por componente, tokens CSS globales, Lucide React, animaciones Motion/CSS suaves y prefers-reduced-motion.
- Diseño accesible y responsive con foco visible, teclado y estados loading/empty/error/success.
- No introducir bibliotecas visuales pesadas sin justificación.
Seguridad, datos y publicación
- Autorizar siempre del lado servidor: actor autenticado, rol y propiedad de recurso.
- Registrar periodistas sin aprobación humana, pero no permitir escalada de rol mediante payloads modificados.
- Nunca guardar contraseña sin hash ni exponer credenciales, .env, rutas internas, logs sensibles o trazas.
- Subidas: validar formato real/tamaño, generar nombre seguro, almacenar fuera de public, calcular SHA-256 y proteger rutas.
- La publicación exige estado aprobado de la imagen vigente, con hash coincidente; editar/reemplazar la imagen invalida la aprobación.
- Ante IA caída, inconclusa, no configurada, inválida o rechazada: no publicar. No abrir bypass manual o de frontend.
- Mock de IA exclusivamente local: prohibido como aprobación de producción.
- Sin proveedor real, permitir borradores pero no falsas publicaciones «verificadas».
- PostgreSQL únicamente en Docker, recursos delimitados, volumen persistente, migraciones versionadas.
IA desacoplada
- Casos de uso dependen de ImageVerificationPort; adaptadores HTTP, mock local o futuro proveedor se implementan en infraestructura.
- No acoplar lógica a FastAPI, Python, ONNX, un modelo particular ni umbrales supuestos.
- Normalizar respuestas y errores, registrar versión/latencia/hash cuando aplique.
- Nunca comunicar que verificar una imagen equivale a verificar la veracidad completa de una noticia.
Pruebas y verificaciones
- No agregar Jest, Vitest, Testing Library, Playwright ni pruebas automatizadas generales/unitarias/E2E.
- Sí ejecutar lint, comprobación de tipos y build, resolviendo fallos antes de cerrar etapa.
- Excepción IA: verificaciones puntuales de integración por HTTP (curl/Postman), caída/timeout, rechazo y hash; Pytest y métricas (precision, recall, F1, matriz de confusión, latencia) solo cuando exista modelo Python y dataset etiquetado.
- No falsear resultados de pruebas o métricas. Declarar claramente lo que no se pudo verificar.
Colaboración y control de cambios
- Si hay varios agentes/worktrees, cada uno debe limitarse a su asignación y evitar editar simultáneamente archivos compartidos sin coordinación.
- No renombrar/mover carpetas, cambiar esquema de BD, contrato IA, configuración compartida ni dependencias centrales sin explicar el impacto.
- Inspeccionar diferencias antes de finalizar; no sobrescribir trabajo ajeno.
- Nunca hacer git reset --hard, rebase destructivo, force push o commits no solicitados.
- El responsable crea y revisa los commits. Si solicita convención, usar Conventional Commits en español con asunto minúsculo.
Prioridad y criterio de entrega
1. Seguridad/integridad de publicación y desacoplamiento de IA.
2. Diseño editorial celeste, suave y consistente.
3. Funcionalidad completa de noticias, usuarios y permisos.
4. Mantenibilidad, legibilidad y compilación reproducible.
No llamar «terminado» a un flujo que depende de datos falsos o evita la verificación. Documentar límites reales del MVP en README.
