-- Smart slot generation: anchor slots to appointment boundaries
-- and step by service duration instead of fixed 15-minute intervals.
-- This eliminates dead gaps between appointments.

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
  v_occupied RECORD;
  v_window_start time;
  v_window_end time;
  v_current_slot time;
BEGIN
  -- Get service duration
  SELECT s.duration_minutes INTO v_duration
    FROM public.services s
    WHERE s.id = p_service_id AND s.staff_id = p_staff_id;

  IF v_duration IS NULL THEN RETURN; END IF;

  v_day_of_week := EXTRACT(DOW FROM p_date)::integer;

  -- Check if working at all
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
    v_window_start := v_sched.start_time;

    -- Walk through occupied intervals (appointments + blocked times) within this range
    FOR v_occupied IN
      SELECT occ.start_time, occ.end_time FROM (
        SELECT a.start_time, a.end_time
        FROM public.appointments a
        WHERE a.staff_id = p_staff_id
          AND a.date = p_date
          AND a.status IN ('confirmed', 'completed')
          AND a.start_time < v_sched.end_time
          AND a.end_time > v_sched.start_time
        UNION ALL
        SELECT bt.start_time, bt.end_time
        FROM public.staff_blocked_times bt
        WHERE bt.staff_id = p_staff_id
          AND bt.date = p_date
          AND bt.start_time < v_sched.end_time
          AND bt.end_time > v_sched.start_time
      ) occ
      ORDER BY occ.start_time
    LOOP
      -- Free window: from v_window_start to this occupied interval's start
      v_window_end := LEAST(v_occupied.start_time, v_sched.end_time);

      -- Generate slots within this free window
      v_current_slot := v_window_start;
      WHILE v_current_slot + (v_duration || ' minutes')::interval <= v_window_end LOOP
        IF v_current_slot > v_min_time THEN
          slot_time := v_current_slot;
          RETURN NEXT;
        END IF;
        v_current_slot := v_current_slot + (v_duration || ' minutes')::interval;
      END LOOP;

      -- Advance past this occupied interval
      v_window_start := GREATEST(v_window_start, v_occupied.end_time);
    END LOOP;

    -- Final free window: from last occupied end to schedule range end
    v_current_slot := v_window_start;
    WHILE v_current_slot + (v_duration || ' minutes')::interval <= v_sched.end_time LOOP
      IF v_current_slot > v_min_time THEN
        slot_time := v_current_slot;
        RETURN NEXT;
      END IF;
      v_current_slot := v_current_slot + (v_duration || ' minutes')::interval;
    END LOOP;

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
