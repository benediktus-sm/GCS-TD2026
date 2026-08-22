"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFleetStore } from "@/stores/fleet-store";
import { useDroneManager } from "@/stores/drone-manager";
import { useDroneMetadataStore } from "@/stores/drone-metadata-store";
import { useAgentCapabilitiesStore } from "@/stores/agent-capabilities-store";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { DroneStatusBadge } from "@/components/shared/drone-status-badge";
import { DroneOverviewTab } from "@/components/drone-detail/DroneOverviewTab";
import { DroneFlightsTab } from "@/components/drone-detail/DroneFlightsTab";
import { DroneConfigureTab } from "@/components/drone-detail/DroneConfigureTab";
import { CalibrationPanel } from "@/components/fc/calibration/CalibrationPanel";
import { ParametersPanel } from "@/components/fc/parameters/ParametersPanel";
import { DroneRadioPanel } from "@/components/dashboard/DroneRadioPanel";
import { X, RotateCcw, Trash2 } from "lucide-react";
import { ConnectionQualityMeter } from "@/components/indicators/ConnectionQualityMeter";
import { NavStatePill } from "@/components/indicators/NavStatePill";
import { TrafficPill } from "@/components/indicators/TrafficPill";
import { useUiStore } from "@/stores/ui-store";

const STATIC_TAB_IDS = ["overview", "flights", "calibrate", "parameters", "configure"] as const;
const RADIO_TAB_ID = "radio" as const;
type DroneDetailTab = (typeof STATIC_TAB_IDS)[number] | typeof RADIO_TAB_ID;

interface DroneDetailPanelProps {
  droneId: string;
  onClose: () => void;
}

