"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button, Input, Heading, Text } from "@/components/ui";
import {
  getStaffForServiceAction,
  getAvailableSlotsAction,
  getStaffScheduleAction,
  getStaffTimeOffDatesAction,
  createAppointment,
} from "@/app/admin/turnero-actions";
import type { BookingSettings, Service, StaffMember } from "@/types";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, addMonths, isSameMonth,
  isSameDay, isAfter, isBefore, addDays,
} from "date-fns";
import { es } from "date-fns/locale";

type BookingStep = "service" | "staff" | "date" | "time" | "contact" | "confirm" | "success";

const STEP_LABELS = ["Servicio", "Profesional", "Fecha", "Hora", "Datos", "Confirmar"];

interface BookingWidgetProps {
  settings: BookingSettings;
  services: Service[];
  staff: StaffMember[];
  userId: string;
}

export function BookingWidget({ settings, services, staff: initialStaff }: BookingWidgetProps) {
  const [step, setStep] = React.useState<BookingStep>("service");
  const [selectedService, setSelectedService] = React.useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = React.useState<{ id: string; name: string; avatar_url: string } | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [contactName, setContactName] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactEmail, setContactEmail] = React.useState("");

  const [availableStaff, setAvailableStaff] = React.useState<{ id: string; name: string; avatar_url: string }[]>([]);
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [staffSchedule, setStaffSchedule] = React.useState<{ day_of_week: number; is_working: boolean }[]>([]);
  const [staffTimeOffDates, setStaffTimeOffDates] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  const stepIndex = ["service", "staff", "date", "time", "contact", "confirm"].indexOf(step);

  // --- Step handlers ---

  async function handleSelectService(service: Service) {
    setSelectedService(service);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setLoading(true);
    const staffList = await getStaffForServiceAction(service.id);
    setAvailableStaff(staffList);
    setLoading(false);

    if (staffList.length === 1) {
      await handleSelectStaff(staffList[0]);
    } else {
      setStep("staff");
    }
  }

  async function handleSelectStaff(member: { id: string; name: string; avatar_url: string }) {
    setSelectedStaff(member);
    setSelectedDate(null);
    setSelectedTime(null);
    setLoading(true);
    const [schedule, timeOffDates] = await Promise.all([
      getStaffScheduleAction(member.id),
      getStaffTimeOffDatesAction(member.id),
    ]);
    setStaffSchedule(schedule);
    setStaffTimeOffDates(timeOffDates);
    setLoading(false);
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
    const result = await createAppointment(fd);
    setSubmitting(false);
    if (result.success) {
      setStep("success");
    } else {
      setError(result.error || "Error al crear el turno");
    }
  }

  function handleBack() {
    const steps: BookingStep[] = ["service", "staff", "date", "time", "contact", "confirm"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      // If we auto-skipped staff (only 1), go back to service
      if (step === "date" && availableStaff.length === 1) {
        setStep("service");
      } else {
        setStep(steps[currentIndex - 1]);
      }
    }
  }

  function handleReset() {
    setStep("service");
    setSelectedService(null);
    setSelectedStaff(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setError("");
  }

  if (step === "success") {
    return (
      <section id="Turnero" className="flex min-h-dvh w-full items-center justify-center py-16">
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
          <Button variant="outline" onClick={handleReset}>
            Reservar otro turno
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section id="Turnero" className="flex min-h-dvh w-full items-center justify-center py-16">
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
              {i > 0 && <div className={cn("h-px w-6", i <= stepIndex ? "bg-primary" : "bg-border")} />}
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
        {step !== "service" && (
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
          {step === "service" && (
            <ServiceStep services={services} onSelect={handleSelectService} loading={loading} />
          )}
          {step === "staff" && (
            <StaffStep staff={availableStaff} onSelect={handleSelectStaff} loading={loading} />
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
          {step === "confirm" && (
            <ConfirmStep
              service={selectedService!}
              staffName={selectedStaff!.name}
              date={selectedDate!}
              time={selectedTime!}
              name={contactName}
              phone={contactPhone}
              email={contactEmail}
              onConfirm={handleConfirm}
              submitting={submitting}
              error={error}
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
  services: Service[];
  onSelect: (s: Service) => void;
  loading: boolean;
}) {
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
            <div className="mt-1 flex items-center gap-2">
              <Text size="sm" className="font-semibold">${service.price.toLocaleString("es-AR")}</Text>
              <Text size="sm" variant="muted">· {service.duration_minutes} min</Text>
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
  staff: { id: string; name: string; avatar_url: string }[];
  onSelect: (s: { id: string; name: string; avatar_url: string }) => void;
  loading: boolean;
}) {
  if (loading) {
    return <Text variant="muted" className="text-center">Cargando profesionales...</Text>;
  }

  if (staff.length === 0) {
    return <Text variant="muted" className="text-center">No hay profesionales disponibles para este servicio.</Text>;
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
}: {
  service: Service;
  staffName: string;
  date: Date;
  time: string;
  name: string;
  phone: string;
  email: string;
  onConfirm: () => void;
  submitting: boolean;
  error: string;
}) {
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
          <div className="flex justify-between">
            <Text size="sm" variant="muted">Precio</Text>
            <Text className="font-semibold">${service.price.toLocaleString("es-AR")}</Text>
          </div>
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
