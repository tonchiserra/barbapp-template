# Barbapp

Plataforma para una barberia o peluqueria. El dueno personaliza su landing page publica y gestiona turnos, equipo, clientes y sucursales desde el panel de administracion. Modelo single-business (un solo negocio por instancia).

## Stack

| Categoria | Tecnologia |
|-----------|-----------|
| Framework | Next.js 16 (App Router, `src/` dir) |
| UI | Tailwind CSS v4 + Radix UI (primitivas sin estilo, sin shadcn) |
| Auth / DB | Supabase (auth SSR con cookies, PostgreSQL, Storage) |
| Email | Resend |
| Deploy | Vercel |
| Lenguaje | TypeScript strict |
| Paquetes | npm |
| Graficos | recharts (BarChart, LineChart) |
| Fechas | date-fns (locale es-AR) |

## Setup

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd barbapp
npm install
```

### 2. Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **Project Settings > API** y copiar:
   - Project URL
   - Publishable key (anon key)
3. Copiar el contenido de `supabase/setup.sql` y ejecutarlo en el **SQL Editor** de Supabase. Este archivo crea todas las tablas, indices, politicas RLS y funciones en una sola ejecucion.
4. En **Authentication > Providers** habilitar Email
5. Crear el primer usuario owner (ver seccion **Roles y acceso** abajo)

### 3. Resend

1. Crear cuenta en [resend.com](https://resend.com)
2. Copiar la API key
3. (Opcional) Verificar un dominio propio para enviar desde tu email

### 4. Variables de entorno

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
RESEND_API_KEY=re_xxx
```

### 5. Correr

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 6. Deploy en Vercel

