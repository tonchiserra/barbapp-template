-- Enrich clients with automatically computed preferences from appointment history

-- 1. Add new columns
ALTER TABLE public.clients
  ADD COLUMN top_service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN top_staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  ADD COLUMN top_payment_method text,
  ADD COLUMN top_branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  ADD COLUMN last_visit_date date,
  ADD COLUMN no_show_count integer NOT NULL DEFAULT 0,
  ADD COLUMN cancellation_count integer NOT NULL DEFAULT 0;

-- 2. Replace upsert_client with expanded version
CREATE OR REPLACE FUNCTION public.upsert_client(
  p_user_id uuid,
  p_name text,
  p_phone text,
  p_email text,
  p_day_of_week integer,
  p_service_id uuid DEFAULT NULL,
  p_staff_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_client_id uuid;
  v_dow_col text;
  v_match_phone text;
  v_match_email text;
BEGIN
  v_dow_col := 'dow_' || p_day_of_week;

  -- Find existing client by phone (priority)
  IF p_phone <> '' THEN
    SELECT id INTO v_client_id
      FROM public.clients
      WHERE user_id = p_user_id AND phone = p_phone
      LIMIT 1;
  END IF;

  -- Fallback: find by email
  IF v_client_id IS NULL AND p_email <> '' THEN
    SELECT id INTO v_client_id
      FROM public.clients
      WHERE user_id = p_user_id AND email = p_email
      LIMIT 1;
  END IF;

  IF v_client_id IS NOT NULL THEN
    -- Update existing client
    EXECUTE format(
      'UPDATE public.clients SET total_appointments = total_appointments + 1, %I = %I + 1, name = $1, email = CASE WHEN $2 <> '''' THEN $2 ELSE email END, phone = CASE WHEN $3 <> '''' THEN $3 ELSE phone END WHERE id = $4',
      v_dow_col, v_dow_col
    ) USING p_name, p_email, p_phone, v_client_id;
  ELSE
    -- Insert new client
    EXECUTE format(
      'INSERT INTO public.clients (user_id, name, phone, email, total_appointments, %I) VALUES ($1, $2, $3, $4, 1, 1) RETURNING id',
      v_dow_col
    ) INTO v_client_id USING p_user_id, p_name, p_phone, p_email;
  END IF;

  -- Determine match criteria for appointments
  SELECT phone, email INTO v_match_phone, v_match_email
    FROM public.clients WHERE id = v_client_id;

  -- Recompute derived fields from appointment history
  UPDATE public.clients SET
    top_service_id = (
      SELECT a.service_id FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status IN ('confirmed', 'completed')
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
      GROUP BY a.service_id ORDER BY count(*) DESC LIMIT 1
    ),
    top_staff_id = (
      SELECT a.staff_id FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status IN ('confirmed', 'completed')
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
      GROUP BY a.staff_id ORDER BY count(*) DESC LIMIT 1
    ),
    top_payment_method = (
      SELECT a.payment_method FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'completed' AND a.payment_method IS NOT NULL
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
      GROUP BY a.payment_method ORDER BY count(*) DESC LIMIT 1
    ),
    top_branch_id = (
      SELECT s.branch_id FROM public.appointments a
      JOIN public.staff s ON s.id = a.staff_id
      WHERE a.user_id = p_user_id AND a.status IN ('confirmed', 'completed') AND s.branch_id IS NOT NULL
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
      GROUP BY s.branch_id ORDER BY count(*) DESC LIMIT 1
    ),
    last_visit_date = (
      SELECT MAX(a.date) FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'completed'
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
    ),
    no_show_count = (
      SELECT count(*) FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'no_show'
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
    ),
    cancellation_count = (
      SELECT count(*) FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'cancelled'
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
    )
  WHERE id = v_client_id;

  RETURN v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function for status changes (complete/cancel/no-show)
CREATE OR REPLACE FUNCTION public.update_client_on_status_change(
  p_user_id uuid,
  p_phone text,
  p_email text
)
RETURNS void AS $$
DECLARE
  v_client_id uuid;
  v_match_phone text;
  v_match_email text;
BEGIN
  -- Find client
  IF p_phone <> '' THEN
    SELECT id, phone, email INTO v_client_id, v_match_phone, v_match_email
      FROM public.clients
      WHERE user_id = p_user_id AND phone = p_phone
      LIMIT 1;
  END IF;

  IF v_client_id IS NULL AND p_email <> '' THEN
    SELECT id, phone, email INTO v_client_id, v_match_phone, v_match_email
      FROM public.clients
      WHERE user_id = p_user_id AND email = p_email
      LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN RETURN; END IF;

  -- Recompute status-dependent fields
  UPDATE public.clients SET
    top_payment_method = (
      SELECT a.payment_method FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'completed' AND a.payment_method IS NOT NULL
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
      GROUP BY a.payment_method ORDER BY count(*) DESC LIMIT 1
    ),
    last_visit_date = (
      SELECT MAX(a.date) FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'completed'
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
    ),
    no_show_count = (
      SELECT count(*) FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'no_show'
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
    ),
    cancellation_count = (
      SELECT count(*) FROM public.appointments a
      WHERE a.user_id = p_user_id AND a.status = 'cancelled'
        AND ((v_match_phone <> '' AND a.client_phone = v_match_phone)
          OR (v_match_phone = '' AND v_match_email <> '' AND a.client_email = v_match_email))
    )
  WHERE id = v_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Backfill existing clients
DO $$
DECLARE
  v_client RECORD;
  v_phone text;
  v_email text;
  v_user_id uuid;
BEGIN
  FOR v_client IN SELECT id, user_id, phone, email FROM public.clients LOOP
    v_user_id := v_client.user_id;
    v_phone := v_client.phone;
    v_email := v_client.email;

    UPDATE public.clients SET
      top_service_id = (
        SELECT a.service_id FROM public.appointments a
        WHERE a.user_id = v_user_id AND a.status IN ('confirmed', 'completed')
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
        GROUP BY a.service_id ORDER BY count(*) DESC LIMIT 1
      ),
      top_staff_id = (
        SELECT a.staff_id FROM public.appointments a
        WHERE a.user_id = v_user_id AND a.status IN ('confirmed', 'completed')
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
        GROUP BY a.staff_id ORDER BY count(*) DESC LIMIT 1
      ),
      top_payment_method = (
        SELECT a.payment_method FROM public.appointments a
        WHERE a.user_id = v_user_id AND a.status = 'completed' AND a.payment_method IS NOT NULL
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
        GROUP BY a.payment_method ORDER BY count(*) DESC LIMIT 1
      ),
      top_branch_id = (
        SELECT s.branch_id FROM public.appointments a
        JOIN public.staff s ON s.id = a.staff_id
        WHERE a.user_id = v_user_id AND a.status IN ('confirmed', 'completed') AND s.branch_id IS NOT NULL
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
        GROUP BY s.branch_id ORDER BY count(*) DESC LIMIT 1
      ),
      last_visit_date = (
        SELECT MAX(a.date) FROM public.appointments a
        WHERE a.user_id = v_user_id AND a.status = 'completed'
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
      ),
      no_show_count = (
        SELECT count(*) FROM public.appointments a
        WHERE a.user_id = v_user_id AND a.status = 'no_show'
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
      ),
      cancellation_count = (
        SELECT count(*) FROM public.appointments a
        WHERE a.user_id = v_user_id AND a.status = 'cancelled'
          AND ((v_phone <> '' AND a.client_phone = v_phone)
            OR (v_phone = '' AND v_email <> '' AND a.client_email = v_email))
      )
    WHERE id = v_client.id;
  END LOOP;
END;
$$;
