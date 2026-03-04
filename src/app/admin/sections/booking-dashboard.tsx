"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Heading, Text, Input, Textarea, Switch, Button, Badge,
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  useToast,
} from "@/components/ui";
import { saveBookingSettings, updateAppointmentStatus } from "../turnero-actions";
import type { BookingSettings, AppointmentWithDetails, AppointmentStatus } from "@/types";

interface BookingDashboardProps {
  bookingSettings: BookingSettings;
  todayAppointments: AppointmentWithDetails[];
  nextAppointment: AppointmentWithDetails | null;
  weekCount: number;
  monthCount: number;
  monthRevenue: number;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistio",
};

const STATUS_VARIANTS: Record<AppointmentStatus, "default" | "secondary" | "destructive" | "outline"> = {
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "outline",
};

// ---------------------------------------------------------------------------
// Metrics cards
// ---------------------------------------------------------------------------

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Text size="sm" variant="muted">{label}</Text>
        <Heading as="h3" className="mt-1 text-2xl">{value}</Heading>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Settings form
// ---------------------------------------------------------------------------

function SettingsForm({ settings }: { settings: BookingSettings }) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [title, setTitle] = React.useState(settings.title);
  const [description, setDescription] = React.useState(settings.description);
  const [advanceDays, setAdvanceDays] = React.useState(String(settings.advance_days));
  const [minAdvanceHours, setMinAdvanceHours] = React.useState(String(settings.min_advance_hours));
  const [isVisible, setIsVisible] = React.useState(settings.is_visible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);

    const fd = new FormData();
    fd.set("title", title);
    fd.set("description", description);
    fd.set("advance_days", advanceDays);
    fd.set("min_advance_hours", minAdvanceHours);
    if (isVisible) fd.set("is_visible", "on");

    const result = await saveBookingSettings(null, fd);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
    } else {
      toast("Configuracion guardada", "success");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracion del turnero</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div>
            <Text size="sm" className="mb-1.5 font-medium">Titulo</Text>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reserva tu turno" />
          </div>
          <div>
            <Text size="sm" className="mb-1.5 font-medium">Descripcion</Text>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texto opcional debajo del titulo" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Text size="sm" className="mb-1.5 font-medium">Dias de anticipacion</Text>
              <Input type="number" min="1" max="365" value={advanceDays} onChange={(e) => setAdvanceDays(e.target.value)} />
            </div>
            <div>
              <Text size="sm" className="mb-1.5 font-medium">Horas minimas de anticipacion</Text>
              <Input type="number" min="0" max="72" value={minAdvanceHours} onChange={(e) => setMinAdvanceHours(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border px-4 py-3">
            <div>
              <Text size="sm" className="font-medium">Visible en la landing</Text>
              <Text size="sm" variant="muted">Mostrar el widget de reservas en tu pagina</Text>
            </div>
            <Switch checked={isVisible} onCheckedChange={setIsVisible} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Guardar configuracion"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Next appointment card
// ---------------------------------------------------------------------------

function NextAppointmentCard({ appointment }: { appointment: AppointmentWithDetails | null }) {
  if (!appointment) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Text variant="muted">No hay turnos proximos</Text>
        </CardContent>
      </Card>
    );
  }

  const dateStr = format(new Date(appointment.date + "T00:00:00"), "EEEE d 'de' MMMM", { locale: es });
  const timeStr = appointment.start_time.slice(0, 5);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-primary">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Proximo turno
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-baseline justify-between">
          <Heading as="h3" className="text-lg">{appointment.client_name}</Heading>
          <Badge>{timeStr}</Badge>
        </div>
        <Text size="sm" variant="muted" className="capitalize">{dateStr}</Text>
        <div className="flex items-center gap-2">
          <Text size="sm">{appointment.service_name}</Text>
          <Text size="sm" variant="muted">con</Text>
          <Text size="sm">{appointment.staff_name}</Text>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Appointment row
// ---------------------------------------------------------------------------

function AppointmentRow({ appointment }: { appointment: AppointmentWithDetails }) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState<AppointmentStatus>(appointment.status);
  const timeStr = appointment.start_time.slice(0, 5);

  const handleStatusChange = async (newStatus: AppointmentStatus) => {
    setLoading(true);
    const result = await updateAppointmentStatus(appointment.id, newStatus);
    setLoading(false);

    if (result.error) {
      toast(result.error, "error");
    } else {
      setCurrentStatus(newStatus);
      toast(`Turno ${STATUS_LABELS[newStatus].toLowerCase()}`, "success");
    }
  };

  return (
    <div className={cn(
      "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:gap-4",
      currentStatus === "cancelled" && "opacity-50",
    )}>
      {/* Time + client */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold">
          {timeStr}
        </div>
        <div className="min-w-0 flex-1">
          <Text className="truncate font-medium">{appointment.client_name}</Text>
          <Text size="sm" variant="muted" className="truncate">
            {appointment.service_name} &middot; {appointment.staff_name}
          </Text>
        </div>
        <Badge variant={STATUS_VARIANTS[currentStatus]}>
          {STATUS_LABELS[currentStatus]}
        </Badge>
      </div>

      {/* Actions */}
      {currentStatus === "confirmed" && (
        <div className="flex gap-2 sm:shrink-0">
          <Button size="sm" onClick={() => handleStatusChange("completed")} disabled={loading}>
            Completar
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleStatusChange("cancelled")} disabled={loading}>
            Cancelar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleStatusChange("no_show")} disabled={loading}>
            No asistio
          </Button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export function BookingDashboard({
  bookingSettings,
  todayAppointments,
  nextAppointment,
  weekCount,
  monthCount,
  monthRevenue,
}: BookingDashboardProps) {
  const todayCount = todayAppointments.length;
  const formattedRevenue = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(monthRevenue);

  return (
    <div className="space-y-8">
      {/* Settings */}
      <SettingsForm settings={bookingSettings} />

      {/* Metrics */}
      <div>
        <Heading as="h2" className="mb-4 text-lg">Metricas</Heading>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Turnos hoy" value={todayCount} />
          <MetricCard label="Esta semana" value={weekCount} />
          <MetricCard label="Este mes" value={monthCount} />
          <MetricCard label="Ingresos del mes" value={formattedRevenue} />
        </div>
      </div>

      {/* Next appointment */}
      <NextAppointmentCard appointment={nextAppointment} />

      {/* Today's agenda */}
      <div>
        <Heading as="h2" className="mb-4 text-lg">Agenda de hoy</Heading>
        {todayAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Text variant="muted">No hay turnos para hoy</Text>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((appt) => (
              <AppointmentRow key={appt.id} appointment={appt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
