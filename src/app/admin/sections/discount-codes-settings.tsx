"use client";

import * as React from "react";
import {
  Button, Input, Switch, Badge,
  Card, CardHeader,  CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, useToast,
} from "@/components/ui";
import {
  createDiscountCode,
  updateDiscountCode,
  deleteDiscountCode,
} from "@/app/admin/turnero-actions";
import type { DiscountCode } from "@/types";

interface DiscountCodesSettingsProps {
  discountCodes: DiscountCode[];
}

export function DiscountCodesSettings({ discountCodes }: DiscountCodesSettingsProps) {
  const { toast } = useToast();
  const [editingCode, setEditingCode] = React.useState<DiscountCode | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<DiscountCode | null>(null);
  const [pending, setPending] = React.useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createDiscountCode(null, formData);
    setPending(false);
    if (result.success) {
      toast("Cupon creado", "success");
      setIsCreateOpen(false);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleUpdate(formData: FormData) {
    setPending(true);
    const result = await updateDiscountCode(null, formData);
    setPending(false);
    if (result.success) {
      toast("Cupon actualizado", "success");
      setEditingCode(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteDiscountCode(deleteTarget.id);
    setPending(false);
    if (result.success) {
      toast("Cupon eliminado", "success");
      setDeleteTarget(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {discountCodes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay cupones creados todavia.</Text>
          </CardContent>
        </Card>
      ) : (
        discountCodes.map((dc) => (
          <Card key={dc.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Heading as="h3" className="font-mono text-base">
                    {dc.code}
                  </Heading>
                  <Badge variant={dc.is_active ? "default" : "secondary"}>
                    {dc.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
                <Text size="sm" variant="muted">
                  {dc.discount_percent}% de descuento · {dc.used_count}/{dc.max_uses} usados
                </Text>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingCode(dc)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(dc)}>
                  Eliminar
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      <Button variant="outline" onClick={() => setIsCreateOpen(true)}>
        + Agregar cupon
      </Button>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo cupon</DialogTitle>
            <DialogDescription>Crea un codigo de descuento para tus clientes.</DialogDescription>
          </DialogHeader>
          <DiscountCodeForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingCode} onOpenChange={(open) => !open && setEditingCode(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cupon</DialogTitle>
          </DialogHeader>
          {editingCode && (
            <DiscountCodeForm discountCode={editingCode} onSubmit={handleUpdate} pending={pending} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cupon</DialogTitle>
            <DialogDescription>
              ¿Estas seguro de que queres eliminar &quot;{deleteTarget?.code}&quot;? Esta accion no se puede deshacer.
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

function DiscountCodeForm({
  discountCode,
  onSubmit,
  pending,
}: {
  discountCode?: DiscountCode;
  onSubmit: (formData: FormData) => void;
  pending: boolean;
}) {
  const [code, setCode] = React.useState(discountCode?.code ?? "");
  const [discountPercent, setDiscountPercent] = React.useState(
    String(discountCode?.discount_percent ?? ""),
  );
  const [maxUses, setMaxUses] = React.useState(
    String(discountCode?.max_uses ?? ""),
  );
  const [isActive, setIsActive] = React.useState(discountCode?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (discountCode) formData.set("id", discountCode.id);
    formData.set("code", code);
    formData.set("discount_percent", discountPercent);
    formData.set("max_uses", maxUses);
    if (isActive) formData.set("is_active", "on");
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Codigo"
        placeholder="Ej: PROMO10"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Descuento (%)"
          type="number"
          min="1"
          max="100"
          placeholder="10"
          value={discountPercent}
          onChange={(e) => setDiscountPercent(e.target.value)}
          required
        />
        <Input
          label="Cantidad de usos"
          type="number"
          min="1"
          placeholder="10"
          value={maxUses}
          onChange={(e) => setMaxUses(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border p-3">
        <Text size="sm">Cupon activo</Text>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : discountCode ? "Guardar cambios" : "Crear cupon"}
      </Button>
    </form>
  );
}
