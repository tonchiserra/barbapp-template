-- =============================================================================
-- Barbapp: Seed de datos de ejemplo
-- Ejecutar en Supabase SQL Editor DESPUÉS de setup.sql
-- Genera 5 meses de datos realistas (Oct 2025 - Mar 2026)
-- =============================================================================

-- =============================================================================
-- 0. LIMPIAR TODO
-- =============================================================================

delete from public.point_redemptions;
delete from public.product_sales;
delete from public.service_special_prices;
delete from public.staff_blocked_times;
delete from public.staff_time_off;
delete from public.staff_schedules;
delete from public.appointments;
delete from public.clients;
delete from public.services;
delete from public.products;
delete from public.rewards;
delete from public.discount_codes;
delete from public.staff;
delete from public.branches;
delete from public.site_settings;

-- =============================================================================
-- 1. SITE SETTINGS
-- =============================================================================

insert into public.site_settings (
  header, footer, carousel, video, gallery, multicolumn, booking, map, theme, email, ranking
) values (
  '{
    "logo_type": "text",
    "logo_text": "Tonchi Barber",
    "logo_image_url": "",
    "menu_links": [
      {"label": "Inicio", "url": "#"},
      {"label": "Servicios", "url": "#servicios"},
      {"label": "Galería", "url": "#galeria"},
      {"label": "Reservar", "url": "#booking"}
    ],
    "social_links": {
      "instagram": "https://instagram.com/tonchibarber",
      "facebook": null,
      "tiktok": "https://tiktok.com/@tonchibarber",
      "whatsapp": "https://wa.me/5491112345678",
      "x": null,
      "youtube": null,
      "telegram": null
    },
    "is_visible": true
  }'::jsonb,
  '{
    "menu_links": [
      {"label": "Términos", "url": "/terminos"},
      {"label": "Privacidad", "url": "/privacidad"}
    ],
    "social_links": {
      "instagram": "https://instagram.com/tonchibarber",
      "facebook": null,
      "tiktok": "https://tiktok.com/@tonchibarber",
      "whatsapp": "https://wa.me/5491112345678",
      "x": null,
      "youtube": null,
      "telegram": null
    },
    "is_visible": true
  }'::jsonb,
  '{"slides": [], "auto_slide": true, "is_visible": false}'::jsonb,
  '{"title": "", "youtube_url": "", "description": "", "cta_label": "", "cta_url": "", "cta_variant": "primary", "is_visible": false}'::jsonb,
  '{"title": "Nuestro trabajo", "description": "Los mejores cortes de la zona", "images": [], "cta_label": "", "cta_url": "", "cta_variant": "primary", "is_visible": true}'::jsonb,
  '{"title": "¿Por qué elegirnos?", "blocks": [
    {"title": "Experiencia", "description": "Más de 5 años en el rubro", "image_url": ""},
    {"title": "Calidad", "description": "Productos premium importados", "image_url": ""},
    {"title": "Ambiente", "description": "Un espacio pensado para vos", "image_url": ""}
  ], "cta_label": "Reservar turno", "cta_url": "#booking", "cta_variant": "primary", "is_visible": true}'::jsonb,
  '{"title": "Reserva tu turno", "description": "Elegí tu barbero, servicio y horario preferido.", "is_visible": true}'::jsonb,
  '{"title": "Encontranos", "description": "Visitanos en nuestras sucursales", "locations": [
    {"name": "Sede Centro", "address": "Av. Corrientes 1234, CABA", "lat": -34.6037, "lng": -58.3816},
    {"name": "Sede Norte", "address": "Av. Maipú 456, Vicente López", "lat": -34.5271, "lng": -58.4735}
  ], "is_visible": true}'::jsonb,
  '{"background": "#ffffff", "foreground": "#121212", "primary": "#007AFF", "secondary": "#f5f5f6"}'::jsonb,
  '{"subject": "Gracias por tu visita, {nombre}!", "greeting": "Gracias por tu visita, {nombre}!", "body": "Tu turno fue completado con éxito. Acá tenés el resumen:", "farewell": "Te esperamos de nuevo!"}'::jsonb,
  '{"title": "Ranking de Clientes", "description": "Los más fieles de Tonchi Barber", "is_visible": true}'::jsonb
);

-- =============================================================================
-- 2. BRANCHES (sucursales)
-- =============================================================================

insert into public.branches (id, name, address, is_active, sort_order) values
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Sede Centro', 'Av. Corrientes 1234, CABA', true, 0),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Sede Norte', 'Av. Maipú 456, Vicente López', true, 1);

-- =============================================================================
-- 3. STAFF (profesionales)
-- staff.id = auth.users.id
-- =============================================================================

insert into public.staff (id, name, role, branch_id, is_active, commission_percent, min_advance_hours, sort_order) values
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'Tonchi',  'admin',    'a1b2c3d4-0001-4000-8000-000000000001', true, 50, 2, 0),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 'Damian',  'owner',    'a1b2c3d4-0001-4000-8000-000000000001', true, 50, 2, 1),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'Alexis',  'employee', 'a1b2c3d4-0001-4000-8000-000000000002', true, 40, 3, 2);

