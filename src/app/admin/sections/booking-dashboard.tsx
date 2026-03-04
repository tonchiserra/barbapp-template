"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { format as fnsFormat, subMonths } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Heading, Text, Button, Badge,
  Card, CardHeader, CardTitle, CardContent,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from "@/components/ui";
import { updateAppointmentStatus } from "../turnero-actions";
import type { AppointmentWithDetails, AppointmentStatus } from "@/types";

interface BookingDashboardProps {
  todayAppointments: AppointmentWithDetails[];
  nextAppointment: AppointmentWithDetails | null;
  weekCount: number;
  monthCount: number;
  monthRevenue: number;
  weekRevenue: number;
  prevWeekRevenue: number;
  prevMonthRevenue: number;
  historicalMonth: string | null;
  historicalLabel: string | null;
  historicalRevenue: number | null;
  historicalCount: number | null;
  historicalCompletedCount: number | null;
}

// ---------------------------------------------------------------------------
// Helpers
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

function calcPercentDiff(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);
}

// ---------------------------------------------------------------------------
// Metrics card
// ---------------------------------------------------------------------------

function MetricCard({ label, value, percentDiff }: { label: string; value: string | number; percentDiff?: number | null }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Text size="sm" variant="muted">{label}</Text>
        <Heading as="h3" className="mt-1 text-2xl">{value}</Heading>
        {percentDiff != null && (
          <div className={cn(
            "mt-1.5 flex items-center gap-1 text-xs font-medium",
            percentDiff > 0 && "text-emerald-600",
            percentDiff < 0 && "text-red-500",
            percentDiff === 0 && "text-muted-foreground",
          )}>
            {percentDiff > 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : percentDiff < 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            ) : null}
            <span>
              {percentDiff === 0
                ? "Sin cambios"
                : `${percentDiff > 0 ? "+" : ""}${percentDiff.toFixed(0)}% vs anterior`}
            </span>
          </div>
        )}
      </CardContent>
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
  todayAppointments,
  nextAppointment,
  weekCount,
  monthCount,
  monthRevenue,
  weekRevenue,
  prevWeekRevenue,
  prevMonthRevenue,
  historicalMonth,
  historicalLabel,
  historicalRevenue,
  historicalCount,
  historicalCompletedCount,
}: BookingDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const todayCount = todayAppointments.length;

  const monthOptions = React.useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(now, i);
      return {
        value: fnsFormat(date, "yyyy-MM"),
        label: fnsFormat(date, "MMMM yyyy", { locale: es }),
      };
    });
  }, []);

  const handleMonthChange = (value: string) => {
    router.push(`${pathname}?mes=${value}`);
  };

  return (
    <div className="space-y-8">
      {/* Metrics */}
      <div>
        <Heading as="h2" className="mb-4 text-lg">Metricas</Heading>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Turnos hoy" value={todayCount} />
          <MetricCard label="Esta semana" value={weekCount} />
          <MetricCard label="Este mes" value={monthCount} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard
            label="Ingresos semana"
            value={formatARS(weekRevenue)}
            percentDiff={calcPercentDiff(weekRevenue, prevWeekRevenue)}
          />
          <MetricCard
            label="Ingresos del mes"
            value={formatARS(monthRevenue)}
            percentDiff={calcPercentDiff(monthRevenue, prevMonthRevenue)}
          />
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

      {/* Historical */}
      <div>
        <div className="mb-4 flex items-center justify-between gap-4">
          <Heading as="h2" className="text-lg">Historico</Heading>
          <div className="w-52">
            <Select value={historicalMonth ?? ""} onValueChange={handleMonthChange}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="capitalize">{opt.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {historicalMonth && historicalRevenue != null ? (
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Turnos" value={historicalCount ?? 0} />
            <MetricCard label="Completados" value={historicalCompletedCount ?? 0} />
            <MetricCard label="Ingresos" value={formatARS(historicalRevenue)} />
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <Text variant="muted">Selecciona un mes para ver las metricas</Text>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
