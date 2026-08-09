import { useState } from "react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import {
  ChevronLeft, ChevronRight, Maximize2, Zap, Package,
  ClipboardCheck, Activity, Cpu, Fingerprint, BarChart2, AlertTriangle, Check, X,
} from "lucide-react";
import { TelemetryReadout } from "@/components/flight/TelemetryReadout";
import { ActionsPanel } from "@/components/flight/ActionsPanel";
import { LoadoutSelector } from "@/components/flight/LoadoutSelector";
import { CompactInfoCards } from "@/components/flight/CompactInfoCards";
import { OsdOverlay } from "@/components/flight/OsdOverlay";
import { ProximityRadar } from "@/components/flight/ProximityRadar";
import { VideoCanvas } from "@/components/flight/VideoCanvas";
import { TelemetryFreshnessIndicator } from "@/components/indicators/TelemetryFreshnessIndicator";
import { RecordingControls } from "@/components/shared/RecordingControls";
import { useChecklistStore } from "@/stores/checklist-store";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";
import type { FleetDrone } from "@/lib/types";

const OverviewHud = dynamic(
  () => import("@/components/flight/OverviewHud").then((m) => m.OverviewHud),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0a1428] border border-border-default flex items-center justify-center">
        <span className="text-[10px] font-mono text-text-tertiary">Loading HUD...</span>
      </div>
    ),
  }
);

const OverviewMap = dynamic(
  () => import("@/components/flight/OverviewMap").then((m) => m.OverviewMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0a0a0a] border border-border-default flex items-center justify-center">
        <span className="text-[10px] font-mono text-text-tertiary">Loading Map...</span>
      </div>
    ),
  }
);

interface DroneOverviewTabProps {
  drone: FleetDrone;
}

type RightPanel = "map" | "fly";
type HudSubTab = "quick" | "loadout" | "preflight" | "health" | "vehicle" | "identity" | "stats" | "emergency";

const HUD_SUB_TABS: { id: HudSubTab; label: string; icon: React.ReactNode }[] = [
  { id: "quick", label: "Quick", icon: <Zap size={12} /> },
  { id: "loadout", label: "Loadout", icon: <Package size={12} /> },
  { id: "preflight", label: "Pre-flight", icon: <ClipboardCheck size={12} /> },
  { id: "health", label: "Health", icon: <Activity size={12} /> },
  { id: "vehicle", label: "Vehicle", icon: <Cpu size={12} /> },
  { id: "identity", label: "Identity", icon: <Fingerprint size={12} /> },
  { id: "stats", label: "Stats", icon: <BarChart2 size={12} /> },
  { id: "emergency", label: "Emergency", icon: <AlertTriangle size={12} /> },
];