-- =============================================================================
-- 4. STAFF SCHEDULES (horarios semanales)
-- Tonchi y Damian: Lun-Vie 09:00-13:00 y 14:00-20:00, Sáb 09:00-14:00
-- Alexis: Mar-Sáb 10:00-14:00 y 15:00-21:00
-- day_of_week: 0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab
-- =============================================================================

-- Tonchi (Lun-Vie mañana y tarde)
insert into public.staff_schedules (staff_id, day_of_week, start_time, end_time, is_working) values
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 1, '09:00', '13:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 1, '14:00', '20:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 2, '09:00', '13:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 2, '14:00', '20:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 3, '09:00', '13:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 3, '14:00', '20:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 4, '09:00', '13:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 4, '14:00', '20:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 5, '09:00', '13:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 5, '14:00', '20:00', true),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 6, '09:00', '14:00', true);

-- Damian (Lun-Vie mañana y tarde)
insert into public.staff_schedules (staff_id, day_of_week, start_time, end_time, is_working) values
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 1, '09:00', '13:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 1, '14:00', '20:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 2, '09:00', '13:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 2, '14:00', '20:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 3, '09:00', '13:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 3, '14:00', '20:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 4, '09:00', '13:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 4, '14:00', '20:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 5, '09:00', '13:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 5, '14:00', '20:00', true),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', 6, '09:00', '14:00', true);

-- Alexis (Mar-Sab tarde extendida)
insert into public.staff_schedules (staff_id, day_of_week, start_time, end_time, is_working) values
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 2, '10:00', '14:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 2, '15:00', '21:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 3, '10:00', '14:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 3, '15:00', '21:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 4, '10:00', '14:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 4, '15:00', '21:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 5, '10:00', '14:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 5, '15:00', '21:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 6, '10:00', '14:00', true),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 6, '15:00', '21:00', true);

-- =============================================================================
-- 5. STAFF TIME OFF (días libres)
-- =============================================================================

insert into public.staff_time_off (staff_id, date, reason) values
  -- Tonchi: vacaciones dic 2025
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2025-12-24', 'Nochebuena'),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2025-12-25', 'Navidad'),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2025-12-31', 'Fin de año'),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2026-01-01', 'Año nuevo'),
  -- Damian: feriados + personal
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2025-12-24', 'Nochebuena'),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2025-12-25', 'Navidad'),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2025-12-31', 'Fin de año'),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2026-01-01', 'Año nuevo'),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2026-02-16', 'Carnaval'),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2026-02-17', 'Carnaval'),
  -- Alexis: unos días personales
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', '2025-12-25', 'Navidad'),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', '2026-01-01', 'Año nuevo'),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', '2026-01-20', 'Día personal'),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', '2026-03-02', 'Turno médico');

-- =============================================================================
-- 6. STAFF BLOCKED TIMES (bloqueos parciales)
-- =============================================================================

insert into public.staff_blocked_times (staff_id, date, start_time, end_time, reason) values
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2026-01-15', '09:00', '11:00', 'Reunión con proveedor'),
  ('6bc56cee-a45a-4c00-967f-5f63406598da', '2026-02-10', '14:00', '16:00', 'Capacitación'),
  ('0c6a5894-7fc1-4f32-abd4-2a365409ed17', '2026-02-20', '10:00', '12:00', 'Trámite personal'),
  ('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2026-03-05', '17:00', '20:00', 'Evento personal');

-- =============================================================================
-- 7. SERVICES (servicios por staff)
-- =============================================================================

-- Tonchi
insert into public.services (id, staff_id, name, description, price_transfer, price_cash, duration_minutes, is_active, sort_order) values
  ('b1000000-0001-4000-8000-000000000001', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'Corte clásico',       'Corte con tijera y/o máquina', 5000, 4500, 30, true, 0),
  ('b1000000-0001-4000-8000-000000000002', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'Corte + Barba',       'Corte completo con perfilado de barba', 7500, 7000, 45, true, 1),
  ('b1000000-0001-4000-8000-000000000003', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'Barba',               'Perfilado y diseño de barba con navaja', 3500, 3000, 20, true, 2),
  ('b1000000-0001-4000-8000-000000000004', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'Corte degradé',       'Fade bajo, medio o alto', 6000, 5500, 40, true, 3),
  ('b1000000-0001-4000-8000-000000000005', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'Cejas',               'Diseño y depilación de cejas', 1500, 1500, 10, true, 4);

-- Damian
insert into public.services (id, staff_id, name, description, price_transfer, price_cash, duration_minutes, is_active, sort_order) values
  ('b1000000-0002-4000-8000-000000000001', '6bc56cee-a45a-4c00-967f-5f63406598da', 'Corte clásico',       'Corte a elección', 5000, 4500, 30, true, 0),
  ('b1000000-0002-4000-8000-000000000002', '6bc56cee-a45a-4c00-967f-5f63406598da', 'Corte + Barba',       'Combo completo', 7000, 6500, 45, true, 1),
  ('b1000000-0002-4000-8000-000000000003', '6bc56cee-a45a-4c00-967f-5f63406598da', 'Barba',               'Barba con navaja', 3000, 2800, 20, true, 2),
  ('b1000000-0002-4000-8000-000000000004', '6bc56cee-a45a-4c00-967f-5f63406598da', 'Color',               'Decoloración o tintura', 12000, 11000, 60, true, 3),
  ('b1000000-0002-4000-8000-000000000005', '6bc56cee-a45a-4c00-967f-5f63406598da', 'Alisado',             'Tratamiento alisado keratina', 15000, 14000, 90, true, 4);

