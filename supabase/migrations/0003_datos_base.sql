-- Datos base: configuración, zonas, 10 departamentos, servicios, flota
insert into public.configuracion (clave, valor, descripcion) values
  ('porcentaje_anticipo', '30', 'Porcentaje del arriendo que se cobra como anticipo al reservar'),
  ('dias_cancelacion_sin_costo', '7', 'Días de anticipación mínimos para cancelar sin multa'),
  ('porcentaje_multa_cancelacion', '100', 'Porcentaje del anticipo retenido si se cancela fuera de plazo'),
  ('hora_checkin', '"15:00"', 'Hora de check-in'),
  ('hora_checkout', '"11:00"', 'Hora de check-out'),
  ('horas_aviso_transporte_llegada', '48', 'Horas antes de la llegada para enviar coordinación de transporte'),
  ('horas_aviso_checkout', '24', 'Horas antes del check-out para enviar recordatorio');

insert into public.zonas (nombre, region) values
  ('Viña del Mar', 'Valparaíso'),
  ('La Serena', 'Coquimbo'),
  ('Pucón', 'La Araucanía'),
  ('Puerto Varas', 'Los Lagos'),
  ('San Pedro de Atacama', 'Antofagasta');

insert into public.departamentos (codigo, nombre, zona_id, direccion, descripcion, capacidad_max, dormitorios, banos, tarifa_base, amenidades)
select * from (values
  ('DT-01', 'Mirador Reñaca', 1, 'Av. Borgoño 14500, Reñaca', 'Vista al mar, a pasos de la playa.', 4, 2, 1, 65000, array['wifi','estacionamiento','vista al mar']),
  ('DT-02', 'Costa Viña Centro', 1, 'Av. San Martín 800, Viña del Mar', 'Céntrico, cerca del casino y la playa.', 2, 1, 1, 48000, array['wifi','piscina']),
  ('DT-03', 'Faro La Serena', 2, 'Av. del Mar 2200, La Serena', 'Frente a la playa, ideal familias.', 6, 3, 2, 72000, array['wifi','estacionamiento','piscina','quincho']),
  ('DT-04', 'Bahía Coquimbo', 2, 'Av. Costanera 1500, Coquimbo', 'Depto. moderno con terraza.', 4, 2, 2, 55000, array['wifi','terraza']),
  ('DT-05', 'Volcán Pucón', 3, 'Camino al Volcán km 2, Pucón', 'Cabaña-departamento con vista al volcán Villarrica.', 5, 2, 1, 68000, array['wifi','chimenea','estacionamiento']),
  ('DT-06', 'Lago Pucón', 3, 'Av. Costanera 450, Pucón', 'A orillas del lago Villarrica.', 4, 2, 1, 60000, array['wifi','kayak','estacionamiento']),
  ('DT-07', 'Osorno Puerto Varas', 4, 'Av. Vicente Pérez Rosales 1200', 'Vista al volcán Osorno y lago Llanquihue.', 4, 2, 2, 70000, array['wifi','calefacción','estacionamiento']),
  ('DT-08', 'Centro Puerto Varas', 4, 'San José 300, Puerto Varas', 'Céntrico, a pasos de restaurantes.', 2, 1, 1, 50000, array['wifi']),
  ('DT-09', 'Oasis Atacama', 5, 'Caracoles 120, San Pedro de Atacama', 'Estilo adobe con patio y piscina.', 4, 2, 1, 80000, array['wifi','piscina','desayuno']),
  ('DT-10', 'Estrellas Atacama', 5, 'Tocopilla 45, San Pedro de Atacama', 'Terraza para observación astronómica.', 3, 1, 1, 75000, array['wifi','terraza','telescopio'])
) as v(codigo, nombre, zona_id, direccion, descripcion, capacidad_max, dormitorios, banos, tarifa_base, amenidades);

insert into public.servicios (nombre, tipo, descripcion, precio, duracion_horas, cupo_max, requiere_transporte) values
  ('Traslado aeropuerto / terminal', 'transporte', 'Traslado privado desde y hacia el punto de llegada.', 25000, 1, 6, true),
  ('Tour Valle del Elqui', 'tour', 'Día completo por el valle con visita a viñas y observatorio.', 45000, 9, 8, true),
  ('Tour Termas Geométricas', 'tour', 'Excursión a las termas desde Pucón.', 55000, 8, 8, true),
  ('Tour Saltos del Petrohué', 'tour', 'Recorrido por Petrohué y lago Todos los Santos.', 40000, 6, 8, true),
  ('Tour Valle de la Luna', 'tour', 'Atardecer en el Valle de la Luna con guía.', 35000, 4, 10, true),
  ('Cuna para bebé', 'equipamiento', 'Cuna plegable con ropa de cama.', 8000, null, null, false),
  ('Parrilla portátil', 'equipamiento', 'Parrilla con carbón incluido.', 12000, null, null, false);

insert into public.vehiculos (patente, marca, modelo, capacidad) values
  ('DTVA-01', 'Hyundai', 'H1', 8),
  ('DTVA-02', 'Toyota', 'Hiace', 10);

insert into public.conductores (nombre, telefono, licencia) values
  ('Conductor de prueba 1', '+56911111111', 'A2'),
  ('Conductor de prueba 2', '+56922222222', 'A2');
