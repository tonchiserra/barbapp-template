"use client";

import * as React from "react";
import Image from "next/image";
import {
  Button, Input, Textarea, Switch, Badge,
  Card, CardHeader, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, useToast,
} from "@/components/ui";
import { uploadImage, deleteImage, validateImageFile } from "@/lib/storage";
import {
  updateStaff,
  createService, updateService, deleteService,
  getAllServicesForStaffAction,
  updateStaffSchedule,
  addStaffTimeOff, removeStaffTimeOff,
  addStaffBlockedTime, removeStaffBlockedTime,
  getStaffEarnings,
  getSpecialPricesForService, addServiceSpecialPrice, removeServiceSpecialPrice,
} from "@/app/admin/turnero-actions";
import type { StaffEarningsPeriod } from "@/app/admin/turnero-actions";
import type { AuthSession } from "@/lib/auth";
import type { StaffMember, Branch, Service, ServiceSpecialPrice, StaffSchedule, StaffTimeOff, StaffBlockedTime } from "@/types";
import { DAY_NAMES } from "@/types";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dueño",
  manager: "Encargado",
  employee: "Empleado",
};

interface StaffSettingsProps {
  staff: StaffMember[];
  staffSchedules: StaffSchedule[];
  staffTimeOff: StaffTimeOff[];
  staffBlockedTimes: StaffBlockedTime[];
  branches: Branch[];
  session: AuthSession;
}

export function StaffSettings({ staff, staffSchedules, staffTimeOff, staffBlockedTimes, branches, session }: StaffSettingsProps) {
  const [selectedStaffId, setSelectedStaffId] = React.useState<string | null>(null);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  if (selectedStaff) {
    return (
      <StaffDetail
        staff={selectedStaff}
        schedules={staffSchedules.filter((s) => s.staff_id === selectedStaff.id)}
        timeOff={staffTimeOff.filter((t) => t.staff_id === selectedStaff.id)}
        blockedTimes={staffBlockedTimes.filter((bt) => bt.staff_id === selectedStaff.id)}
        branches={branches}
        onBack={() => setSelectedStaffId(null)}
        session={session}
      />
    );
  }

  return (
    <StaffList
      staff={staff}
      branches={branches}
      onSelect={(id) => setSelectedStaffId(id)}
      session={session}
    />
  );
}

// ---------------------------------------------------------------------------
// Staff List
// ---------------------------------------------------------------------------