export function DroneOverviewTab({ drone }: DroneOverviewTabProps) {
  const t = useTranslations("droneDetail");
  const [rightPanel, setRightPanel] = useState<RightPanel>("map");
  const [telemetryCollapsed, setTelemetryCollapsed] = useState(false);
  const [hudSubTab, setHudSubTab] = useState<HudSubTab>("quick");
  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const enterImmersiveMode = useUiStore((s) => s.enterImmersiveMode);

  const checklistItems = useChecklistStore((s) => s.items);
  const toggleItem = useChecklistStore((s) => s.toggleItem);
  const resetSession = useChecklistStore((s) => s.resetSession);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left column: HUD + Telemetry + Info */}
      {!immersiveMode && !telemetryCollapsed && (
        <div className="w-[22rem] shrink-0 flex flex-col overflow-y-auto border-r border-border-default">
          {/* Telemetry freshness dots */}
          <div className="px-3 py-1.5 border-b border-border-default shrink-0">
            <TelemetryFreshnessIndicator />
          </div>

          {/* Compact HUD */}
          <div className="h-60 shrink-0">
            <OverviewHud />
          </div>

          {/* Sub-tab Navigation Bar */}
          <div className="flex items-center gap-1 p-1 bg-bg-secondary border-b border-border-default overflow-x-auto shrink-0 no-scrollbar">
            {HUD_SUB_TABS.map((tab) => {
              const active = hudSubTab === tab.id;
              const isDanger = tab.id === "emergency";
              return (
                <button
                  key={tab.id}
                  onClick={() => setHudSubTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-medium rounded transition-all shrink-0 cursor-pointer",
                    active
                      ? isDanger
                        ? "bg-status-error/20 text-status-error border border-status-error/40 font-bold"
                        : "bg-bg-tertiary text-text-primary border border-border-strong font-semibold shadow-xs"
                      : isDanger
                      ? "text-status-error/70 hover:text-status-error hover:bg-status-error/10"
                      : "text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary/50"
                  )}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sub-tab Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {hudSubTab === "quick" && (
              <>
                <TelemetryReadout />
                <ActionsPanel mode="quick" />
              </>
            )}

            {hudSubTab === "loadout" && (
              <div className="p-3">
                <LoadoutSelector />
              </div>
            )}

            {hudSubTab === "preflight" && (
              <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <ClipboardCheck size={14} className="text-accent-primary" />
                    <span>Pre-Flight Checklist</span>
                  </h4>
                  <button
                    onClick={resetSession}
                    className="text-[10px] font-mono text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {checklistItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={cn(
                        "flex items-center justify-between p-2 text-xs rounded border transition-all text-left cursor-pointer group",
                        item.status === "pass"
                          ? "bg-status-success/10 border-status-success/30 text-status-success"
                          : item.status === "fail"
                          ? "bg-status-error/10 border-status-error/30 text-status-error"
                          : "bg-bg-tertiary/50 border-border-default text-text-secondary hover:bg-bg-tertiary hover:border-border-strong"
                      )}
                    >
                      <span className="font-medium truncate pr-2">{item.label}</span>
                      <div className="shrink-0 flex items-center justify-center">
                        {item.status === "pass" ? (
                          <div className="w-4 h-4 rounded bg-status-success text-bg-primary flex items-center justify-center">
                            <Check size={11} strokeWidth={3} />
                          </div>
                        ) : item.status === "fail" ? (
                          <div className="w-4 h-4 rounded bg-status-error text-bg-primary flex items-center justify-center">
                            <X size={11} strokeWidth={3} />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded border border-border-strong bg-bg-primary group-hover:border-accent-primary transition-colors flex items-center justify-center" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hudSubTab === "health" && (
              <CompactInfoCards drone={drone} filterTab="health" />
            )}

            {hudSubTab === "vehicle" && (
              <CompactInfoCards drone={drone} filterTab="vehicle" />
            )}

            {hudSubTab === "identity" && (
              <CompactInfoCards drone={drone} filterTab="identity" />
            )}

            {hudSubTab === "stats" && (
              <CompactInfoCards drone={drone} filterTab="stats" />
            )}

            {hudSubTab === "emergency" && (
              <div className="p-3">
                <ActionsPanel mode="emergency" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right column: Map / Fly toggle */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Sub-tab bar */}
        {!immersiveMode && (
          <div className="flex items-center gap-1 px-2 py-1.5 bg-bg-secondary border-b border-border-default shrink-0">
            <button
              onClick={() => setTelemetryCollapsed((c) => !c)}
              className="p-1 text-text-tertiary hover:text-text-primary transition-colors"
              title={telemetryCollapsed ? "Show telemetry panel" : "Hide telemetry panel"}
            >
              {telemetryCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
            <button
              onClick={() => setRightPanel("map")}
              className={
                rightPanel === "map"
                  ? "px-3 py-1 text-xs font-mono font-semibold text-text-primary bg-bg-tertiary rounded"
                  : "px-3 py-1 text-xs font-mono text-text-tertiary hover:text-text-secondary transition-colors rounded"
              }
            >
              {t("map")}
            </button>
            <button
              onClick={() => setRightPanel("fly")}
              className={
                rightPanel === "fly"
                  ? "px-3 py-1 text-xs font-mono font-semibold text-text-primary bg-bg-tertiary rounded"
                  : "px-3 py-1 text-xs font-mono text-text-tertiary hover:text-text-secondary transition-colors rounded"
              }
            >
              {t("fly")}
            </button>
            <div className="flex-1" />
            <button
              onClick={enterImmersiveMode}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-tertiary hover:text-text-primary transition-colors"
              title="Enter immersive mode"
            >
              <Maximize2 size={12} />
              {t("immersive")}
            </button>
            <RecordingControls />
          </div>
        )}

        {/* Panel content */}
        <div className="flex-1 min-h-0">
          {rightPanel === "map" && <OverviewMap />}
          {rightPanel === "fly" && (
            <div className="relative h-full">
              <VideoCanvas>
                <OsdOverlay />
                <ProximityRadar />
              </VideoCanvas>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
