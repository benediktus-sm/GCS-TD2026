"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Power, PlaneTakeoff, PlaneLanding,
  Pause, Play, XOctagon, Skull, ClipboardCheck,
} from "lucide-react";
import { FollowMeButton } from "./FollowMeButton";
import { LoadoutSelector } from "./LoadoutSelector";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { FlightModeSelector } from "@/components/shared/flight-mode-selector";
import { ActionDialogs } from "./action-dialogs";
import { useDroneStore } from "@/stores/drone-store";
import { useDroneManager } from "@/stores/drone-manager";
import { useChecklistStore } from "@/stores/checklist-store";
import { useFirmwareCapabilities } from "@/hooks/use-firmware-capabilities";
import { useFlightShortcuts } from "@/hooks/use-flight-shortcuts";
import { useShallow } from "zustand/react/shallow";
import { cn } from "@/lib/utils";


interface ActionsPanelProps {
  mode?: "quick" | "emergency" | "full";
}

export function ActionsPanel({ mode = "quick" }: ActionsPanelProps) {
  const t = useTranslations("flight");
  const selectedDroneId = useDroneManager((s) => s.selectedDroneId);
  const isConnected = useDroneManager((s) => selectedDroneId ? s.drones.has(selectedDroneId) : false);

  const armState = useDroneStore((s) => s.armState);
  const flightMode = useDroneStore((s) => s.flightMode);
  const previousMode = useDroneStore((s) => s.previousMode);
  const setFlightMode = useDroneStore((s) => s.setFlightMode);
  const getProtocol = useDroneManager((s) => s.getSelectedProtocol);

  const [showArmConfirm, setShowArmConfirm] = useState(false);
  const [showDisarmConfirm, setShowDisarmConfirm] = useState(false);
  const [showRthConfirm, setShowRthConfirm] = useState(false);
  const [showTakeoffConfirm, setShowTakeoffConfirm] = useState(false);
  const [showLandConfirm, setShowLandConfirm] = useState(false);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);
  const [showKillConfirm, setShowKillConfirm] = useState(false);
  const [takeoffAlt, setTakeoffAlt] = useState("10");
  const [showChecklist, setShowChecklist] = useState(false);
  const checklistReady = useChecklistStore(
    (s) => s.items.every((item) => item.status === "pass" || item.status === "skipped")
  );
  const checklistProgress = useChecklistStore(
    useShallow((s) => {
      const items = s.items;
      return {
        total: items.length,
        checked: items.filter((i) => i.status === "pass" || i.status === "skipped").length,
        failed: items.filter((i) => i.status === "fail").length,
      };
    })
  );

  const isArmed = armState === "armed";
  const protocol = getProtocol();
  const { supports } = useFirmwareCapabilities();
  const hasMissions = supports("supportsMissionUpload");
  const hasAutonomousFlight = supports("supportsGeoFence"); // RTL/Land/Takeoff require autonomous nav

  useFlightShortcuts({
    enabled: true,
    onArmConfirm: () => setShowArmConfirm(true),
    onDisarmConfirm: () => setShowDisarmConfirm(true),
    onRthConfirm: () => setShowRthConfirm(true),
    onTakeoffConfirm: () => setShowTakeoffConfirm(true),
    onLandConfirm: () => setShowLandConfirm(true),
    onAbortConfirm: () => setShowAbortConfirm(true),
    takeoffAlt,
  });

  if (mode === "emergency") {
    return (
      <>
        <div className={cn("p-3 bg-status-error/5 border border-status-error/30 rounded flex flex-col gap-2 transition-opacity duration-200", !isConnected && "opacity-50 pointer-events-none")}>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-status-error uppercase tracking-wider">
            <XOctagon size={14} />
            <span>Emergency Operations</span>
          </div>
          <p className="text-[10px] text-text-tertiary">
            Use these safety overrides only during immediate flight hazards. Actions take effect instantly after confirmation.
          </p>

          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1">
              <Tooltip content="Abort Mission (Shift+X)" position="top">
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full h-9 font-semibold text-xs flex items-center justify-center gap-1.5"
                  icon={<XOctagon size={14} />}
                  onClick={() => setShowAbortConfirm(true)}
                >
                  {t("abort") || "ABORT MISSION"}
                </Button>
              </Tooltip>
            </div>
            <div className="flex-1">
              <Tooltip content="Kill all motors immediately" position="top">
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Skull size={14} />}
                  className="w-full h-9 font-semibold text-xs bg-red-800 hover:bg-red-700 border-red-600 flex items-center justify-center gap-1.5"
                  onClick={() => setShowKillConfirm(true)}
                >
                  KILL MOTORS
                </Button>
              </Tooltip>
            </div>
          </div>
        </div>

        <ActionDialogs
          showArmConfirm={showArmConfirm}
          setShowArmConfirm={setShowArmConfirm}
          showDisarmConfirm={showDisarmConfirm}
          setShowDisarmConfirm={setShowDisarmConfirm}
          showRthConfirm={showRthConfirm}
          setShowRthConfirm={setShowRthConfirm}
          showTakeoffConfirm={showTakeoffConfirm}
          setShowTakeoffConfirm={setShowTakeoffConfirm}
          showLandConfirm={showLandConfirm}
          setShowLandConfirm={setShowLandConfirm}
          showAbortConfirm={showAbortConfirm}
          setShowAbortConfirm={setShowAbortConfirm}
          showKillConfirm={showKillConfirm}
          setShowKillConfirm={setShowKillConfirm}
          showChecklist={showChecklist}
          setShowChecklist={setShowChecklist}
          checklistReady={checklistReady}
          takeoffAlt={takeoffAlt}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("p-2.5 bg-transparent flex flex-col gap-1.5 transition-opacity duration-200", !isConnected && "opacity-50 pointer-events-none")}>
        <div className="flex items-center gap-1.5">
          {/* ARM / DISARM — Heavy industrial safety switch styling */}
          <div className="flex-1 [&>*]:w-full">
            <Tooltip
              content={isArmed ? t("disarmShortcut") : t("armShortcut")}
              position="right"
            >
              <Button
                variant="secondary"
                size="sm"
                icon={<Power size={13} />}
                className={cn(
                  "w-full h-8 text-xs font-mono font-bold tracking-wider uppercase text-white transition-colors cursor-pointer rounded border",
                  isArmed
                    ? "bg-status-success hover:bg-status-success/85 border-status-success"
                    : "bg-status-error hover:bg-status-error/85 border-status-error"
                )}
                onClick={() => {
                  if (isArmed) setShowDisarmConfirm(true);
                  else setShowArmConfirm(true);
                }}
              >
                {isArmed ? t("disarm") : t("arm")}
              </Button>
            </Tooltip>
          </div>

          {/* Flight mode selector */}
          <div className="flex-1">
            <FlightModeSelector
              value={flightMode}
              onChange={(mode) => {
                if (protocol) protocol.setFlightMode(mode);
                else setFlightMode(mode);
              }}
              className="w-full h-8 text-xs font-mono"
            />
          </div>
        </div>

        {/* All action buttons — Tactile Avionics Pushbutton Grid */}
        <div className="grid grid-cols-5 gap-1 pt-0.5">
          {hasAutonomousFlight && (
            <div>
              {hasMissions && flightMode === "AUTO" ? (
                <Tooltip content="Pause mission (Shift+P)" position="top">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider rounded border border-border-default hover:border-accent-primary/50"
                    icon={<Pause size={11} />}
                    onClick={() => {
                      if (protocol) protocol.pauseMission();
                      else setFlightMode("LOITER");
                    }}
                  >
                    PAUSE
                  </Button>
                </Tooltip>
              ) : hasMissions && flightMode === "LOITER" && previousMode === "AUTO" ? (
                <Tooltip content="Resume mission (Shift+P)" position="top">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider rounded border border-accent-primary/40 text-accent-primary"
                    icon={<Play size={11} />}
                    onClick={() => {
                      if (protocol) protocol.resumeMission();
                      else setFlightMode("AUTO");
                    }}
                  >
                    RESUME
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip content="Hold position (Shift+P)" position="top">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider rounded border border-border-default hover:border-accent-primary/50"
                    icon={<Pause size={11} />}
                    onClick={() => {
                      if (protocol) protocol.setFlightMode("LOITER");
                      else setFlightMode("LOITER");
                    }}
                  >
                    HOLD
                  </Button>
                </Tooltip>
              )}
            </div>
          )}

          {hasAutonomousFlight && (
            <div>
              <Tooltip content="Return to home (Shift+R)" position="top">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PlaneLanding size={11} />}
                  className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider text-status-warning border-status-warning/40 hover:bg-status-warning/15 rounded"
                  onClick={() => setShowRthConfirm(true)}
                >
                  RTH
                </Button>
              </Tooltip>
            </div>
          )}

          {hasAutonomousFlight && (
            <>
              <div className="flex items-center gap-0.5 bg-bg-primary border border-border-default rounded px-1">
                <input
                  type="number"
                  value={takeoffAlt}
                  onChange={(e) => setTakeoffAlt(e.target.value)}
                  className="w-full h-8 bg-transparent text-[11px] font-mono font-bold text-text-primary text-center outline-none"
                  min="1"
                  max="120"
                  step="1"
                  title="Target Altitude (m)"
                />
                <span className="text-[8px] font-mono text-text-tertiary">m</span>
              </div>

              <div>
                <Tooltip content="Auto Takeoff (Shift+T)" position="top">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider rounded border border-status-success/40 text-status-success hover:bg-status-success/15"
                    icon={<PlaneTakeoff size={11} />}
                    onClick={() => {
                      const alt = parseFloat(takeoffAlt);
                      if (isNaN(alt) || alt <= 0) return;
                      setShowTakeoffConfirm(true);
                    }}
                  >
                    TAKEOFF
                  </Button>
                </Tooltip>
              </div>

              <div>
                <Tooltip content="Auto Land (Shift+L)" position="top">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider rounded border border-border-default hover:border-status-warning/50 text-text-primary"
                    icon={<PlaneLanding size={11} />}
                    onClick={() => setShowLandConfirm(true)}
                  >
                    LAND
                  </Button>
                </Tooltip>
              </div>
            </>
          )}

          {mode === "full" && (
            <>
              <div>
                <Tooltip content="Abort Mission (Shift+X)" position="top">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider text-status-error border-status-error/40 rounded"
                    icon={<XOctagon size={11} />}
                    onClick={() => setShowAbortConfirm(true)}
                  >
                    ABORT
                  </Button>
                </Tooltip>
              </div>

              <div>
                <Tooltip content="Emergency Motor Kill" position="top">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Skull size={11} />}
                    className="w-full h-8 px-1 flex flex-col items-center justify-center text-[8px] font-mono font-bold tracking-wider bg-status-error text-white hover:bg-status-error/85 rounded"
                    onClick={() => setShowKillConfirm(true)}
                  >
                    KILL
                  </Button>
                </Tooltip>
              </div>
            </>
          )}
        </div>

        {/* Follow-me mode */}
        {isArmed && hasAutonomousFlight && (
          <FollowMeButton />
        )}
      </div>

      <ActionDialogs
        showArmConfirm={showArmConfirm}
        setShowArmConfirm={setShowArmConfirm}
        showDisarmConfirm={showDisarmConfirm}
        setShowDisarmConfirm={setShowDisarmConfirm}
        showRthConfirm={showRthConfirm}
        setShowRthConfirm={setShowRthConfirm}
        showTakeoffConfirm={showTakeoffConfirm}
        setShowTakeoffConfirm={setShowTakeoffConfirm}
        showLandConfirm={showLandConfirm}
        setShowLandConfirm={setShowLandConfirm}
        showAbortConfirm={showAbortConfirm}
        setShowAbortConfirm={setShowAbortConfirm}
        showKillConfirm={showKillConfirm}
        setShowKillConfirm={setShowKillConfirm}
        showChecklist={showChecklist}
        setShowChecklist={setShowChecklist}
        checklistReady={checklistReady}
        takeoffAlt={takeoffAlt}
      />
    </>
  );
}
