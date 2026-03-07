"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { format as fnsFormat, subMonths, addDays } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Heading, Text, Button, Badge,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from "@/components/ui";
import { updateAppointmentStatus } from "../turnero-actions";
import type { Appointment, AppointmentWithDetails, AppointmentStatus, PaymentMethod, StaffMember } from "@/types";

interface BookingDashboardProps {
  upcomingAppointments: AppointmentWithDetails[];
  weekAppointments: Appointment[];
  monthAppointments: Appointment[];
  prevWeekAppointments: Appointment[];
  prevMonthAppointments: Appointment[];
  historicalAppointments: Appointment[] | null;
  staff: StaffMember[];
  todayStr: string;
  historicalMonth: string | null;
  historicalLabel: string | null;
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
  const [currentPrice, setCurrentPrice] = React.useState(Number(appointment.price));
  const [currentPaymentMethod, setCurrentPaymentMethod] = React.useState<PaymentMethod | null>(appointment.payment_method);
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const timeStr = appointment.start_time.slice(0, 5);

  const discountMult = appointment.discount_percent > 0 ? (1 - appointment.discount_percent / 100) : 1;
  const cashPrice = Math.round(Number(appointment.service_price_transfer) * discountMult * 100) / 100 !== Number(appointment.price)
    ? Number(appointment.price)
    : Number(appointment.price);
  const transferPrice = Math.round(Number(appointment.service_price_transfer) * discountMult * 100) / 100;
  const pricesDiffer = transferPrice !== cashPrice;

  const handleStatusChange = async (newStatus: AppointmentStatus, paymentMethod?: PaymentMethod) => {
    setLoading(true);
    const result = await updateAppointmentStatus(appointment.id, newStatus, paymentMethod);
    setLoading(false);

    if (result.error) {
      toast(result.error, "error");
    } else {
      setCurrentStatus(newStatus);
      if (paymentMethod) {
        setCurrentPaymentMethod(paymentMethod);
        setCurrentPrice(paymentMethod === "transfer" ? transferPrice : cashPrice);
      }
      toast(`Turno ${STATUS_LABELS[newStatus].toLowerCase()}`, "success");
    }
  };

  const handleComplete = (paymentMethod: PaymentMethod) => {
    setCompleteDialogOpen(false);
    handleStatusChange("completed", paymentMethod);
  };

