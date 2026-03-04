# Barbapp

Plataforma para barberos y peluqueros. Cada profesional crea su cuenta y personaliza su landing page publica con sistema de turnos integrado.

## Stack

- **Framework:** Next.js 16 (App Router, `src/` dir)
- **UI:** Tailwind CSS v4 + Radix UI (sin shadcn)
- **Auth/DB:** Supabase (auth SSR con cookies, PostgreSQL, Storage)
- **Email:** Resend
- **Deploy:** Vercel
- **Lenguaje:** TypeScript strict

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
3. Correr las migraciones en orden desde `supabase/migrations/` en el **SQL Editor** de Supabase:
   - `00001_create_site_settings.sql` — Tabla principal de configuracion
   - `00002_create_storage_bucket.sql` — Bucket de imagenes
   - `00003` a `00007` — Columnas JSONB (footer, carousel, video, gallery, multicolumn)
   - `00008_create_booking_tables.sql` — Servicios, staff, horarios, turnos
   - `00009_staff_blocked_times_and_slot_validation.sql` — Bloqueos de horarios
   - `00010_create_clients_table.sql` — Tabla de clientes
   - `00011_add_map_column.sql` — Seccion de mapa
   - `00012_add_theme_column.sql` — Colores del tema
   - `00013_add_email_column.sql` — Plantilla de email
4. En **Authentication > Providers** habilitar Email (y opcionalmente OAuth)

### 3. Resend

1. Crear cuenta en [resend.com](https://resend.com)
2. Copiar la API key
3. (Opcional) Verificar un dominio propio para enviar desde tu email

### 4. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

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

## Estructura

```
src/
├── app/
│   ├── page.tsx                  # Landing page publica
│   ├── layout.tsx                # Root layout (metadata, viewport)
│   ├── globals.css               # Tailwind v4, design tokens
│   ├── login/                    # Login (email + password)
│   ├── registro/                 # Registro
│   ├── auth/callback/            # OAuth callback
│   ├── ui-kit/                   # Referencia visual de componentes
│   └── admin/                    # Panel de administracion (protegido)
│       ├── dashboard/            # Metricas y agenda del dia
│       ├── header/               # Configuracion del header
│       ├── footer/               # Configuracion del footer
│       ├── carousel/             # Carrusel de imagenes
│       ├── video/                # Video de YouTube
│       ├── gallery/              # Galeria de imagenes
│       ├── multicolumn/          # Bloques multicolumna
│       ├── mapa/                 # Ubicaciones
│       ├── estilos/              # Colores del tema
│       ├── email/                # Plantilla del email
│       ├── servicios/            # ABM de servicios
│       ├── equipo/               # ABM de staff + horarios
│       ├── clientes/             # Listado de clientes + export CSV
│       └── configuracion/        # Config general del turnero
│
├── components/
│   ├── ui/                       # UI Kit (Button, Input, Dialog, etc.)
│   ├── sections/                 # Secciones de la landing page
│   └── icons/                    # Iconos de redes sociales
│
├── lib/
│   ├── utils.ts                  # cn(), hexToHsl, luminance
│   ├── email.ts                  # Envio de emails con Resend
│   ├── theme.ts                  # Generador de CSS de tema
│   ├── storage.ts                # Upload/delete a Supabase Storage
│   ├── supabase/                 # Clientes Supabase (client, server, middleware)
│   └── queries/                  # Data access (site-settings, services, staff, appointments, clients)
│
├── types/
│   └── index.ts                  # Interfaces y defaults
│
└── middleware.ts                 # Auth guard para /admin/*
```

## Funcionalidades

### Landing page publica

- **Header** — Logo (texto o imagen), menu de navegacion, redes sociales, sticky con blur
- **Carrusel** — Slides con imagen desktop/mobile, texto, CTA, auto-rotacion
- **Video** — Embed de YouTube
- **Galeria** — Grid de imagenes
- **Multicolumna** — Bloques con imagen, titulo y link
- **Mapa** — Ubicaciones con Google Maps embed
- **Turnero** — Widget de reserva de turnos (servicio > profesional > fecha > hora > datos)
- **Footer** — Links y redes sociales
- **Tema custom** — Colores personalizables por admin (inyectados como CSS variables)

### Panel de admin

- **Dashboard** — Turnos del dia, proximo turno, metricas (semana/mes/ano), ingresos
- **Secciones de landing** — Cada seccion se edita individualmente con vista previa
- **Servicios** — CRUD con precio, duracion y orden
- **Equipo** — Staff con avatar, horarios semanales, bloqueos de horarios, dias libres
- **Clientes** — Listado paginado con dia frecuente, export a CSV
- **Estilos** — 4 colores base que generan todo el tema (fondo, texto, primario, secundario)
- **Email** — Plantilla personalizable con variables ({nombre}, {servicio}, {profesional}, {fecha}, {hora})
- **Configuracion** — Dias de anticipacion, horas minimas de anticipacion

### Turnero

- Seleccion de servicio > profesional > fecha > hora > datos del cliente
- Calculo de disponibilidad en tiempo real (horarios, bloqueos, turnos existentes)
- Email automatico al completar un turno (via Resend)
- Link a Google Calendar en la confirmacion
- Estados: confirmado, completado, cancelado, no asistio

## Base de datos

Tabla principal `site_settings` con una row por usuario y columnas JSONB por seccion. Tablas adicionales para el turnero:

| Tabla | Descripcion |
|-------|-------------|
| `site_settings` | Config de landing (header, footer, carousel, etc.) |
| `services` | Catalogo de servicios |
| `staff` | Miembros del equipo |
| `staff_services` | Relacion staff-servicio con overrides de precio/duracion |
| `staff_schedules` | Horario semanal por staff |
| `staff_time_off` | Dias libres |
| `staff_blocked_times` | Bloqueos parciales de horario |
| `appointments` | Turnos reservados |
| `clients` | Clientes (auto-generados al reservar) |

RLS habilitado: lectura publica, escritura solo para el owner.

## UI Kit

Componentes custom sobre Radix UI con estilo iOS:

**Server:** Button, LinkButton, Heading, Text, Link, Badge, Separator, Card (compound)

**Client:** Input, Textarea, Select, Checkbox, Switch, Dialog, ImageUpload, Toast

Referencia visual en `/ui-kit`.

## Scripts

```bash
npm run dev       # Desarrollo
npm run build     # Build de produccion
npm start         # Correr build
npm run lint      # Linting
```