export function DroneDetailPanel({ droneId, onClose }: DroneDetailPanelProps) {
  const t = useTranslations("dronePanel");
  const drones = useFleetStore((s) => s.drones);
  const removeDrone = useFleetStore((s) => s.removeDrone);
  const [activeTab, setActiveTab] = useState("overview");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { toast } = useToast();

  const radioPresent = useAgentCapabilitiesStore((s) => s.radio !== null);

  const tabs = useMemo(() => {
    const ids: DroneDetailTab[] = [...STATIC_TAB_IDS];
    if (radioPresent) ids.push(RADIO_TAB_ID);
    return ids.map((id) => ({ id, label: t(id) }));
  }, [t, radioPresent]);

  // If the active tab is the radio tab but the agent stopped
  // advertising a radio block, fall back to overview during render.
  // Computing this during render (instead of in an effect) avoids a
  // setState-in-effect cascade.
  const visibleTab =
    activeTab === RADIO_TAB_ID && !radioPresent ? "overview" : activeTab;

  const fallbackDrone = useMemo(() => ({
    id: "offline-drone",
    name: t("noDroneSelected", { defaultValue: "No Drone Selected" }),
    status: "offline" as const,
    connectionState: "disconnected" as const,
    flightMode: "STABILIZE" as const,
    armState: "disarmed" as const,
    lastHeartbeat: 0,
    healthScore: 0,
  }), [t]);

  const drone = droneId ? drones.find((d) => d.id === droneId) : fallbackDrone;
  const metadata = useDroneMetadataStore((s) => s.profiles[droneId || ""]);
  const managedDrones = useDroneManager((s) => s.drones);
  const isConnected = droneId ? managedDrones.has(droneId) : false;

  const immersiveMode = useUiStore((s) => s.immersiveMode);
  const exitImmersiveMode = useUiStore((s) => s.exitImmersiveMode);
  const pendingDetailTab = useUiStore((s) => s.pendingDetailTab);
  const setPendingDetailTab = useUiStore((s) => s.setPendingDetailTab);

  const displayName = metadata?.displayName ?? drone?.name ?? droneId;

  // Consume pending detail tab from Cmd+K navigation
  if (pendingDetailTab && activeTab !== pendingDetailTab) {
    setActiveTab(pendingDetailTab);
    setPendingDetailTab(null);
  }

  // Exit immersive mode if tab changes away from overview
  useEffect(() => {
    if (immersiveMode && activeTab !== "overview") {
      exitImmersiveMode();
    }
  }, [activeTab, immersiveMode, exitImmersiveMode]);

  // Select this drone in drone-manager so getSelectedProtocol() returns the right protocol
  useEffect(() => {
    if (isConnected) {
      useDroneManager.getState().selectDrone(droneId);
    }
  }, [droneId, isConnected]);

  function handleDelete() {
    // Disconnect if connected
    if (isConnected) {
      useDroneManager.getState().removeDrone(droneId);
    }
    // Remove from fleet
    removeDrone(droneId);
    // Delete metadata
    useDroneMetadataStore.getState().deleteProfile(droneId);
    setDeleteOpen(false);
    toast(`Drone "${displayName}" deleted`, "warning");
    onClose();
  }

  if (!drone) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-text-secondary">
          Drone &quot;{droneId}&quot; not found
        </p>
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t("backToDashboard")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Merged header + tabs bar — Tactical Avionics MFD Header */}
      {!immersiveMode && (
        <div className="flex items-center gap-2 px-3 py-1 bg-bg-secondary border-b border-border-default flex-shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono font-bold text-text-primary tracking-wide">{displayName}</span>
            <DroneStatusBadge status={drone.status} />
            {drone.id !== "offline-drone" && (
              <Button
                variant="ghost"
                size="sm"
                icon={<X size={12} />}
                className="h-6 w-6 p-0"
                onClick={onClose}
              />
            )}
          </div>

          <div className="w-px h-4 bg-border-default shrink-0 mx-1" />

          {/* MFD Navigation Segment Bar */}
          <div
            role="tablist"
            aria-label="Drone detail"
            className="flex items-center gap-1 self-stretch"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`drone-tab-${tab.id}`}
                role="tab"
                aria-selected={visibleTab === tab.id}
                aria-controls={`drone-tabpanel-${tab.id}`}
                tabIndex={visibleTab === tab.id ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => {
                  const idsArr = tabs.map((tt) => tt.id);
                  const idx = idsArr.indexOf(visibleTab as DroneDetailTab);
                  let nextIdx = idx;
                  if (e.key === "ArrowRight") {
                    nextIdx = (idx + 1) % idsArr.length;
                  } else if (e.key === "ArrowLeft") {
                    nextIdx = (idx - 1 + idsArr.length) % idsArr.length;
                  } else if (e.key === "Home") {
                    nextIdx = 0;
                  } else if (e.key === "End") {
                    nextIdx = idsArr.length - 1;
                  } else {
                    return;
                  }
                  e.preventDefault();
                  const nextId = idsArr[nextIdx];
                  setActiveTab(nextId);
                  requestAnimationFrame(() => {
                    document
                      .getElementById(`drone-tab-${nextId}`)
                      ?.focus();
                  });
                }}
                className={cn(
                  "flex items-center px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded transition-colors cursor-pointer shrink-0 border",
                  visibleTab === tab.id
                    ? "text-accent-primary bg-accent-primary/15 border-accent-primary/40 font-bold"
                    : "text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary/40 border-transparent"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {isConnected && (
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <NavStatePill />
              <TrafficPill />
              <ConnectionQualityMeter />
              <Button
                variant="danger"
                size="sm"
                icon={<RotateCcw size={11} />}
                className="h-6 px-2 text-[10px] font-mono font-bold tracking-wider uppercase border border-status-error/40 text-status-error hover:bg-status-error/15"
                onClick={() => {
                  const protocol = useDroneManager.getState().getSelectedProtocol();
                  if (protocol) protocol.reboot();
                }}
              >
                {t("rebootFc")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab content */}
      <div
        id={`drone-tabpanel-${visibleTab}`}
        role="tabpanel"
        aria-labelledby={`drone-tab-${visibleTab}`}
        className="flex-1 min-h-0 overflow-hidden flex flex-col"
      >
        {visibleTab === "overview" && <DroneOverviewTab drone={drone} />}
        {visibleTab === "flights" && <DroneFlightsTab droneId={droneId} />}
        {visibleTab === "calibrate" && <CalibrationPanel />}
        {visibleTab === "parameters" && <ParametersPanel />}
        {visibleTab === "configure" && (
          <DroneConfigureTab
            droneId={droneId}
            droneName={displayName}
            isConnected={isConnected}
          />
        )}
        {visibleTab === RADIO_TAB_ID && radioPresent && (
          <DroneRadioPanel droneId={droneId} />
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        title={t("deleteDrone")}
        message={t("deleteConfirm", { name: displayName })}
        confirmLabel={t("delete")}
        variant="danger"
      />
    </div>
  );
}
