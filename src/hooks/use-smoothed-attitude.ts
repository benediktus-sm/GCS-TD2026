"use client";

// Dead-reckoning smoothing for attitude indicators. MAVLink ATTITUDE frames
// arrive at whatever rate the link allows (often just a few Hz over a
// low-bandwidth radio link like LoRa), which makes artificial horizons feel
// like they're "jumping" between positions instead of moving smoothly.
// This extrapolates roll/pitch/yaw forward from the latest sample using the
// gyro angular rates already in the frame, redrawing every animation frame
// regardless of how often new telemetry actually arrives.

import { useEffect, useRef, useState } from "react";
import { useTelemetryStore } from "@/stores/telemetry-store";
import { extrapolateAttitude, type ExtrapolatedAttitude } from "@/lib/attitude-extrapolate";

export type SmoothedAttitude = ExtrapolatedAttitude;

export function useSmoothedAttitude(): SmoothedAttitude {
  useTelemetryStore((s) => s._version);
  const latest = useTelemetryStore((s) => s.attitude.latest());
  const [smoothed, setSmoothed] = useState<SmoothedAttitude>({ roll: 0, pitch: 0, yaw: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!latest) return;

    const tick = () => {
      setSmoothed(extrapolateAttitude(latest));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [latest]);

  return smoothed;
}
