"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFleetStore } from "@/stores/fleet-store";
import { useDroneManager } from "@/stores/drone-manager";
import { useDroneMetadataStore } from "@/stores/drone-metadata-store";
import { useConnectDialogStore } from "@/stores/connect-dialog-store";
import { StatusDot } from "@/components/ui/status-dot";
import { Plus, Search, ChevronDown, ChevronUp } from "lucide-react";
import { DroneTile } from "@/components/shared/drone-tile";
import { cn } from "@/lib/utils";
import type { FleetDrone, DroneStatus } from "@/lib/types";

const statusToDot: Record<DroneStatus, "online" | "idle" | "warning" | "error" | "offline"> = {
  online: "online",
  in_mission: "online",
  idle: "idle",
  returning: "warning",
  maintenance: "error",
  offline: "offline",
};

function DroneMiniCard({
  drone,
  selected,
  onClick,
}: {
  drone: FleetDrone;
  selected?: boolean;
  onClick?: (id: string) => void;
}) {
  const displayName =
    useDroneMetadataStore((s) => s.profiles[drone.id]?.displayName) ?? drone.name;
  const batteryPct = Math.max(0, Math.min(100, drone.battery?.remaining ?? 0));
  const isArmed = drone.armState === "armed";

  return (
    <button
      onClick={() => onClick?.(drone.id)}
      title={`${displayName} — ${drone.status.replace("_", " ")} — ${batteryPct}%`}
      className={cn(
        "h-8 px-2 rounded flex items-center gap-2 border transition-colors cursor-pointer shrink-0 text-left",
        "bg-bg-primary border-border-default hover:border-border-strong",
        selected && "border-accent-primary bg-accent-primary/10",
        isArmed && "ring-1 ring-status-warning"
      )}
    >
      <StatusDot status={statusToDot[drone.status]} className="shrink-0" />
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="text-xs font-mono font-semibold text-text-primary truncate max-w-[100px]">
            {displayName}
          </span>
          <span
            className={cn(
              "text-[8px] px-1 py-0.2 rounded-xs font-mono uppercase font-bold tracking-tight shrink-0",
              isArmed
                ? "bg-status-warning/20 text-status-warning"
                : "bg-bg-tertiary text-text-tertiary"
            )}
          >
            {isArmed ? "ARM" : "DIS"}
          </span>
        </div>
        <div className="flex items-center gap-2 leading-none mt-1 text-[9px] text-text-tertiary font-mono">
          <span>{batteryPct}%</span>
        </div>
      </div>
    </button>
  );
}

interface DroneListPanelProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function DroneListPanel({ collapsed, onToggleCollapse }: DroneListPanelProps) {
  const t = useTranslations("fleet");
  const drones = useFleetStore((s) => s.drones);
  const selectedDroneId = useDroneManager((s) => s.selectedDroneId);
  const selectDrone = useDroneManager((s) => s.selectDrone);

  const [search, setSearch] = useState("");
  const openDialog = useConnectDialogStore((s) => s.openDialog);

  const filtered = useMemo(() => {
    if (!search.trim()) return drones;
    const q = search.toLowerCase();
    return drones.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        (d.suiteName && d.suiteName.toLowerCase().includes(q))
    );
  }, [drones, search]);

  if (collapsed) {
    return (
      <div className="w-full flex flex-row items-center gap-3 px-3 py-1.5 bg-bg-secondary h-10 border-b border-border-default shrink-0">
        {/* Header: label + add + expand */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-text-tertiary">
            {t("title")}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); openDialog(); }}
            className="w-6 h-6 flex items-center justify-center bg-accent-primary/10 hover:bg-accent-primary transition-colors cursor-pointer group rounded"
            title={t("addDrone")}
          >
            <Plus size={12} className="text-accent-primary group-hover:text-bg-primary transition-colors" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="w-6 h-6 flex items-center justify-center hover:bg-bg-tertiary transition-colors cursor-pointer group rounded"
            title={t("expandPanel")}
          >
            <ChevronDown size={12} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
          </button>
        </div>

        <div className="w-px h-4 bg-border-default shrink-0" />

        {/* Drone tiles */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-row items-center gap-1.5 min-w-0">
          {drones.map((drone) => (
            <DroneTile
              key={drone.id}
              drone={drone}
              selected={drone.id === selectedDroneId}
              onClick={selectDrone}
            />
          ))}
        </div>

        <div className="w-px h-4 bg-border-default shrink-0" />

        {/* Count */}
        <div className="text-right shrink-0">
          <span className="text-[9px] text-text-tertiary font-mono">{drones.length}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-row items-center gap-3 px-3 py-1.5 bg-bg-secondary h-11 border-b border-border-default shrink-0">
      {/* Left Header */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-secondary">
          {t("title")}
        </span>
        <span className="text-[10px] text-text-tertiary font-mono bg-bg-tertiary px-1.5 py-0.5 rounded">
          {drones.length}
        </span>
      </div>

      <div className="w-px h-4 bg-border-default shrink-0" />

      {/* Middle: Horizontal scrollable drone list */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex flex-row items-center gap-1.5 min-w-0 py-0.5">
        {filtered.map((drone) => (
          <DroneMiniCard
            key={drone.id}
            drone={drone}
            selected={drone.id === selectedDroneId}
            onClick={selectDrone}
          />
        ))}
        {filtered.length === 0 && (
          <div className="text-xs text-text-tertiary font-mono py-1">
            {search ? t("noMatch") : t("noDrones")}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border-default shrink-0" />

      {/* Right Controls: Search bar, Add, Collapse */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search Bar - aligned to the right */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-bg-primary border border-border-default rounded w-40">
          <Search size={11} className="text-text-tertiary shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchDrones")}
            className="w-full bg-transparent text-[11px] font-mono text-text-primary placeholder:text-text-tertiary outline-none"
          />
        </div>

        <button
          onClick={openDialog}
          className="w-6 h-6 flex items-center justify-center bg-accent-primary/10 hover:bg-accent-primary transition-colors cursor-pointer group rounded"
          title={t("addDrone")}
        >
          <Plus size={12} className="text-accent-primary group-hover:text-bg-primary transition-colors" />
        </button>

        <button
          onClick={onToggleCollapse}
          className="w-6 h-6 flex items-center justify-center hover:bg-bg-tertiary transition-colors cursor-pointer group rounded"
          title={t("collapsePanel")}
        >
          <ChevronUp size={12} className="text-text-tertiary group-hover:text-text-secondary transition-colors" />
        </button>
      </div>
    </div>
  );
}
