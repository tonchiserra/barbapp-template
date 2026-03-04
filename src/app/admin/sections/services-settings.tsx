"use client";

import * as React from "react";
import {
  Button, Input, Textarea, Switch, Badge,
  Card, CardHeader, CardContent,
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, useToast,
} from "@/components/ui";
import { createService, updateService, deleteService } from "@/app/admin/turnero-actions";
import type { Service } from "@/types";

interface ServicesSettingsProps {
  services: Service[];
}

export function ServicesSettings({ services }: ServicesSettingsProps) {
  const { toast } = useToast();
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Service | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createService(null, formData);
    setPending(false);
    if (result.success) {
      toast("Servicio creado", "success");
      setIsCreateOpen(false);
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
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {services.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay servicios creados todavia.</Text>
          </CardContent>
        </Card>
      ) : (
        services.map((service) => (
          <Card key={service.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Heading as="h3" className="text-base">{service.name}</Heading>
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <Text size="sm" variant="muted">
                  ${service.price.toLocaleString("es-AR")} · {service.duration_minutes} min
                </Text>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingService(service)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(service)}>
                  Eliminar
                </Button>
              </div>
            </CardHeader>
            {service.description && (
              <CardContent>
                <Text size="sm" variant="muted">{service.description}</Text>
              </CardContent>
            )}
          </Card>
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
            <DialogDescription>Agrega un servicio que ofrezcas a tus clientes.</DialogDescription>
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
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
  const [price, setPrice] = React.useState(String(service?.price ?? ""));
  const [duration, setDuration] = React.useState(String(service?.duration_minutes ?? 30));
  const [isActive, setIsActive] = React.useState(service?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (service) formData.set("id", service.id);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("price", price);
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
          label="Precio ($)"
          type="number"
          min="0"
          step="0.01"
          placeholder="0"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
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
      </div>
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
