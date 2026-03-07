"use client";

import * as React from "react";
import {
  Button, Input, Switch, Badge,
  Card, CardHeader, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, useToast,
} from "@/components/ui";
import { createBranch, updateBranch, deleteBranch } from "@/app/admin/turnero-actions";
import type { Branch } from "@/types";

interface BranchesSettingsProps {
  branches: Branch[];
}

export function BranchesSettings({ branches }: BranchesSettingsProps) {
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<Branch | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createBranch(null, formData);
    setPending(false);
    if (result.success) {
      toast("Sucursal creada", "success");
      setIsCreateOpen(false);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleUpdate(formData: FormData) {
    setPending(true);
    const result = await updateBranch(null, formData);
    setPending(false);
    if (result.success) {
      toast("Sucursal actualizada", "success");
      setEditingBranch(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteBranch(deleteTarget.id);
    setPending(false);
    if (result.success) {
      toast("Sucursal eliminada", "success");
      setDeleteTarget(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {branches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay sucursales creadas todavia.</Text>
            <Text size="sm" variant="muted" className="mt-1">
              Si tu negocio tiene mas de una sede, crea sucursales para que los clientes elijan donde reservar.
            </Text>
          </CardContent>
        </Card>
      ) : (
        branches.map((branch) => (
          <Card key={branch.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Heading as="h3" className="text-base">{branch.name}</Heading>
                  <Badge variant={branch.is_active ? "secondary" : "outline"}>
                    {branch.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                {branch.address && (
                  <Text size="sm" variant="muted">{branch.address}</Text>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingBranch(branch)}>
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(branch)} className="text-red-500 hover:text-red-700">
                  Eliminar
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
        + Agregar sucursal
      </Button>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva sucursal</DialogTitle>
            <DialogDescription>Agrega una sede de tu negocio.</DialogDescription>
          </DialogHeader>
          <BranchForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingBranch} onOpenChange={(open) => !open && setEditingBranch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar sucursal</DialogTitle>
          </DialogHeader>
          {editingBranch && (
            <BranchForm branch={editingBranch} onSubmit={handleUpdate} pending={pending} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar sucursal</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que queres eliminar &quot;{deleteTarget?.name}&quot;? Los empleados asignados quedaran sin sucursal.
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
    </div>
  );
}

function BranchForm({
  branch,
  onSubmit,
  pending,
}: {
  branch?: Branch;
  onSubmit: (formData: FormData) => void;
  pending: boolean;
}) {
  const [name, setName] = React.useState(branch?.name ?? "");
  const [address, setAddress] = React.useState(branch?.address ?? "");
  const [isActive, setIsActive] = React.useState(branch?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    if (branch) fd.set("id", branch.id);
    fd.set("name", name);
    fd.set("address", address);
    if (isActive) fd.set("is_active", "on");
    onSubmit(fd);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        placeholder="Ej: Sede Centro"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Direccion"
        placeholder="Ej: Av. Corrientes 1234"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />
      <div className="flex items-center justify-between rounded-xl border p-3">
        <Text size="sm">Sucursal activa</Text>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : branch ? "Guardar cambios" : "Crear sucursal"}
      </Button>
    </form>
  );
}
