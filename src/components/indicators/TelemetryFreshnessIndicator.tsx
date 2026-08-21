"use client";

import { useTranslations } from "next-intl";
import { useTelemetryFreshness } from "@/hooks/use-telemetry-freshness";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

type TelemetryChannel = "attitude" | "position" | "battery" | "gps" | "vfr" | "rc" | "sysStatus" | "radio" | "ekf" | "wind" | "navController";

const DISPLAY_CHANNELS: { key: TelemetryChannel; labelKey: string; short: string }[] = [
  { key: "attitude", labelKey: "telemetryChannels.attitude", short: "ATT" },
  { key: "position", labelKey: "telemetryChannels.position", short: "POS" },
  { key: "battery", labelKey: "telemetryChannels.battery", short: "BAT" },
  { key: "gps", labelKey: "telemetryChannels.gps", short: "GPS" },
  { key: "rc", labelKey: "telemetryChannels.rcInput", short: "RC" },
  { key: "radio", labelKey: "telemetryChannels.radio", short: "RAD" },
  { key: "vfr", labelKey: "telemetryChannels.vfrHud", short: "VFR" },
  { key: "sysStatus", labelKey: "telemetryChannels.systemStatus", short: "SYS" },
  { key: "ekf", labelKey: "telemetryChannels.ekf", short: "EKF" },
  { key: "wind", labelKey: "telemetryChannels.wind", short: "WND" },
  { key: "navController", labelKey: "telemetryChannels.navController", short: "NAV" },
];

const FRESHNESS_COLORS = {
  fresh: "bg-status-success",
  stale: "bg-status-warning",
  lost: "bg-status-error",
  none: "bg-text-tertiary/40",
} as const;

const FRESHNESS_BG = {
  fresh: "border-status-success/30 bg-status-success/10 text-status-success",
  stale: "border-status-warning/30 bg-status-warning/10 text-status-warning",
  lost: "border-status-error/30 bg-status-error/10 text-status-error",
  none: "border-border-default bg-bg-tertiary/40 text-text-tertiary",
} as const;

/**
 * Row of per-channel status button chips for key telemetry channels.
 * Green = receiving data, yellow = stale, red = lost, gray = never received.
 */
export function TelemetryFreshnessIndicator({ className }: { className?: string }) {
  const t = useTranslations("indicators");
  const { getFreshness } = useTelemetryFreshness();

  const freshnessLabel = {
    fresh: t("telemetryFresh"),
    stale: t("telemetryStale"),
    lost: t("telemetryLost"),
    none: t("telemetryNone"),
  } as const;

  return (
    <div className={cn("grid grid-cols-11 gap-0.5 w-full", className)}>
      {DISPLAY_CHANNELS.map(({ key, labelKey, short }) => {
        const freshness = getFreshness(key);
        const label = t(labelKey);
        return (
          <Tooltip key={key} content={`${label}: ${freshnessLabel[freshness]}`}>
            <button
              type="button"
              className={cn(
                "h-5 px-0.5 rounded flex items-center justify-center gap-0.5 border text-[8px] font-mono font-bold transition-colors cursor-pointer select-none min-w-0",
                FRESHNESS_BG[freshness]
              )}
            >
              <span className={cn("w-1 h-1 rounded-full shrink-0", FRESHNESS_COLORS[freshness])} />
              <span className="leading-none truncate">{short}</span>
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
}

