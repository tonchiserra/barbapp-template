-- Allow multiple time ranges per day for staff schedules (e.g. 09-13 and 14-18)
-- Drop the unique constraint that limits one range per day
ALTER TABLE public.staff_schedules DROP CONSTRAINT IF EXISTS staff_schedules_staff_id_day_of_week_key;

-- Update get_available_slots to iterate over multiple schedule rows per day
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_staff_id uuid,
  p_service_id uuid,
  p_date date
)
RETURNS TABLE(slot_time time) AS $$
DECLARE
  v_duration integer;
  v_day_of_week integer;
  v_min_time time;
  v_sched RECORD;
  v_current_slot time;
  v_slot_end time;
BEGIN
  -- Get service duration
  SELECT s.duration_minutes INTO v_duration
    FROM public.services s
    WHERE s.id = p_service_id AND s.staff_id = p_staff_id;

  IF v_duration IS NULL THEN RETURN; END IF;

  v_day_of_week := EXTRACT(DOW FROM p_date)::integer;

  -- Check if working at all (any schedule row with is_working=true)
  IF NOT EXISTS (
    SELECT 1 FROM public.staff_schedules sch
    WHERE sch.staff_id = p_staff_id AND sch.day_of_week = v_day_of_week AND sch.is_working = true
  ) THEN
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

  -- Iterate over each schedule range for this day
  FOR v_sched IN
    SELECT sch.start_time, sch.end_time
    FROM public.staff_schedules sch
    WHERE sch.staff_id = p_staff_id AND sch.day_of_week = v_day_of_week AND sch.is_working = true
    ORDER BY sch.start_time
  LOOP
    v_current_slot := v_sched.start_time;
    WHILE v_current_slot + (v_duration || ' minutes')::interval <= v_sched.end_time LOOP
      v_slot_end := v_current_slot + (v_duration || ' minutes')::interval;

      IF v_current_slot <= v_min_time THEN
        v_current_slot := v_current_slot + interval '15 minutes';
        CONTINUE;
      END IF;

      -- Check appointment overlap
      IF NOT EXISTS (
        SELECT 1 FROM public.appointments a
        WHERE a.staff_id = p_staff_id
          AND a.date = p_date
          AND a.status IN ('confirmed', 'completed')
          AND a.start_time < v_slot_end
          AND a.end_time > v_current_slot
      ) THEN
        -- Check blocked time overlap
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
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
