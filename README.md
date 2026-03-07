# Barbapp

Plataforma SaaS para barberos y peluqueros. Cada profesional crea su cuenta, personaliza su landing page publica y gestiona turnos, equipo, clientes y sucursales desde el panel de administracion.

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
│   ├── registro/                 # Registro de usuario
│   ├── auth/callback/            # Callback de autenticacion
│   ├── ui-kit/                   # Referencia visual de componentes
│   └── admin/                    # Panel de administracion (protegido)
│       ├── admin-shell.tsx       # Layout con sidebar de navegacion
│       ├── dashboard/            # Metricas, agenda, proximo turno
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
│       ├── sucursales/           # Gestion de sucursales
│       └── configuracion/        # Config general del turnero
│
├── components/
│   ├── ui/                       # UI Kit (Button, Input, Dialog, Card, etc.)
│   ├── sections/                 # Secciones de la landing (header, booking, etc.)
│   └── icons/                    # Iconos de redes sociales (IG, FB, TikTok, etc.)
│
├── lib/
│   ├── utils.ts                  # cn(), hexToHsl, luminance, YouTube URL parser
│   ├── email.ts                  # Envio de emails con Resend
│   ├── theme.ts                  # Generador de CSS dinamico desde colores
│   ├── storage.ts                # Upload/delete a Supabase Storage (2MB, validacion)
│   ├── supabase/                 # Clientes Supabase (client, server, middleware)
│   └── queries/                  # Data access (site-settings, staff, services, appointments, clients, branches)
│
├── types/
│   └── index.ts                  # Interfaces, defaults y constantes
│
└── middleware.ts                 # Auth guard: protege /admin/*, refresca JWT
```

---

## Funcionalidades

### Landing page publica

Cada usuario tiene su landing page personalizable compuesta por secciones independientes. Cada seccion se puede activar/desactivar y editar desde el admin.

| Seccion | Descripcion |
|---------|-------------|
| **Header** | Logo (texto o imagen), menu de navegacion con links custom, iconos de redes sociales. Sticky con efecto frosted glass (backdrop-blur). En mobile: hamburger menu con panel lateral. |
| **Carrusel** | Slides con imagen desktop/mobile independientes, titulo, subtitulo, boton CTA. Color de texto y alineacion configurables. Auto-rotacion opcional. |
| **Video** | Embed de YouTube con titulo, descripcion y CTA. |
| **Galeria** | Grid de imagenes con titulo, descripcion y CTA. |
| **Multicolumna** | Bloques con imagen, titulo, subtitulo y link. Grid responsive. |
| **Mapa** | Embed de Google Maps con soporte para multiples ubicaciones. |
| **Turnero** | Widget completo de reserva de turnos (detalle abajo). |
| **Footer** | Links de navegacion, iconos de redes sociales. |

**Tema dinamico:** 4 colores base (fondo, texto, primario, secundario) generan automaticamente todo el esquema de colores. Se inyectan como CSS variables en el `<style>` de la landing.

### Panel de admin

Accesible en `/admin/*`, protegido por middleware de autenticacion. Sidebar con dos grupos de navegacion:

**Secciones de landing:** Header, Carrusel, Video, Galeria, Multicolumna, Mapa, Footer, Estilos.

**Gestion del negocio:** Configuracion, Dashboard, Sucursales, Equipo, Clientes, Cupones, Email.

---

## Turnero (sistema de reservas)

### Flujo de reserva (publico)

El widget de booking guia al cliente paso a paso:

1. **Sucursal** (solo si hay mas de 1) — Seleccion de ubicacion
2. **Profesional** — Lista de staff activo (filtrado por sucursal si aplica). Muestra avatar y nombre. Se auto-salta si hay 1 solo profesional.
3. **Servicio** — Servicios del profesional seleccionado. Muestra nombre, descripcion, duracion y precios (efectivo/transferencia). Se auto-salta si hay 1 solo servicio.
4. **Fecha** — Calendario mensual. Solo muestra dias habiles del profesional, excluye dias libres. Respeta `advance_days` (ventana maxima) y `min_advance_hours` (anticipacion minima).
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

**Al completar:** Se registra el metodo de pago (efectivo/transferencia). Si es transferencia, el precio se recalcula con `price_transfer` del servicio. Se envia email de finalizacion al cliente.

**Al cancelar / no asistir:** Se actualizan los contadores del cliente (`cancellation_count`, `no_show_count`).

### Precios duales

Cada servicio tiene dos precios: `price_cash` (efectivo) y `price_transfer` (transferencia). El precio final se determina cuando el admin marca el turno como completado y selecciona el metodo de pago.

### Codigos de descuento

- Codigo alfanumerico, case-insensitive
- Porcentaje de descuento (1-100%)
- Limite de usos y contador
- Validacion atomica con `use_discount_code()` (previene race conditions)
- Se aplica en el paso de confirmacion de la reserva

---

## Equipo (staff)

### Gestion de profesionales

- CRUD completo con nombre, avatar (upload a Storage, max 2MB) y estado activo/inactivo
- Asignacion a sucursal (opcional)
- Marca de propietario (`is_owner`)

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
- Duracion en minutos
- Estado activo/inactivo
- Orden de visualizacion

---

## Clientes (CRM)

Los clientes se crean automaticamente al reservar un turno. Se identifican por telefono (prioridad) o email dentro del mismo negocio.

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

Vista general del negocio para el admin:

- Turnos del dia con controles de estado (completar, cancelar, no asistio)
- Proximo turno destacado
- Metricas de la semana, mes y ano
- Ingresos por metodo de pago
- Skeleton de carga durante la hidratacion

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
| `site_settings` | Config de landing (1 row por usuario, columnas JSONB por seccion) |
| `staff` | Profesionales del equipo |
| `services` | Servicios (pertenecen a staff) |
| `staff_schedules` | Horarios semanales (multiples rangos por dia) |
| `staff_time_off` | Dias libres completos |
| `staff_blocked_times` | Bloqueos parciales de horario |
| `appointments` | Turnos reservados |
| `clients` | Clientes (auto-generados con preferencias computadas) |
| `discount_codes` | Codigos de descuento |
| `branches` | Sucursales |

### Seguridad (RLS)

Todas las tablas tienen Row Level Security:

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| site_settings | owner | owner | owner | owner |
| staff, services, schedules | publico | owner | owner | owner |
| branches | publico (activas) | owner | owner | owner |
| appointments | owner | cualquiera | owner | owner |
| clients | owner | cualquiera | cualquiera | — |
| discount_codes | publico | owner | owner | owner |

### Funciones PostgreSQL

| Funcion | Descripcion |
|---------|-------------|
| `get_available_slots()` | Genera slots disponibles (inteligente, sin baches) |
| `upsert_client()` | Crea/actualiza cliente y recomputa preferencias |
| `update_client_on_status_change()` | Actualiza contadores al cambiar estado de turno |
| `use_discount_code()` | Valida y consume codigo de descuento (atomico) |
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