  return (
    <div className={cn(
      "space-y-3 rounded-xl border p-4",
      currentStatus === "cancelled" && "opacity-50",
    )}>
      {/* Row 1: time + client + price */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-max px-2 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-semibold">
          {timeStr}
        </div>
        <Text className="min-w-0 flex-1 truncate font-medium">{appointment.client_name}</Text>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {appointment.discount_percent > 0 && (
            <Badge variant="secondary">-{appointment.discount_percent}%</Badge>
          )}
          {currentStatus === "completed" && currentPaymentMethod ? (
            <div className="flex items-center gap-1.5">
              <Text size="sm" className="font-semibold">{formatARS(currentPrice)}</Text>
              <Text size="sm" variant="muted">{currentPaymentMethod === "transfer" ? "transf." : "efec."}</Text>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Text size="sm" className="font-semibold">{formatARS(cashPrice)}</Text>
                <Text size="sm" variant="muted">efec.</Text>
              </div>
              {pricesDiffer && (
                <div className="flex items-center gap-1.5">
                  <Text size="sm" className="font-semibold">{formatARS(transferPrice)}</Text>
                  <Text size="sm" variant="muted">transf.</Text>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Row 2: service · staff + status + actions */}
      <div className="flex items-center gap-2">
        <Text size="sm" variant="muted" className="min-w-0 flex-1 truncate">
          {appointment.service_name} &middot; {appointment.staff_name}
        </Text>
        <Badge variant="secondary">
          {STATUS_LABELS[currentStatus]}
        </Badge>
        {currentStatus === "confirmed" && (
          <>
            <Button size="sm" onClick={() => setCompleteDialogOpen(true)} disabled={loading}>
              Completar
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleStatusChange("cancelled")} disabled={loading}>
              Cancelar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleStatusChange("no_show")} disabled={loading}>
              No asistio
            </Button>
          </>
        )}
      </div>

      {/* Complete dialog: ask payment method */}
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Metodo de pago</DialogTitle>
            <DialogDescription>¿Como pago {appointment.client_name}?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button onClick={() => handleComplete("cash")} disabled={loading}>
              Efectivo — {formatARS(cashPrice)}
            </Button>
            <Button variant="outline" onClick={() => handleComplete("transfer")} disabled={loading}>
              Transferencia — {formatARS(transferPrice)}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export function BookingDashboard({
  upcomingAppointments,
  weekAppointments,
  monthAppointments,
  prevWeekAppointments,
  prevMonthAppointments,
  historicalAppointments,
  staff,
  todayStr,
  historicalMonth,
  historicalLabel,
}: BookingDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedDay, setSelectedDay] = React.useState(todayStr);
  const [selectedStaffId, setSelectedStaffId] = React.useState("all");

  // Staff filter helper
  const byStaff = React.useCallback(
    <T extends { staff_id: string }>(arr: T[]) =>
      selectedStaffId === "all" ? arr : arr.filter((a) => a.staff_id === selectedStaffId),
    [selectedStaffId],
  );

  const activeStatuses = ["confirmed", "completed"];

  // Build 7-day tabs
  const days = React.useMemo(() => {
    const today = new Date(todayStr + "T00:00:00");
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      const dateStr = fnsFormat(date, "yyyy-MM-dd");
      return {
        dateStr,
        label: i === 0 ? "Hoy" : fnsFormat(date, "EEE d", { locale: es }),
        isToday: i === 0,
      };
    });
  }, [todayStr]);

  // Filter agenda appointments by staff
  const filteredByStaff = byStaff(upcomingAppointments);
  const dayAppointments = filteredByStaff.filter((a) => a.date === selectedDay);

  // Next appointment (respects staff filter)
  const filteredNextAppointment = React.useMemo(() => {
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    return filteredByStaff.find((a) =>
      a.status === "confirmed" && (a.date > todayStr || (a.date === todayStr && a.start_time >= nowTime)),
    ) ?? null;
  }, [filteredByStaff, todayStr]);

  // Metrics (all filtered by staff)
  const todayCount = byStaff(upcomingAppointments).filter((a) => a.date === todayStr).length;

  const weekFiltered = byStaff(weekAppointments);
  const weekCount = weekFiltered.filter((a) => activeStatuses.includes(a.status)).length;
  const weekRevenue = weekFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const monthFiltered = byStaff(monthAppointments);
  const monthCount = monthFiltered.filter((a) => activeStatuses.includes(a.status)).length;
  const monthRevenue = monthFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const prevWeekRevenue = byStaff(prevWeekAppointments)
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);
  const prevMonthRevenue = byStaff(prevMonthAppointments)
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);

  // Historical metrics (filtered by staff)
  const historicalMetrics = React.useMemo(() => {
    if (!historicalAppointments) return null;
    const filtered = byStaff(historicalAppointments);
    const active = filtered.filter((a) => activeStatuses.includes(a.status));
    const completed = filtered.filter((a) => a.status === "completed");
    return {
      count: active.length,
      completedCount: completed.length,
      revenue: completed.reduce((sum, a) => sum + Number(a.price), 0),
    };
  }, [historicalAppointments, byStaff]);

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
      {/* Staff filter */}
      {staff.length > 1 && (
        <div className="flex items-center gap-3">
          <Text size="sm" variant="muted">Filtrar por:</Text>
          <div className="w-44">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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

      {/* 7-day agenda */}
      <div>
        <Heading as="h2" className="mb-4 text-lg">Agenda</Heading>

        {/* Next appointment */}
        <NextAppointmentCard appointment={filteredNextAppointment} />

        {/* Day tabs */}
        <div className="mt-4 mb-4 grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))" }}>
          {days.map((day) => (
            <button
              key={day.dateStr}
              onClick={() => setSelectedDay(day.dateStr)}
              className={cn(
                "flex shrink-0 flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                selectedDay === day.dateStr
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:bg-accent/80",
              )}
            >
              <span className="capitalize">{day.label}</span>
            </button>
          ))}
        </div>

        {/* Appointment list */}
        {dayAppointments.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Text variant="muted">No hay turnos para este dia</Text>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appt) => (
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

        {historicalMonth && historicalMetrics ? (
          <div className="grid grid-cols-3 gap-3">
            <MetricCard label="Turnos" value={historicalMetrics.count} />
            <MetricCard label="Completados" value={historicalMetrics.completedCount} />
            <MetricCard label="Ingresos" value={formatARS(historicalMetrics.revenue)} />
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
