"use client";

import * as React from "react";
import {
  Button, Input, Switch, Badge,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Card, CardHeader, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, useToast,
} from "@/components/ui";
import {
  createReward,
  updateReward,
  deleteReward,
} from "@/app/admin/turnero-actions";
import type { Reward, RewardType } from "@/types";

interface RewardsSettingsProps {
  rewards: Reward[];
}

export function RewardsSettings({ rewards }: RewardsSettingsProps) {
  const { toast } = useToast();
  const [editingReward, setEditingReward] = React.useState<Reward | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Reward | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createReward(null, formData);
    setPending(false);
    if (result.success) {
      toast("Recompensa creada", "success");
      setIsCreateOpen(false);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleUpdate(formData: FormData) {
    setPending(true);
    const result = await updateReward(null, formData);
    setPending(false);
    if (result.success) {
      toast("Recompensa actualizada", "success");
      setEditingReward(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteReward(deleteTarget.id);
    setPending(false);
    if (result.success) {
      toast("Recompensa eliminada", "success");
      setDeleteTarget(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="py-4">
          <Text size="sm" variant="muted">
            Los clientes acumulan 1 punto por cada $1.000 gastados en turnos completados.
            Configura recompensas que podran canjear con sus puntos.
          </Text>
        </CardContent>
      </Card>

      {rewards.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay recompensas creadas todavia.</Text>
          </CardContent>
        </Card>
      ) : (
        rewards.map((reward) => (
          <Card key={reward.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Heading as="h3" className="text-base">
                    {reward.name}
                  </Heading>
                  <Badge variant={reward.is_active ? "default" : "secondary"}>
                    {reward.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                  <Badge variant="secondary">
                    {reward.type === "product" ? "Producto" : `${reward.discount_percent}% dto`}
                  </Badge>
                </div>
                <Text size="sm" variant="muted">
                  {reward.points_cost} puntos
                  {reward.description ? ` · ${reward.description}` : ""}
                </Text>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingReward(reward)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(reward)}>
                  Eliminar
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
        + Agregar recompensa
      </Button>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva recompensa</DialogTitle>
            <DialogDescription>Crea una recompensa que los clientes podran canjear con sus puntos.</DialogDescription>
          </DialogHeader>
          <RewardForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingReward} onOpenChange={(open) => !open && setEditingReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar recompensa</DialogTitle>
          </DialogHeader>
          {editingReward && (
            <RewardForm reward={editingReward} onSubmit={handleUpdate} pending={pending} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar recompensa</DialogTitle>
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

function RewardForm({
  reward,
  onSubmit,
  pending,
}: {
  reward?: Reward;
  onSubmit: (formData: FormData) => void;
  pending: boolean;
}) {
  const [name, setName] = React.useState(reward?.name ?? "");
  const [description, setDescription] = React.useState(reward?.description ?? "");
  const [pointsCost, setPointsCost] = React.useState(String(reward?.points_cost ?? ""));
  const [type, setType] = React.useState<RewardType>(reward?.type ?? "product");
  const [discountPercent, setDiscountPercent] = React.useState(
    String(reward?.discount_percent ?? ""),
  );
  const [isActive, setIsActive] = React.useState(reward?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (reward) formData.set("id", reward.id);
    formData.set("name", name);
    formData.set("description", description);
    formData.set("points_cost", pointsCost);
    formData.set("type", type);
    if (type === "discount") formData.set("discount_percent", discountPercent);
    if (isActive) formData.set("is_active", "on");
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        placeholder="Ej: Corte gratis"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Descripcion (opcional)"
        placeholder="Ej: Un corte de pelo clasico"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Costo en puntos"
        type="number"
        min="1"
        placeholder="50"
        value={pointsCost}
        onChange={(e) => setPointsCost(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Tipo</label>
        <Select value={type} onValueChange={(val: string) => setType(val as RewardType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product">Producto</SelectItem>
            <SelectItem value="discount">Descuento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type === "discount" && (
        <Input
          label="Porcentaje de descuento"
          type="number"
          min="1"
          max="100"
          placeholder="10"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          required
        />
      )}
      <div className="flex items-center justify-between rounded-xl border p-3">
        <Text size="sm">Recompensa activa</Text>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : reward ? "Guardar cambios" : "Crear recompensa"}
      </Button>
    </form>
  );
}
