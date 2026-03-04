-- ============================================================
-- SEED: Datos de ejemplo para 5 meses (nov 2025 – mar 2026)
-- ============================================================
-- IMPORTANTE: Reemplazar 'TU_USER_ID' con tu auth.users.id real.
-- Ejecutar una sola vez. Para limpiar: DELETE FROM appointments WHERE user_id = 'TU_USER_ID';
-- ============================================================

DO $$
DECLARE
  v_user_id UUID := 'a6374531-9b14-4b8d-9b01-250c87f4e931'; -- <-- REEMPLAZAR

  -- Staff
  v_staff_1 UUID;
  v_staff_2 UUID;

  -- Services
  v_svc_corte UUID;
  v_svc_barba UUID;
  v_svc_combo UUID;

  -- Helpers
  v_date DATE;
  v_month_start DATE;
  v_day INT;
  v_hour INT;
  v_status TEXT;
  v_client_idx INT;
  v_svc_id UUID;
  v_svc_price NUMERIC;
  v_svc_duration INT;
  v_staff_id UUID;
  v_rand DOUBLE PRECISION;

  -- Client names
  v_clients TEXT[] := ARRAY[
    'Juan Perez', 'Carlos Garcia', 'Martin Lopez', 'Lucas Rodriguez',
    'Franco Gonzalez', 'Matias Fernandez', 'Nicolas Martinez', 'Santiago Diaz',
    'Tomas Sanchez', 'Agustin Romero', 'Facundo Torres', 'Lautaro Alvarez',
    'Ignacio Ruiz', 'Federico Ramirez', 'Joaquin Flores', 'Diego Medina',
    'Pablo Herrera', 'Andres Acosta', 'Gonzalo Castro', 'Sebastian Rios'
  ];

  v_phones TEXT[] := ARRAY[
    '1122334455', '1133445566', '1144556677', '1155667788',
    '1166778899', '1177889900', '1188990011', '1199001122',
    '1100112233', '1111223344', '1122334456', '1133445567',
    '1144556678', '1155667789', '1166778890', '1177889901',
    '1188990012', '1199001123', '1100112234', '1111223345'
  ];

