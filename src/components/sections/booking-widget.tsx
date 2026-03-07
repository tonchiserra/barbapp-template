"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, Input, Heading, Text } from "@/components/ui";
import {
  getServicesForStaffAction,
  getAvailableSlotsAction,
  getStaffScheduleAction,
  getStaffTimeOffDatesAction,
  createAppointment,
  validateDiscountCodeAction,
} from "@/app/admin/turnero-actions";
import type { BookingSettings, StaffMember } from "@/types";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, isSameMonth,
  isSameDay, isAfter, isBefore, addDays,
} from "date-fns";
import { es } from "date-fns/locale";

type BookingStep = "staff" | "service" | "date" | "time" | "contact" | "confirm" | "success";

const STEP_LABELS = ["Profesional", "Servicio", "Fecha", "Hora", "Datos", "Confirmar"];

interface StaffService {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_transfer: number;
  price_cash: number;
}

interface BookingWidgetProps {
  settings: BookingSettings;
  staff: StaffMember[];
  userId: string;
}

export function BookingWidget({ settings, staff: initialStaff, userId }: BookingWidgetProps) {
  const [step, setStep] = React.useState<BookingStep>("staff");
  const [selectedStaff, setSelectedStaff] = React.useState<StaffMember | null>(null);
  const [staffServices, setStaffServices] = React.useState<StaffService[]>([]);
  const [selectedService, setSelectedService] = React.useState<StaffService | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");

  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [staffSchedule, setStaffSchedule] = React.useState<{ day_of_week: number; is_working: boolean }[]>([]);
  const [staffTimeOffDates, setStaffTimeOffDates] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Discount code
  const [discountCode, setDiscountCode] = React.useState("");
  const [appliedDiscount, setAppliedDiscount] = React.useState<{
    discount_code_id: string;
    discount_percent: number;
  } | null>(null);
  const [discountError, setDiscountError] = React.useState("");
  const [validatingDiscount, setValidatingDiscount] = React.useState(false);

  const stepIndex = ["staff", "service", "date", "time", "contact", "confirm"].indexOf(step);

  // Auto-select if only 1 staff member
  const autoSelected = React.useRef(false);
  React.useEffect(() => {
    if (initialStaff.length === 1 && !autoSelected.current) {
      autoSelected.current = true;
      handleSelectStaff(initialStaff[0]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Step handlers ---

  async function handleSelectStaff(member: StaffMember) {
    setSelectedStaff(member);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setLoading(true);

    const [services, schedule, timeOffDates] = await Promise.all([
      getServicesForStaffAction(member.id),
      getStaffScheduleAction(member.id),
      getStaffTimeOffDatesAction(member.id),
    ]);

    setStaffServices(services);
    setStaffSchedule(schedule);
    setStaffTimeOffDates(timeOffDates);
    setLoading(false);

    if (initialStaff.length === 1 && services.length === 1) {
      setSelectedService(services[0]);
      setStep("date");
    } else {
      setStep("service");
    }
  }

  function handleSelectService(service: StaffService) {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedTime(null);
    setStep("date");
  }

  async function handleSelectDate(date: Date) {
    setSelectedDate(date);
    setSelectedTime(null);
    if (!selectedStaff || !selectedService) return;
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const slots = await getAvailableSlotsAction(selectedStaff.id, selectedService.id, dateStr);
    setAvailableSlots(slots.map((s) => s.slot_time));
    setLoading(false);
    setStep("time");
  }

  function handleSelectTime(time: string) {
    setSelectedTime(time);
    setStep("contact");
  }

  function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("confirm");
  }

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return;
    setValidatingDiscount(true);
    setDiscountError("");
    const result = await validateDiscountCodeAction(discountCode.trim(), userId);
    setValidatingDiscount(false);
    if (result.valid) {
      setAppliedDiscount({
        discount_code_id: result.discount_code_id!,
        discount_percent: result.discount_percent!,
      });
      setDiscountError("");
    } else {
      setAppliedDiscount(null);
      setDiscountError(result.error || "Cupon invalido");
    }
  }

  function handleRemoveDiscount() {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountError("");
  }

  async function handleConfirm() {
    if (!selectedService || !selectedStaff || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError("");
    const fd = new FormData();
    fd.set("staff_id", selectedStaff.id);
    fd.set("service_id", selectedService.id);
    fd.set("date", format(selectedDate, "yyyy-MM-dd"));
    fd.set("start_time", selectedTime);
    fd.set("client_name", contactName);
    fd.set("client_phone", contactPhone);
    fd.set("client_email", contactEmail);
    if (appliedDiscount) fd.set("discount_code", discountCode.trim());
    const result = await createAppointment(fd);
    setSubmitting(false);
    if (result.success) {
      setStep("success");
    } else {
      setError(result.error || "Error al crear el turno");
    }
  }

  function handleBack() {
    const steps: BookingStep[] = ["staff", "service", "date", "time", "contact", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      // If we auto-skipped staff+service (only 1 of each), go back to staff
      if (step === "date" && initialStaff.length === 1 && staffServices.length === 1) {
        setStep("staff");
      } else if (step === "service" && initialStaff.length === 1) {
        setStep("staff");
      } else {
        setStep(steps[currentIndex - 1]);
      }
    }
  }

  function handleReset() {
    setStep("staff");
    setSelectedStaff(null);
    setStaffServices([]);
    setSelectedService(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setError("");
    setDiscountCode("");
    setAppliedDiscount(null);
    setDiscountError("");

    // Auto-select if only 1 staff
    if (initialStaff.length === 1) {
      handleSelectStaff(initialStaff[0]);
    }
  }

  if (step === "success") {
    let calendarUrl = "";
    if (selectedDate && selectedTime && selectedService) {
      const [h, m] = selectedTime.split(":").map(Number);
      const start = new Date(selectedDate);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + (selectedService.duration_minutes ?? 30) * 60_000);
      const fmt = (d: Date) =>
        `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}00`;
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: `${selectedService.name}${selectedStaff ? ` con ${selectedStaff.name}` : ""}`,
        dates: `${fmt(start)}/${fmt(end)}`,
        details: `Turno reservado: ${selectedService.name}${selectedStaff ? ` con ${selectedStaff.name}` : ""}`,
      });
      calendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
    }

    return (
      <section id="Turnero" className="flex w-full items-center justify-center py-16">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-green-600">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <Heading as="h2">¡Turno confirmado!</Heading>
          <Text variant="muted" size="lg">
            Tu turno para {selectedService?.name} con {selectedStaff?.name} el{" "}
            {selectedDate && format(selectedDate, "EEEE d 'de' MMMM", { locale: es })} a las{" "}
            {selectedTime?.slice(0, 5)} ha sido reservado.
          </Text>
          <div className="flex flex-col gap-3 sm:flex-row">
            {calendarUrl && (
              <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90"
              >
                Agregar a Google Calendar
              </a>
            )}
            <Button variant="outline" onClick={handleReset}>
              Reservar otro turno
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="Turnero" className="flex w-full items-center justify-center py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 sm:px-6 lg:px-8">
        {settings.title && (
          <Heading as="h2" className="text-center sm:text-4xl">
            {settings.title}
          </Heading>
        )}
        {settings.description && (
          <Text variant="muted" size="lg" className="max-w-xl text-center">
            {settings.description}
          </Text>
        )}

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          {STEP_LABELS.map((label, i) => (
            <React.Fragment key={label}>
              {i > 0 && <div className={cn("h-px w-4", i <= stepIndex ? "bg-primary" : "bg-border")} />}
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < stepIndex ? "bg-primary text-primary-foreground" :
                i === stepIndex ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground",
              )}>
                {i < stepIndex ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Back button */}
        {step !== "staff" && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 self-start text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Volver
          </button>
        )}

        {/* Step content */}
        <div className="w-full">
          {step === "staff" && (
            <StaffStep staff={initialStaff} onSelect={handleSelectStaff} loading={loading} />
          )}
          {step === "service" && (
            <ServiceStep services={staffServices} onSelect={handleSelectService} loading={loading} />
          )}
          {step === "date" && (
            <DateStep
              advanceDays={settings.advance_days}
              minAdvanceHours={settings.min_advance_hours}
              staffSchedule={staffSchedule}
              staffTimeOffDates={staffTimeOffDates}
              selectedDate={selectedDate}
              onSelect={handleSelectDate}
              loading={loading}
            />
          )}
          {step === "time" && (
            <TimeStep slots={availableSlots} onSelect={handleSelectTime} loading={loading} />
          )}
          {step === "contact" && (
            <ContactStep
              name={contactName}
              phone={contactPhone}
              email={contactEmail}
              onNameChange={setContactName}
              onPhoneChange={setContactPhone}
              onEmailChange={setContactEmail}
              onSubmit={handleContactSubmit}
            />
          )}
          {step === "confirm" && selectedService && (
            <ConfirmStep
              service={selectedService}
              staffName={selectedStaff!.name}
              date={selectedDate!}
              time={selectedTime!}
              name={contactName}
              phone={contactPhone}
              email={contactEmail}
              onConfirm={handleConfirm}
              submitting={submitting}
              error={error}
              discountCode={discountCode}
              discountError={discountError}
              appliedDiscount={appliedDiscount}
              validatingDiscount={validatingDiscount}
              onDiscountCodeChange={setDiscountCode}
              onApplyDiscount={handleApplyDiscount}
              onRemoveDiscount={handleRemoveDiscount}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Step: Service
// ---------------------------------------------------------------------------

function ServiceStep({ services, onSelect, loading }: {
  services: StaffService[];
  onSelect: (s: StaffService) => void;
  loading: boolean;
}) {
  if (loading) {
    return <Text variant="muted" className="text-center">Cargando servicios...</Text>;
  }

  if (services.length === 0) {
    return <Text variant="muted" className="text-center">Este profesional no tiene servicios asignados.</Text>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size="sm" variant="muted" className="text-center">Selecciona un servicio</Text>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => onSelect(service)}
            disabled={loading}
            className="flex flex-col gap-1 rounded-2xl border p-4 text-left transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          >
            <Text className="font-semibold">{service.name}</Text>
            {service.description && <Text size="sm" variant="muted">{service.description}</Text>}
            <div className="mt-1 flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <Text size="sm" className="font-semibold">${service.price_cash.toLocaleString("es-AR")}</Text>
                <Text size="sm" variant="muted">efectivo</Text>
              </div>
              {service.price_transfer !== service.price_cash && (
                <div className="flex items-center gap-2">
                  <Text size="sm" className="font-semibold">${service.price_transfer.toLocaleString("es-AR")}</Text>
                  <Text size="sm" variant="muted">transferencia</Text>
                </div>
              )}
              <Text size="sm" variant="muted">{service.duration_minutes} min</Text>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Staff
// ---------------------------------------------------------------------------

function StaffStep({ staff, onSelect, loading }: {
  staff: StaffMember[];
  onSelect: (s: StaffMember) => void;
  loading: boolean;
}) {
  if (loading) {
    return <Text variant="muted" className="text-center">Cargando profesionales...</Text>;
  }

  if (staff.length === 0) {
    return <Text variant="muted" className="text-center">No hay profesionales disponibles.</Text>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size="sm" variant="muted" className="text-center">Selecciona un profesional</Text>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {staff.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member)}
            className="flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all hover:border-primary hover:bg-primary/5"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <Text size="sm" className="font-medium">{member.name}</Text>
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Date (Calendar)
// ---------------------------------------------------------------------------

function DateStep({
  advanceDays,
  minAdvanceHours,
  staffSchedule,
  staffTimeOffDates,
  selectedDate,
  onSelect,
  loading,
}: {
  advanceDays: number;
  minAdvanceHours: number;
  staffSchedule: { day_of_week: number; is_working: boolean }[];
  staffTimeOffDates: string[];
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  loading: boolean;
}) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = addDays(today, 0);
  const maxDate = addDays(today, advanceDays);

  const timeOffSet = new Set(staffTimeOffDates);
  const workingDays = new Set(staffSchedule.filter((s) => s.is_working).map((s) => s.day_of_week));

  function isDateDisabled(date: Date): boolean {
    if (isBefore(date, minDate)) return true;
    if (isAfter(date, maxDate)) return true;
    if (!workingDays.has(date.getDay())) return true;
    if (timeOffSet.has(format(date, "yyyy-MM-dd"))) return true;
    // Check min advance hours for today
    if (isSameDay(date, today)) {
      const now = new Date();
      const hoursLeft = 24 - now.getHours() - now.getMinutes() / 60;
      if (hoursLeft < minAdvanceHours) return true;
    }
    return false;
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const canPrevMonth = isAfter(monthStart, today);
  const canNextMonth = isBefore(endOfMonth(currentMonth), maxDate);

  if (loading) {
    return <Text variant="muted" className="text-center">Cargando horarios...</Text>;
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size="sm" variant="muted" className="text-center">Selecciona una fecha</Text>
      <div className="mx-auto w-full max-w-sm">
        {/* Month navigation */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            disabled={!canPrevMonth}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <Text className="font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </Text>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            disabled={!canNextMonth}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent disabled:opacity-30"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
            <Text key={d} size="sm" variant="muted" className="py-1 font-medium">{d}</Text>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, currentMonth);
            const disabled = !inMonth || isDateDisabled(day);
            const selected = selectedDate && isSameDay(day, selectedDate);
            const isToday = isSameDay(day, today);

            return (
              <button
                key={day.toISOString()}
                onClick={() => !disabled && onSelect(day)}
                disabled={disabled}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-all",
                  disabled && "text-muted-foreground/30 cursor-not-allowed",
                  !disabled && !selected && "hover:bg-primary/10 hover:text-primary",
                  selected && "bg-primary text-primary-foreground",
                  isToday && !selected && !disabled && "ring-1 ring-primary",
                )}
              >
                {format(day, "d")}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Time
// ---------------------------------------------------------------------------

function TimeStep({ slots, onSelect, loading }: {
  slots: string[];
  onSelect: (time: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return <Text variant="muted" className="text-center">Cargando horarios disponibles...</Text>;
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Text variant="muted" className="text-center">No hay turnos disponibles para esta fecha.</Text>
        <Text size="sm" variant="muted" className="text-center">Proba seleccionando otra fecha.</Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Text size="sm" variant="muted" className="text-center">Selecciona un horario</Text>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => onSelect(slot)}
            className="rounded-xl border py-3 text-center text-sm font-semibold transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
          >
            {slot.slice(0, 5)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Contact
// ---------------------------------------------------------------------------

function ContactStep({
  name, phone, email,
  onNameChange, onPhoneChange, onEmailChange,
  onSubmit,
}: {
  name: string;
  phone: string;
  email: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Text size="sm" variant="muted" className="text-center">Ingresa tus datos de contacto</Text>
      <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <Input label="Nombre" placeholder="Tu nombre" value={name} onChange={(e) => onNameChange(e.target.value)} required />
        <Input label="Telefono" placeholder="Ej: 1155667788" type="tel" value={phone} onChange={(e) => onPhoneChange(e.target.value)} required />
        <Input label="Email (opcional)" placeholder="tu@email.com" type="email" value={email} onChange={(e) => onEmailChange(e.target.value)} />
        <Button type="submit">Continuar</Button>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step: Confirm
// ---------------------------------------------------------------------------

function ConfirmStep({
  service, staffName, date, time, name, phone, email,
  onConfirm, submitting, error,
  discountCode, discountError, appliedDiscount, validatingDiscount,
  onDiscountCodeChange, onApplyDiscount, onRemoveDiscount,
}: {
  service: StaffService;
  staffName: string;
  date: Date;
  time: string;
  name: string;
  phone: string;
  email: string;
  onConfirm: () => void;
  submitting: boolean;
  error: string;
  discountCode: string;
  discountError: string;
  appliedDiscount: { discount_code_id: string; discount_percent: number } | null;
  validatingDiscount: boolean;
  onDiscountCodeChange: (v: string) => void;
  onApplyDiscount: () => void;
  onRemoveDiscount: () => void;
}) {
  const discountMult = appliedDiscount ? (1 - appliedDiscount.discount_percent / 100) : 1;
  const applyDisc = (p: number) => Math.round(p * discountMult * 100) / 100;

  return (
    <div className="flex flex-col gap-4">
      <Text size="sm" variant="muted" className="text-center">Confirma tu turno</Text>
      <div className="mx-auto w-full max-w-sm rounded-2xl border p-5">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Servicio</Text>
            <Text size="sm" className="font-medium">{service.name}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Profesional</Text>
            <Text size="sm" className="font-medium">{staffName}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Fecha</Text>
            <Text size="sm" className="font-medium capitalize">
              {format(date, "EEEE d 'de' MMMM", { locale: es })}
            </Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Hora</Text>
            <Text size="sm" className="font-medium">{time.slice(0, 5)}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Duracion</Text>
            <Text size="sm" className="font-medium">{service.duration_minutes} min</Text>
          </div>
          <div className="my-1 h-px bg-border" />

          {/* Discount code */}
          <div className="flex flex-col gap-2">
            <Text size="sm" variant="muted">Cupon de descuento</Text>
            {appliedDiscount ? (
              <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-600">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  <Text size="sm" className="font-medium text-green-700">
                    {discountCode.toUpperCase()} (-{appliedDiscount.discount_percent}%)
                  </Text>
                </div>
                <button
                  type="button"
                  onClick={onRemoveDiscount}
                  className="text-sm font-medium text-red-500 hover:text-red-700"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Ingresa tu codigo"
                  value={discountCode}
                  onChange={(e) => onDiscountCodeChange(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onApplyDiscount}
                  disabled={validatingDiscount || !discountCode.trim()}
                >
                  {validatingDiscount ? "..." : "Aplicar"}
                </Button>
              </div>
            )}
            {discountError && (
              <Text size="sm" className="text-red-500">{discountError}</Text>
            )}
          </div>

          <div className="my-1 h-px bg-border" />

          {/* Prices */}
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Efectivo</Text>
            <div className="flex items-center gap-2">
              {appliedDiscount && (
                <Text size="sm" variant="muted" className="line-through">
                  ${service.price_cash.toLocaleString("es-AR")}
                </Text>
              )}
              <Text className="font-semibold">${applyDisc(service.price_cash).toLocaleString("es-AR")}</Text>
            </div>
          </div>
          {service.price_transfer !== service.price_cash && (
            <div className="flex justify-between">
              <Text size="sm" variant="muted">Transferencia</Text>
              <div className="flex items-center gap-2">
                {appliedDiscount && (
                  <Text size="sm" variant="muted" className="line-through">
                    ${service.price_transfer.toLocaleString("es-AR")}
                  </Text>
                )}
                <Text className="font-semibold">${applyDisc(service.price_transfer).toLocaleString("es-AR")}</Text>
              </div>
            </div>
          )}

          <div className="my-1 h-px bg-border" />
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Nombre</Text>
            <Text size="sm" className="font-medium">{name}</Text>
          </div>
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Telefono</Text>
            <Text size="sm" className="font-medium">{phone}</Text>
          </div>
          {email && (
            <div className="flex justify-between">
              <Text size="sm" variant="muted">Email</Text>
              <Text size="sm" className="font-medium">{email}</Text>
            </div>
          )}
        </div>
      </div>
      {error && (
        <Text variant="destructive" size="sm" className="text-center">{error}</Text>
      )}
      <Button onClick={onConfirm} disabled={submitting} size="lg" className="mx-auto max-w-sm">
        {submitting ? "Reservando..." : "Confirmar turno"}
      </Button>
    </div>
  );
}
