"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { format as fnsFormat, subMonths, addDays } from "date-fns";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Heading, Text, Button, Badge, Input,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from "@/components/ui";
import { updateAppointmentStatus, rescheduleAppointment, getServicesForStaffAction, getAvailableSlotsAction } from "../turnero-actions";
import type { Appointment, AppointmentWithDetails, AppointmentStatus, PaymentMethod, StaffMember, Branch } from "@/types";

interface BookingDashboardProps {
  upcomingAppointments: AppointmentWithDetails[];
  weekAppointments: Appointment[];
  monthAppointments: Appointment[];
  prevWeekAppointments: Appointment[];
  prevMonthAppointments: Appointment[];
  historicalAppointments: Appointment[] | null;
  staff: StaffMember[];
  branches: Branch[];
  showBranchFilter: boolean;
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
  const [cancelDialogOpen, setCancelDialogOpen] = React.useState(false);
  const [noShowDialogOpen, setNoShowDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editServices, setEditServices] = React.useState<{ id: string; name: string; duration_minutes: number; price_cash: number; price_transfer: number }[]>([]);
  const [editServiceId, setEditServiceId] = React.useState(appointment.service_id);
  const [editDate, setEditDate] = React.useState(appointment.date);
  const [editSlots, setEditSlots] = React.useState<string[]>([]);
  const [editTime, setEditTime] = React.useState(appointment.start_time.slice(0, 5));
  const [editLoadingSlots, setEditLoadingSlots] = React.useState(false);
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

  const handleOpenEdit = async () => {
    setEditDialogOpen(true);
    setEditServiceId(appointment.service_id);
    setEditDate(appointment.date);
    setEditTime(appointment.start_time.slice(0, 5));
    const services = await getServicesForStaffAction(appointment.staff_id);
    setEditServices(services);
    // Load slots for current date/service
    const slots = await getAvailableSlotsAction(appointment.staff_id, appointment.service_id, appointment.date);
    setEditSlots(slots.map((s) => s.slot_time.slice(0, 5)));
  };

  const handleEditDateOrServiceChange = async (newServiceId: string, newDate: string) => {
    setEditServiceId(newServiceId);
    setEditDate(newDate);
    setEditTime("");
    setEditSlots([]);
    if (!newDate) return;
    setEditLoadingSlots(true);
    const slots = await getAvailableSlotsAction(appointment.staff_id, newServiceId, newDate);
    setEditSlots(slots.map((s) => s.slot_time.slice(0, 5)));
    setEditLoadingSlots(false);
  };