-- Alexis
insert into public.services (id, staff_id, name, description, price_transfer, price_cash, duration_minutes, is_active, sort_order) values
  ('b1000000-0003-4000-8000-000000000001', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'Corte clásico',       'Corte con máquina o tijera', 4500, 4000, 30, true, 0),
  ('b1000000-0003-4000-8000-000000000002', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'Corte + Barba',       'Corte y perfilado completo', 6500, 6000, 45, true, 1),
  ('b1000000-0003-4000-8000-000000000003', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'Barba',               'Diseño de barba con navaja', 3000, 2500, 20, true, 2),
  ('b1000000-0003-4000-8000-000000000004', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'Corte niño',          'Corte para menores de 12', 3500, 3000, 25, true, 3);

-- =============================================================================
-- 8. SERVICE SPECIAL PRICES (precios especiales por fecha)
-- =============================================================================

-- Black Friday 2025
insert into public.service_special_prices (service_id, date, price_cash, price_transfer) values
  ('b1000000-0001-4000-8000-000000000001', '2025-11-28', 3500, 4000),
  ('b1000000-0001-4000-8000-000000000002', '2025-11-28', 5500, 6000),
  ('b1000000-0002-4000-8000-000000000001', '2025-11-28', 3500, 4000),
  ('b1000000-0003-4000-8000-000000000001', '2025-11-28', 3000, 3500);

-- Día del padre 2026 (promo)
insert into public.service_special_prices (service_id, date, price_cash, price_transfer) values
  ('b1000000-0001-4000-8000-000000000002', '2026-03-15', 6000, 6500),
  ('b1000000-0002-4000-8000-000000000002', '2026-03-15', 5500, 6000);

-- =============================================================================
-- 9. DISCOUNT CODES
-- =============================================================================

insert into public.discount_codes (id, code, discount_percent, max_uses, used_count, is_active) values
  ('d1000000-0001-4000-8000-000000000001', 'BIENVENIDO', 15, 50, 12, true),
  ('d1000000-0001-4000-8000-000000000002', 'AMIGO20',    20, 30, 8,  true),
  ('d1000000-0001-4000-8000-000000000003', 'BLACKFRI',   25, 100, 45, false),
  ('d1000000-0001-4000-8000-000000000004', 'VERANO10',   10, 20, 3,  true);

-- =============================================================================
-- 10. PRODUCTS (productos a la venta)
-- =============================================================================

insert into public.products (id, name, price, image_url, is_active, sort_order) values
  ('c1000000-0001-4000-8000-000000000001', 'Pomada para pelo - Suavecito',     3500, '', true, 0),
  ('c1000000-0001-4000-8000-000000000002', 'Cera mate - By Vilain Gold Digger', 5500, '', true, 1),
  ('c1000000-0001-4000-8000-000000000003', 'Aceite para barba - Viking',       2800, '', true, 2),
  ('c1000000-0001-4000-8000-000000000004', 'Shampoo anticaída - Keratin',      4200, '', true, 3),
  ('c1000000-0001-4000-8000-000000000005', 'Aftershave - Proraso',             2200, '', true, 4),
  ('c1000000-0001-4000-8000-000000000006', 'Peine de madera',                  1200, '', true, 5);

-- =============================================================================
-- 11. REWARDS (recompensas canjeables por puntos)
-- =============================================================================

insert into public.rewards (id, name, description, points_cost, type, discount_percent, is_active, sort_order) values
  ('e1000000-0001-4000-8000-000000000001', 'Corte gratis',          'Un corte clásico de regalo',     50, 'product',  null, true, 0),
  ('e1000000-0001-4000-8000-000000000002', '10% de descuento',      'En cualquier servicio',          15, 'discount', 10,   true, 1),
  ('e1000000-0001-4000-8000-000000000003', '25% de descuento',      'En cualquier servicio',          35, 'discount', 25,   true, 2),
  ('e1000000-0001-4000-8000-000000000004', 'Pomada gratis',         'Una pomada Suavecito de regalo', 30, 'product',  null, true, 3),
  ('e1000000-0001-4000-8000-000000000005', 'Barba gratis',          'Perfilado de barba de regalo',   25, 'product',  null, true, 4);

-- =============================================================================
-- 12. CLIENTS (clientes)
-- 25 clientes con datos realistas argentinos
-- =============================================================================

