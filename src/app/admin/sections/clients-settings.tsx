"use client";

import * as React from "react";
import { Button, Heading, Text, Badge, Card, CardContent } from "@/components/ui";
import { getClientsAction, getAllClientsAction } from "@/app/admin/turnero-actions";
import type { ClientWithDetails } from "@/types";
import { DAY_NAMES } from "@/types";

const PAGE_SIZE = 20;

export function ClientsSettings() {
  const [clients, setClients] = React.useState<ClientWithDetails[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [exporting, setExporting] = React.useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const fetchClients = React.useCallback(async (p: number) => {
    setLoading(true);
    const result = await getClientsAction(p, PAGE_SIZE);
    setClients(result.clients);
    setTotal(result.total);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    fetchClients(page);
  }, [page, fetchClients]);

  async function handleExportCsv() {
    setExporting(true);
    const allClients = await getAllClientsAction();

    const header = "Nombre,Telefono,Email,Turnos,Dia frecuente,Servicio favorito,Profesional favorito,Metodo de pago,Sucursal,Ultima visita,No asistio,Cancelaciones";
    const rows = allClients.map((c) => {
      const topDay = getTopDay(c);
      const name = c.name.replace(/"/g, '""');
      const phone = (c.phone || "").replace(/"/g, '""');
      const email = (c.email || "").replace(/"/g, '""');
      const service = (c.top_service_name || "-").replace(/"/g, '""');
      const staff = (c.top_staff_name || "-").replace(/"/g, '""');
      const payment = formatPayment(c.top_payment_method);
      const branch = (c.top_branch_name || "-").replace(/"/g, '""');
      const lastVisit = c.last_visit_date ? formatDate(c.last_visit_date) : "-";
      return `"${name}","${phone}","${email}",${c.total_appointments},"${topDay}","${service}","${staff}","${payment}","${branch}","${lastVisit}",${c.no_show_count},${c.cancellation_count}`;
    });

    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clientes.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  function getTopDay(client: ClientWithDetails): string {
    const counts = [
      client.dow_0, client.dow_1, client.dow_2, client.dow_3,
      client.dow_4, client.dow_5, client.dow_6,
    ];
    const max = Math.max(...counts);
    if (max === 0) return "-";
    const dayIndex = counts.indexOf(max);
    return DAY_NAMES[dayIndex];
  }

  function formatPayment(method: string | null): string {
    if (method === "cash") return "Efectivo";
    if (method === "transfer") return "Transferencia";
    return "-";
  }

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  if (loading && clients.length === 0) {
    return <Text variant="muted">Cargando clientes...</Text>;
  }

  if (total === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Text variant="muted">Todavia no hay clientes registrados. Apareceran automaticamente cuando se reserve un turno.</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Text size="sm" variant="muted">{total} cliente{total !== 1 ? "s" : ""}</Text>
        <Button variant="outline" size="sm" disabled={exporting} onClick={handleExportCsv}>
          {exporting ? "Exportando..." : "Descargar CSV"}
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Nombre</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Telefono</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Email</th>
              <th className="px-4 py-3 text-center font-medium">Turnos</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Servicio fav.</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Profesional fav.</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Pago</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Sucursal</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Dia frec.</th>
              <th className="px-4 py-3 text-center font-medium">Ultima visita</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Ausencias</th>
              <th className="hidden px-4 py-3 text-center font-medium md:table-cell">Cancelaciones</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b last:border-0 transition-colors hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{client.name}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{client.phone || "-"}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{client.email || "-"}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary">{client.total_appointments}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{client.top_service_name || "-"}</td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{client.top_staff_name || "-"}</td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">{formatPayment(client.top_payment_method)}</td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">{client.top_branch_name || "-"}</td>
                <td className="hidden px-4 py-3 text-center text-muted-foreground md:table-cell">{getTopDay(client)}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">
                  {client.last_visit_date ? formatDate(client.last_visit_date) : "-"}
                </td>
                <td className="hidden px-4 py-3 text-center md:table-cell">
                  {client.no_show_count > 0 ? (
                    <Badge variant="destructive">{client.no_show_count}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
                <td className="hidden px-4 py-3 text-center md:table-cell">
                  {client.cancellation_count > 0 ? (
                    <Badge variant="outline">{client.cancellation_count}</Badge>
                  ) : (
                    <span className="text-muted-foreground">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Text size="sm" variant="muted">
            Pagina {page} de {totalPages}
          </Text>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