1. Conectar el repo en [vercel.com](https://vercel.com)
2. Agregar las 3 variables de entorno en **Settings > Environment Variables**
3. Deploy automatico en cada push

---

## Estructura del proyecto

```
src/
├── app/
│   ├── page.tsx                  # Landing page publica
│   ├── layout.tsx                # Root layout (metadata, fonts)
│   ├── globals.css               # Tailwind v4, design tokens, animaciones
│   ├── login/                    # Login (email + password)
│   ├── onboarding/               # Onboarding (nombre y sucursal al primer login)
│   ├── auth/callback/            # Callback de autenticacion
│   ├── ui-kit/                   # Referencia visual de componentes
│   └── admin/                    # Panel de administracion (protegido)
│       ├── admin-shell.tsx       # Layout con sidebar de navegacion
│       ├── dashboard/            # Metricas, caja (comisiones), historico, graficos
│       ├── agenda/               # Turnos y gestion de citas (7 dias)
│       ├── header/               # Logo, menu, redes sociales
│       ├── footer/               # Links y redes del footer
│       ├── carousel/             # Carrusel de imagenes hero
│       ├── video/                # Embed de YouTube
│       ├── gallery/              # Galeria de imagenes
│       ├── multicolumn/          # Bloques con imagen y texto
│       ├── mapa/                 # Ubicaciones con Google Maps
│       ├── estilos/              # Colores del tema (4 colores base)
│       ├── email/                # Plantilla de email personalizable
│       ├── equipo/               # Staff + servicios + horarios
│       ├── clientes/             # CRM de clientes + export CSV
│       ├── cupones/              # Codigos de descuento
│       ├── puntos/               # Recompensas y sistema de fidelizacion
│       ├── productos/            # Catalogo de productos y ventas
│       ├── ranking/              # Config de ranking publico
│       ├── sucursales/           # Gestion de sucursales
│       └── configuracion/        # Config general del turnero
│
├── components/
│   ├── ui/                       # UI Kit (Button, Input, Dialog, Card, etc.)
│   ├── sections/                 # Secciones de la landing (header, booking, etc.)
│   └── icons/                    # Iconos de redes sociales (IG, FB, TikTok, etc.)
│
├── lib/
│   ├── auth.ts                   # Sesion centralizada (getAuthSession, requireAuth, requireScope)
│   ├── permissions.ts            # Roles, scopes y permisos (hasScope, getDefaultRoute)
│   ├── utils.ts                  # cn(), hexToHsl, luminance, YouTube URL parser
│   ├── email.ts                  # Envio de emails con Resend
│   ├── theme.ts                  # Generador de CSS dinamico desde colores
│   ├── storage.ts                # Upload/delete a Supabase Storage (2MB, validacion)
│   ├── supabase/                 # Clientes Supabase (client, server, middleware)
│   └── queries/                  # Data access (site-settings, staff, services, appointments, clients, branches, rewards, ranking)
│
├── types/
│   └── index.ts                  # Interfaces, defaults y constantes
│
└── middleware.ts                 # Auth guard: protege /admin/*, refresca JWT
```

---

## Funcionalidades

### Landing page publica

Landing page personalizable compuesta por secciones independientes. Cada seccion se puede activar/desactivar y editar desde el admin.

| Seccion | Descripcion |
|---------|-------------|
| **Header** | Logo (texto o imagen), menu de navegacion con links custom, iconos de redes sociales. Sticky con efecto frosted glass (backdrop-blur). En mobile: hamburger menu con panel lateral. |
| **Carrusel** | Slides con imagen desktop/mobile independientes, titulo, subtitulo, boton CTA. Color de texto y alineacion configurables. Auto-rotacion opcional. |
| **Video** | Embed de YouTube con titulo, descripcion y CTA. |
| **Galeria** | Grid de imagenes con titulo, descripcion y CTA. |
| **Multicolumna** | Bloques con imagen, titulo, subtitulo y link. Grid responsive. |
| **Mapa** | Embed de Google Maps con soporte para multiples ubicaciones. |
| **Turnero** | Widget completo de reserva de turnos (detalle abajo). |
| **Ranking** | Top 100 clientes por puntos de fidelidad. Barra de progreso relativa al primero. Configurable desde el admin (titulo, descripcion, visibilidad). |
| **Footer** | Links de navegacion, iconos de redes sociales. |

**Tema dinamico:** 4 colores base (fondo, texto, primario, secundario) generan automaticamente todo el esquema de colores. Se inyectan como CSS variables en el `<style>` de la landing.

### Panel de admin

Accesible en `/admin/*`, protegido por middleware de autenticacion y sistema de roles. Sidebar con dos grupos de navegacion. Las secciones sin permiso aparecen deshabilitadas (visibles pero no clickeables):

**Secciones de landing:** Header, Carrusel, Video, Galeria, Multicolumna, Mapa, Ranking, Footer, Estilos. *(solo admin/owner)*

**Gestion del negocio:** Configuracion, Dashboard, Agenda, Sucursales, Equipo, Clientes, Cupones, Puntos, Productos, Email. *(visibilidad segun rol)*

---

## Turnero (sistema de reservas)

### Flujo de reserva (publico)

El widget de booking guia al cliente paso a paso:

1. **Sucursal** (solo si hay mas de 1) — Seleccion de ubicacion
2. **Profesional** — Lista de staff activo (filtrado por sucursal si aplica). Muestra avatar y nombre. Se auto-salta si hay 1 solo profesional.
3. **Servicio** — Servicios del profesional seleccionado. Muestra nombre, descripcion, duracion y precios (efectivo/transferencia). Se auto-salta si hay 1 solo servicio.
4. **Fecha** — Calendario mensual. Solo muestra dias habiles del profesional, excluye dias libres. Respeta la agenda del profesional (fecha inicio/fin) y sus horas minimas de anticipacion.
5. **Horario** — Slots disponibles generados en tiempo real. Algoritmo inteligente que genera horarios segun la duracion del servicio, anclados a los limites de turnos existentes para eliminar baches.
6. **Datos de contacto** — Nombre (obligatorio), telefono (obligatorio), email (opcional).
7. **Confirmacion** — Resumen completo. Campo opcional para codigo de descuento. Muestra precios en efectivo y transferencia (con descuento si aplica).
8. **Exito** — Mensaje de confirmacion + link para agregar a Google Calendar.

### Generacion de slots

La funcion `get_available_slots()` en PostgreSQL genera los horarios disponibles:

- Recibe: `staff_id`, `service_id`, `date`
- Obtiene la duracion del servicio seleccionado
- Itera los rangos horarios del dia (soporta turnos partidos, ej: 9-13 y 14-18)
- Identifica las ventanas libres entre turnos existentes y bloqueos
- Genera slots avanzando de a `duration_minutes` dentro de cada ventana libre
- Filtra horarios pasados (para el dia de hoy, timezone Buenos Aires)

**Resultado:** Los turnos se empaquetan sin baches. Si hay un turno de 9:00 a 9:45, el siguiente slot disponible es 9:45 (no 10:00).

### Estados de un turno

```
confirmado → completado (admin selecciona metodo de pago)
confirmado → cancelado
confirmado → no asistio
```

**Al completar:** Se registra el metodo de pago (efectivo/transferencia). Si es transferencia, el precio se recalcula con `price_transfer` del servicio. Se envia email de finalizacion al cliente. Se suman puntos de fidelidad al cliente (1 punto por cada $1.000).

**Al cancelar / no asistir:** Se actualizan los contadores del cliente (`cancellation_count`, `no_show_count`).

**Edicion de turnos:** El staff puede modificar el servicio, fecha y horario de un turno confirmado. El precio se recalcula automaticamente (con descuento si aplica). Cancelar y marcar no asistio requiere confirmacion. Se puede revertir a confirmado.

### Precios duales

Cada servicio tiene dos precios: `price_cash` (efectivo) y `price_transfer` (transferencia). El precio final se determina cuando el admin marca el turno como completado y selecciona el metodo de pago.

### Codigos de descuento

- Codigo alfanumerico, case-insensitive
- Porcentaje de descuento (1-100%)
- Limite de usos y contador
- Validacion atomica con `use_discount_code()` (previene race conditions)
- Se aplica en el paso de confirmacion de la reserva

---

## Roles y acceso

### Sistema de roles (RBAC)

Cada usuario de la aplicacion tiene una cuenta en Supabase Auth. Al iniciar sesion por primera vez, un flujo de onboarding le pide completar su nombre y sucursal, y crea automaticamente su registro en `staff`. El primer usuario se crea como `owner`; los siguientes como `employee`.

**Relacion clave:** `staff.id = auth.users.id` (el ID del staff ES su ID de Supabase Auth).

| Rol | Descripcion |
|-----|-------------|
| **admin** | Cuenta del desarrollador. Acceso total. Oculto en listados de staff. |
| **owner** | Dueno del negocio. Acceso total incluyendo landing page. |
| **manager** | Encargado de sucursal. Acceso a gestion del negocio (sin landing page). Solo ve/edita staff de su sucursal. |
| **employee** | Empleado. Solo puede ver y editar su propio perfil (servicios, horarios, dias libres, bloqueos). |

### Permisos por seccion (scopes)

Las secciones del admin estan protegidas por scopes. Cada rol tiene un conjunto de scopes permitidos definidos en `src/lib/permissions.ts`.

| Scope | admin | owner | manager | employee |
|-------|:-----:|:-----:|:-------:|:--------:|
| landing:* (header, carousel, video, gallery, multicolumn, mapa, ranking, footer, estilos) | si | si | no | no |
| turnero:configuracion | si | si | si | no |
| turnero:dashboard | si | si | si* | si* |
| turnero:agenda | si | si | si* | si* |
| turnero:sucursales | si | si | si | no |
| turnero:equipo | si | si | si** | si** |
| turnero:clientes | si | si | si | no |
| turnero:cupones | si | si | si | no |
| turnero:puntos | si | si | si | no |
| turnero:productos | si | si | si | si |
| turnero:email | si | si | si | no |

*\*dashboard/agenda: employee ve solo sus turnos, manager ve turnos de su sucursal*
*\*\*equipo: employee solo accede a su perfil, manager solo a staff de su sucursal*

### Crear un usuario

1. En Supabase Dashboard > **Authentication** > crear usuario con email y password
2. El usuario inicia sesion en la app
3. Aparece el onboarding (`/onboarding`) donde completa su nombre y sucursal
4. Se crea automaticamente como `owner` (si es el primero) o `employee`
5. Un owner/admin puede cambiar el rol desde la seccion Equipo

**Nota:** El admin no aparece en listados de staff y no se puede crear desde el onboarding. Para crear o promover un admin manualmente:

```sql
-- Crear admin nuevo (requiere cuenta en Supabase Auth)
INSERT INTO public.staff (id, name, role)
VALUES ('<auth-uid>', 'Admin', 'admin');

-- O promover un usuario existente a admin
UPDATE public.staff SET role = 'admin' WHERE id = '<auth-uid>';
```

### Reiniciar la base de datos

Si necesitas borrar todo y empezar de cero, ejecutar en el SQL Editor **antes** de correr `setup.sql`:

```sql
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

DROP TABLE IF EXISTS product_sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS point_redemptions CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS service_special_prices CASCADE;
DROP TABLE IF EXISTS staff_blocked_times CASCADE;
DROP TABLE IF EXISTS staff_time_off CASCADE;
DROP TABLE IF EXISTS staff_schedules CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

DROP FUNCTION IF EXISTS public.get_my_staff();
DROP FUNCTION IF EXISTS public.is_staff_member();
DROP FUNCTION IF EXISTS public.is_owner_or_admin();
DROP FUNCTION IF EXISTS public.can_manage_staff(uuid);
DROP FUNCTION IF EXISTS public.handle_updated_at();
DROP FUNCTION IF EXISTS public.get_available_slots(uuid, uuid, date);
DROP FUNCTION IF EXISTS public.use_discount_code(text);
DROP FUNCTION IF EXISTS public.upsert_client(text, text, text, integer, uuid, uuid);
DROP FUNCTION IF EXISTS public.update_client_on_status_change(text, text);
DROP FUNCTION IF EXISTS public.add_client_points(text, text, numeric);
DROP FUNCTION IF EXISTS public.redeem_points(uuid, uuid, uuid);
DROP FUNCTION IF EXISTS public.get_public_ranking(integer);
```

---

## Equipo (staff)

### Gestion de profesionales

- Edicion de nombre, avatar (upload a Storage, max 2MB) y estado activo/inactivo
- Asignacion a sucursal (opcional)
- Porcentaje de comision configurable (0-100%, default 50%)
- Card de ganancias: turnos completados, ingresos totales y comision del empleado para hoy, semana y mes
- Agenda propia: cada profesional controla desde/hasta cuando acepta citas y las horas minimas de anticipacion
- Rol visible como badge (Dueno, Encargado, Empleado)
- Staff no se crea ni elimina desde el admin (se gestiona en Supabase directamente)

### Horarios semanales

- Configuracion por dia de la semana (lunes a domingo)
- Soporta **multiples rangos por dia** para manejar turnos partidos (ej: 09:00-13:00 y 14:00-18:00)
- Toggle de dia laborable/libre

### Dias libres y bloqueos

- **Dias libres:** Fecha completa no disponible, con motivo opcional
- **Bloqueos parciales:** Rango horario dentro de un dia (ej: 12:00-13:00 almuerzo), con motivo

### Servicios por profesional

Cada servicio pertenece a un unico profesional (no son globales):

- Nombre, descripcion
- Precio en efectivo y precio por transferencia
- Precios especiales por fecha (precio diferente en una fecha especifica, mayor o menor al original)
- Duracion en minutos
- Estado activo/inactivo
- Orden de visualizacion

---

## Clientes (CRM)

Los clientes se crean automaticamente al reservar un turno. Se identifican por telefono (prioridad) o email.

### Datos auto-computados

En cada reserva y cambio de estado, se recalculan desde el historial de `appointments`:

| Campo | Descripcion |
|-------|-------------|
| `total_appointments` | Cantidad total de turnos |
| `dow_0` a `dow_6` | Turnos por dia de la semana (dom a sab) |
| `top_service_id` | Servicio mas reservado |
| `top_staff_id` | Profesional preferido |
| `top_payment_method` | Metodo de pago preferido (efectivo/transferencia) |
| `top_branch_id` | Sucursal preferida |
| `last_visit_date` | Fecha de la ultima visita completada |
| `no_show_count` | Cantidad de ausencias |
| `cancellation_count` | Cantidad de cancelaciones |

### Admin

- Listado paginado, ordenado por cantidad de turnos
- Tabla con todas las metricas (responsive, columnas ocultas en mobile)
- Export a CSV con todos los campos

---

## Sucursales

Soporte multi-sucursal para negocios con mas de una ubicacion:

- CRUD de sucursales (nombre, direccion, estado activo)
- Asignacion de staff a sucursal
- En el turnero: paso de seleccion de sucursal (solo si hay mas de 1 sucursal activa)
- El staff se filtra por la sucursal seleccionada

---

## Dashboard

Vista de metricas e ingresos del negocio con filtros por sucursal y empleado (owner/admin):

- **Metricas:** Turnos y ingresos del dia, semana y mes. Comparativa porcentual vs periodo anterior.
- **Caja:** Desglose por empleado con tabs Hoy/Semana/Mes. Muestra turnos completados, ingreso en efectivo y transferencia, comision del empleado y neto para el dueno. Fila de totales al final.
- **Historico:** Tabla con los ultimos 12 meses mostrando turnos totales, completados e ingresos. Se actualiza reactivamente con los filtros.
- **Graficos:** Grafico de barras (turnos por mes) y grafico de linea (ingresos por mes) de los ultimos 12 meses. Usa recharts con carga dinamica (`next/dynamic`, sin SSR).
- **Filtros por rol:** Employee ve solo sus datos, manager ve datos de su sucursal, owner/admin ve todo con filtros de sucursal y empleado.

---

## Agenda

Gestion de turnos y citas con vista de 7 dias:

- **Proximo turno:** Card destacada con el siguiente turno confirmado del dia.
- **Vista por dia:** 7 tabs (uno por dia) con lista de turnos ordenados cronologicamente.
- **Acciones:** Completar (con selector de metodo de pago), cancelar, marcar no asistio, editar (servicio, fecha, horario), revertir a confirmado.
- **Filtros compartidos:** Mismos filtros de sucursal y empleado que el dashboard, extraidos a un hook reutilizable (`useStaffFilters`).
- **Filtros por rol:** Employee ve solo sus turnos, manager ve turnos de su sucursal, owner/admin ve todo.

---

## Sistema de puntos (fidelizacion)

### Acumulacion

Por cada turno completado, el cliente acumula **1 punto por cada $1.000** del precio final. La asignacion es automatica (fire-and-forget) al marcar el turno como completado. Se identifica al cliente por telefono (prioridad) o email.

### Recompensas

Desde `/admin/puntos` se configuran recompensas canjeables:

- **Producto:** Un item fisico (ej: "Pomada gratis", 50 puntos)
- **Descuento:** Porcentaje de descuento (ej: "20% off", 30 puntos)
- Cada recompensa tiene nombre, descripcion, costo en puntos y estado activo/inactivo
- El canje es atomico (funcion PostgreSQL con `FOR UPDATE` lock para prevenir race conditions)

### Ranking publico

Seccion configurable en la landing page que muestra los **top 100 clientes** por puntos acumulados:

- Barra de progreso relativa al cliente con mas puntos
- Privacidad: solo muestra nombre + inicial del apellido (ej: "Juan P.")
- Configurable desde `/admin/ranking` (titulo, descripcion, visibilidad)

---

## Productos

Sistema de catalogo y ventas de productos del negocio. Accesible por todo el staff.

### Catalogo

- CRUD de productos: nombre, precio, foto (upload a Storage)
- Estado activo/inactivo

### Ventas

- Boton rapido "Vender" en cada producto con selector de cantidad
- Cada venta queda asociada al empleado que la registro (`staff_id`)
- Historial paginado con detalle de producto, empleado, fecha y monto
- Empleados pueden eliminar solo sus propias ventas; admin/owner/manager todas
- Solo admin/owner/manager pueden eliminar productos

---

## Email

Integracion con Resend para envio de emails transaccionales:

- Se envia automaticamente al marcar un turno como completado
- Plantilla HTML personalizable desde el admin
- Variables disponibles: `{nombre}`, `{servicio}`, `{profesional}`, `{fecha}`, `{hora}`
- Campos editables: asunto, saludo, cuerpo, despedida
- Link a Google Calendar en el email

---

## Tema y diseno

### Estilo iOS

- Bordes redondeados generosos (`rounded-xl`, `rounded-2xl`)
- Tipografia system font (-apple-system, SF Pro)
- Blancos puros, grises claros
- Primary azul iOS (#007AFF)
- Sin dark mode

### Personalizacion

4 colores base configurables desde `/admin/estilos`:

| Color | Default | Uso |
|-------|---------|-----|
| Background | `#ffffff` | Fondo de toda la pagina |
| Foreground | `#121212` | Texto principal |
| Primary | `#007AFF` | Botones, links, acentos |
| Secondary | `#f5f5f6` | Fondos secundarios |

Los colores derivados (muted, border, accent) se calculan automaticamente. El contraste de texto sobre primary se ajusta por luminancia.

---

## Base de datos

### Tablas principales

| Tabla | Descripcion |
|-------|-------------|
| `site_settings` | Config de landing (singleton, 1 row, columnas JSONB por seccion) |
| `staff` | Profesionales del equipo |
| `services` | Servicios (pertenecen a staff) |
| `service_special_prices` | Precios especiales por fecha para servicios |
| `staff_schedules` | Horarios semanales (multiples rangos por dia) |
| `staff_time_off` | Dias libres completos |
| `staff_blocked_times` | Bloqueos parciales de horario |
| `appointments` | Turnos reservados |
| `clients` | Clientes (auto-generados con preferencias computadas, puntos) |
| `discount_codes` | Codigos de descuento |
| `branches` | Sucursales |
| `rewards` | Recompensas canjeables con puntos |
| `point_redemptions` | Historial de canjes de puntos |
| `products` | Catalogo de productos |
| `product_sales` | Registro de ventas de productos |

### Seguridad (RLS)

Todas las tablas tienen Row Level Security con patron basado en roles. Las policies usan funciones helper que verifican membresia y rol del usuario autenticado.

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| site_settings | publico | owner/admin | owner/admin | owner/admin |
| branches | publico (activas) + miembros | owner/admin | owner/admin | owner/admin |
| staff | publico (activos, no admin) + miembros | — (via Supabase) | segun rol* | — (via Supabase) |
| services, schedules, time_off, blocked_times | publico | segun rol* | segun rol* | segun rol* |
| appointments | miembros del negocio | cualquiera | miembros | miembros |
| clients | miembros del negocio | cualquiera | cualquiera | — |
| discount_codes | publico | miembros | miembros | miembros |
| rewards | publico | miembros | miembros | miembros |
| point_redemptions | miembros | miembros | — | — |
| products | publico | miembros | miembros | miembros |
| product_sales | miembros | miembros | — | miembros |

*\*admin/owner: cualquier staff del negocio. manager: staff de su sucursal. employee: solo su propio perfil.*

### Funciones PostgreSQL

| Funcion | Descripcion |
|---------|-------------|
| `onboard_staff(name, branch_id)` | Crea el registro staff para el usuario autenticado (owner si es el primero, employee si no) |
| `is_staff_member()` | Verifica si el usuario autenticado es miembro del staff |
| `is_owner_or_admin()` | Verifica si el usuario tiene rol admin u owner |
| `can_manage_staff(staff_id)` | Verifica si puede gestionar un staff segun su rol |
| `get_my_staff()` | Devuelve el registro staff del usuario autenticado |
| `get_available_slots()` | Genera slots disponibles (inteligente, sin baches) |
| `upsert_client()` | Crea/actualiza cliente y recomputa preferencias |
| `update_client_on_status_change()` | Actualiza contadores al cambiar estado de turno |
| `use_discount_code()` | Valida y consume codigo de descuento (atomico) |
| `add_client_points()` | Suma puntos de fidelidad al cliente segun precio |
| `redeem_points()` | Canjea puntos por recompensa (atomico, FOR UPDATE lock) |
| `get_public_ranking()` | Top N clientes por puntos (nombre + inicial, SECURITY DEFINER) |
| `handle_updated_at()` | Trigger para timestamp `updated_at` |

---

## UI Kit

Componentes custom sobre Radix UI con estilo iOS. Sin dependencia de shadcn/ui.

**Server (sin interactividad):** Button, LinkButton, Heading, Text, Link, Badge, Separator, Card (compound con Header, Title, Description, Content, Footer)

**Client ("use client"):** Input, Textarea, Select, Checkbox, Switch, Dialog, ImageUpload, Toast

Referencia visual disponible en `/ui-kit`.

---

## Scripts

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de produccion
npm start         # Correr build de produccion
npm run lint      # Linting con ESLint
```
