/**
 * @module ReplayMap
 * @description Leaflet map for flight replay. Shows drone marker (rotated by heading),
 * progressive trail, and home marker. Auto-follows drone position.
 * @license GPL-3.0-only
 */
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { useTelemetryStore } from "@/stores/telemetry-store";
import { useTrailStore, type TrailPoint } from "@/stores/trail-store";
import { DEFAULT_CENTER } from "@/lib/map-constants";
import { Crosshair } from "lucide-react";
import "leaflet/dist/leaflet.css";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTR = '&copy; <a href="https://carto.com/">CARTO</a>';

// ── Drone Icon ───────────────────────────────────────────

function makeDroneIcon(heading: number): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<svg width="24" height="24" viewBox="0 -0.5 25 25" style="transform:rotate(${heading}deg)" xmlns="http://www.w3.org/2000/svg">
      <path d="m24.794 16.522-.281-2.748-10.191-5.131s.091-1.742 0-4.31c-.109-1.68-.786-3.184-1.839-4.339l.005.006h-.182c-1.048 1.15-1.726 2.653-1.834 4.312l-.001.021c-.091 2.567 0 4.31 0 4.31l-10.19 5.131-.281 2.748 6.889-2.074 3.491-.582c-.02.361-.031.783-.031 1.208 0 2.051.266 4.041.764 5.935l-.036-.162-2.728 1.095v1.798l3.52-.8c.155.312.3.566.456.812l-.021-.035v.282c.032-.046.062-.096.093-.143.032.046.061.096.094.143v-.282c.135-.21.28-.464.412-.726l.023-.051 3.52.8v-1.798l-2.728-1.095c.463-1.733.728-3.723.728-5.774 0-.425-.011-.847-.034-1.266l.003.058 3.492.582 6.888 2.074z" fill="#000000" stroke="#000" stroke-width="0.5" opacity="0.9"/>
    </svg>`,
  });
}

const homeIcon = L.divIcon({
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: `<svg width="16" height="16" viewBox="0 0 16 16">
    <circle cx="8" cy="8" r="6" fill="none" stroke="#3A82FF" stroke-width="1.5" stroke-dasharray="3 2"/>
    <circle cx="8" cy="8" r="2" fill="#3A82FF"/>
  </svg>`,
});

// ── Map Follower ─────────────────────────────────────────

function MapFollower({ position, enabled }: { position: [number, number] | null; enabled: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (enabled && position) {
      map.setView(position, map.getZoom(), { animate: true, duration: 0.3 });
    }
  }, [map, position, enabled]);
  return null;
}

// ── Main Component ───────────────────────────────────────

export function ReplayMap() {
  const posBuffer = useTelemetryStore((s) => s.position);
  const trailVersion = useTrailStore((s) => s._version);
  const trailRing = useTrailStore((s) => s._ring);

  const pos = posBuffer.latest();
  const [autoFollow, setAutoFollow] = useState(true);

  const dronePos: [number, number] | null = pos && pos.lat !== 0
    ? [pos.lat, pos.lon]
    : null;

  const droneIcon = useMemo(
    () => makeDroneIcon(pos?.heading ?? 0),
    [pos?.heading],
  );

  // Trail as positions array
  const trailPositions = useMemo(() => {
    // trailVersion used for reactivity
    void trailVersion;
    return trailRing.toArray().map((p: TrailPoint) => [p.lat, p.lon] as [number, number]);
  }, [trailRing, trailVersion]);

  // Home position (first trail point)
  const homePos = trailPositions.length > 0 ? trailPositions[0] : null;

  // Default center
  const defaultCenter: [number, number] = dronePos ?? homePos ?? DEFAULT_CENTER;

  // Disable auto-follow on user drag
  const handleMapDrag = useCallback(() => setAutoFollow(false), []);

  return (
    <div className="relative flex-1">
      <MapContainer
        center={defaultCenter}
        zoom={16}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />
        <MapFollower position={dronePos} enabled={autoFollow} />
        <MapDragDetector onDrag={handleMapDrag} />

        {/* Trail */}
        {trailPositions.length >= 2 && (
          <Polyline
            positions={trailPositions}
            pathOptions={{ color: "#3A82FF", weight: 2.5, opacity: 0.8 }}
          />
        )}

        {/* Home marker */}
        {homePos && <Marker position={homePos} icon={homeIcon} interactive={false} />}

        {/* Drone marker */}
        {dronePos && <Marker position={dronePos} icon={droneIcon} interactive={false} />}
      </MapContainer>

      {/* Re-center button (shown when auto-follow disabled) */}
      {!autoFollow && (
        <button
          onClick={() => setAutoFollow(true)}
          className="absolute bottom-3 right-3 z-[1000] flex items-center gap-1 px-2 py-1 text-[10px] font-mono text-text-secondary bg-bg-primary/90 border border-border-default rounded hover:text-text-primary transition-colors cursor-pointer"
        >
          <Crosshair size={12} />
          Re-center
        </button>
      )}
    </div>
  );
}

// ── Map Drag Detector ────────────────────────────────────

function MapDragDetector({ onDrag }: { onDrag: () => void }) {
  const map = useMap();
  useEffect(() => {
    map.on("dragstart", onDrag);
    return () => { map.off("dragstart", onDrag); };
  }, [map, onDrag]);
  return null;
}
