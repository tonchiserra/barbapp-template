-- Rename price_override to price_transfer and add price_cash
alter table public.staff_services rename column price_override to price_transfer;
alter table public.staff_services add column price_cash numeric(10,2);
