-- Retorna fechas sin disponibilidad en un rango (para deshabilitar en calendario)
create or replace function public.get_fully_booked_dates(
  p_staff_id uuid,
  p_service_id uuid,
  p_start_date date,
  p_end_date date
)
returns table(booked_date date) as $$
declare
  v_current date;
begin
  v_current := p_start_date;
  while v_current <= p_end_date loop
    if not exists (
      select 1 from public.get_available_slots(p_staff_id, p_service_id, v_current)
    ) then
      booked_date := v_current;
      return next;
    end if;
    v_current := v_current + 1;
  end loop;
end;
$$ language plpgsql security definer;
