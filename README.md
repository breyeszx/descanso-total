# Descanso Total

Sistema web de gestión de arriendos turísticos, servicios y operaciones. Next.js 16 + Supabase. Ver `ROADMAP.md` para el estado por fase y `CLAUDE.md` para convenciones.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completar claves de Supabase
bash scripts/migrate.sh      # aplica supabase/migrations en orden (requiere psql y SUPABASE_DB_URL)
node scripts/seed-admin.mjs  # crea el admin; también seed-cliente.mjs y seed-funcionario.mjs
npm run dev
```

Pruebas: `npm test` (unitarias con node:test) y `bash scripts/test-db.sh` (reglas de negocio contra la base, en transacción revertida).

Tras cada migración regenerar tipos: `npx supabase gen types typescript --db-url "$SUPABASE_DB_URL" --schema public > src/lib/supabase/database.types.ts`.

## Despliegue en Vercel

1. Importar el repositorio en Vercel (framework Next.js, sin configuración extra).
2. Variables de entorno (Production y Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (secreta; usada por Webpay, cron, correos y actas)
   - `NEXT_PUBLIC_APP_URL` = URL pública del sitio (la usa Webpay para el retorno y los correos para los enlaces)
   - `CRON_SECRET` = cadena aleatoria larga (Vercel la envía al cron de `vercel.json`)
   - `TZ` = `America/Santiago` (fechas y horas de traslados)
   - Opcionales: `WEBPAY_COMMERCE_CODE` + `WEBPAY_API_KEY` (sin ellas: ambiente de integración de Transbank), `SENDGRID_API_KEY` + `EMAIL_FROM` + `EMAIL_FROM_NAME` (sin ellas: correos simulados, en producción se marcan como fallidos).
3. En Supabase > Authentication > URL Configuration: agregar la URL de Vercel como Site URL y en Redirect URLs.
4. El cron `GET /api/cron/notificaciones` corre cada hora (avisos de transporte 48 h y check-out 24 h, y envío de la cola).

## Roles y manual breve

- **Cliente**: busca por zona y fechas, reserva con anticipo (Webpay), registra acompañantes, agrega servicios, reprograma o cancela según plazo, descarga sus actas. Todo en "Mis reservas".
- **Funcionario** (`/terreno`): ve llegadas y estadías del día, hace check-in (acompañantes, checklist, cobro de saldo, firma) y check-out (daños, multas, cobro final). Cada acto emite un acta PDF. También consulta reservas y registra pagos.
- **Administrador** (`/admin/...`): clientes, departamentos con fotos e inventario, reservas y pagos manuales, traslados, flota, servicios, mantenciones, finanzas y reportes con exportación PDF.

Credenciales de prueba: ver variables `SEED_*` en `.env.local` tras correr los seeds.
