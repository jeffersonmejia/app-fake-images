# 02 — Business: CRUD y transacción de órdenes

## Propósito
Entregar gestión funcional de órdenes y persistencia correcta, con reglas de negocio explícitas, sin exigir todavía que los patrones externos estén completos.

## Dependencia y entrada
- Etapa 01 integrada y aprobada; `AGENTS.md`, DDL real, contratos congelados y schema listo.
- Interfaz de pagos definida con puerto mock/fake para pruebas. Coordinar con etapa 03: solo el agente dueño de `payments` modifica su implementación concreta.

## Ownership y trabajo paralelo
- Agente backend órdenes: `app/.../features/orders/**`, coordinación transaccional definida por contratos y tests de orders.
- Agente catálogo/clientes: `app/.../features/catalog/**`, `customers/**` y sus pruebas.
- Agente frontend negocio: `client/src/features/orders/**`, componentes de menú y clientes; no cambiar shared sin revisión del coordinador.
- Agente BD: migraciones SQL nuevas, si son indispensables, solo mediante solicitud del dueño y verificación contra esquema original.
- Integración de pago en orders requiere que 03 publique un adaptador conforme a los contratos; durante esta etapa usar fake determinista.

## Tareas detalladas
### A. Consulta de datos
- Consultas paginadas de órdenes (incluyendo estado, cliente, total) con búsqueda básica; el servidor controla paginación, orden estable y límites.
- Consulta de detalle con ítems, cantidades, precios y estado de pago.
- Catálogo de productos y clientes para selección, sin CRUD total innecesario.
- Evitar consultas N+1; medir y ajustar joins/proyecciones según el esquema real.

### B. CRUD de órdenes
- Crear orden pendiente asociada a cliente o mesa permitida por el esquema; exigir al menos un ítem en el momento de pago.
- Agregar/quitar ítems, cambiar cantidades, consultar y editar solo en estado pendiente.
- Total calculado desde datos de servidor, `BigDecimal`, escala monetaria explícita, cantidades enteras positivas; no confiar en precio aportado por cliente.
- Cancelación lógica; nunca `DELETE` físico de transacciones confirmadas. Si falta estado cancelada válido, añadir migración justificada.
- Controlar código de errores: not found, validación, conflicto de estado, concurrencia y falla externa.

### C. Pago transaccional (negocio, con gateway fake en esta etapa)
- Caso de uso confirma pago con transacción real: prevalidación, autorización simulada idempotente externa al bloqueo largo, relectura de orden bajo bloqueo, comprobación de estado e inexistencia de pago, inserción de pago y transición a completada.
- Usar JPA `PESSIMISTIC_WRITE` y unique persistente para `Payments.order_id`; devolver conflicto controlado en segunda solicitud.
- La llamada externa se simula como autorización sin cargo real; repetir no debe duplicar autorizaciones por orden. Gestionar autorización exitosa pero commit fallido sin declarar cobro completado (documentar límite de consistencia externa).
- Inyección de fallo transaccional en perfil demo/test: fallar después de escribir cambios a varias tablas y antes del commit; forzar `flush` para mostrar escrituras SQL que se revierten. Nunca exponer activación de fallo en perfil normal.
- Generar evento de confirmación solo después del COMMIT (03 conectará observadores). No publicar eventos tras rollback.

### D. UI de órdenes
- Tabla real paginada, filtros, creación, edición, detalle, cancelación con confirmación, pago simulado.
- Mostrar errores en español, carga, vacío, éxito y conflictos 409 por concurrencia.
- Deshabilitar acciones ilegales según estado; backend siempre vuelve a validar.
- CSS Modules y tokens MD3, sin iconografía innecesaria; responsive básico.

## Pruebas obligatorias
- Unitarias de reglas (cantidades, total, transiciones y validaciones), dobles/fakes de puertos.
- Integración PostgreSQL Testcontainers para insert/select/update/cancel, relaciones, constraints y serialización del resultado.
- Normal: un pago → una fila en `Payments` y orden completada tras COMMIT.
- ROLLBACK: inyección después de persistir/flush, verificación antes/después de conteos y estado, sin filas parciales; la auditoría de intento se verifica aparte.
- Concurrencia: dos hilos/sesiones sincronizados sobre la MISMA orden con dos conexiones separadas; exactamente un ganador, un rechazo controlado, una fila de pago y estado correcto; repetir determinísticamente.
- Verificación de transacción con consultas SQL fuera del mismo EntityManager para no confundir caché con persistencia.
- Frontend: build/lint y flujos mínimos de formulario y estados (tests de componentes si se configura runner).

## Criterios de aceptación
- [ ] CRUD completo de órdenes pendiente/cancelada funciona sin errores de restricciones.
- [ ] Menú/clientes se consumen desde PostgreSQL real.
- [ ] Total y reglas se calculan y comprueban en backend.
- [ ] Pago normal hace commit; segundo pago se rechaza de forma controlada.
- [ ] Fallo inyectado produce rollback comprobado desde conexión independiente.
- [ ] Prueba concurrente real pasa de manera reproducible.
- [ ] UI responde a éxito y error, con compilación/lint/tests de etapa ejecutados.
- [ ] Puertos/eventos para 03 no están acoplados a implementación concreta.

## Puerta de integración
La etapa 02 debe quedar comprobable con fake del proveedor. La integración real de Circuit Breaker/Adapter ocurre en 03. Si 03 avanza en paralelo, no alterar contratos sin aviso y aprobación de coordinador.

## Entrega del agente
Archivos cambiados, endpoints disponibles, plan de datos de prueba, resultados de consultas/test, problemas y sugerencia de commit (sin efectuarlo).
