"use client";

import * as React from "react";
import Image from "next/image";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Button, Input, Switch, Badge,
  Card, CardHeader, CardContent,
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
  Heading, Text, ImageUpload, useToast,
} from "@/components/ui";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  recordProductSale,
  getProductSales,
  deleteProductSale,
} from "@/app/admin/turnero-actions";
import type { Product, ProductSaleWithDetails } from "@/types";

interface ProductsSettingsProps {
  products: Product[];
}

export function ProductsSettings({ products }: ProductsSettingsProps) {
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Product | null>(null);
  const [saleTarget, setSaleTarget] = React.useState<Product | null>(null);
  const [salesOpen, setSalesOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function handleCreate(formData: FormData) {
    setPending(true);
    const result = await createProduct(null, formData);
    setPending(false);
    if (result.success) {
      toast("Producto creado", "success");
      setIsCreateOpen(false);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleUpdate(formData: FormData) {
    setPending(true);
    const result = await updateProduct(null, formData);
    setPending(false);
    if (result.success) {
      toast("Producto actualizado", "success");
      setEditingProduct(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setPending(true);
    const result = await deleteProduct(deleteTarget.id);
    setPending(false);
    if (result.success) {
      toast("Producto eliminado", "success");
      setDeleteTarget(null);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Text variant="muted">No hay productos creados todavia.</Text>
          </CardContent>
        </Card>
      ) : (
        products.map((product) => (
          <Card key={product.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {product.image_url && (
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Heading as="h3" className="text-base">
                      {product.name}
                    </Heading>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <Text size="sm" variant="muted">
                    ${product.price.toLocaleString("es-AR")}
                  </Text>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSaleTarget(product)}
                >
                  Vender
                </Button>
                <Button variant="outline" size="sm" onClick={() => setEditingProduct(product)}>
                  Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(product)}>
                  Eliminar
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setIsCreateOpen(true)} className="flex-1">
          + Agregar producto
        </Button>
        <Button variant="outline" onClick={() => setSalesOpen(true)}>
          Ver ventas
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo producto</DialogTitle>
            <DialogDescription>Agrega un producto para registrar ventas.</DialogDescription>
          </DialogHeader>
          <ProductForm onSubmit={handleCreate} pending={pending} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <ProductForm product={editingProduct} onSubmit={handleUpdate} pending={pending} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar producto</DialogTitle>
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

      {/* Record Sale Dialog */}
      {saleTarget && (
        <SaleDialog
          product={saleTarget}
          onClose={() => setSaleTarget(null)}
        />
      )}

      {/* Sales History Dialog */}
      {salesOpen && (
        <SalesHistoryDialog onClose={() => setSalesOpen(false)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Form
// ---------------------------------------------------------------------------

function ProductForm({
  product,
  onSubmit,
  pending,
}: {
  product?: Product;
  onSubmit: (formData: FormData) => void;
  pending: boolean;
}) {
  const [name, setName] = React.useState(product?.name ?? "");
  const [price, setPrice] = React.useState(String(product?.price ?? ""));
  const [imageUrl, setImageUrl] = React.useState(product?.image_url ?? "");
  const [isActive, setIsActive] = React.useState(product?.is_active ?? true);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData();
    if (product) formData.set("id", product.id);
    formData.set("name", name);
    formData.set("price", price);
    formData.set("image_url", imageUrl);
    if (isActive) formData.set("is_active", "on");
    onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        placeholder="Ej: Pomada para el pelo"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="Precio"
        type="number"
        min="0"
        step="0.01"
        placeholder="2500"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Foto (opcional)</label>
        <ImageUpload
          bucket="images"
          path="products"
          currentUrl={imageUrl || undefined}
          onUpload={setImageUrl}
          onRemove={() => setImageUrl("")}
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border p-3">
        <Text size="sm">Producto activo</Text>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : product ? "Guardar cambios" : "Crear producto"}
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sale Dialog
// ---------------------------------------------------------------------------

function SaleDialog({ product, onClose }: { product: Product; onClose: () => void }) {
  const { toast } = useToast();
  const [quantity, setQuantity] = React.useState("1");
  const [pending, setPending] = React.useState(false);

  async function handleSale() {
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      toast("La cantidad debe ser al menos 1", "error");
      return;
    }
    setPending(true);
    const result = await recordProductSale(product.id, qty);
    setPending(false);
    if (result.success) {
      toast(`Venta registrada: ${qty}x ${product.name}`, "success");
      onClose();
    } else {
      toast(result.error || "Error", "error");
    }
  }

  const qty = parseInt(quantity, 10) || 0;
  const total = qty * product.price;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar venta</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Input
            label="Cantidad"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <div className="flex items-center justify-between rounded-xl border p-3">
            <Text size="sm" variant="muted">Total</Text>
            <Text className="font-semibold">${total.toLocaleString("es-AR")}</Text>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSale} disabled={pending || qty < 1}>
            {pending ? "Registrando..." : "Registrar venta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Sales History Dialog
// ---------------------------------------------------------------------------

function SalesHistoryDialog({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [sales, setSales] = React.useState<ProductSaleWithDetails[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const pageSize = 20;

  const loadSales = React.useCallback(async (p: number) => {
    setLoading(true);
    const result = await getProductSales(p, pageSize);
    setSales(result.sales);
    setTotal(result.total);
    setPage(p);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadSales(1);
  }, [loadSales]);

  async function handleDelete(saleId: string) {
    const result = await deleteProductSale(saleId);
    if (result.success) {
      toast("Venta eliminada", "success");
      loadSales(page);
    } else {
      toast(result.error || "Error", "error");
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de ventas</DialogTitle>
          <DialogDescription>{total} ventas registradas</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center">
            <Text variant="muted">Cargando...</Text>
          </div>
        ) : sales.length === 0 ? (
          <div className="py-8 text-center">
            <Text variant="muted">No hay ventas registradas.</Text>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-xl border p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <Text size="sm" className="font-medium">
                    {sale.quantity}x {sale.product_name}
                  </Text>
                  <Text size="sm" variant="muted">
                    {sale.staff_name} · {format(new Date(sale.created_at), "dd MMM yyyy HH:mm", { locale: es })}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text size="sm" className="font-semibold">
                    ${(sale.price * sale.quantity).toLocaleString("es-AR")}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sale.id)}
                    className="text-destructive"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => loadSales(page - 1)}
                >
                  Anterior
                </Button>
                <Text size="sm" variant="muted">
                  {page} / {totalPages}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => loadSales(page + 1)}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
