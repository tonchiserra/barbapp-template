alter table site_settings
  add column if not exists email jsonb
  default '{"subject":"Gracias por tu visita, {nombre}!","greeting":"Gracias por tu visita, {nombre}!","body":"Tu turno fue completado con exito. Aca tenes el resumen:","farewell":"Te esperamos de nuevo!"}'::jsonb;