insert into public.clients (id, name, phone, email, total_appointments, points, total_points_earned,
  dow_0, dow_1, dow_2, dow_3, dow_4, dow_5, dow_6, last_visit_date) values
  ('f1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     18, 32, 82,  0,4,3,3,4,2,2, '2026-03-07'),
  ('f1000000-0001-4000-8000-000000000002', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  14, 18, 58,  0,3,2,3,2,2,2, '2026-03-06'),
  ('f1000000-0001-4000-8000-000000000003', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    12, 45, 45,  0,2,2,2,2,2,2, '2026-03-04'),
  ('f1000000-0001-4000-8000-000000000004', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   10, 12, 42,  0,2,1,2,2,1,2, '2026-02-28'),
  ('f1000000-0001-4000-8000-000000000005', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',         9, 8,  38,  0,2,1,1,2,1,2, '2026-03-08'),
  ('f1000000-0001-4000-8000-000000000006', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',    8, 22, 32,  0,1,2,1,1,2,1, '2026-02-25'),
  ('f1000000-0001-4000-8000-000000000007', 'Santiago Gómez',    '1155001007', 'santi.gomez@gmail.com',       7, 5,  28,  0,1,1,1,1,2,1, '2026-03-01'),
  ('f1000000-0001-4000-8000-000000000008', 'Agustín Díaz',      '1155001008', 'agus.diaz@gmail.com',         7, 15, 25,  0,1,1,2,1,1,1, '2026-02-20'),
  ('f1000000-0001-4000-8000-000000000009', 'Lautaro Ruiz',      '1155001009', 'lauta.ruiz@yahoo.com',        6, 10, 22,  0,1,1,1,1,1,1, '2026-03-03'),
  ('f1000000-0001-4000-8000-000000000010', 'Thiago Álvarez',    '1155001010', 'thiago.alvarez@gmail.com',    6, 18, 18,  0,1,1,1,1,1,1, '2026-02-15'),
  ('f1000000-0001-4000-8000-000000000011', 'Valentín Torres',   '1155001011', 'valen.torres@gmail.com',      5, 0,  20,  0,1,1,1,1,0,1, '2026-02-22'),
  ('f1000000-0001-4000-8000-000000000012', 'Bautista Ramírez',  '1155001012', 'bauti.ramirez@gmail.com',     5, 7,  17,  0,1,0,1,1,1,1, '2026-01-30'),
  ('f1000000-0001-4000-8000-000000000013', 'Facundo Flores',    '1155001013', 'facu.flores@hotmail.com',     4, 12, 12,  0,0,1,1,1,0,1, '2026-02-10'),
  ('f1000000-0001-4000-8000-000000000014', 'Emiliano Acosta',   '1155001014', 'emi.acosta@gmail.com',        4, 5,  15,  0,1,0,1,0,1,1, '2026-01-25'),
  ('f1000000-0001-4000-8000-000000000015', 'Gonzalo Herrera',   '1155001015', 'gonza.herrera@gmail.com',     3, 8,   8,  0,0,1,0,1,0,1, '2026-02-05'),
  ('f1000000-0001-4000-8000-000000000016', 'Maximiliano Castro','1155001016', 'maxi.castro@outlook.com',     3, 3,  10,  0,1,0,0,1,0,1, '2026-01-20'),
  ('f1000000-0001-4000-8000-000000000017', 'Ignacio Romero',    '1155001017', 'nacho.romero@gmail.com',      3, 6,   6,  0,0,1,0,1,1,0, '2025-12-18'),
  ('f1000000-0001-4000-8000-000000000018', 'Martín Suárez',     '1155001018', 'martin.suarez@gmail.com',     2, 4,   4,  0,0,0,1,0,1,0, '2026-01-10'),
  ('f1000000-0001-4000-8000-000000000019', 'Santino Cabrera',   '1155001019', 'santi.cabrera@gmail.com',     2, 0,   5,  0,0,1,0,0,1,0, '2025-12-05'),
  ('f1000000-0001-4000-8000-000000000020', 'Bruno Medina',      '1155001020', 'bruno.medina@yahoo.com',      2, 2,   2,  0,1,0,0,0,0,1, '2025-11-28'),
  ('f1000000-0001-4000-8000-000000000021', 'Federico Morales',  '1155001021', 'fede.morales@gmail.com',      1, 0,   3,  0,0,0,0,1,0,0, '2025-11-15'),
  ('f1000000-0001-4000-8000-000000000022', 'Ramiro Ojeda',      '1155001022', 'ramiro.ojeda@gmail.com',      1, 3,   3,  0,0,0,1,0,0,0, '2025-12-10'),
  ('f1000000-0001-4000-8000-000000000023', 'Sebastián Vargas',  '1155001023', 'seba.vargas@hotmail.com',     1, 0,   0,  0,0,0,0,0,1,0, '2025-10-20'),
  ('f1000000-0001-4000-8000-000000000024', 'Cristian Molina',   '1155001024', 'cris.molina@gmail.com',       1, 0,   0,  0,0,0,0,0,0,1, '2025-10-30'),
  ('f1000000-0001-4000-8000-000000000025', 'Diego Giménez',     '1155001025', 'diego.gimenez@gmail.com',     1, 0,   2,  0,1,0,0,0,0,0, '2025-11-05');

-- =============================================================================
-- 13. APPOINTMENTS (turnos — 5 meses: Oct 2025 - Mar 2026)
-- Mezcla de completed, confirmed (futuros), cancelled, no_show
-- =============================================================================

insert into public.appointments (staff_id, service_id, client_name, client_phone, client_email,
  date, start_time, end_time, price, payment_method, status, discount_code_id, discount_percent, original_price) values

-- ===== OCTUBRE 2025 =====
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2025-10-06', '09:00', '09:30', 4500, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2025-10-07', '10:00', '10:45', 6500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2025-10-08', '10:00', '10:30', 4000, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2025-10-10', '14:00', '14:45', 7000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Sebastián Vargas',  '1155001023', 'seba.vargas@hotmail.com',    '2025-10-17', '09:30', '10:00', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000003', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2025-10-20', '15:00', '15:20', 3000, 'transfer', 'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',   '2025-10-22', '15:00', '15:45', 6000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Cristian Molina',   '1155001024', 'cris.molina@gmail.com',      '2025-10-25', '11:00', '11:30', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000004', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2025-10-27', '09:00', '09:40', 5500, 'transfer', 'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000003', 'Santiago Gómez',    '1155001007', 'santi.gomez@gmail.com',      '2025-10-29', '16:00', '16:20', 2800, 'cash',     'completed', null, 0, null),

-- ===== NOVIEMBRE 2025 =====
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2025-11-03', '10:00', '10:30', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2025-11-04', '10:00', '10:30', 4000, 'transfer', 'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2025-11-05', '09:00', '09:45', 6500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Agustín Díaz',      '1155001008', 'agus.diaz@gmail.com',        '2025-11-06', '14:00', '14:45', 7000, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Diego Giménez',     '1155001025', 'diego.gimenez@gmail.com',    '2025-11-05', '11:00', '11:30', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000004', 'Lautaro Ruiz',      '1155001009', 'lauta.ruiz@yahoo.com',       '2025-11-06', '11:00', '11:25', 3000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Thiago Álvarez',    '1155001010', 'thiago.alvarez@gmail.com',   '2025-11-07', '10:00', '10:30', 4500, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000004', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2025-11-10', '15:00', '15:40', 5500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Federico Morales',  '1155001021', 'fede.morales@gmail.com',     '2025-11-13', '12:00', '12:30', 4000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000004', 'Valentín Torres',   '1155001011', 'valen.torres@gmail.com',     '2025-11-14', '14:00', '15:00', 11000,'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2025-11-17', '09:00', '09:45', 7000, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Gonzalo Herrera',   '1155001015', 'gonza.herrera@gmail.com',    '2025-11-19', '16:00', '16:30', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Bautista Ramírez',  '1155001012', 'bauti.ramirez@gmail.com',    '2025-11-20', '15:00', '15:45', 6000, 'transfer', 'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Emiliano Acosta',   '1155001014', 'emi.acosta@gmail.com',       '2025-11-21', '11:00', '11:30', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',   '2025-11-24', '09:30', '10:00', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2025-11-25', '14:00', '14:45', 7000, 'transfer', 'completed', null, 0, null),
-- Black Friday (con descuento)
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Bruno Medina',      '1155001020', 'bruno.medina@yahoo.com',     '2025-11-28', '09:00', '09:30', 2625, 'cash',     'completed', 'd1000000-0001-4000-8000-000000000003', 25, 3500),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Maximiliano Castro','1155001016', 'maxi.castro@outlook.com',    '2025-11-28', '10:00', '10:30', 3000, 'transfer', 'completed', 'd1000000-0001-4000-8000-000000000003', 25, 4000),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Santiago Gómez',    '1155001007', 'santi.gomez@gmail.com',      '2025-11-28', '10:00', '10:30', 2625, 'cash',     'completed', 'd1000000-0001-4000-8000-000000000003', 25, 3500),

