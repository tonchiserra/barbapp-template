"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
  Heading, Text,
  Card, CardContent,
} from "@/components/ui";
import { useStaffFilters, StaffFilterBar } from "./staff-filters";
import type { Appointment, StaffMember, Branch, PaymentMethod } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MonthlySummary {
  month: string;   // "yyyy-MM"
  label: string;   // "marzo 2026"
  total: number;
  completed: number;
  revenue: number;
}

export interface HistoricalAppointment {
  staff_id: string;
  date: string;
  price: number;
  status: string;
}

export interface MonthLabel {
  key: string;    // "yyyy-MM"
  label: string;  // "marzo 2026"
}

interface BookingDashboardProps {
  weekAppointments: Appointment[];
  monthAppointments: Appointment[];
  prevWeekAppointments: Appointment[];
  prevMonthAppointments: Appointment[];
  todayAppointments: Appointment[];
  historicalAppointments: HistoricalAppointment[];
  monthLabels: MonthLabel[];
  staff: StaffMember[];
  branches: Branch[];
  showBranchFilter: boolean;
  todayStr: string;
}

// ---------------------------------------------------------------------------
// Charts (dynamic import — client-only, heavy)
// ---------------------------------------------------------------------------

const DashboardCharts = dynamic(() => import("./dashboard-charts"), { ssr: false });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcPercentDiff(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(amount);
}

// ---------------------------------------------------------------------------
// Metric card
// ---------------------------------------------------------------------------

