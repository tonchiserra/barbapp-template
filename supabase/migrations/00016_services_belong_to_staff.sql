-- Move services from many-to-many (via staff_services) to direct ownership by staff.
-- Each service now belongs to exactly one staff member.

-- 1. Add new columns to services
ALTER TABLE public.services ADD COLUMN staff_id uuid REFERENCES public.staff(id) ON DELETE CASCADE;
ALTER TABLE public.services ADD COLUMN price_transfer numeric(10,2);
ALTER TABLE public.services ADD COLUMN price_cash numeric(10,2);

-- 2. Migrate: for each staff_services row, create a new service cloned from the original
DO $$
DECLARE
  r RECORD;
  new_service_id uuid;
BEGIN
  FOR r IN
    SELECT ss.staff_id, ss.service_id, ss.price_transfer, ss.price_cash, ss.duration_override,
           s.user_id, s.name, s.description, s.price, s.duration_minutes, s.is_active, s.sort_order
    FROM public.staff_services ss
    JOIN public.services s ON s.id = ss.service_id
  LOOP
    INSERT INTO public.services (user_id, staff_id, name, description, price, price_transfer, price_cash, duration_minutes, is_active, sort_order)
    VALUES (
      r.user_id, r.staff_id, r.name, r.description, r.price,
      COALESCE(r.price_transfer, r.price),
      COALESCE(r.price_cash, r.price),
      COALESCE(r.duration_override, r.duration_minutes),
      r.is_active, r.sort_order
    )
    RETURNING id INTO new_service_id;

    -- Update appointments that reference the old service + this staff
    UPDATE public.appointments
    SET service_id = new_service_id
    WHERE service_id = r.service_id AND staff_id = r.staff_id;
  END LOOP;

  -- Delete old services (those without staff_id)
  DELETE FROM public.services WHERE staff_id IS NULL;
END $$;

-- 3. Make staff_id NOT NULL
ALTER TABLE public.services ALTER COLUMN staff_id SET NOT NULL;

-- 4. Add index for staff_id lookups
CREATE INDEX IF NOT EXISTS idx_services_staff_id ON public.services(staff_id);

-- 5. Drop staff_services table
DROP TABLE IF EXISTS public.staff_services;

-- 6. Drop the old price column (no longer needed, replaced by price_transfer/price_cash)
ALTER TABLE public.services DROP COLUMN price;

-- 7. Update get_available_slots: no longer joins staff_services
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_date date
)
RETURNS TABLE(slot_time time) AS $$
DECLARE
  v_duration integer;
  v_day_of_week integer;
  v_start_time time;
  v_end_time time;
  v_is_working boolean;
  v_current_slot time;
  v_slot_end time;
  v_min_time time;
BEGIN
  -- Get service duration directly from services table
  SELECT s.duration_minutes
    INTO v_duration
    FROM public.services s
    WHERE s.id = p_service_id AND s.staff_id = p_staff_id;

  IF v_duration IS NULL THEN
    RETURN;
  END IF;

  -- Get day of week (0=Sunday, matches JS getDay())
  v_day_of_week := EXTRACT(DOW FROM p_date)::integer;

  -- Get schedule for that day
  SELECT sch.start_time, sch.end_time, sch.is_working
    INTO v_start_time, v_end_time, v_is_working
    FROM public.staff_schedules sch
    WHERE sch.staff_id = p_staff_id AND sch.day_of_week = v_day_of_week;

  -- No schedule or not working
  IF NOT FOUND OR NOT v_is_working THEN
    RETURN;
  END IF;

  -- Check time off (full day)
  IF EXISTS (SELECT 1 FROM public.staff_time_off WHERE staff_id = p_staff_id AND date = p_date) THEN
    RETURN;
  END IF;

  -- For today: only show future slots
  IF p_date = current_date THEN
    v_min_time := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::time;
  ELSE
    v_min_time := '00:00'::time;
  END IF;

  -- Generate slots in 15-minute steps
  v_current_slot := v_start_time;
  WHILE v_current_slot + (v_duration || ' minutes')::interval <= v_end_time LOOP
    v_slot_end := v_current_slot + (v_duration || ' minutes')::interval;

    -- Skip past slots (for today)
    IF v_current_slot <= v_min_time THEN
      v_current_slot := v_current_slot + interval '15 minutes';
      CONTINUE;
    END IF;

    -- Check for overlap with existing appointments
    IF NOT EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.staff_id = p_staff_id
        AND a.date = p_date
        AND a.status IN ('confirmed', 'completed')
        AND a.start_time < v_slot_end
        AND a.end_time > v_current_slot
    ) THEN
      -- Check for overlap with blocked time ranges
      IF NOT EXISTS (
        SELECT 1 FROM public.staff_blocked_times bt
        WHERE bt.staff_id = p_staff_id
          AND bt.date = p_date
          AND bt.start_time < v_slot_end
          AND bt.end_time > v_current_slot
      ) THEN
        slot_time := v_current_slot;
        RETURN NEXT;
      END IF;
    END IF;

    v_current_slot := v_current_slot + interval '15 minutes';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
