# 01 — Foundation: esquema, contratos y bases de ejecución

## Propósito
Establecer una base ejecutable compartida para los worktrees sin desarrollar aún el CRUD ni los patrones finales. Todas las implementaciones posteriores parten de contratos, migraciones y configuraciones reproducibles.

## Entradas y dependencias
- Leer `AGENTS.md` y el enunciado del taller.
- Fuente de BD: https://github.com/ericsolor/restaurant-dbms-postgresql; inspeccionar SQL real y confirmar estructura, nombres exactos y restricciones. No asumir que los scripts son compatibles sin adaptación.
- Decisiones: Java 21, Spring Boot, JPA/Hibernate, PostgreSQL, React/Vite, MD3, CSS Modules, Docker solo PostgreSQL, sin login.
- Etapa anterior: ninguna. Esta etapa es **bloqueante** para la integración del resto.

## Entregables
1. Estructura monorepo `app/`, `client/`, `payment-simulator/`, `database/original/`, `database/backup/`, docs de etapas y `README.md` inicial.
2. Backend Spring Boot iniciado, health/status sencillo, manejo global de excepciones y configuración por perfiles `local`, `test`, `demo`.
3. PostgreSQL persistente con Compose; variables documentadas en `.env.example`; sin backend/frontend en Compose.
4. SQL original archivado sin alterar y con referencia al repositorio; una cadena Flyway que instala esquema + seeds reproduciblemente una única vez, sin ejecutar queries de ejemplo destructivas.
5. Hibernate `ddl-auto=validate`, pool de conexiones ajustable, mapeo inicial validado de tablas necesarias, sin exponer entidades JPA como contratos HTTP.
6. Proyecto React/Vite navegable con shell, rutas iniciales, tema neutral MD3, CSS Modules, manejo básico de errores y componentes accesibles.
7. Contratos acordados entre `orders` y `payments` antes del trabajo paralelo: IDs, DTO de confirmación, resultado, errores de negocio, `PaymentGateway`, publicación de eventos, estados legales y contrato de auditoría.
8. README mínimo con requisitos y pasos de inicio/paro desde entorno limpio.

## Tareas detalladas
### A. Auditoría de SQL original (dueño: agente de base de datos)
- Revisar DDL/seed y listar `Customers`, `Orders`, `Order_Items`, `Payments`, `Menu_Items`, `Order_Status` y cualquier tabla exigida por sus FK.
- Registrar identificadores citados, tipos monetarios, llaves compuestas, unique, checks, defaults y estado de las semillas.
- Verificar necesidad de estado pendiente/completada/cancelada; diseñar mapeo sin mutar filas existentes arbitrariamente.
- Diseñar cambios mínimos (`audit_events`, versión optimista solo si aporta valor) como migraciones posteriores; documentar impacto y plan de rollback lógico.
- Decidir una convención para ejecutar scripts originales con Flyway sin duplicar bootstrap. Verificar idempotencia de inicialización de volúmenes nuevos, no reejecutar seeds en reinicios.

### B. Esqueleto backend (dueño: agente backend foundation)
- Crear proyecto Java 21 y paquetes `features/<feature>/{domain,application,infrastructure,presentation}` cuando aporten código, y `shared/` restringido.
- Configurar datasource, Flyway y validación de esquema de Hibernate, perfiles y logging; endpoint sencillo de salud que no exponga detalles sensibles.
- Definir contrato REST transversal de errores con IDs de correlación y códigos estables; sin stack traces al consumidor.
- Diseñar puertos de dominio/aplicación para coordinación de órdenes y pagos; crear solo contratos útiles, sin implementaciones artificiales.
- Documentar ownership de archivos compartidos `pom.xml`, perfiles de Spring y migraciones.

### C. Esqueleto frontend (dueño: agente frontend foundation)
- Vite + React, router, layout con navegación Órdenes / Auditoría / Laboratorio, estados vacíos y página 404.
- Material Design 3 en estilo neutro, tokens CSS y CSS Modules por componente; implementar navegación teclado y foco visibles.
- Cliente HTTP común con URL por entorno, parseo de errores normalizados y no duplicar clientes por feature.
- Pantallas inicialmente vacías y honestas: no mostrar datos falsos como reales.

### D. Puertas de contratos e integración (coordinador)
- Publicar `contracts.md` mínimo: endpoints previstos, JSON de creación/edición, confirmación de pago, estados, errores, eventos, simulador, auditoría y plan de perfiles.
- Congelar interfaz pública para que 02 desarrolle órdenes y 03 desarrolle patrones/pagos en worktrees separados.
- Integrar cambios compartidos en una base común antes de activar 02/03. El usuario hace commits y merges.

## Pruebas obligatorias
- `mvn test` (prueba de arranque y validación de contexto) y compilación/package sin saltar tests.
- Testcontainers inicia PostgreSQL limpio; Flyway migra desde cero; Hibernate valida tablas sin `create/update`.
- Volver a levantar el contenedor sobre volumen persistente no duplica datos ni ejecuta semillas por segunda vez.
- `npm run build` y lint frontend pasan; navegación shell sin errores en consola.
- Secret scan manual de archivos de configuración y `.gitignore` efectivos.

## Criterios de aceptación
- [ ] Docker Compose inicia exclusivamente PostgreSQL y mantiene datos entre reinicios.
- [ ] Originales preservados, schema/seed instalables y trazables a la fuente.
- [ ] Flyway + JPA validate pasan en BD recién creada y BD reiniciada.
- [ ] Backend y frontend arrancan con instrucciones del README.
- [ ] Contratos inter-feature aprobados y sin dependencias circulares.
- [ ] Compilación, lint y pruebas de esta etapa pasan con resultados registrados.

## Paralelización / bloqueos
- Auditoría SQL, esqueleto backend y esqueleto frontend pueden elaborarse en worktrees paralelos con propiedad exclusiva de archivos.
- El backend no fija entidades definitivas antes de la auditoría SQL.
- Nadie comienza persistencia final ni pago hasta integrar esquema + contratos.

## Entrega del agente
Resumen de archivos modificados, diff de contratos, resultados de comandos, bloqueos, decisiones de migración y sugerencia de commit (sin ejecutarlo).
