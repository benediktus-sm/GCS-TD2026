"use client";

import { useState, useEffect, useRef } from "react";
import { useTelemetryLatest } from "@/hooks/use-telemetry-latest";
import { useDroneStore } from "@/stores/drone-store";
import { useDroneManager } from "@/stores/drone-manager";
import { mpsToKph, normalizeHeading } from "@/lib/telemetry-utils";
import { MODE_DESCRIPTIONS } from "@/components/fc/flight-modes/flight-mode-constants";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import type { UnifiedFlightMode } from "@/lib/protocol/types";
import { useTelemetryDeck } from "./telemetry-deck/TelemetryDeck";

function gpsFixColor(fixType: number): string {
  if (fixType >= 3) return "text-status-success";
  if (fixType === 2) return "text-status-warning";
  return "text-status-error";
}

function batteryBarColor(pct: number): string {
  if (pct <= 25) return "bg-status-error";
  if (pct <= 50) return "bg-status-warning";
  return "bg-status-success";
}

function FlightCell({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-3.5 px-1 bg-bg-secondary hover:bg-bg-tertiary transition-colors">
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-mono font-bold tracking-widest text-green-400 uppercase">
          {label}
        </span>
        <span className="text-[9px] font-mono text-green-500/70 uppercase">
          {unit}
        </span>
      </div>
      <span className="text-2xl font-mono font-bold tabular-nums text-text-primary mt-1 tracking-tight">
        {value}
      </span>
    </div>
  );
}

export function TelemetryReadout() {
  const selectedDroneId = useDroneManager((s) => s.selectedDroneId);
  const isConnected = useDroneManager((s) => selectedDroneId ? s.drones.has(selectedDroneId) : false);

  const pos = useTelemetryLatest("position");
  const vfr = useTelemetryLatest("vfr");
  const bat = useTelemetryLatest("battery");
  const gps = useTelemetryLatest("gps");
  const mode = useDroneStore((s) => s.flightMode);
  const { controls: deckControls, panel: deckPanel } = useTelemetryDeck();

  const alt = pos?.alt ?? vfr?.alt ?? 0;
  const speedKph = mpsToKph(vfr?.groundspeed ?? pos?.groundSpeed ?? 0);
  const heading = normalizeHeading(pos?.heading ?? vfr?.heading ?? 0);
  const vs = vfr?.climb ?? pos?.climbRate ?? 0;
  const batteryPct = bat?.remaining ?? 0;
  const voltage = bat?.voltage ?? 0;
  const current = bat?.current ?? 0;
  const satellites = gps?.satellites ?? 0;
  const fixType = gps?.fixType ?? 0;

  const altStr = isConnected ? `${alt.toFixed(1)}` : "--.-";
  const speedStr = isConnected ? `${speedKph.toFixed(1)}` : "--.-";
  const headingStr = isConnected ? `${String(Math.round(heading)).padStart(3, "0")}\u00B0` : "---\u00B0";
  const vsStr = isConnected ? `${vs >= 0 ? "+" : ""}${vs.toFixed(1)}` : "--.-";

  return (
    <div className={cn("bg-bg-primary transition-opacity duration-200 border-b border-border-default", !isConnected && "opacity-60")}>
      {/* Primary flight metrics — High-visibility green bordered 4-cell grid */}
      <div className="grid grid-cols-4 gap-1.5 p-2 bg-bg-primary">
        <div className="rounded border-2 border-green-500 overflow-hidden bg-bg-secondary shadow-[0_0_8px_rgba(34,197,94,0.15)]">
          <FlightCell label="ALT" value={altStr} unit="m" />
        </div>
        <div className="rounded border-2 border-green-500 overflow-hidden bg-bg-secondary shadow-[0_0_8px_rgba(34,197,94,0.15)]">
          <FlightCell label="SPD" value={speedStr} unit="km/h" />
        </div>
        <div className="rounded border-2 border-green-500 overflow-hidden bg-bg-secondary shadow-[0_0_8px_rgba(34,197,94,0.15)]">
          <FlightCell label="HDG" value={headingStr} unit="mag" />
        </div>
        <div className="rounded border-2 border-green-500 overflow-hidden bg-bg-secondary shadow-[0_0_8px_rgba(34,197,94,0.15)]">
          <FlightCell label="V/S" value={vsStr} unit="m/s" />
        </div>
      </div>

      {/* Secondary Avionics Status bar — GPS, battery voltage/current, mode, deck controls */}
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-bg-secondary/60 text-[10px] font-mono">
        {/* GPS Fix + Satellites */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn("inline-block w-2 h-2 rounded-full", isConnected && fixType >= 3 ? "bg-status-success shadow-[0_0_6px_rgba(16,185,129,0.8)]" : isConnected && fixType === 2 ? "bg-status-warning" : "bg-status-error")} />
          <span className={cn("font-bold tabular-nums", isConnected ? gpsFixColor(fixType) : "text-text-tertiary")}>
            {isConnected ? (fixType >= 3 ? "3D FIX" : fixType === 2 ? "2D FIX" : "NO FIX") : "OFFLINE"}
          </span>
          <span className="text-text-tertiary">({isConnected ? satellites : 0} SAT)</span>
        </div>

        {/* Battery Power & Level */}
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0 px-2">
          {voltage > 0 && (
            <span className="text-text-secondary tabular-nums font-medium hidden sm:inline">
              {voltage.toFixed(1)}V
            </span>
          )}
          <div className="flex-1 max-w-[90px] h-1.5 bg-bg-tertiary rounded-full overflow-hidden border border-border-default">
            <div
              className={cn("h-full transition-all", isConnected ? batteryBarColor(batteryPct) : "bg-text-tertiary")}
              style={{ width: `${isConnected ? Math.max(batteryPct, 2) : 0}%` }}
            />
          </div>
          <span className={cn("tabular-nums font-bold", !isConnected ? "text-text-tertiary" : batteryPct <= 25 ? "text-status-error" : batteryPct <= 50 ? "text-status-warning" : "text-status-success")}>
            {isConnected ? `${Math.round(batteryPct)}%` : "--%"}
          </span>
        </div>

        {/* Flight mode + deck controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ModeLabel mode={isConnected ? mode : "OFFLINE"} />
          {deckControls}
        </div>
      </div>

      {/* Expandable telemetry deck — full width below status bar */}
      {deckPanel}
    </div>
  );
}

