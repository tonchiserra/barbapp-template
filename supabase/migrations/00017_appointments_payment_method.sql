-- Track how the client paid (cash or transfer) when completing an appointment
ALTER TABLE public.appointments
  ADD COLUMN payment_method text CHECK (payment_method IN ('cash', 'transfer'));
