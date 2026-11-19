# 03 — Patterns: SOLID, Proxy, Observer, Adapter y Circuit Breaker

## Propósito
Introducir patrones verificables y proveedor HTTP simulado, manteniendo el pago de 02 transaccional y evitando acoplar la lógica de negocio a APIs externas.

## Dependencias
- Etapa 01 aprobada, contratos de órdenes/pagos/eventos publicados.
- Puede iniciarse **en paralelo con 02** solo en archivos de propiedad exclusiva: `payments` infraestructura y aplicación según contrato, `audit`, `payment-simulator`, tests asociados y componentes de laboratorio propios; integración final tras 02.
- No modificar directamente el caso de uso de órdenes en otro worktree.

## Tareas detalladas
### A. SOLID por evidencia
- SRP: separar controlador, caso de uso, adaptador PostgreSQL, cliente externo, auditoría y notificación.
- OCP: `PaymentGateway` (contrato) implementado por proveedor HTTP simulado y fake de test sin cambiar el caso de uso.
- LSP: dos `NotificationPort` sustituibles (console e in-memory/test), verificadas con tests de contrato idénticos.
- ISP: puertos separados para lectura de órdenes, escritura transaccional, gateway, auditoría y notificación.
- DIP: no importar infraestructura desde dominio/application; realizar verificaciones de dependencia por paquetes o revisión automatizada.
- Documentar tabla principio → clases relevantes → test demostrativo.

### B. Proxy explícito
- Definir `PaymentOperation` o contrato equivalente, implementación real de caso de uso y `PaymentServiceProxy` en la frontera correspondiente.
- Proxy registra operación, actor fijo de demostración, hora, correlación y resultado; delega sin reemplazar validación central.
- Demostrar cliente → proxy → servicio real en test/log y sin confundirlo con un `@ControllerAdvice` genérico.
- Auditoría de intentos fallidos puede guardarse en transacción independiente cuando sea necesario, pero la confirmación transaccional no debe adelantarse.

### C. Observer
- Publicar `OrderCompletedEvent` solo tras COMMIT real (`@TransactionalEventListener` AFTER_COMMIT o abstracción equivalente).
- Dos observadores independientes: `AuditObserver` persistente y `NotificationObserver` console/in-memory. Ambos registran la misma correlación e ID de orden.
- Los fallos de notificación no revierten pagos ya confirmados; registrar fallo y política de recuperación, sin prometer entrega garantizada. Si se necesita garantizar entrega post-commit, proponer outbox como extensión fuera del MVP.
- Verificar que un rollback no genera observaciones de orden confirmada.

### D. Adapter HTTP independiente
- Implementar simulador local con contrato distinto al interno (p. ej. `executeTransaction(value, code, idempotencyKey)` frente a `authorize(orderId, amount)`). El simulador no efectúa cobros reales.
- Incluir endpoint de control de disponibilidad/fallos solo en modo laboratorio; idempotencia por clave y resultado determinista.
- Adapter realiza traducción de datos, códigos de respuesta, timeout y excepciones de red a errores de dominio/aplicación.
- Configuración host/puerto por entorno; sin URL secreta ni conexión real a proveedor comercial.

### E. Circuit Breaker
- Resilience4j envuelve la llamada del Adapter al simulador; establecer ventana mínima y umbral de fallos reproducibles, tiempo de OPEN y un permiso de prueba HALF_OPEN, todo configurable.
- Exponer estado actual y conteos mediante endpoint diagnóstico en perfil `demo` protegido por limitación a entorno local, sin ofrecer mutación en producción.
- Evidencia: CLOSED normal; fallos suficientes abren OPEN; nuevas llamadas bloqueadas sin tocar simulador; tras espera configurada, HALF_OPEN permite prueba; éxito cierra y error reabre.
- Evitar reintentos automáticos que distorsionen el número de llamadas y el resultado demostrado.

## Pruebas obligatorias
- Test de contrato LSP para ambas implementaciones de notificación; dependencias SOLID verificadas.
- Proxy: verificaciones de delegación una vez, auditoría de intento y respuesta de error.
- Observer: dos suscriptores ejecutados después del commit; ninguno en rollback; contar eventos sin confundir intento vs confirmación.
- Adapter: conversión de request/response y errores HTTP, timeouts, conexión caída (MockWebServer/WireMock o servidor local de tests).
- Circuit Breaker: estado inicial, transición a OPEN, no ejecución de request durante OPEN, HALF_OPEN éxito y fracaso, CLOSED posterior; reloj/duración configurados para tests deterministas.
- Integración 02 + 03: un pago normal, proveedor caído sin pago persistido, retry idempotente, comportamiento de auditoría.
- Backend build/tests/lint y simulador ejecutable sin dependencias ocultas.

## Criterios de aceptación
- [ ] Principios SOLID referenciados a clases reales y tests, no solo comentarios.
- [ ] Proxy distingue cliente, proxy y servicio real con traza observable.
- [ ] Observer cuenta dos reacciones post-commit, cero confirmaciones en rollback.
- [ ] Adapter traduce contratos incompatibles y errores sin filtrar DTO externo.
- [ ] Simulador corre independientemente del backend y no mueve dinero.
- [ ] Circuit Breaker demuestra CLOSED, OPEN, HALF_OPEN, CLOSED y rechazo en OPEN.
- [ ] Fallos de simulador no generan pagos confirmados.
- [ ] Compilación, lint y pruebas de etapa pasan.

## Riesgos/decisiones
- Una transacción SQL no revierte HTTP ya realizado: evitar cobros reales y documentar autorización/idempotencia.
- Publicar después del commit no garantiza notificaciones ante caída abrupta entre commit y callback; no presentar como garantía fuerte de entrega.
- No mezclar los tres patrones Proxy, Adapter y Circuit Breaker en una única clase opaca.

## Entrega del agente
Mapa principio/patrón → archivo → escenario, resultados de test, capturas/logs candidatos para informe y sugerencia de commit; no crear commit.