function ModeLabel({ mode }: { mode: string }) {
  const [show, setShow] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const prevModeRef = useRef(mode);
  const { toast } = useToast();
  const desc = MODE_DESCRIPTIONS[mode as UnifiedFlightMode];

  useEffect(() => {
    if (
      prevModeRef.current !== mode &&
      prevModeRef.current !== "" &&
      mode !== "OFFLINE" &&
      prevModeRef.current !== "OFFLINE"
    ) {
      setHighlight(true);
      toast(`Mode changed: ${prevModeRef.current} -> ${mode}`, "info");
      const timer = setTimeout(() => setHighlight(false), 1500);
      prevModeRef.current = mode;
      return () => clearTimeout(timer);
    }
    prevModeRef.current = mode;
  }, [mode, toast]);

  return (
    <div
      className="relative shrink-0"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span
        className={cn(
          "font-semibold uppercase cursor-default transition-colors duration-300",
          highlight ? "text-status-success" : "text-text-secondary",
        )}
        style={highlight ? {
          animation: "mode-pulse 1.5s ease-out",
          textShadow: "0 0 8px rgba(34, 197, 94, 0.6)",
        } : undefined}
      >
        {mode}
      </span>
      {show && desc && (
        <div className="absolute right-0 bottom-full mb-1 z-50 bg-bg-tertiary border border-border-default px-2 py-1.5 text-[10px] text-text-secondary whitespace-nowrap">
          {desc}
        </div>
      )}
    </div>
  );
}
 