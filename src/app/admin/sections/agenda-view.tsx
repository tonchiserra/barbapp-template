"use client";

import * as React from "react";
import { format as fnsFormat, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Heading, Text, Button, Badge, Input,
  Card, CardHeader, CardTitle, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  useToast,
} from "@/components/ui";
import { useStaffFilters, StaffFilterBar } from "./staff-filters";
import { updateAppointmentStatus, rescheduleAppointment, getServicesForStaffAction, getAvailableSlotsAction } from "../turnero-actions";
import type { AppointmentWithDetails, AppointmentStatus, PaymentMethod, StaffMember, Branch } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistio",
};

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);
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

  const dateStr = fnsFormat(new Date(appointment.date + "T00:00:00"), "EEEE d 'de' MMMM", { locale: es });
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

      {/* Complete dialog */}
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

      {/* Cancel dialog */}
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

      {/* No-show dialog */}
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

      {/* Edit dialog */}
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
// Agenda view (main export)
// ---------------------------------------------------------------------------

interface AgendaViewProps {
  appointments: AppointmentWithDetails[];
  staff: StaffMember[];
  branches: Branch[];
  showBranchFilter: boolean;
  todayStr: string;
}

export function AgendaView({ appointments, staff, branches, showBranchFilter, todayStr }: AgendaViewProps) {
  const [selectedDay, setSelectedDay] = React.useState(todayStr);
  const {
    selectedBranchId, selectedStaffId, setSelectedStaffId,
    visibleStaff, handleBranchChange, byFilters,
  } = useStaffFilters(staff);

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

  const filteredByStaff = byFilters(appointments);
  const dayAppointments = filteredByStaff.filter((a) => a.date === selectedDay);

  const filteredNextAppointment = React.useMemo(() => {
    const now = new Date();
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:00`;
    return filteredByStaff.find((a) =>
      a.status === "confirmed" && (a.date > todayStr || (a.date === todayStr && a.start_time >= nowTime)),
    ) ?? null;
  }, [filteredByStaff, todayStr]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <StaffFilterBar
        branches={branches}
        showBranchFilter={showBranchFilter}
        selectedBranchId={selectedBranchId}
        selectedStaffId={selectedStaffId}
        visibleStaff={visibleStaff}
        onBranchChange={handleBranchChange}
        onStaffChange={setSelectedStaffId}
      />

      {/* Next appointment */}
      <NextAppointmentCard appointment={filteredNextAppointment} />

      {/* Day tabs */}
      <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(40px, 1fr))" }}>
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
  );
}