-- ===== DICIEMBRE 2025 =====
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2025-12-01', '09:00', '09:30', 4500, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2025-12-02', '09:00', '09:45', 6500, 'transfer', 'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2025-12-03', '10:30', '11:00', 4000, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2025-12-04', '14:30', '15:15', 7000, 'transfer', 'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2025-12-05', '11:00', '11:30', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000003', 'Agustín Díaz',      '1155001008', 'agus.diaz@gmail.com',        '2025-12-08', '09:00', '09:20', 3000, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Lautaro Ruiz',      '1155001009', 'lauta.ruiz@yahoo.com',       '2025-12-09', '11:00', '11:45', 6000, 'transfer', 'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000003', 'Thiago Álvarez',    '1155001010', 'thiago.alvarez@gmail.com',   '2025-12-10', '16:00', '16:20', 2800, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Facundo Flores',    '1155001013', 'facu.flores@hotmail.com',    '2025-12-11', '15:00', '15:45', 7000, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Valentín Torres',   '1155001011', 'valen.torres@gmail.com',     '2025-12-12', '10:00', '10:30', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Ignacio Romero',    '1155001017', 'nacho.romero@gmail.com',     '2025-12-12', '12:00', '12:30', 4000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',   '2025-12-15', '14:00', '14:45', 6500, 'cash',     'completed', null, 0, null),
-- Cancelaciones e inasistencias
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Santino Cabrera',   '1155001019', 'santi.cabrera@gmail.com',    '2025-12-05', '16:00', '16:30', 4500, 'cash',     'cancelled', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Ramiro Ojeda',      '1155001022', 'ramiro.ojeda@gmail.com',     '2025-12-10', '09:00', '09:30', 4500, 'cash',     'no_show',   null, 0, null),
-- Pre-navidad con descuento BIENVENIDO
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2025-12-22', '09:00', '09:45', 5950, 'transfer', 'completed', 'd1000000-0001-4000-8000-000000000001', 15, 7000),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2025-12-22', '10:00', '10:30', 3825, 'cash',     'completed', 'd1000000-0001-4000-8000-000000000001', 15, 4500),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Bautista Ramírez',  '1155001012', 'bauti.ramirez@gmail.com',    '2025-12-23', '10:00', '10:45', 5100, 'cash',     'completed', 'd1000000-0001-4000-8000-000000000001', 15, 6000),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000004', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2025-12-23', '11:00', '11:40', 5500, 'cash',     'completed', null, 0, null),
-- Ignacio antes de navidad
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000003', 'Ignacio Romero',    '1155001017', 'nacho.romero@gmail.com',     '2025-12-18', '15:00', '15:20', 2800, 'cash',     'completed', null, 0, null),
-- Santino viene de nuevo
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Santino Cabrera',   '1155001019', 'santi.cabrera@gmail.com',    '2025-12-19', '15:00', '15:30', 4000, 'transfer', 'completed', null, 0, null),