function MetricCard({ label, value, percentDiff }: { label: string; value: string | number; percentDiff?: number | null }) {
  return (
    <Card>
      <CardContent className="p-4">
        <Text size="sm" variant="muted">{label}</Text>
        <Heading as="h3" className="mt-1 text-2xl">{value}</Heading>
        {percentDiff != null && (
          <div className={cn(
            "mt-1.5 flex items-center gap-1 text-xs font-medium",
            percentDiff > 0 && "text-emerald-600",
            percentDiff < 0 && "text-red-500",
            percentDiff === 0 && "text-muted-foreground",
          )}>
            {percentDiff > 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="m18 15-6-6-6 6" />
              </svg>
            ) : percentDiff < 0 ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                <path d="m6 9 6 6 6-6" />
              </svg>
            ) : null}
            <span>
              {percentDiff === 0
                ? "Sin cambios"
                : `${percentDiff > 0 ? "+" : ""}${percentDiff.toFixed(0)}% vs anterior`}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Caja (staff commission breakdown)
// ---------------------------------------------------------------------------

type CajaPeriod = "today" | "week" | "month";

function CajaSection({
  staff,
  todayAppointments,
  weekAppointments,
  monthAppointments,
}: {
  staff: StaffMember[];
  todayAppointments: { staff_id: string; price: number; payment_method: PaymentMethod | null }[];
  weekAppointments: { staff_id: string; price: number; payment_method: PaymentMethod | null }[];
  monthAppointments: { staff_id: string; price: number; payment_method: PaymentMethod | null }[];
}) {
  const [period, setPeriod] = React.useState<CajaPeriod>("today");

  const appointments = period === "today" ? todayAppointments : period === "week" ? weekAppointments : monthAppointments;

  const staffMap = new Map(staff.map((s) => [s.id, s]));

  const rows = React.useMemo(() => {
    const grouped = new Map<string, { count: number; revenue: number; cash: number; transfer: number }>();

    for (const appt of appointments) {
      const existing = grouped.get(appt.staff_id) ?? { count: 0, revenue: 0, cash: 0, transfer: 0 };
      const price = Number(appt.price);
      existing.count += 1;
      existing.revenue += price;
      if (appt.payment_method === "cash") existing.cash += price;
      else if (appt.payment_method === "transfer") existing.transfer += price;
      grouped.set(appt.staff_id, existing);
    }

    return Array.from(grouped.entries())
      .map(([staffId, data]) => {
        const member = staffMap.get(staffId);
        const commission = Math.round(data.revenue * (member?.commission_percent ?? 0) / 100);
        return {
          staffId,
          name: member?.name ?? "—",
          percent: member?.commission_percent ?? 0,
          ...data,
          commission,
          net: data.revenue - commission,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [appointments, staffMap]);

  const totals = React.useMemo(() => {
    return rows.reduce(
      (acc, r) => ({
        count: acc.count + r.count,
        revenue: acc.revenue + r.revenue,
        cash: acc.cash + r.cash,
        transfer: acc.transfer + r.transfer,
        commission: acc.commission + r.commission,
        net: acc.net + r.net,
      }),
      { count: 0, revenue: 0, cash: 0, transfer: 0, commission: 0, net: 0 },
    );
  }, [rows]);

  const periodLabels: Record<CajaPeriod, string> = { today: "Hoy", week: "Semana", month: "Mes" };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Heading as="h2" className="text-lg">Caja</Heading>
        <div className="flex gap-1 rounded-xl bg-accent p-1">
          {(["today", "week", "month"] as CajaPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Text variant="muted">No hay turnos completados</Text>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Empleado</th>
                    <th className="px-4 py-3 font-medium text-right">Turnos</th>
                    <th className="px-4 py-3 font-medium text-right">Efectivo</th>
                    <th className="px-4 py-3 font-medium text-right">Transf.</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium text-right">Comision</th>
                    <th className="px-4 py-3 font-medium text-right">Neto</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.staffId} className="border-b last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium">{r.name}</span>
                        <span className="ml-1.5 text-muted-foreground">({r.percent}%)</span>
                      </td>
                      <td className="px-4 py-3 text-right">{r.count}</td>
                      <td className="px-4 py-3 text-right">{formatARS(r.cash)}</td>
                      <td className="px-4 py-3 text-right">{formatARS(r.transfer)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatARS(r.revenue)}</td>
                      <td className="px-4 py-3 text-right text-amber-600">{formatARS(r.commission)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatARS(r.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-accent/50 font-medium">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{totals.count}</td>
                    <td className="px-4 py-3 text-right">{formatARS(totals.cash)}</td>
                    <td className="px-4 py-3 text-right">{formatARS(totals.transfer)}</td>
                    <td className="px-4 py-3 text-right">{formatARS(totals.revenue)}</td>
                    <td className="px-4 py-3 text-right text-amber-600">{formatARS(totals.commission)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatARS(totals.net)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard
// ---------------------------------------------------------------------------

export function BookingDashboard({
  weekAppointments,
  monthAppointments,
  prevWeekAppointments,
  prevMonthAppointments,
  todayAppointments,
  historicalAppointments,
  monthLabels,
  staff,
  branches,
  showBranchFilter,
  todayStr,
}: BookingDashboardProps) {
  const {
    selectedBranchId, selectedStaffId, setSelectedStaffId,
    visibleStaff, handleBranchChange, byFilters,
  } = useStaffFilters(staff);

  const activeStatuses = ["confirmed", "completed"];

  // Metrics
  const todayFiltered = byFilters(todayAppointments);
  const todayCount = todayFiltered.length;
  const todayRevenue = todayFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const weekFiltered = byFilters(weekAppointments);
  const weekCount = weekFiltered.filter((a) => activeStatuses.includes(a.status)).length;
  const weekRevenue = weekFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const monthFiltered = byFilters(monthAppointments);
  const monthCount = monthFiltered.filter((a) => activeStatuses.includes(a.status)).length;
  const monthRevenue = monthFiltered.filter((a) => a.status === "completed").reduce((sum, a) => sum + Number(a.price), 0);

  const prevWeekRevenue = byFilters(prevWeekAppointments)
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);
  const prevMonthRevenue = byFilters(prevMonthAppointments)
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + Number(a.price), 0);

  // Compute monthly summaries client-side so filters apply
  const filteredSummaries = React.useMemo(() => {
    const filtered = byFilters(historicalAppointments);
    const activeStatuses = ["confirmed", "completed"];
    const labelMap = new Map(monthLabels.map((m) => [m.key, m.label]));

    // Group by month
    const grouped = new Map<string, { total: number; completed: number; revenue: number }>();
    for (const a of filtered) {
      const month = a.date.slice(0, 7);
      const entry = grouped.get(month) ?? { total: 0, completed: 0, revenue: 0 };
      if (activeStatuses.includes(a.status)) entry.total += 1;
      if (a.status === "completed") {
        entry.completed += 1;
        entry.revenue += Number(a.price);
      }
      grouped.set(month, entry);
    }

    // Return in same order as monthLabels (newest first)
    return monthLabels
      .map((m) => {
        const data = grouped.get(m.key) ?? { total: 0, completed: 0, revenue: 0 };
        return { month: m.key, label: m.label, ...data };
      })
      .filter((s) => s.total > 0 || s.completed > 0);
  }, [historicalAppointments, monthLabels, byFilters]);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <StaffFilterBar
        branches={branches}
        showBranchFilter={showBranchFilter}
        selectedBranchId={selectedBranchId}
        selectedStaffId={selectedStaffId}
        visibleStaff={visibleStaff}
        onBranchChange={handleBranchChange}
        onStaffChange={setSelectedStaffId}
      />

      {/* Metrics */}
      <div>
        <Heading as="h2" className="mb-4 text-lg">Metricas</Heading>
        <div className="grid grid-cols-3 gap-3">
          <MetricCard label="Turnos hoy" value={todayCount} />
          <MetricCard label="Esta semana" value={weekCount} />
          <MetricCard label="Este mes" value={monthCount} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <MetricCard label="Ingresos hoy" value={formatARS(todayRevenue)} />
          <MetricCard
            label="Ingresos semana"
            value={formatARS(weekRevenue)}
            percentDiff={calcPercentDiff(weekRevenue, prevWeekRevenue)}
          />
          <MetricCard
            label="Ingresos del mes"
            value={formatARS(monthRevenue)}
            percentDiff={calcPercentDiff(monthRevenue, prevMonthRevenue)}
          />
        </div>
      </div>

      {/* Caja */}
      <CajaSection
        staff={staff}
        todayAppointments={byFilters(todayAppointments).filter((a) => a.status === "completed")}
        weekAppointments={byFilters(weekAppointments).filter((a) => a.status === "completed")}
        monthAppointments={byFilters(monthAppointments).filter((a) => a.status === "completed")}
      />

      {/* Charts */}
      {filteredSummaries.length > 0 && (
        <DashboardCharts summaries={filteredSummaries} />
      )}

      {/* Historical (all months) */}
      <div>
        <Heading as="h2" className="mb-4 text-lg">Historico</Heading>
        {filteredSummaries.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Text variant="muted">No hay datos historicos disponibles</Text>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Mes</th>
                      <th className="px-4 py-3 font-medium text-right">Turnos</th>
                      <th className="px-4 py-3 font-medium text-right">Completados</th>
                      <th className="px-4 py-3 font-medium text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.map((s) => (
                      <tr key={s.month} className="border-b last:border-0">
                        <td className="px-4 py-3 capitalize font-medium">{s.label}</td>
                        <td className="px-4 py-3 text-right">{s.total}</td>
                        <td className="px-4 py-3 text-right">{s.completed}</td>
                        <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatARS(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
