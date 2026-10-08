# Roadmap – Sistema Web "Descanso Total"

Fuente: Entrega 1 (ERS, EDT, Mockups). Stack: Next.js (App Router, última versión), Supabase (Postgres + Auth + Storage), backend Node dentro de Next (Route Handlers + Server Actions), Webpay Plus, SendGrid, PDF con @react-pdf/renderer, deploy en Vercel.

## Decisiones técnicas
- Un solo repo Next.js. El "backend Node" son Route Handlers (`app/api/**`) y Server Actions. Sin Express aparte.
- Supabase Auth con roles en tabla `profiles` (`admin`, `funcionario`, `cliente`). RLS por rol.
- Reglas críticas en Postgres: constraint de exclusión por rango de fechas para evitar overbooking (RNF09), trigger de auditoría (RNF15).
- UI: Tailwind + shadcn/ui, español, responsive (RNF03). Zona horaria America/Santiago, CLP (RNF16).
- Tests: Vitest (unit) + Playwright (e2e) en fase QA.

## Módulos (según ERS 2.1)
1. Portal Clientes: catálogo, reservas, servicios extra, pagos.
2. Recepción / Terreno: check-in, check-out, inventario, actas PDF.
3. Logística: transporte, tours, correos automáticos.
4. Administración: clientes, departamentos, mantenciones, finanzas, reportes.

## Fases de desarrollo

### Fase 0 – Setup (RF01 base)
- [x] Crear proyecto Next.js + TypeScript + Tailwind + shadcn/ui.
- [x] Clientes server/browser (`@supabase/ssr`), proxy de sesión, `requirePerfil()`.
- [x] Layout base, navegación por rol, login, registro, dashboard.
- [x] `.env.local` con claves del proyecto Supabase, migración 0001 aplicada, admin de prueba creado (`scripts/seed-admin.mjs`), login verificado en navegador.

### Fase 1 – Datos y autenticación (RF01, RNF04, RNF09, RNF15)
- [x] Migración 0002: 22 tablas (configuracion, zonas, departamentos, fotos, tarifas_temporada, servicios, vehiculos, conductores, clientes, inventario_items/movimientos, reservas, acompanantes, reserva_servicios, transportes, pagos, actas, reserva_cargos, mantenciones, movimientos_financieros, notificaciones, auditoria).
- [x] Reglas en BD: exclusion constraint anti-overbooking, bloqueo reserva<->mantención, cálculo de arriendo por tarifa/temporada, anticipo por configuración, recálculo de totales, pago aprobado => confirmada + ingreso financiero, actas => en_curso/finalizada, auditoría inmutable.
- [x] Funciones: `departamentos_disponibles()`, `estado_departamento_actual()`, `tarifa_noche()`, `calcular_arriendo()`, `recalcular_reserva()`. Vista `vw_departamentos`.
- [x] RLS por rol en todas las tablas, buckets de Storage (departamentos público; actas, firmas, comprobantes privados).
- [x] Migración 0003: configuración, 5 zonas, 10 departamentos, 7 servicios, flota de prueba.
- [x] Tipos generados en `src/lib/supabase/database.types.ts` (regenerar tras cada migración: `npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public`).

### Fase 2 – Administración central (RF02, RF03, RF04, RF05)
- [x] CRUD clientes con búsqueda, validación de RUT chileno y mensajes de duplicado (`/admin/clientes`).
- [x] CRUD departamentos con fotos en Storage (portada, eliminar), amenidades, activo/inactivo (`/admin/departamentos`).
- [x] Inventario valorizado por departamento con movimientos (alta, baja, deterioro, reparación => egreso financiero) (`/admin/inventario/[id]`).
- [x] Dashboard admin con KPIs, tablero de estado en tiempo real y próximas estadías.
- [ ] Pendiente para fases siguientes: gestión de tarifas por temporada y catálogo de servicios desde el panel (hoy se editan en BD).

### Fase 3 – Portal de clientes y reservas (RF06, RF07, RF08, RF11, RF17)
- [x] Home con buscador, catálogo `/departamentos` (filtra con `departamentos_disponibles`) y detalle con cotización (`cotizar_reserva`).
- [x] Motor de reservas `/reservar/[id]`: RPC `crear_reserva` atómica (valida disponibilidad, capacidad, fechas; inserta servicios y encola notificación).
- [x] Acompañantes (alta/baja por el cliente mientras la reserva esté activa).
- [x] Servicios extra y tours seleccionables al reservar, con resumen en vivo.
- [x] Cancelación (`cancelar_reserva`: multa automática si pagó y cancela fuera de plazo) y reprogramación (`modificar_reserva`, respeta plazo y disponibilidad).
- [x] "Mis reservas" con detalle, desglose, pagos y estado. Botón Webpay deshabilitado hasta Fase 4.
- [x] Usuario cliente de prueba: `scripts/seed-cliente.mjs` (credenciales en `.env.local`).