-- ===== ENERO 2026 =====
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-01-05', '09:00', '09:30', 4500, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2026-01-06', '09:30', '10:00', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2026-01-07', '10:00', '10:30', 4000, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2026-01-08', '14:00', '14:45', 7000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2026-01-09', '09:00', '09:45', 6500, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Martín Suárez',     '1155001018', 'martin.suarez@gmail.com',    '2026-01-10', '10:00', '10:30', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Agustín Díaz',      '1155001008', 'agus.diaz@gmail.com',        '2026-01-13', '10:00', '10:45', 6000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Lautaro Ruiz',      '1155001009', 'lauta.ruiz@yahoo.com',       '2026-01-14', '14:00', '14:30', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000003', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',   '2026-01-15', '11:00', '11:20', 3000, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Santiago Gómez',    '1155001007', 'santi.gomez@gmail.com',      '2026-01-16', '09:00', '09:45', 7000, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Maximiliano Castro','1155001016', 'maxi.castro@outlook.com',    '2026-01-20', '11:00', '11:30', 4000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Thiago Álvarez',    '1155001010', 'thiago.alvarez@gmail.com',   '2026-01-21', '09:00', '09:45', 6500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-01-22', '14:00', '14:30', 4500, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000004', 'Emiliano Acosta',   '1155001014', 'emi.acosta@gmail.com',       '2026-01-23', '15:00', '15:40', 5500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2026-01-24', '10:00', '10:30', 4000, 'cash',     'completed', null, 0, null),
-- Con descuento AMIGO20
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000005', 'Valentín Torres',   '1155001011', 'valen.torres@gmail.com',     '2026-01-27', '14:00', '15:30', 11200,'transfer', 'completed', 'd1000000-0001-4000-8000-000000000002', 20, 14000),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Emiliano Acosta',   '1155001014', 'emi.acosta@gmail.com',       '2026-01-25', '10:00', '10:30', 3600, 'cash',     'completed', 'd1000000-0001-4000-8000-000000000002', 20, 4500),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Bautista Ramírez',  '1155001012', 'bauti.ramirez@gmail.com',    '2026-01-30', '11:00', '11:30', 4500, 'cash',     'completed', null, 0, null),
-- Cancelación
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Facundo Flores',    '1155001013', 'facu.flores@hotmail.com',    '2026-01-28', '09:00', '09:30', 4500, 'cash',     'cancelled', null, 0, null),

-- ===== FEBRERO 2026 =====
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-02-02', '09:00', '09:45', 7000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2026-02-03', '10:00', '10:30', 4500, 'transfer', 'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2026-02-04', '15:00', '15:45', 6000, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Gonzalo Herrera',   '1155001015', 'gonza.herrera@gmail.com',    '2026-02-05', '14:00', '14:30', 4500, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2026-02-06', '09:00', '09:45', 6500, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000003', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2026-02-09', '15:00', '15:20', 3000, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Facundo Flores',    '1155001013', 'facu.flores@hotmail.com',    '2026-02-10', '10:00', '10:30', 4000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Agustín Díaz',      '1155001008', 'agus.diaz@gmail.com',        '2026-02-11', '11:00', '11:30', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000004', 'Lautaro Ruiz',      '1155001009', 'lauta.ruiz@yahoo.com',       '2026-02-12', '09:00', '09:40', 5500, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2026-02-13', '14:00', '14:45', 7000, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Thiago Álvarez',    '1155001010', 'thiago.alvarez@gmail.com',   '2026-02-15', '11:00', '11:30', 4000, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-02-18', '09:00', '09:45', 6500, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Agustín Díaz',      '1155001008', 'agus.diaz@gmail.com',        '2026-02-20', '10:00', '10:30', 4500, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Santiago Gómez',    '1155001007', 'santi.gomez@gmail.com',      '2026-02-20', '15:00', '15:45', 6000, 'cash',     'cancelled', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Valentín Torres',   '1155001011', 'valen.torres@gmail.com',     '2026-02-22', '14:00', '14:30', 4500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',   '2026-02-25', '09:00', '09:45', 7000, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-02-26', '14:00', '14:30', 4500, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000004', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2026-02-28', '09:00', '10:00', 11000,'transfer', 'completed', null, 0, null),
-- No show
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Ignacio Romero',    '1155001017', 'nacho.romero@gmail.com',     '2026-02-19', '12:00', '12:30', 4000, 'cash',     'no_show',   null, 0, null),

