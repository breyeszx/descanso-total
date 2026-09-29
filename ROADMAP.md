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
- [ ] Migración inicial: profiles, clientes, departamentos, fotos, tarifas, inventario, reservas, acompañantes, servicios_extra, reserva_servicios, pagos, transportes, tours, mantenciones, movimientos_dinero, actas, auditoria.
- [ ] Enums de estado (departamento, reserva, pago). Exclusion constraint en reservas (departamento + daterange).
- [ ] RLS por rol, trigger de auditoría, seed de 10 departamentos.
- [ ] Middleware de auth y guards por rol. Tipos generados de Supabase.

### Fase 2 – Administración central (RF02, RF03, RF04, RF05)
- [ ] CRUD clientes (sin duplicados por RUT/email).
- [ ] CRUD departamentos con fotos (Supabase Storage), tarifas y servicios.
- [ ] Inventario valorizado por departamento (altas, bajas, deterioros, reparaciones).
- [ ] Tablero de estado en tiempo real (Disponible / Reservado / Ocupado / En Mantención).

### Fase 3 – Portal de clientes y reservas (RF06, RF07, RF08, RF11, RF17)
- [ ] Home y catálogo público con búsqueda por zona y fechas.
- [ ] Detalle de departamento y motor de reservas con cálculo de anticipo.
- [ ] Registro de acompañantes previo al check-in.
- [ ] Catálogo de servicios extra y tours contratables en la reserva.
- [ ] Cancelación y modificación según políticas de plazo.
- [ ] Panel "Mis reservas" del cliente.

### Fase 4 – Pagos y notificaciones (RF12, RF23, RF10)
- [ ] Integración Webpay Plus (transbank-sdk, ambiente de integración): anticipo, saldo, servicios, multas.
- [ ] Registro de pagos y liquidación de saldos.
- [ ] SendGrid: confirmación de reserva, comprobante de pago, alertas.
- [ ] Cron (Vercel Cron) para correo de transporte 48h antes de llegada y 24h antes de check-out.

### Fase 5 – Operaciones en terreno (RF13, RF14, RF15, RF16, RF22)
- [ ] Vista tablet de check-in: recepción, cobro de saldo, checklist de estado.
- [ ] Acta de check-in en PDF con firma del cliente (canvas) y almacenamiento en Storage.
- [ ] Check-out: checklist, registro de daños y multas.
- [ ] Acta de check-out y liquidación en PDF.

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
Fase actual: 1 (Fase 0 cerrada el 29-09-2026). Actualizar esta sección al cerrar cada fase.

Notas: migraciones se aplican con `bash scripts/migrate.sh` (psql 18 local + SUPABASE_DB_URL, pooler aws-0-us-west-2). shadcn usa estilo base-nova (Base UI): el Button no acepta `asChild`, usar `render={<Link ... />}`. Next 16 usa `src/proxy.ts` en vez de middleware.
