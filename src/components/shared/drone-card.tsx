"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BatteryBar } from "./battery-bar";
import { StatusDot } from "@/components/ui/status-dot";
import { Cloud } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useDroneMetadataStore } from "@/stores/drone-metadata-store";
import type { FleetDrone, DroneStatus } from "@/lib/types";

interface DroneCardProps {
  drone: FleetDrone;
  selected?: boolean;
  onClick?: (id: string) => void;
  compact?: boolean;
}

const statusToBadgeVariant: Record<DroneStatus, "success" | "warning" | "error" | "info" | "neutral"> = {
  online: "success",
  in_mission: "info",
  idle: "neutral",
  returning: "warning",
  maintenance: "error",
  offline: "neutral",
};

const statusToDot: Record<DroneStatus, "online" | "idle" | "warning" | "error" | "offline"> = {
  online: "online",
  in_mission: "online",
  idle: "idle",
  returning: "warning",
  maintenance: "error",
  offline: "offline",
};

const gpsFixLabel: Record<number, string> = {
  0: "No Fix",
  2: "2D",
  3: "3D",
};

export function DroneCard({ drone, selected, onClick, compact = false }: DroneCardProps) {
  const displayName = useDroneMetadataStore((s) => s.profiles[drone.id]?.displayName) ?? drone.name;
  const tStatus = useTranslations("status");
  const sats = drone.gps?.satellites ?? 0;
  const fixType = drone.gps?.fixType ?? 0;
  const lowSats = sats < 6 && fixType > 0;

  return (
    <Card
      padding={!compact}
      className={cn(
        selected && "border-accent-primary bg-accent-primary/5",
        compact && "p-2"
      )}
      onClick={() => onClick?.(drone.id)}
    >
      <div className={cn("flex items-start justify-between", compact ? "mb-1" : "mb-2")}>
        <div className="flex items-center gap-1.5">
          <StatusDot status={statusToDot[drone.status]} />
          <span className={cn("font-semibold text-text-primary truncate max-w-[120px]", compact ? "text-xs" : "text-sm")}>{displayName}</span>
          {drone.source === "cloud" && (
            <Cloud size={10} className="text-accent-primary shrink-0" />
          )}
          {drone.runtimeMode === "lite" && (
            <Badge variant="info" className="text-[9px] px-1 py-0 h-3.5">
              {tStatus("runtimeMode.lite")}
            </Badge>
          )}
          {drone.profile === "ground-station" && (
            <span title={drone.role ? `Ground station — ${drone.role}` : "Ground station"}>
              <Badge variant="info" className="text-[9px] px-1 py-0 h-3.5">
                GS
              </Badge>
            </span>
          )}
          {drone.profile === "compute" && (
            <span title="Compute node">
              <Badge variant="info" className="text-[9px] px-1 py-0 h-3.5">
                CMP
              </Badge>
            </span>
          )}
          {drone.videoPipelineFlavor === "gst-native" && (
            <span
              title={
                drone.videoEncoderName
                  ? `Native GStreamer air pipeline (${drone.videoEncoderName}${drone.videoEncoderHwAccel ? " / HW" : " / SW"})`
                  : "Native GStreamer air pipeline"
              }
            >
              <Badge variant="info" className="text-[9px] px-1 py-0 h-3.5">
                GST
              </Badge>
            </span>
          )}
          {drone.attachedDisplayType === "spi-lcd" && (
            <span title='Local SPI LCD attached (Waveshare 3.5" / ILI9486)'>
              <Badge variant="neutral" className="text-[9px] px-1 py-0 h-3.5">
                LCD
              </Badge>
            </span>
          )}
          {drone.manualMavlinkWsUrl && (
            <span
              title={`Direct LAN MAVLink available — ${drone.manualMavlinkWsUrl}\nClick to copy to clipboard.`}
              onClick={(e) => {
                e.stopPropagation();
                if (drone.manualMavlinkWsUrl) {
                  navigator.clipboard?.writeText(drone.manualMavlinkWsUrl);
                }
              }}
              className="cursor-pointer shrink-0"
            >
              <Badge variant="success" className="text-[9px] px-1 py-0 h-3.5">
                Direct
              </Badge>
            </span>
          )}
          {(drone.profileSource === "detected" ||
            drone.profileSource === "tiebreaker" ||
            drone.profileSource === "default") && (
            <span
              title={
                drone.profileSource === "detected"
                  ? "Profile auto-detected from hardware fingerprint"
                  : drone.profileSource === "tiebreaker"
                  ? "Profile picked by tiebreaker. Confirm in setup."
                  : "Profile fell back to default. Confirm in setup."
              }
              className="inline-flex h-3.5 items-center rounded-sm bg-status-warning/20 px-0.5 font-mono text-[9px] lowercase text-status-warning shrink-0"
            >
              auto
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant={drone.armState === "armed" ? "warning" : "neutral"} className="text-[9px] px-1 py-0 h-3.5">
            {drone.armState}
          </Badge>
          <Badge variant={statusToBadgeVariant[drone.status]} className="text-[9px] px-1 py-0 h-3.5">{drone.status.replace("_", " ")}</Badge>
        </div>
      </div>
      <BatteryBar percentage={drone.battery?.remaining ?? 0} className={compact ? "mb-1" : "mb-2"} />
      <div className="flex items-center justify-between text-[9px] text-text-tertiary">
        <span className="font-mono truncate max-w-[80px]">{drone.flightMode}</span>
        <div className="flex items-center gap-1.5 min-w-0">
          {drone.gps && (
            <span className={cn("font-mono shrink-0", lowSats ? "text-status-warning" : "text-text-tertiary")}>
              {gpsFixLabel[fixType] ?? `Fix ${fixType}`} {sats}s
            </span>
          )}
          {drone.suiteName && <span className="truncate ml-0.5 max-w-[60px]">{drone.suiteName}</span>}
        </div>
      </div>
    </Card>
  );
}