-- ===== MARZO 2026 (hasta 11) =====
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Santiago Gómez',    '1155001007', 'santi.gomez@gmail.com',      '2026-03-01', '09:00', '09:45', 7000, 'cash',     'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Lautaro Ruiz',      '1155001009', 'lauta.ruiz@yahoo.com',       '2026-03-03', '10:00', '10:30', 4000, 'transfer', 'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2026-03-04', '10:00', '10:30', 4500, 'cash',     'completed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2026-03-06', '09:00', '09:45', 6500, 'cash',     'completed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-03-07', '09:00', '09:45', 7500, 'transfer', 'completed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000002', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2026-03-08', '15:00', '15:45', 6000, 'cash',     'completed', null, 0, null),
-- Turnos confirmados (futuros)
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000001', 'Matías López',      '1155001001', 'matias.lopez@gmail.com',     '2026-03-12', '09:00', '09:30', 4500, 'cash',     'confirmed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000002', 'Lucas Fernández',   '1155001002', 'lucas.fernandez@gmail.com',  '2026-03-12', '10:00', '10:45', 6500, 'transfer', 'confirmed', null, 0, null),
('0c6a5894-7fc1-4f32-abd4-2a365409ed17', 'b1000000-0003-4000-8000-000000000001', 'Nicolás García',    '1155001003', 'nico.garcia@hotmail.com',    '2026-03-13', '10:00', '10:30', 4000, 'cash',     'confirmed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000004', 'Tomás Martínez',    '1155001004', 'tomas.martinez@gmail.com',   '2026-03-14', '14:00', '14:40', 6000, 'transfer', 'confirmed', null, 0, null),
('6bc56cee-a45a-4c00-967f-5f63406598da', 'b1000000-0002-4000-8000-000000000001', 'Joaquín Rodríguez', '1155001005', 'joaco.rod@gmail.com',        '2026-03-16', '09:30', '10:00', 5000, 'cash',     'confirmed', null, 0, null),
('460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 'b1000000-0001-4000-8000-000000000002', 'Franco Pérez',      '1155001006', 'franco.perez@outlook.com',   '2026-03-18', '14:00', '14:45', 7500, 'transfer', 'confirmed', null, 0, null);

-- =============================================================================
-- 14. PRODUCT SALES (ventas de productos)
-- =============================================================================

insert into public.product_sales (product_id, staff_id, price, quantity, created_at) values
  -- Octubre
  ('c1000000-0001-4000-8000-000000000001', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 3500, 1, '2025-10-10 15:00:00-03'),
  ('c1000000-0001-4000-8000-000000000003', '6bc56cee-a45a-4c00-967f-5f63406598da', 2800, 1, '2025-10-15 11:00:00-03'),
  -- Noviembre
  ('c1000000-0001-4000-8000-000000000002', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 5500, 1, '2025-11-05 10:30:00-03'),
  ('c1000000-0001-4000-8000-000000000001', '6bc56cee-a45a-4c00-967f-5f63406598da', 3500, 2, '2025-11-12 14:30:00-03'),
  ('c1000000-0001-4000-8000-000000000005', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 2200, 1, '2025-11-20 16:00:00-03'),
  ('c1000000-0001-4000-8000-000000000004', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 4200, 1, '2025-11-28 12:00:00-03'),
  -- Diciembre
  ('c1000000-0001-4000-8000-000000000001', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 3500, 3, '2025-12-22 10:00:00-03'),
  ('c1000000-0001-4000-8000-000000000003', '6bc56cee-a45a-4c00-967f-5f63406598da', 2800, 2, '2025-12-20 11:00:00-03'),
  ('c1000000-0001-4000-8000-000000000006', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 1200, 1, '2025-12-19 15:30:00-03'),
  -- Enero
  ('c1000000-0001-4000-8000-000000000002', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 5500, 1, '2026-01-08 09:30:00-03'),
  ('c1000000-0001-4000-8000-000000000001', '6bc56cee-a45a-4c00-967f-5f63406598da', 3500, 1, '2026-01-15 14:00:00-03'),
  ('c1000000-0001-4000-8000-000000000005', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 2200, 2, '2026-01-22 10:30:00-03'),
  -- Febrero
  ('c1000000-0001-4000-8000-000000000004', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 4200, 1, '2026-02-05 15:00:00-03'),
  ('c1000000-0001-4000-8000-000000000001', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 3500, 2, '2026-02-14 10:00:00-03'),
  ('c1000000-0001-4000-8000-000000000003', '6bc56cee-a45a-4c00-967f-5f63406598da', 2800, 1, '2026-02-20 16:30:00-03'),
  -- Marzo
  ('c1000000-0001-4000-8000-000000000002', '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', 5500, 1, '2026-03-04 11:00:00-03'),
  ('c1000000-0001-4000-8000-000000000006', '0c6a5894-7fc1-4f32-abd4-2a365409ed17', 1200, 2, '2026-03-07 15:00:00-03');

-- =============================================================================
-- 15. POINT REDEMPTIONS (canjes de puntos)
-- =============================================================================

insert into public.point_redemptions (client_id, reward_id, reward_name, points_spent, redeemed_by, created_at) values
  -- Matías canjeó un 10% de descuento
  ('f1000000-0001-4000-8000-000000000001', 'e1000000-0001-4000-8000-000000000002', '10% de descuento',  15, '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2025-12-22 09:50:00-03'),
  -- Matías canjeó un corte gratis
  ('f1000000-0001-4000-8000-000000000001', 'e1000000-0001-4000-8000-000000000001', 'Corte gratis',      50, '460fd8bf-ca9a-4dfe-9eef-a5175e935acb', '2026-02-02 09:50:00-03'),
  -- Lucas canjeó una pomada
  ('f1000000-0001-4000-8000-000000000002', 'e1000000-0001-4000-8000-000000000004', 'Pomada gratis',     30, '6bc56cee-a45a-4c00-967f-5f63406598da', '2026-01-06 10:30:00-03'),
  -- Nicolás canjeó una barba gratis
  ('f1000000-0001-4000-8000-000000000003', 'e1000000-0001-4000-8000-000000000005', 'Barba gratis',      25, '0c6a5894-7fc1-4f32-abd4-2a365409ed17', '2026-01-24 10:30:00-03'),
  -- Valentín canjeó 10% descuento
  ('f1000000-0001-4000-8000-000000000011', 'e1000000-0001-4000-8000-000000000002', '10% de descuento',  15, '6bc56cee-a45a-4c00-967f-5f63406598da', '2026-02-22 14:30:00-03'),
  -- Tomás canjeó 25% descuento
  ('f1000000-0001-4000-8000-000000000004', 'e1000000-0001-4000-8000-000000000003', '25% de descuento',  35, '6bc56cee-a45a-4c00-967f-5f63406598da', '2026-02-28 10:00:00-03');

-- =============================================================================
-- 16. UPDATE client top references (set top_service_id, top_staff_id, top_branch_id)
-- Solo para los clientes más activos
-- =============================================================================

update public.clients set
  top_service_id = 'b1000000-0001-4000-8000-000000000001',
  top_staff_id = '460fd8bf-ca9a-4dfe-9eef-a5175e935acb',
  top_payment_method = 'cash',
  top_branch_id = 'a1b2c3d4-0001-4000-8000-000000000001',
  no_show_count = 0,
  cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000001'; -- Matías

update public.clients set
  top_service_id = 'b1000000-0002-4000-8000-000000000002',
  top_staff_id = '6bc56cee-a45a-4c00-967f-5f63406598da',
  top_payment_method = 'cash',
  top_branch_id = 'a1b2c3d4-0001-4000-8000-000000000001',
  no_show_count = 0,
  cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000002'; -- Lucas

update public.clients set
  top_service_id = 'b1000000-0003-4000-8000-000000000001',
  top_staff_id = '0c6a5894-7fc1-4f32-abd4-2a365409ed17',
  top_payment_method = 'cash',
  top_branch_id = 'a1b2c3d4-0001-4000-8000-000000000002',
  no_show_count = 0,
  cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000003'; -- Nicolás

update public.clients set
  top_service_id = 'b1000000-0001-4000-8000-000000000002',
  top_staff_id = '460fd8bf-ca9a-4dfe-9eef-a5175e935acb',
  top_payment_method = 'cash',
  top_branch_id = 'a1b2c3d4-0001-4000-8000-000000000001',
  no_show_count = 0,
  cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000004'; -- Tomás

update public.clients set
  top_service_id = 'b1000000-0001-4000-8000-000000000002',
  top_staff_id = '460fd8bf-ca9a-4dfe-9eef-a5175e935acb',
  top_payment_method = 'cash',
  top_branch_id = 'a1b2c3d4-0001-4000-8000-000000000001',
  no_show_count = 0,
  cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000005'; -- Joaquín

-- Ramiro Ojeda: no_show
update public.clients set no_show_count = 1, cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000022';

-- Santino Cabrera: 1 cancelled
update public.clients set no_show_count = 0, cancellation_count = 1
where id = 'f1000000-0001-4000-8000-000000000019';

-- Ignacio Romero: 1 no_show
update public.clients set no_show_count = 1, cancellation_count = 0
where id = 'f1000000-0001-4000-8000-000000000017';

-- Facundo Flores: 1 cancelled
update public.clients set no_show_count = 0, cancellation_count = 1
where id = 'f1000000-0001-4000-8000-000000000013';

-- Santiago Gómez: 1 cancelled
update public.clients set cancellation_count = 1
where id = 'f1000000-0001-4000-8000-000000000007';

-- =============================================================================
-- DONE! Seed completado con datos de Oct 2025 a Mar 2026.
-- =============================================================================