BEGIN
  -- ============================================================
  -- 1. Create staff members
  -- ============================================================
  INSERT INTO staff (user_id, name, is_owner, is_active, sort_order)
  VALUES (v_user_id, 'Martin', TRUE, TRUE, 0)
  RETURNING id INTO v_staff_1;

  INSERT INTO staff (user_id, name, is_owner, is_active, sort_order)
  VALUES (v_user_id, 'Lucas', FALSE, TRUE, 1)
  RETURNING id INTO v_staff_2;

  -- ============================================================
  -- 2. Create services
  -- ============================================================
  INSERT INTO services (user_id, name, description, price, duration_minutes, is_active, sort_order)
  VALUES (v_user_id, 'Corte', 'Corte de pelo clasico', 5000, 30, TRUE, 0)
  RETURNING id INTO v_svc_corte;

  INSERT INTO services (user_id, name, description, price, duration_minutes, is_active, sort_order)
  VALUES (v_user_id, 'Barba', 'Perfilado y afeitado de barba', 3500, 20, TRUE, 1)
  RETURNING id INTO v_svc_barba;

  INSERT INTO services (user_id, name, description, price, duration_minutes, is_active, sort_order)
  VALUES (v_user_id, 'Corte + Barba', 'Combo completo', 7500, 45, TRUE, 2)
  RETURNING id INTO v_svc_combo;

  -- ============================================================
  -- 3. Link staff to services
  -- ============================================================
  INSERT INTO staff_services (staff_id, service_id) VALUES
    (v_staff_1, v_svc_corte),
    (v_staff_1, v_svc_barba),
    (v_staff_1, v_svc_combo),
    (v_staff_2, v_svc_corte),
    (v_staff_2, v_svc_barba),
    (v_staff_2, v_svc_combo);

  -- ============================================================
  -- 4. Staff schedules (Mon-Sat, 9:00-19:00)
  -- ============================================================
  FOR d IN 1..6 LOOP
    INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_working)
    VALUES (v_staff_1, d, '09:00', '19:00', TRUE);
    INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_working)
    VALUES (v_staff_2, d, '09:00', '19:00', TRUE);
  END LOOP;
  -- Sunday off
  INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_working)
  VALUES (v_staff_1, 0, '09:00', '19:00', FALSE);
  INSERT INTO staff_schedules (staff_id, day_of_week, start_time, end_time, is_working)
  VALUES (v_staff_2, 0, '09:00', '19:00', FALSE);

  -- ============================================================
  -- 5. Generate appointments for 5 months
  --    Nov 2025: ~20 appts (starting out)
  --    Dec 2025: ~30 appts (growing)
  --    Jan 2026: ~40 appts (steady)
  --    Feb 2026: ~45 appts (peak)
  --    Mar 2026: ~15 appts (partial month, up to today)
  -- ============================================================

  -- ---- NOVIEMBRE 2025 ----
  v_month_start := '2025-11-01';
  FOR i IN 1..20 LOOP
    v_day := 1 + floor(random() * 29)::INT;
    v_date := v_month_start + (v_day - 1);
    -- Skip Sundays
    IF EXTRACT(DOW FROM v_date) = 0 THEN v_date := v_date + 1; END IF;

    v_hour := 9 + floor(random() * 9)::INT;
    v_client_idx := 1 + floor(random() * 20)::INT;
    v_rand := random();

    IF v_rand < 0.5 THEN
      v_svc_id := v_svc_corte; v_svc_price := 5000; v_svc_duration := 30;
    ELSIF v_rand < 0.75 THEN
      v_svc_id := v_svc_barba; v_svc_price := 3500; v_svc_duration := 20;
    ELSE
      v_svc_id := v_svc_combo; v_svc_price := 7500; v_svc_duration := 45;
    END IF;

    IF random() < 0.5 THEN v_staff_id := v_staff_1; ELSE v_staff_id := v_staff_2; END IF;

    v_rand := random();
    IF v_rand < 0.7 THEN v_status := 'completed';
    ELSIF v_rand < 0.85 THEN v_status := 'cancelled';
    ELSIF v_rand < 0.95 THEN v_status := 'no_show';
    ELSE v_status := 'confirmed';
    END IF;

    INSERT INTO appointments (user_id, staff_id, service_id, client_name, client_phone, client_email, date, start_time, end_time, price, status)
    VALUES (
      v_user_id, v_staff_id, v_svc_id,
      v_clients[v_client_idx], v_phones[v_client_idx], '',
      v_date,
      make_time(v_hour, 0, 0),
      make_time(v_hour, 0, 0) + (v_svc_duration || ' minutes')::INTERVAL,
      v_svc_price, v_status
    );
  END LOOP;

  -- ---- DICIEMBRE 2025 ----
  v_month_start := '2025-12-01';
  FOR i IN 1..30 LOOP
    v_day := 1 + floor(random() * 30)::INT;
    v_date := v_month_start + (v_day - 1);
    IF EXTRACT(DOW FROM v_date) = 0 THEN v_date := v_date + 1; END IF;

    v_hour := 9 + floor(random() * 9)::INT;
    v_client_idx := 1 + floor(random() * 20)::INT;
    v_rand := random();

    IF v_rand < 0.45 THEN
      v_svc_id := v_svc_corte; v_svc_price := 5000; v_svc_duration := 30;
    ELSIF v_rand < 0.7 THEN
      v_svc_id := v_svc_barba; v_svc_price := 3500; v_svc_duration := 20;
    ELSE
      v_svc_id := v_svc_combo; v_svc_price := 7500; v_svc_duration := 45;
    END IF;

    IF random() < 0.5 THEN v_staff_id := v_staff_1; ELSE v_staff_id := v_staff_2; END IF;

    v_rand := random();
    IF v_rand < 0.75 THEN v_status := 'completed';
    ELSIF v_rand < 0.88 THEN v_status := 'cancelled';
    ELSIF v_rand < 0.95 THEN v_status := 'no_show';
    ELSE v_status := 'confirmed';
    END IF;

    INSERT INTO appointments (user_id, staff_id, service_id, client_name, client_phone, client_email, date, start_time, end_time, price, status)
    VALUES (
      v_user_id, v_staff_id, v_svc_id,
      v_clients[v_client_idx], v_phones[v_client_idx], '',
      v_date,
      make_time(v_hour, 0, 0),
      make_time(v_hour, 0, 0) + (v_svc_duration || ' minutes')::INTERVAL,
      v_svc_price, v_status
    );
  END LOOP;

  -- ---- ENERO 2026 ----
  v_month_start := '2026-01-01';
  FOR i IN 1..40 LOOP
    v_day := 1 + floor(random() * 30)::INT;
    v_date := v_month_start + (v_day - 1);
    IF EXTRACT(DOW FROM v_date) = 0 THEN v_date := v_date + 1; END IF;

    v_hour := 9 + floor(random() * 9)::INT;
    v_client_idx := 1 + floor(random() * 20)::INT;
    v_rand := random();

    IF v_rand < 0.4 THEN
      v_svc_id := v_svc_corte; v_svc_price := 5000; v_svc_duration := 30;
    ELSIF v_rand < 0.65 THEN
      v_svc_id := v_svc_barba; v_svc_price := 3500; v_svc_duration := 20;
    ELSE
      v_svc_id := v_svc_combo; v_svc_price := 7500; v_svc_duration := 45;
    END IF;

    IF random() < 0.5 THEN v_staff_id := v_staff_1; ELSE v_staff_id := v_staff_2; END IF;

    v_rand := random();
    IF v_rand < 0.72 THEN v_status := 'completed';
    ELSIF v_rand < 0.85 THEN v_status := 'cancelled';
    ELSIF v_rand < 0.93 THEN v_status := 'no_show';
    ELSE v_status := 'confirmed';
    END IF;

    INSERT INTO appointments (user_id, staff_id, service_id, client_name, client_phone, client_email, date, start_time, end_time, price, status)
    VALUES (
      v_user_id, v_staff_id, v_svc_id,
      v_clients[v_client_idx], v_phones[v_client_idx], '',
      v_date,
      make_time(v_hour, 0, 0),
      make_time(v_hour, 0, 0) + (v_svc_duration || ' minutes')::INTERVAL,
      v_svc_price, v_status
    );
  END LOOP;

  -- ---- FEBRERO 2026 ----
  v_month_start := '2026-02-01';
  FOR i IN 1..45 LOOP
    v_day := 1 + floor(random() * 27)::INT;
    v_date := v_month_start + (v_day - 1);
    IF EXTRACT(DOW FROM v_date) = 0 THEN v_date := v_date + 1; END IF;

    v_hour := 9 + floor(random() * 9)::INT;
    v_client_idx := 1 + floor(random() * 20)::INT;
    v_rand := random();

    IF v_rand < 0.35 THEN
      v_svc_id := v_svc_corte; v_svc_price := 5000; v_svc_duration := 30;
    ELSIF v_rand < 0.6 THEN
      v_svc_id := v_svc_barba; v_svc_price := 3500; v_svc_duration := 20;
    ELSE
      v_svc_id := v_svc_combo; v_svc_price := 7500; v_svc_duration := 45;
    END IF;

    IF random() < 0.5 THEN v_staff_id := v_staff_1; ELSE v_staff_id := v_staff_2; END IF;

    v_rand := random();
    IF v_rand < 0.78 THEN v_status := 'completed';
    ELSIF v_rand < 0.88 THEN v_status := 'cancelled';
    ELSIF v_rand < 0.95 THEN v_status := 'no_show';
    ELSE v_status := 'confirmed';
    END IF;

    INSERT INTO appointments (user_id, staff_id, service_id, client_name, client_phone, client_email, date, start_time, end_time, price, status)
    VALUES (
      v_user_id, v_staff_id, v_svc_id,
      v_clients[v_client_idx], v_phones[v_client_idx], '',
      v_date,
      make_time(v_hour, 0, 0),
      make_time(v_hour, 0, 0) + (v_svc_duration || ' minutes')::INTERVAL,
      v_svc_price, v_status
    );
  END LOOP;

  -- ---- MARZO 2026 (parcial, hasta hoy ~4) ----
  v_month_start := '2026-03-01';
  FOR i IN 1..15 LOOP
    v_day := 1 + floor(random() * 3)::INT; -- days 1-3
    v_date := v_month_start + (v_day - 1);
    IF EXTRACT(DOW FROM v_date) = 0 THEN v_date := v_date + 1; END IF;

    v_hour := 9 + floor(random() * 9)::INT;
    v_client_idx := 1 + floor(random() * 20)::INT;
    v_rand := random();

    IF v_rand < 0.4 THEN
      v_svc_id := v_svc_corte; v_svc_price := 5000; v_svc_duration := 30;
    ELSIF v_rand < 0.65 THEN
      v_svc_id := v_svc_barba; v_svc_price := 3500; v_svc_duration := 20;
    ELSE
      v_svc_id := v_svc_combo; v_svc_price := 7500; v_svc_duration := 45;
    END IF;

    IF random() < 0.5 THEN v_staff_id := v_staff_1; ELSE v_staff_id := v_staff_2; END IF;

    -- More confirmed for current month (some pending)
    v_rand := random();
    IF v_rand < 0.4 THEN v_status := 'completed';
    ELSIF v_rand < 0.5 THEN v_status := 'cancelled';
    ELSE v_status := 'confirmed';
    END IF;

    INSERT INTO appointments (user_id, staff_id, service_id, client_name, client_phone, client_email, date, start_time, end_time, price, status)
    VALUES (
      v_user_id, v_staff_id, v_svc_id,
      v_clients[v_client_idx], v_phones[v_client_idx], '',
      v_date,
      make_time(v_hour, 0, 0),
      make_time(v_hour, 0, 0) + (v_svc_duration || ' minutes')::INTERVAL,
      v_svc_price, v_status
    );
  END LOOP;

  -- ---- Add a few future appointments (today + upcoming) ----
  INSERT INTO appointments (user_id, staff_id, service_id, client_name, client_phone, client_email, date, start_time, end_time, price, status)
  VALUES
    (v_user_id, v_staff_1, v_svc_corte, 'Juan Perez', '1122334455', '', CURRENT_DATE, '10:00', '10:30', 5000, 'confirmed'),
    (v_user_id, v_staff_2, v_svc_combo, 'Carlos Garcia', '1133445566', '', CURRENT_DATE, '11:00', '11:45', 7500, 'confirmed'),
    (v_user_id, v_staff_1, v_svc_barba, 'Martin Lopez', '1144556677', '', CURRENT_DATE, '14:00', '14:20', 3500, 'confirmed'),
    (v_user_id, v_staff_2, v_svc_corte, 'Lucas Rodriguez', '1155667788', '', CURRENT_DATE + 1, '09:00', '09:30', 5000, 'confirmed'),
    (v_user_id, v_staff_1, v_svc_combo, 'Franco Gonzalez', '1166778899', '', CURRENT_DATE + 2, '16:00', '16:45', 7500, 'confirmed');

  RAISE NOTICE 'Seed data created: 2 staff, 3 services, ~155 appointments across 5 months';
END $$;