### Fase 4 – Pagos y notificaciones (RF12, RF23, RF10)
- [x] Webpay Plus con `transbank-sdk` (`src/lib/webpay.ts`): sin `WEBPAY_COMMERCE_CODE`/`WEBPAY_API_KEY` usa integración de Transbank. Flujo: `iniciarPagoWebpay` (anticipo o saldo) → `/pagos/webpay/iniciar/[pagoId]` (auto-submit) → `/pagos/webpay/retorno` (ruta pública, commit con cliente admin, maneja abortos y timeouts).
- [x] Pagos manuales del staff (`/admin/reservas/[id]`): transferencia/efectivo, reembolsos; listado y filtro de reservas en `/admin/reservas`, cancelación y no-show.
- [x] Correos con SendGrid REST (`src/lib/email.ts`): sin `SENDGRID_API_KEY` se simulan en desarrollo. Plantillas en `src/lib/notificaciones.ts` (confirmación, comprobante, coordinación de transporte, recordatorio de check-out, cancelación).
- [x] Cola `notificaciones` + trigger comprobante al aprobar pago + `encolar_notificaciones_programadas()` (48h llegada / 24h check-out). Cron `GET /api/cron/notificaciones` con `CRON_SECRET` (vercel.json, cada hora).
- [ ] Pendiente al decidir proveedores: rellenar `WEBPAY_*` (producción) y `SENDGRID_API_KEY` + `EMAIL_FROM` en `.env`. No requiere cambios de código.

### Fase 5 – Operaciones en terreno (RF13, RF14, RF15, RF16, RF22)
- [x] `/terreno` (rol funcionario y admin): llegadas pendientes, estadías en curso y búsqueda; tarjetas con botones grandes para tablet.
- [x] Check-in `/terreno/[id]/check-in`: registro de acompañantes faltantes, checklist del inventario del departamento, cobro del saldo (efectivo/transferencia/webpay POS), firma táctil (canvas → PNG en bucket `firmas`), observaciones. Acta PDF con `@react-pdf/renderer` en bucket `actas`; trigger pasa la reserva a en_curso.
- [x] Check-out `/terreno/[id]/check-out`: muestra el estado de entrada por ítem, marca daños/faltantes con cargo sugerido (valor de reposición), multa adicional, cobro final; crea `reserva_cargos`, movimientos de inventario (deterioro/baja) y actualiza estado del ítem; acta PDF con liquidación; trigger finaliza la reserva.
- [x] Descarga de actas `GET /api/actas/[id]` (RLS decide: staff o cliente dueño). Enlaces en "Mis reservas" y en `/admin/reservas/[id]`.
- [x] Usuario funcionario de prueba: `scripts/seed-funcionario.mjs`. Funcionario accede a `/terreno` y `/admin/reservas`; clientes, departamentos e inventario quedan solo para admin.

### Fase 6 – Logística y mantenciones (RF09, RF11, RF18)
- [ ] Vehículos, conductores y asignación de traslados por reserva.
- [ ] Gestión de tours y venta presencial.
- [ ] Programación de mantenciones con bloqueo automático de fechas.

### Fase 7 – Finanzas y reportería (RF19, RF20, RF21, RF22)
- [ ] Ingresos y egresos (arriendos, servicios, reparaciones, dividendos, contribuciones).
- [ ] Informes diarios/semanales/mensuales/anuales por departamento y zona, exportables a PDF.
- [ ] Dashboard con KPIs y estadísticas de ocupación, temporadas y rentabilidad.

### Fase 8 – QA, seguridad y despliegue (RNF06-08, RNF11, RNF12, RNF13)
- [ ] Tests unitarios de reglas de negocio y e2e de reserva, pago y check-in.
- [ ] Revisión de RLS, validaciones (zod) en cliente y servidor, mensajes de error.
- [ ] Rendimiento (índices, caché), respaldos Supabase, deploy a Vercel.
- [ ] Manuales por rol y documentación técnica.

## Estado
Fase actual: 6 (Fase 5 cerrada el 08-10-2026). Webpay/SendGrid siguen en modo integración/simulado hasta tener credenciales. Actualizar esta sección al cerrar cada fase.

Notas: UI con preset shadcn `b5cReslJ2` (nova, zinc, teal, DM Sans); reaplicar con `npx shadcn@latest apply b5cReslJ2` si se reinstalan componentes. Formularios: `src/components/form/fields.tsx` + `FormState` en `src/lib/form.ts` (conserva valores tras error porque React 19 resetea el form). migraciones se aplican con `bash scripts/migrate.sh` (psql 18 local + SUPABASE_DB_URL, pooler aws-0-us-west-2). shadcn usa estilo base-nova (Base UI): el Button no acepta `asChild`, usar `render={<Link ... />}`. Next 16 usa `src/proxy.ts` en vez de middleware.
