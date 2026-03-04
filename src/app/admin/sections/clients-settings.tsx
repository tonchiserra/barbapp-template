"use client";

import * as React from "react";
import { Button, Heading, Text, Badge, Card, CardContent } from "@/components/ui";
import { getClientsAction, getAllClientsAction } from "@/app/admin/turnero-actions";
import type { Client } from "@/types";
import { DAY_NAMES } from "@/types";

const PAGE_SIZE = 20;

export function ClientsSettings() {
  const [clients, setClients] = React.useState<Client[]>([]);
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

    const header = "Nombre,Telefono,Email,Turnos,Dia frecuente";
    const rows = allClients.map((c) => {
      const topDay = getTopDay(c);
      const name = c.name.replace(/"/g, '""');
      const phone = (c.phone || "").replace(/"/g, '""');
      const email = (c.email || "").replace(/"/g, '""');
      return `"${name}","${phone}","${email}",${c.total_appointments},"${topDay}"`;
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

  function getTopDay(client: Client): string {
    const counts = [
      client.dow_0, client.dow_1, client.dow_2, client.dow_3,
      client.dow_4, client.dow_5, client.dow_6,
    ];
    const max = Math.max(...counts);
    if (max === 0) return "-";
    const dayIndex = counts.indexOf(max);
    return DAY_NAMES[dayIndex];
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
              <th className="px-4 py-3 text-left font-medium">Telefono</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-center font-medium">Cortes</th>
              <th className="px-4 py-3 text-center font-medium">Dia frecuente</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b last:border-0 transition-colors hover:bg-accent/50">
                <td className="px-4 py-3 font-medium">{client.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.phone || "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{client.email || "-"}</td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="secondary">{client.total_appointments}</Badge>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground">{getTopDay(client)}</td>
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
