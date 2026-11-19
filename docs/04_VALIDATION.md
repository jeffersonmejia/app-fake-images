# 04 — Validation: laboratorio, robustez y entrega académica

## Propósito
Integrar todas las etapas y entregar un proyecto reconstruible con evidencias reales, pruebas reproducibles, PDF, ZIP y backup restaurable.

## Dependencias
- 01, 02 y 03 aprobadas, integradas por el usuario con contratos compatibles.
- Todos los worktrees sincronizados con la base integrada. Solo el coordinador/usuario resuelve cambios globales.

## Tareas detalladas
### A. Panel de demostraciones
- Una única pantalla `Laboratorio` con escenarios separados: COMMIT, ROLLBACK, consistencia, concurrencia, durabilidad (guía y verificación posterior), Proxy, Observer, Adapter, Circuit Breaker fallo y recuperación.
- Cada ejecución muestra: nombre, parámetros, momento, estado, ID de correlación, respuesta HTTP, diferencia verificable de filas/estado e indicación del concepto académico.
- Para concurrencia, botón que dispara una prueba backend coordinada con dos clientes/transacciones reales y devuelve ambas respuestas; ofrecer opción de abrir dos pestañas/usuarios para la exposición.
- Para Circuit Breaker, controles de fallo/recuperación del simulador, estado y número de llamadas; `HALF_OPEN` no debe fingirse desde frontend.
- Seguridad del laboratorio: solo perfil demo local; indicador de modo demo y datos aislados/etiquetados; nunca público sin protecciones.
- No considerar una captura o un toast como evidencia suficiente: se necesitan consultas persistentes o trazas controladas.

### B. Pruebas finales de aceptación
| ID | Escenario | Resultado verificable |
| --- | --- | --- |
| AT-01 | CRUD órdenes | Create/read/update/cancel lógica, estados coherentes |
| AT-02 | COMMIT | Orden completada + 1 pago durable |
| AT-03 | ROLLBACK | Excepción intermedia después de flush, sin cambios parciales |
| AT-04 | Consistencia | Rechazar cantidad 0, orden inexistente e importe incoherente |
| AT-05 | Concurrencia | Dos pagos simultáneos, solo uno confirmado y otro conflicto |
| AT-06 | Durabilidad | Reiniciar app y contenedor con volumen conservado, datos siguen |
| AT-07 | Proxy | Identificación de delegación/intercepción y auditoría |
| AT-08 | Observer | Dos suscriptores post-commit, ninguno post-rollback |
| AT-09 | Adapter | Transformación interna ↔ externa comprobable |
| AT-10 | Breaker OPEN | Fallos suficientes → OPEN, sin solicitudes externas en OPEN |
| AT-11 | Breaker recuperado | HALF_OPEN + prueba exitosa → CLOSED |
| AT-12 | Breaker recae | HALF_OPEN + prueba fallida → OPEN |
| AT-13 | Restauración | `pg_restore` de backup en BD limpia reproduce esquema y datos |
| AT-14 | Reconstrucción | ZIP limpio ejecuta instalación y pruebas según README |

### C. Validación técnica y calidad
- Ejecutar unitarias, integración Testcontainers, concurrencia repetida y contratos simulador; registrar comandos y resultados reales.
- Ejecutar build y lint de frontend; validar formularios, paginación, estados, errores, accesibilidad básica y 404.
- Comprobar que modo demo no está habilitado en perfil normal; errores no exponen trazas ni secretos.
- Comparar backend vs PostgreSQL con consultas SQL, no solo JPA EntityManager o caché.
- Medir que el proyecto reinicia sin romper la BD ni recrear seeds y que la limpieza de datos de test es segura.
- Verificar que no haya `target/`, `node_modules/`, `dist/`, `.git/`, logs, secretos ni archivos de cache en ZIP.

### D. Backup y restauración
- Tras demos, exportar `BD_MejiaChavezJeffersonPaul.backup` en formato custom pg_dump (`-F c`) con estructura y datos.
- Restaurar a base **nueva y vacía** mediante `pg_restore`, verificando tablas, FK, checks, auditoría, órdenes, detalles y pagos.
- Documentar dentro y fuera de Docker, nombres de contenedor/usuario configurables y diferencias de versión de PostgreSQL.
- Archivar SQL original sin modificar y declarar migraciones añadidas.

### E. README final
Incluir: tecnologías/versiones realmente usadas, requisitos, variables por entorno, pasos desde cero, scripts originales, arranque postgres/backend/frontend/simulador, usuario de prueba (sin login: DEMO_OPERATOR), endpoints importantes, COMMIT/ROLLBACK, concurrencia, breaker, logs de Observer/Proxy, comandos de test, restauración del backup, solución de problemas y limitaciones conocidas.

### F. Informe y ZIP (entrega Moodle)
- PDF `Taller_Consistencia_MejiaChavezJeffersonPaul.pdf`: portada, BD asignada, stack, arquitectura, tablas, flujo, capturas de CRUD, cada propiedad ACID, cinco SOLID, cuatro patrones, fallo externo, resultados de casos, conclusiones y URL del repositorio.
- Capturas auténticas con ID de orden/tiempo/resultado SQL; código citado en el informe como texto editable y resaltado, no capturas de código.
- ZIP `Proyecto_MejiaChavezJeffersonPaul.zip` con código fuente, migraciones, originales, simulador, README y backup; excluir binarios/dependencias descargables.
- Dos archivos a Moodle: PDF y ZIP, backup **dentro del ZIP**. No subir backup como tercera entrega independiente.
- El usuario realiza commits/push y publicación del repositorio. Agentes solo proponen mensajes, no ejecutan operaciones Git de escritura.

## Criterios de aceptación final
- [ ] 14 escenarios AT ejecutados; pruebas fallidas documentadas y corregidas.
- [ ] Laboratorio ejecuta pruebas independientes sin editar código, y muestra hechos verificables.
- [ ] COMMIT, ROLLBACK, integridad y aislamiento demostrados en PostgreSQL.
- [ ] Circuit Breaker atraviesa tres estados y bloquea en OPEN.
- [ ] Reinicio y restauración validan durabilidad.
- [ ] Suite backend, lint/build frontend y simulador pasan sin errores.
- [ ] README permite reconstrucción por otra persona.
- [ ] PDF y ZIP tienen nombres exactos y contienen todo lo solicitado, sin secretos.

## Orden para ejecución en vivo
1. CRUD y pago normal; consultar datos persistidos.
2. Error inyectado, rollback y consulta de cambios.
3. Concurrencia de pago único con dos solicitudes sincronizadas.
4. Proxy y eventos de dos observadores.
5. Proveedor disponible; provocar fallos hasta OPEN; probar bloqueo; recuperar en HALF_OPEN y CLOSED.
6. Reiniciar app/DB sin borrar volumen; verificar pago anterior.

## Entrega del agente
Matriz AT con evidencia por caso, comandos de test con exit code, instrucciones de reproducción, checklist de ZIP/PDF y sugerencias de commits sin ejecutarlos.
