"use client";

import * as React from "react";
import {
  Button, Input, Textarea, Switch, Badge,
  Card, CardHeader, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, useToast,
} from "@/components/ui";
import {
  createStaff, updateStaff, deleteStaff,
  createService, updateService, deleteService,
  getAllServicesForStaffAction,
  updateStaffSchedule,
  addStaffTimeOff, removeStaffTimeOff,
  addStaffBlockedTime, removeStaffBlockedTime,
} from "@/app/admin/turnero-actions";
import type { StaffMember, Service, StaffSchedule, StaffTimeOff, StaffBlockedTime } from "@/types";
import { DAY_NAMES } from "@/types";

interface StaffSettingsProps {
  staff: StaffMember[];
  staffSchedules: StaffSchedule[];
  staffTimeOff: StaffTimeOff[];
  staffBlockedTimes: StaffBlockedTime[];
}

export function StaffSettings({ staff, staffSchedules, staffTimeOff, staffBlockedTimes }: StaffSettingsProps) {
  const [selectedStaffId, setSelectedStaffId] = React.useState<string | null>(null);

  const selectedStaff = staff.find((s) => s.id === selectedStaffId);

  if (selectedStaff) {
    return (
      <StaffDetail
        staff={selectedStaff}
        schedules={staffSchedules.filter((s) => s.staff_id === selectedStaff.id)}
        timeOff={staffTimeOff.filter((t) => t.staff_id === selectedStaff.id)}
        blockedTimes={staffBlockedTimes.filter((bt) => bt.staff_id === selectedStaff.id)}
        onBack={() => setSelectedStaffId(null)}
      />
    );
  }

  return (
    <StaffList
      staff={staff}
      onSelect={(id) => setSelectedStaffId(id)}
    />
  );
}

// ---------------------------------------------------------------------------
// Staff List
// ---------------------------------------------------------------------------

function StaffList({ staff, onSelect }: { staff: StaffMember[]; onSelect: (id: string) => void }) {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createStaff(null, formData);
    setPending(false);
    if (result.success) {
      toast("Empleado creado", "success");
      setIsCreateOpen(false);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {staff.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay empleados creados todavia.</Text>
          </CardContent>
        </Card>
      ) : (
        staff.map((member) => (
          <Card key={member.id} className="cursor-pointer transition-colors hover:bg-accent/50" onClick={() => onSelect(member.id)}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <Heading as="h3" className="text-base">{member.name}</Heading>
                    {member.is_owner && <Badge variant="default">Owner</Badge>}
                  </div>
                  <Badge variant={member.is_active ? "secondary" : "outline"}>
                    {member.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-muted-foreground">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </CardHeader>
          </Card>
        ))
      )}

      <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
        + Agregar empleado
      </Button>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo empleado</DialogTitle>
            <DialogDescription>Agrega un empleado a tu equipo.</DialogDescription>
          </DialogHeader>
          <StaffCreateForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StaffCreateForm({ onSubmit, pending }: { onSubmit: (fd: FormData) => void; pending: boolean }) {
  const [name, setName] = React.useState("");
  const [isOwner, setIsOwner] = React.useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", name);
    if (isOwner) fd.set("is_owner", "on");
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input label="Nombre" placeholder="Ej: Juan" value={name} onChange={(e) => setName(e.target.value)} required />
      <div className="flex items-center justify-between rounded-xl border p-3">
        <Text size="sm">Es el dueño</Text>
        <Switch checked={isOwner} onCheckedChange={setIsOwner} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Creando..." : "Crear empleado"}
      </Button>
    </form>
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
  onBack,
}: {
  staff: StaffMember;
  schedules: StaffSchedule[];
  timeOff: StaffTimeOff[];
  blockedTimes: StaffBlockedTime[];
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [pending, setPending] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // --- General info ---
  const [name, setName] = React.useState(staff.name);
  const [isOwner, setIsOwner] = React.useState(staff.is_owner);
  const [isActive, setIsActive] = React.useState(staff.is_active);

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData();
    fd.set("id", staff.id);
    fd.set("name", name);
    if (isOwner) fd.set("is_owner", "on");
    if (isActive) fd.set("is_active", "on");
    const result = await updateStaff(null, fd);
    setPending(false);
    if (result.success) toast("Datos guardados", "success");
    else toast(result.error || "Error", "error");
  }

  async function handleDelete() {
    setPending(true);
    const result = await deleteStaff(staff.id);
    setPending(false);
    if (result.success) {
      toast("Empleado eliminado", "success");
      onBack();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  // --- Schedule ---
  const [localSchedules, setLocalSchedules] = React.useState(
    DAY_NAMES.map((_, i) => {
      const existing = schedules.find((s) => s.day_of_week === i);
      return {
        day_of_week: i,
        start_time: existing?.start_time?.slice(0, 5) || "09:00",
        end_time: existing?.end_time?.slice(0, 5) || "18:00",
        is_working: existing?.is_working ?? (i >= 1 && i <= 5),
      };
    }),
  );

  function updateScheduleField(dayIndex: number, field: string, value: string | boolean) {
    setLocalSchedules((prev) => prev.map((s) => (s.day_of_week === dayIndex ? { ...s, [field]: value } : s)));
  }

  async function handleSaveSchedule() {
    setPending(true);
    const rows = localSchedules.map((s) => ({
      day_of_week: s.day_of_week,
      start_time: s.start_time + ":00",
      end_time: s.end_time + ":00",
      is_working: s.is_working,
    }));
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
            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Text size="sm">Es el dueño</Text>
              <Switch checked={isOwner} onCheckedChange={setIsOwner} />
            </div>
            <div className="flex items-center justify-between rounded-xl border p-3">
              <Text size="sm">Activo</Text>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending} className="flex-1">
                {pending ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
                Eliminar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Services */}
      <StaffServicesSection staffId={staff.id} />

      {/* Schedule */}
      <Card>
        <CardHeader>
          <Heading as="h3" className="text-base">Horarios de atencion</Heading>
          <Text size="sm" variant="muted">Configura los dias y horarios de trabajo.</Text>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {localSchedules.map((sched) => (
            <div key={sched.day_of_week} className="flex items-center gap-3 rounded-xl border p-3">
              <Switch
                checked={sched.is_working}
                onCheckedChange={(v) => updateScheduleField(sched.day_of_week, "is_working", v)}
              />
              <Text size="sm" className="w-24 font-medium">
                {DAY_NAMES[sched.day_of_week]}
              </Text>
              {sched.is_working ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={sched.start_time}
                    onChange={(e) => updateScheduleField(sched.day_of_week, "start_time", e.target.value)}
                    className="rounded-lg border bg-background px-2 py-1.5 text-sm"
                  />
                  <Text size="sm" variant="muted">a</Text>
                  <input
                    type="time"
                    value={sched.end_time}
                    onChange={(e) => updateScheduleField(sched.day_of_week, "end_time", e.target.value)}
                    className="rounded-lg border bg-background px-2 py-1.5 text-sm"
                  />
                </div>
              ) : (
                <Text size="sm" variant="muted">Dia libre</Text>
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
          <Heading as="h3" className="text-base">Bloqueos de horario</Heading>
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

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar empleado</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que queres eliminar a &quot;{staff.name}&quot;? Se eliminaran tambien sus servicios, horarios y dias libres.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      </CardContent>
    </Card>
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