function StaffList({ staff, branches, onSelect, session }: { staff: StaffMember[]; branches: Branch[]; onSelect: (id: string) => void; session: AuthSession }) {
  const isEmployee = session.role === "employee";

  function canAccess(member: StaffMember) {
    if (isEmployee) return member.id === session.staffId;
    return true;
  }

  return (
    <div className="flex flex-col gap-4">
      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay empleados en el equipo.</Text>
          </CardContent>
        </Card>
      ) : (
        staff.map((member) => {
          const accessible = canAccess(member);
          return (
            <Card
              key={member.id}
              className={accessible ? "cursor-pointer transition-colors hover:bg-accent/50" : "opacity-50"}
              onClick={accessible ? () => onSelect(member.id) : undefined}
            >
              <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  {member.avatar_url ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border">
                      <Image src={member.avatar_url} alt={member.name} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Heading as="h3" className="text-base">{member.name}</Heading>
                      {ROLE_LABELS[member.role] && (
                        <Badge variant={member.role === "owner" ? "default" : "secondary"}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={member.is_active ? "secondary" : "outline"}>
                        {member.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                      {member.branch_id && branches.find((b) => b.id === member.branch_id) && (
                        <Text size="sm" variant="muted">
                          {branches.find((b) => b.id === member.branch_id)!.name}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
                {accessible && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                )}
              </CardHeader>
            </Card>
          );
        })
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff Earnings Card
// ---------------------------------------------------------------------------

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);
}

function StaffEarningsCard({ staffId, commissionPercent }: { staffId: string; commissionPercent: number }) {
  const [earnings, setEarnings] = React.useState<{
    today: StaffEarningsPeriod;
    week: StaffEarningsPeriod;
    month: StaffEarningsPeriod;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setLoading(true);
    getStaffEarnings(staffId).then((data) => {
      setEarnings(data);
      setLoading(false);
    });
  }, [staffId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Ganancias</Heading>
        </CardHeader>
        <CardContent>
          <Text variant="muted" size="sm">Cargando...</Text>
        </CardContent>
      </Card>
    );
  }

  if (!earnings) return null;

  const periods = [
    { label: "Hoy", data: earnings.today },
    { label: "Semana", data: earnings.week },
    { label: "Mes", data: earnings.month },
  ];

  return (
    <Card>
      <CardHeader>
        <Heading as="h3" className="text-base">Ganancias</Heading>
        <Text size="sm" variant="muted">Comision: {commissionPercent}%</Text>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {periods.map((p) => {
            const commission = Math.round(p.data.revenue * commissionPercent / 100);
            return (
              <div key={p.label} className="flex flex-col gap-1 rounded-xl border p-3">
                <Text size="sm" variant="muted">{p.label}</Text>
                <Text size="sm">{p.data.count} turnos</Text>
                <Text size="sm">{formatARS(p.data.revenue)}</Text>
                <Text size="sm" className="font-semibold text-emerald-600">
                  {formatARS(commission)}
                </Text>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Staff Detail
// ---------------------------------------------------------------------------

function StaffDetail({
  staff,
  schedules,
  timeOff,
  blockedTimes,
  branches,
  onBack,
  session,
}: {
  staff: StaffMember;
  schedules: StaffSchedule[];
  timeOff: StaffTimeOff[];
  blockedTimes: StaffBlockedTime[];
  branches: Branch[];
  onBack: () => void;
  session: AuthSession;
}) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);

  const canEditAdminFields = session.role === "admin" || session.role === "owner" ||
    (session.role === "manager" && staff.id !== session.staffId);

  // --- General info ---
  const [name, setName] = React.useState(staff.name);
  const [isActive, setIsActive] = React.useState(staff.is_active);
  const [avatarUrl, setAvatarUrl] = React.useState(staff.avatar_url || "");
  const [branchId, setBranchId] = React.useState(staff.branch_id || "");
  const [commissionPercent, setCommissionPercent] = React.useState(staff.commission_percent);
  const [agendaStartDate, setAgendaStartDate] = React.useState(staff.agenda_start_date || "");
  const [agendaEndDate, setAgendaEndDate] = React.useState(staff.agenda_end_date || "");
  const [minAdvanceHours, setMinAdvanceHours] = React.useState(staff.min_advance_hours);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast(validation.error!, "error");
      if (avatarInputRef.current) avatarInputRef.current.value = "";
      return;
    }
    setAvatarUploading(true);
    const result = await uploadImage(file, "images", `staff/${staff.id}`);
    setAvatarUploading(false);
    if (avatarInputRef.current) avatarInputRef.current.value = "";
    if (result.error) {
      toast(result.error, "error");
    } else if (result.url) {
      setAvatarUrl(result.url);
    }
  }

  async function handleAvatarRemove() {
    setAvatarUploading(true);
    const result = await deleteImage("images", `staff/${staff.id}`);
    setAvatarUploading(false);
    if (result.error) {
      toast(result.error, "error");
    } else {
      setAvatarUrl("");
    }
  }

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("id", staff.id);
    fd.set("name", name);
    fd.set("avatar_url", avatarUrl);
    fd.set("branch_id", branchId);
    fd.set("commission_percent", String(commissionPercent));
    fd.set("agenda_start_date", agendaStartDate);
    fd.set("agenda_end_date", agendaEndDate);
    fd.set("min_advance_hours", String(minAdvanceHours));
    if (isActive) fd.set("is_active", "on");
    const result = await updateStaff(null, fd);
    setPending(false);
    if (result.success) toast("Datos guardados", "success");
    else toast(result.error || "Error", "error");
  }

  // --- Schedule (supports multiple ranges per day) ---
  const [localSchedules, setLocalSchedules] = React.useState(() =>
    DAY_NAMES.map((_, i) => {
      const dayRows = schedules.filter((s) => s.day_of_week === i);
      const isWorking = dayRows.length > 0 ? dayRows.some((s) => s.is_working) : (i >= 1 && i <= 5);
      const ranges = dayRows
        .filter((s) => s.is_working)
        .map((s) => ({ start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }));

      return {
        day_of_week: i,
        is_working: isWorking,
        ranges: ranges.length > 0 ? ranges : [{ start_time: "09:00", end_time: "18:00" }],
      };
    }),
  );

  function toggleDayWorking(dayIndex: number, working: boolean) {
    setLocalSchedules((prev) => prev.map((d) => d.day_of_week === dayIndex ? { ...d, is_working: working } : d));
  }

  function updateRange(dayIndex: number, rangeIndex: number, field: "start_time" | "end_time", value: string) {
    setLocalSchedules((prev) =>
      prev.map((d) =>
        d.day_of_week === dayIndex
          ? { ...d, ranges: d.ranges.map((r, i) => (i === rangeIndex ? { ...r, [field]: value } : r)) }
          : d,
      ),
    );
  }

  function addRange(dayIndex: number) {
    setLocalSchedules((prev) =>
      prev.map((d) =>
        d.day_of_week === dayIndex
          ? { ...d, ranges: [...d.ranges, { start_time: "14:00", end_time: "18:00" }] }
          : d,
      ),
    );
  }

  function removeRange(dayIndex: number, rangeIndex: number) {
    setLocalSchedules((prev) =>
      prev.map((d) =>
        d.day_of_week === dayIndex
          ? { ...d, ranges: d.ranges.filter((_, i) => i !== rangeIndex) }
          : d,
      ),
    );
  }

  async function handleSaveSchedule() {
    setPending(true);
    const rows: { day_of_week: number; start_time: string; end_time: string; is_working: boolean }[] = [];
    for (const day of localSchedules) {
      if (day.is_working) {
        for (const range of day.ranges) {
          rows.push({
            day_of_week: day.day_of_week,
            start_time: range.start_time + ":00",
            end_time: range.end_time + ":00",
            is_working: true,
          });
        }
      } else {
        rows.push({ day_of_week: day.day_of_week, start_time: "09:00:00", end_time: "18:00:00", is_working: false });
      }
    }
    const result = await updateStaffSchedule(staff.id, rows);
    setPending(false);
    if (result.success) toast("Horarios guardados", "success");
    else toast(result.error || "Error", "error");
  }

  // --- Time off ---
  const [newTimeOffDate, setNewTimeOffDate] = React.useState("");
  const [newTimeOffReason, setNewTimeOffReason] = React.useState("");

  async function handleAddTimeOff() {
    if (!newTimeOffDate) return;
    setPending(true);
    const result = await addStaffTimeOff(staff.id, newTimeOffDate, newTimeOffReason);
    setPending(false);
    if (result.success) {
      toast("Dia libre agregado", "success");
      setNewTimeOffDate("");
      setNewTimeOffReason("");
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleRemoveTimeOff(id: string) {
    setPending(true);
    const result = await removeStaffTimeOff(id);
    setPending(false);
    if (result.success) toast("Dia libre eliminado", "success");
    else toast(result.error || "Error", "error");
  }

  // --- Blocked times ---
  const [btDate, setBtDate] = React.useState("");
  const [btStart, setBtStart] = React.useState("13:00");
  const [btEnd, setBtEnd] = React.useState("14:00");
  const [btReason, setBtReason] = React.useState("");

  async function handleAddBlockedTime() {
    if (!btDate || !btStart || !btEnd) return;
    setPending(true);
    const result = await addStaffBlockedTime(staff.id, btDate, btStart + ":00", btEnd + ":00", btReason);
    setPending(false);
    if (result.success) {
      toast("Bloqueo agregado", "success");
      setBtDate("");
      setBtReason("");
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleRemoveBlockedTime(id: string) {
    setPending(true);
    const result = await removeStaffBlockedTime(id);
    setPending(false);
    if (result.success) toast("Bloqueo eliminado", "success");
    else toast(result.error || "Error", "error");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <button
          onClick={onBack}
          className="flex items-center gap-2 self-start rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          Volver al equipo
        </button>

      {/* General info */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Datos generales</Heading>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveGeneral} className="flex flex-col gap-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border">
                  <Image src={avatarUrl} alt={name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col items-start gap-1.5">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-40"
                >
                  {avatarUploading ? "Subiendo..." : avatarUrl ? "Cambiar foto" : "Subir foto"}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={avatarUploading}
                    className="text-sm font-medium text-destructive hover:text-destructive/80 disabled:opacity-40"
                  >
                    Eliminar
                  </button>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            {ROLE_LABELS[staff.role] && (
              <div className="flex items-center justify-between rounded-xl border p-3">
                <Text size="sm">Rol</Text>
                <Badge variant={staff.role === "owner" ? "default" : "secondary"}>
                  {ROLE_LABELS[staff.role]}
                </Badge>
              </div>
            )}
            <div className={`flex items-center justify-between rounded-xl border p-3 ${!canEditAdminFields ? "opacity-50" : ""}`}>
              <Text size="sm">Activo</Text>
              <Switch checked={isActive} onCheckedChange={setIsActive} disabled={!canEditAdminFields} />
            </div>
            {branches.length > 0 && (
              <div className={`flex flex-col gap-1.5 ${!canEditAdminFields ? "opacity-50" : ""}`}>
                <Text size="sm" className="font-medium">Sucursal</Text>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  disabled={!canEditAdminFields}
                  className="rounded-xl border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed"
                >
                  <option value="">Sin sucursal</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={`flex flex-col gap-1.5 ${!canEditAdminFields ? "opacity-50" : ""}`}>
              <Text size="sm" className="font-medium">Comision (%)</Text>
              <input
                type="number"
                min={0}
                max={100}
                value={commissionPercent}
                onChange={(e) => setCommissionPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                disabled={!canEditAdminFields}
                className="rounded-xl border bg-background px-3 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Agenda */}
            <div className="mt-2 rounded-xl border p-4">
              <Text size="sm" className="mb-3 font-semibold">Agenda</Text>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Text size="sm" className="font-medium">Desde</Text>
                    <input
                      type="date"
                      value={agendaStartDate}
                      onChange={(e) => setAgendaStartDate(e.target.value)}
                      className="rounded-xl border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Text size="sm" className="font-medium">Hasta</Text>
                    <input
                      type="date"
                      value={agendaEndDate}
                      onChange={(e) => setAgendaEndDate(e.target.value)}
                      className="rounded-xl border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
                <Text size="sm" variant="muted">Dejá vacío para no limitar.</Text>
                <div className="flex flex-col gap-1.5">
                  <Text size="sm" className="font-medium">Horas mínimas de anticipación</Text>
                  <input
                    type="number"
                    min={0}
                    max={72}
                    value={minAdvanceHours}
                    onChange={(e) => setMinAdvanceHours(Math.min(72, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="rounded-xl border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Earnings */}
      <StaffEarningsCard staffId={staff.id} commissionPercent={commissionPercent} />

      {/* Services */}
      <StaffServicesSection staffId={staff.id} />

      {/* Schedule */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Horarios de atencion</Heading>
          <Text size="sm" variant="muted">Configura los dias y horarios de trabajo.</Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {localSchedules.map((day) => (
            <div key={day.day_of_week} className="flex flex-col gap-2 rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <Switch
                  checked={day.is_working}
                  onCheckedChange={(v) => toggleDayWorking(day.day_of_week, v)}
                />
                <Text size="sm" className="w-24 font-medium">
                  {DAY_NAMES[day.day_of_week]}
                </Text>
                {!day.is_working && <Text size="sm" variant="muted">Dia libre</Text>}
              </div>
              {day.is_working && (
                <div className="flex flex-col gap-2">
                  {day.ranges.map((range, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={range.start_time}
                        onChange={(e) => updateRange(day.day_of_week, ri, "start_time", e.target.value)}
                        className="rounded-lg border bg-background px-2 py-1.5 text-sm"
                      />
                      <Text size="sm" variant="muted">a</Text>
                      <input
                        type="time"
                        value={range.end_time}
                        onChange={(e) => updateRange(day.day_of_week, ri, "end_time", e.target.value)}
                        className="rounded-lg border bg-background px-2 py-1.5 text-sm"
                      />
                      {day.ranges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRange(day.day_of_week, ri)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-red-500"
                          title="Eliminar rango"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRange(day.day_of_week)}
                    className="flex items-center gap-1 self-start rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    + Agregar rango
                  </button>
                </div>
              )}
            </div>
          ))}
          <Button onClick={handleSaveSchedule} disabled={pending} className="mt-2">
            {pending ? "Guardando..." : "Guardar horarios"}
          </Button>
        </CardContent>
      </Card>

      {/* Time Off */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Dias libres</Heading>
          <Text size="sm" variant="muted">Fechas especificas donde no atendera (vacaciones, feriados, etc).</Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {timeOff.length > 0 && (
            <div className="flex flex-col gap-2">
              {timeOff.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Text size="sm" className="font-medium">{t.date}</Text>
                    {t.reason && <Text size="sm" variant="muted">{t.reason}</Text>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveTimeOff(t.id)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="date"
              value={newTimeOffDate}
              onChange={(e) => setNewTimeOffDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
            />
            <Input
              placeholder="Motivo (opcional)"
              value={newTimeOffReason}
              onChange={(e) => setNewTimeOffReason(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleAddTimeOff} disabled={!newTimeOffDate || pending}>
              Agregar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blocked Times */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Bloqueo de horarios</Heading>
          <Text size="sm" variant="muted">Bloquea rangos de horas en fechas especificas (reuniones, descansos, etc).</Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {blockedTimes.length > 0 && (
            <div className="flex flex-col gap-2">
              {blockedTimes.map((bt) => (
                <div key={bt.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <Text size="sm" className="font-medium">
                      {bt.date} &middot; {bt.start_time.slice(0, 5)} a {bt.end_time.slice(0, 5)}
                    </Text>
                    {bt.reason && <Text size="sm" variant="muted">{bt.reason}</Text>}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveBlockedTime(bt.id)}>
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="date"
                value={btDate}
                onChange={(e) => setBtDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <Input
                placeholder="Motivo (opcional)"
                value={btReason}
                onChange={(e) => setBtReason(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={btStart}
                onChange={(e) => setBtStart(e.target.value)}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <Text size="sm" variant="muted">a</Text>
              <input
                type="time"
                value={btEnd}
                onChange={(e) => setBtEnd(e.target.value)}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm"
              />
              <Button variant="outline" onClick={handleAddBlockedTime} disabled={!btDate || !btStart || !btEnd || pending}>
                Agregar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

// ---------------------------------------------------------------------------
// Staff Services Section (loaded client-side)
// ---------------------------------------------------------------------------

function StaffServicesSection({ staffId }: { staffId: string }) {
  const { toast } = useToast();
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Service | null>(null);
  const [specialPriceTarget, setSpecialPriceTarget] = React.useState<Service | null>(null);

  const loadServices = React.useCallback(async () => {
    const data = await getAllServicesForStaffAction(staffId);
    setServices(data);
    setLoading(false);
  }, [staffId]);

  React.useEffect(() => {
    loadServices();
  }, [loadServices]);

  async function handleCreate(formData: FormData) {
    formData.set("staff_id", staffId);
    setPending(true);
    const result = await createService(null, formData);
    setPending(false);
    if (result.success) {
      toast("Servicio creado", "success");
      setIsCreateOpen(false);
      loadServices();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleUpdate(formData: FormData) {
    setPending(true);
    const result = await updateService(null, formData);
    setPending(false);
    if (result.success) {
      toast("Servicio actualizado", "success");
      setEditingService(null);
      loadServices();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteService(deleteTarget.id);
    setPending(false);
    if (result.success) {
      toast("Servicio eliminado", "success");
      setDeleteTarget(null);
      loadServices();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <Card>
      <CardHeader>
        <Heading as="h3" className="text-base">Servicios</Heading>
        <Text size="sm" variant="muted">Servicios que este empleado ofrece.</Text>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {loading ? (
          <Text size="sm" variant="muted">Cargando servicios...</Text>
        ) : services.length === 0 ? (
          <Text size="sm" variant="muted">No hay servicios creados para este empleado.</Text>
        ) : (
          services.map((service) => (
            <div key={service.id} className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Text size="sm" className="font-medium">{service.name}</Text>
                  <Badge variant={service.is_active ? "secondary" : "outline"}>
                    {service.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <Text size="sm" variant="muted">
                  ${service.price_cash.toLocaleString("es-AR")} efectivo
                  {service.price_transfer !== service.price_cash && ` · $${service.price_transfer.toLocaleString("es-AR")} transf.`}
                  {" · "}{service.duration_minutes} min
                </Text>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setSpecialPriceTarget(service)}>
                  Precios
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditingService(service)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(service)} className="text-red-500 hover:text-red-700">
                  Eliminar
                </Button>
              </div>
            </div>
          ))
        )}

        <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
          + Agregar servicio
        </Button>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo servicio</DialogTitle>
              <DialogDescription>Agrega un servicio para este empleado.</DialogDescription>
            </DialogHeader>
            <ServiceForm onSubmit={handleCreate} pending={pending} />
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingService} onOpenChange={(open) => !open && setEditingService(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar servicio</DialogTitle>
            </DialogHeader>
            {editingService && (
              <ServiceForm service={editingService} onSubmit={handleUpdate} pending={pending} />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Eliminar servicio</DialogTitle>
              <DialogDescription>
                ¿Estas seguro de que queres eliminar &quot;{deleteTarget?.name}&quot;? Esta accion no se puede deshacer.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={pending}>
                {pending ? "Eliminando..." : "Eliminar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Special Prices Dialog */}
        {specialPriceTarget && (
          <SpecialPricesDialog
            service={specialPriceTarget}
            open={!!specialPriceTarget}
            onOpenChange={(open) => !open && setSpecialPriceTarget(null)}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Special Prices Dialog
// ---------------------------------------------------------------------------

function SpecialPricesDialog({
  service,
  open,
  onOpenChange,
}: {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [prices, setPrices] = React.useState<ServiceSpecialPrice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [pending, setPending] = React.useState(false);
  const [newDate, setNewDate] = React.useState("");
  const [newPriceCash, setNewPriceCash] = React.useState(String(service.price_cash));
  const [newPriceTransfer, setNewPriceTransfer] = React.useState(String(service.price_transfer));

  const loadPrices = React.useCallback(async () => {
    const data = await getSpecialPricesForService(service.id);
    setPrices(data);
    setLoading(false);
  }, [service.id]);

  React.useEffect(() => {
    if (open) loadPrices();
  }, [open, loadPrices]);

  async function handleAdd() {
    if (!newDate || !newPriceCash || !newPriceTransfer) return;
    setPending(true);
    const result = await addServiceSpecialPrice(
      service.id,
      newDate,
      parseFloat(newPriceCash),
      parseFloat(newPriceTransfer),
    );
    setPending(false);
    if (result.success) {
      toast("Precio especial guardado", "success");
      setNewDate("");
      setNewPriceCash(String(service.price_cash));
      setNewPriceTransfer(String(service.price_transfer));
      loadPrices();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleRemove(id: string) {
    setPending(true);
    const result = await removeServiceSpecialPrice(id);
    setPending(false);
    if (result.success) {
      toast("Precio especial eliminado", "success");
      loadPrices();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Precios especiales</DialogTitle>
          <DialogDescription>
            Precios para &quot;{service.name}&quot; en fechas especificas.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Existing special prices */}
          {loading ? (
            <Text size="sm" variant="muted">Cargando...</Text>
          ) : prices.length === 0 ? (
            <Text size="sm" variant="muted">No hay precios especiales configurados.</Text>
          ) : (
            <div className="flex flex-col gap-2">
              {prices.map((sp) => (
                <div key={sp.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div className="flex flex-col gap-0.5">
                    <Text size="sm" className="font-medium">{sp.date}</Text>
                    <Text size="sm" variant="muted">
                      ${sp.price_cash.toLocaleString("es-AR")} efectivo · ${sp.price_transfer.toLocaleString("es-AR")} transf.
                    </Text>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(sp.id)}
                    disabled={pending}
                    className="text-red-500 hover:text-red-700"
                  >
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new special price */}
          <div className="flex flex-col gap-3 rounded-xl border p-3">
            <Text size="sm" className="font-medium">Agregar precio especial</Text>
            <Input
              label="Fecha"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Efectivo"
                type="number"
                min={0}
                step={0.01}
                value={newPriceCash}
                onChange={(e) => setNewPriceCash(e.target.value)}
              />
              <Input
                label="Transferencia"
                type="number"
                min={0}
                step={0.01}
                value={newPriceTransfer}
                onChange={(e) => setNewPriceTransfer(e.target.value)}
              />
            </div>
            <Button onClick={handleAdd} disabled={pending || !newDate}>
              {pending ? "Guardando..." : "Agregar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Service Form
// ---------------------------------------------------------------------------

function ServiceForm({
  service,
  onSubmit,
  pending,
}: {
  service?: Service;
  onSubmit: (formData: FormData) => void;
  pending: boolean;
}) {
  const [name, setName] = React.useState(service?.name ?? "");
  const [description, setDescription] = React.useState(service?.description ?? "");
  const [priceTransfer, setPriceTransfer] = React.useState(String(service?.price_transfer ?? ""));
  const [priceCash, setPriceCash] = React.useState(String(service?.price_cash ?? ""));
  const [duration, setDuration] = React.useState(String(service?.duration_minutes ?? 30));
  const [isActive, setIsActive] = React.useState(service?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (service) formData.set("id", service.id);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price_transfer", priceTransfer);
    formData.set("price_cash", priceCash);
    formData.set("duration_minutes", duration);
    if (isActive) formData.set("is_active", "on");
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        placeholder="Ej: Corte de pelo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Textarea
        label="Descripcion (opcional)"
        placeholder="Breve descripcion del servicio"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Precio transferencia ($)"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={priceTransfer}
          onChange={(e) => setPriceTransfer(e.target.value)}
        />
        <Input
          label="Precio efectivo ($)"
          type="number"
          min="0"
          step="1"
          placeholder="0"
          value={priceCash}
          onChange={(e) => setPriceCash(e.target.value)}
        />
      </div>
      <Input
        label="Duracion (min)"
        type="number"
        min="5"
        step="5"
        placeholder="30"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        required
      />
      <div className="flex items-center justify-between rounded-xl border p-3">
        <Text size="sm">Servicio activo</Text>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : service ? "Guardar cambios" : "Crear servicio"}
      </Button>
    </form>
  );
}
