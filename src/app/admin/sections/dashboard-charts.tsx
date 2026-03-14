"use client";

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Heading, Card, CardContent } from "@/components/ui";
import type { MonthlySummary } from "./booking-dashboard";

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);
}

interface DashboardChartsProps {
  summaries: MonthlySummary[];
}

export default function DashboardCharts({ summaries }: DashboardChartsProps) {
  // Reverse so oldest is first (left to right chronologically)
  const data = [...summaries].reverse().map((s) => ({
    name: s.label.split(" ")[0].slice(0, 3), // "mar", "feb", etc.
    turnos: s.total,
    ingresos: s.revenue,
  }));

  return (
    <div className="space-y-6">
      <Heading as="h2" className="text-lg">Graficos</Heading>

      {/* Appointments bar chart */}
      <Card>
        <CardContent className="p-4">
          <Heading as="h3" className="mb-4 text-sm font-medium text-muted-foreground">
            Turnos por mes
          </Heading>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value) => [String(value), "Turnos"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(0 0% 90%)",
                    fontSize: "13px",
                  }}
                />
                <Bar dataKey="turnos" fill="hsl(211 100% 50%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue line chart */}
      <Card>
        <CardContent className="p-4">
          <Heading as="h3" className="mb-4 text-sm font-medium text-muted-foreground">
            Ingresos por mes
          </Heading>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatARS(v)} />
                <Tooltip
                  formatter={(value) => [formatARS(Number(value)), "Ingresos"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(0 0% 90%)",
                    fontSize: "13px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  stroke="hsl(142 71% 45%)"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "hsl(142 71% 45%)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