  const handleSaveEdit = async () => {
    if (!editServiceId || !editDate || !editTime) return;
    setLoading(true);
    const result = await rescheduleAppointment(appointment.id, editServiceId, editDate, `${editTime}:00`);
    setLoading(false);
    if (result.error) {
      toast(result.error, "error");
    } else {
      toast("Turno modificado", "success");
      setEditDialogOpen(false);
      // Reload page to reflect changes
      window.location.reload();
    }
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
            <Button size="sm" variant="outline" onClick={handleOpenEdit} disabled={loading}>
              Editar
            </Button>
            <Button size="sm" variant="outline" onClick={() => setCancelDialogOpen(true)} disabled={loading}>
              Cancelar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setNoShowDialogOpen(true)} disabled={loading}>
              No asistio
            </Button>
          </>
        )}
        {(currentStatus === "cancelled" || currentStatus === "no_show") && (
          <Button size="sm" variant="outline" onClick={() => handleStatusChange("confirmed")} disabled={loading}>
            Revertir
          </Button>
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

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar turno</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que queres cancelar el turno de {appointment.client_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>Volver</Button>
            <Button variant="destructive" onClick={() => { setCancelDialogOpen(false); handleStatusChange("cancelled"); }} disabled={loading}>
              Cancelar turno
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* No-show confirmation dialog */}
      <Dialog open={noShowDialogOpen} onOpenChange={setNoShowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar como no asistio</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que {appointment.client_name} no asistio?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoShowDialogOpen(false)}>Volver</Button>
            <Button variant="destructive" onClick={() => { setNoShowDialogOpen(false); handleStatusChange("no_show"); }} disabled={loading}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog: change service, date, time */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modificar turno</DialogTitle>
            <DialogDescription>Turno de {appointment.client_name}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {editServices.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <Text size="sm" className="font-medium">Servicio</Text>
                <Select
                  value={editServiceId}
                  onValueChange={(v) => handleEditDateOrServiceChange(v, editDate)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {editServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Input
              label="Fecha"
              type="date"
              value={editDate}
              onChange={(e) => handleEditDateOrServiceChange(editServiceId, e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <Text size="sm" className="font-medium">Horario</Text>
              {editLoadingSlots ? (
                <Text size="sm" variant="muted">Cargando horarios...</Text>
              ) : editSlots.length === 0 ? (
                <Text size="sm" variant="muted">No hay horarios disponibles para esta fecha</Text>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {editSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setEditTime(slot)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                        editTime === slot
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-accent",
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button onClick={handleSaveEdit} disabled={loading || !editTime}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Caja (staff commission breakdown)
// ---------------------------------------------------------------------------

type CajaPeriod = "today" | "week" | "month";

function CajaSection({
  staff,
  todayAppointments,
  weekAppointments,
  monthAppointments,
}: {
  staff: StaffMember[];
  todayAppointments: { staff_id: string; price: number; payment_method: PaymentMethod | null }[];
  weekAppointments: { staff_id: string; price: number; payment_method: PaymentMethod | null }[];
  monthAppointments: { staff_id: string; price: number; payment_method: PaymentMethod | null }[];
}) {
  const [period, setPeriod] = React.useState<CajaPeriod>("today");

  const appointments = period === "today" ? todayAppointments : period === "week" ? weekAppointments : monthAppointments;

  // Group by staff
  const staffMap = new Map(staff.map((s) => [s.id, s]));

  const rows = React.useMemo(() => {
    const grouped = new Map<string, { count: number; revenue: number; cash: number; transfer: number }>();

    for (const appt of appointments) {
      const existing = grouped.get(appt.staff_id) ?? { count: 0, revenue: 0, cash: 0, transfer: 0 };
      const price = Number(appt.price);
      existing.count += 1;
      existing.revenue += price;
      if (appt.payment_method === "cash") existing.cash += price;
      else if (appt.payment_method === "transfer") existing.transfer += price;
      grouped.set(appt.staff_id, existing);
    }

    return Array.from(grouped.entries())
      .map(([staffId, data]) => {
        const member = staffMap.get(staffId);
        const commission = Math.round(data.revenue * (member?.commission_percent ?? 0) / 100);
        return {
          staffId,
          name: member?.name ?? "—",
          percent: member?.commission_percent ?? 0,
          ...data,
          commission,
          net: data.revenue - commission,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [appointments, staffMap]);

  const totals = React.useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        count: acc.count + r.count,
        revenue: acc.revenue + r.revenue,
        cash: acc.cash + r.cash,
        transfer: acc.transfer + r.transfer,
        commission: acc.commission + r.commission,
        net: acc.net + r.net,
      }),
      { count: 0, revenue: 0, cash: 0, transfer: 0, commission: 0, net: 0 },
    );
  }, [rows]);

  const periodLabels: Record<CajaPeriod, string> = { today: "Hoy", week: "Semana", month: "Mes" };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Heading as="h2" className="text-lg">Caja</Heading>
        <div className="flex gap-1 rounded-xl bg-accent p-1">
          {(["today", "week", "month"] as CajaPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Text variant="muted">No hay turnos completados</Text>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Empleado</th>
                    <th className="px-4 py-3 font-medium text-right">Turnos</th>
                    <th className="px-4 py-3 font-medium text-right">Efectivo</th>
                    <th className="px-4 py-3 font-medium text-right">Transf.</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Comision</th>
                    <th className="px-4 py-3 font-medium text-right">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.staffId} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium">{r.name}</span>
                        <span className="ml-1.5 text-muted-foreground">({r.percent}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right">{r.count}</td>
                      <td className="px-4 py-3 text-right">{formatARS(r.cash)}</td>
                      <td className="px-4 py-3 text-right">{formatARS(r.transfer)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatARS(r.revenue)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{formatARS(r.commission)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatARS(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-accent/50 font-medium">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{totals.count}</td>
                    <td className="px-4 py-3 text-right">{formatARS(totals.cash)}</td>
                    <td className="px-4 py-3 text-right">{formatARS(totals.transfer)}</td>
                    <td className="px-4 py-3 text-right">{formatARS(totals.revenue)}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{formatARS(totals.commission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatARS(totals.net)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
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
  branches,
  showBranchFilter,
  todayStr,
  historicalMonth,
  historicalLabel,
}: BookingDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [selectedDay, setSelectedDay] = React.useState(todayStr);
  const [selectedBranchId, setSelectedBranchId] = React.useState("all");
  const [selectedStaffId, setSelectedStaffId] = React.useState("all");

  // Staff visible in the staff dropdown (filtered by branch)
  const visibleStaff = React.useMemo(
    () => selectedBranchId === "all" ? staff : staff.filter((s) => s.branch_id === selectedBranchId),
    [staff, selectedBranchId],
  );

  // Reset staff filter when branch changes
  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value);
    setSelectedStaffId("all");
  };

  // Combined filter: branch + staff
  const byFilters = React.useCallback(
    <T extends { staff_id: string }>(arr: T[]) => {
      let filtered = arr;
      if (selectedBranchId !== "all") {
        const branchStaffIds = new Set(staff.filter((s) => s.branch_id === selectedBranchId).map((s) => s.id));
        filtered = filtered.filter((a) => branchStaffIds.has(a.staff_id));
      }
      if (selectedStaffId !== "all") {
        filtered = filtered.filter((a) => a.staff_id === selectedStaffId);
      }
      return filtered;
    },
    [selectedBranchId, selectedStaffId, staff],
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

  // Filter agenda appointments
  const filteredByStaff = byFilters(upcomingAppointments);
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
  const todayFiltered = byFilters(upcomingAppointments).filter((a) => a.date === todayStr);
  const todayCount = todayFiltered.length;
  const todayRevenue = todayFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const weekFiltered = byFilters(weekAppointments);
  const weekCount = weekFiltered.filter((a) => activeStatuses.includes(a.status)).length;
  const weekRevenue = weekFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const monthFiltered = byFilters(monthAppointments);
  const monthCount = monthFiltered.filter((a) => activeStatuses.includes(a.status)).length;
  const monthRevenue = monthFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const prevWeekRevenue = byFilters(prevWeekAppointments)
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);
  const prevMonthRevenue = byFilters(prevMonthAppointments)
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);

  // Historical metrics (filtered by staff)
  const historicalMetrics = React.useMemo(() => {
    if (!historicalAppointments) return null;
    const filtered = byFilters(historicalAppointments);
    const active = filtered.filter((a) => activeStatuses.includes(a.status));
    const completed = filtered.filter((a) => a.status === "completed");
    return {
      count: active.length,
      completedCount: completed.length,
      revenue: completed.reduce((sum, a) => sum + Number(a.price), 0),
    };
  }, [historicalAppointments, byFilters]);

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
      {/* Filters */}
      {(showBranchFilter || staff.length > 1) && (
        <div className="flex flex-wrap items-center gap-3">
          <Text size="sm" variant="muted">Filtrar por:</Text>
          {showBranchFilter && branches.length > 1 && (
            <div className="w-56">
              <Select value={selectedBranchId} onValueChange={handleBranchChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sucursales</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {visibleStaff.length > 1 && (
            <div className="w-52">
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {visibleStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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
        <div className="mt-3 grid grid-cols-3 gap-3">
          <MetricCard label="Ingresos hoy" value={formatARS(todayRevenue)} />
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

      {/* Caja */}
      <CajaSection
        staff={staff}
        todayAppointments={byFilters(upcomingAppointments).filter((a) => a.date === todayStr && a.status === "completed")}
        weekAppointments={byFilters(weekAppointments).filter((a) => a.status === "completed")}
        monthAppointments={byFilters(monthAppointments).filter((a) => a.status === "completed")}
      />

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
