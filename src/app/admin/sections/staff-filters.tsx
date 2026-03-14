"use client";

import * as React from "react";
import {
  Text,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui";
import type { StaffMember, Branch } from "@/types";

export function useStaffFilters(staff: StaffMember[]) {
  const [selectedBranchId, setSelectedBranchId] = React.useState("all");
  const [selectedStaffId, setSelectedStaffId] = React.useState("all");

  const visibleStaff = React.useMemo(
    () => selectedBranchId === "all" ? staff : staff.filter((s) => s.branch_id === selectedBranchId),
    [staff, selectedBranchId],
  );

  const handleBranchChange = React.useCallback((value: string) => {
    setSelectedBranchId(value);
    setSelectedStaffId("all");
  }, []);

  const byFilters = React.useCallback(
    <T extends { staff_id: string }>(arr: T[]) => {
      let filtered = arr;
      if (selectedBranchId !== "all") {
        const branchStaffIds = new Set(staff.filter((s) => s.branch_id === selectedBranchId).map((s) => s.id));
        filtered = filtered.filter((a) => branchStaffIds.has(a.staff_id));
      }
      if (selectedStaffId !== "all") {
        filtered = filtered.filter((a) => a.staff_id === selectedStaffId);
      }
      return filtered;
    },
    [selectedBranchId, selectedStaffId, staff],
  );

  return {
    selectedBranchId,
    selectedStaffId,
    setSelectedStaffId,
    visibleStaff,
    handleBranchChange,
    byFilters,
  };
}

export function StaffFilterBar({
  branches,
  showBranchFilter,
  selectedBranchId,
  selectedStaffId,
  visibleStaff,
  onBranchChange,
  onStaffChange,
}: {
  branches: Branch[];
  showBranchFilter: boolean;
  selectedBranchId: string;
  selectedStaffId: string;
  visibleStaff: StaffMember[];
  onBranchChange: (value: string) => void;
  onStaffChange: (value: string) => void;
}) {
  if (!showBranchFilter && visibleStaff.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Text size="sm" variant="muted">Filtrar por:</Text>
      {showBranchFilter && branches.length > 1 && (
        <div className="w-56">
          <Select value={selectedBranchId} onValueChange={onBranchChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sucursales</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {visibleStaff.length > 1 && (
        <div className="w-52">
          <Select value={selectedStaffId} onValueChange={onStaffChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {visibleStaff.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
