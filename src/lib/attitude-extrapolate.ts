/**
 * Dead-reckoning extrapolation for attitude indicators.
 * Shared by use-smoothed-attitude.ts (React hook consumers) and any
 * imperative draw loop (e.g. OverviewHud's canvas) that reads telemetry
 * store state directly instead of subscribing via hooks.
 */
import type { AttitudeData } from "@/lib/types/telemetry";

const RAD_TO_DEG = 180 / Math.PI;
// Stop extrapolating (freeze on last known angle) if telemetry goes stale
// for longer than this — avoids the indicator spinning away on a lost link.
const MAX_EXTRAPOLATION_MS = 500;

export interface ExtrapolatedAttitude {
  roll: number;
  pitch: number;
  yaw: number;
}

function normalizeHeading(deg: number): number {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Extrapolate roll/pitch/yaw (degrees) forward from the latest sample using its gyro rates. */
export function extrapolateAttitude(att: AttitudeData | undefined, now: number = Date.now()): ExtrapolatedAttitude {
  if (!att) return { roll: 0, pitch: 0, yaw: 0 };
  const elapsedSec = Math.min(now - att.timestamp, MAX_EXTRAPOLATION_MS) / 1000;
  return {
    roll: att.roll + att.rollSpeed * RAD_TO_DEG * elapsedSec,
    pitch: att.pitch + att.pitchSpeed * RAD_TO_DEG * elapsedSec,
    yaw: normalizeHeading(att.yaw + att.yawSpeed * RAD_TO_DEG * elapsedSec),
  };
}
