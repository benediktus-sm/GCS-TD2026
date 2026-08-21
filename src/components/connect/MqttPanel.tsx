"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plug, Wifi } from "lucide-react";
import { MqttMavlinkTransport } from "@/lib/protocol/transport/mqtt-mavlink";
import { MAVLinkAdapter } from "@/lib/protocol/mavlink-adapter";
import { useDroneManager } from "@/stores/drone-manager";
import { useDroneMetadataStore } from "@/stores/drone-metadata-store";
import { randomId } from "@/lib/utils";

const QUICK_PRESETS = [
  { label: "Altnautica Public VPS", url: "wss://mqtt.altnautica.com/mqtt", deviceId: "alpha-1" },
  { label: "Local MQTT Broker (WS)", url: "ws://localhost:9001", deviceId: "drone-1" },
  { label: "Self-Hosted VPS (WS)", url: "ws://192.168.1.100:8083/mqtt", deviceId: "vps-drone-1" },
];

export function MqttPanel({
  onConnected,
  brokerUrl: externalBrokerUrl,
  onBrokerUrlChange,
  targetDroneId,
}: {
  onConnected?: (name: string, type: "mqtt-mavlink", detail: string) => void;
  brokerUrl?: string;
  onBrokerUrlChange?: (url: string) => void;
  /** When set, connects this transport as an additional link to the existing drone (multi-link mode). */
  targetDroneId?: string | null;
}) {
  const [localBrokerUrl, setLocalBrokerUrl] = useState("wss://mqtt.altnautica.com/mqtt");
  const [deviceId, setDeviceId] = useState("alpha-1");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDrone = useDroneManager((s) => s.addDrone);
  const attachLinkToDrone = useDroneManager((s) => s.attachLinkToDrone);

  const effectiveBrokerUrl = externalBrokerUrl ?? localBrokerUrl;

  const handleBrokerUrlChange = (next: string) => {
    setLocalBrokerUrl(next);
    onBrokerUrlChange?.(next);
  };

  async function handleConnect() {
    setError(null);
    const trimmedUrl = effectiveBrokerUrl.trim();
    const trimmedDeviceId = deviceId.trim();

    if (!trimmedUrl) {
      setError("Broker URL is required");
      return;
    }
    if (!trimmedDeviceId) {
      setError("Device ID / Topic prefix is required");
      return;
    }

    setConnecting(true);
    try {
      const transport = new MqttMavlinkTransport();
      await transport.connect(trimmedDeviceId, trimmedUrl, {
        username: username.trim() || undefined,
        password: password || undefined,
      });

      // Multi-link mode: attach as secondary link to existing drone
      if (targetDroneId) {
        const result = await attachLinkToDrone(targetDroneId, transport);
        if (!result.ok) {
          try { await transport.disconnect(); } catch { /* ignore */ }
          setError(result.error);
          setConnecting(false);
          return;
        }
        onConnected?.("link", "mqtt-mavlink", `${trimmedUrl} (${trimmedDeviceId})`);
        setConnecting(false);
        return;
      }

      const adapter = new MAVLinkAdapter();
      const vehicleInfo = await adapter.connect(transport);
      const droneId = randomId();

      const sysIdSuffix = vehicleInfo.systemId > 0 ? ` #${vehicleInfo.systemId}` : "";
      const droneName = `MQTT ${trimmedDeviceId}${sysIdSuffix}`;

      addDrone(droneId, droneName, adapter, transport, vehicleInfo, {
        type: "mqtt-mavlink",
        url: trimmedUrl,
        deviceId: trimmedDeviceId,
        username: username.trim() || undefined,
      });

      useDroneMetadataStore.getState().ensureProfile(droneId, {
        displayName: droneName,
        serial: `ALT-MQTT-${trimmedDeviceId.toUpperCase()}`,
        enrolledAt: Date.now(),
      });

      onConnected?.(droneName, "mqtt-mavlink", trimmedUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "MQTT connection failed");
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="VPS Broker URL (WebSocket)"
          value={effectiveBrokerUrl}
          onChange={(e) => {
            handleBrokerUrlChange(e.target.value);
            setError(null);
          }}
          placeholder="wss://mqtt.altnautica.com/mqtt"
        />

        <Input
          label="Device ID / Topic Prefix"
          value={deviceId}
          onChange={(e) => {
            setDeviceId(e.target.value);
            setError(null);
          }}
          placeholder="alpha-1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input
          label="Username (Optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="mqtt-user"
        />

        <Input
          label="Password (Optional)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {/* Quick Presets */}
      <div>
        <div className="text-[10px] uppercase tracking-wide text-text-tertiary mb-1.5 flex items-center gap-1">
          <Wifi size={10} />
          VPS Broker Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.url}
              onClick={() => {
                handleBrokerUrlChange(preset.url);
                setDeviceId(preset.deviceId);
              }}
              className={`px-2 py-1 text-[10px] font-mono border transition-colors cursor-pointer ${
                effectiveBrokerUrl === preset.url
                  ? "border-accent-primary text-accent-primary bg-accent-primary/10"
                  : "border-border-default text-text-tertiary hover:text-text-secondary hover:border-border-strong"
              }`}
            >
              {preset.label} ({preset.url.replace(/^wss?:\/\//, "")})
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleConnect}
        loading={connecting}
        icon={<Plug size={14} />}
      >
        {connecting ? "Connecting via MQTT..." : "Connect via VPS MQTT"}
      </Button>

      <p className="text-[10px] text-text-tertiary">
        Ensure your VPS Mosquitto/EMQX broker supports WebSocket listener (e.g. port 8083 or 9001) and topic pattern{" "}
        <code className="text-text-secondary">ados/&lt;device-id&gt;/mavlink/#</code>
      </p>

      {error && <p className="text-xs text-status-error">{error}</p>}
    </div>
  );
}
