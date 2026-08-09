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
      <div className={cn("px-3 pt-3 pb-1.5 bg-transparent flex flex-col gap-1.5 transition-opacity duration-200", !isConnected && "opacity-50 pointer-events-none")}>
        <div className="flex items-center gap-1.5">
          {/* ARM / DISARM */}
          <div className="flex-1 [&>*]:w-full">
            <Tooltip
              content={isArmed ? t("disarmShortcut") : t("armShortcut")}
              position="right"
            >
              <Button
                variant={isArmed ? "danger" : "primary"}
                size="sm"
                icon={<Power size={14} />}
                className="w-full h-9 text-sm font-semibold"
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
              className="w-full h-9"
            />
          </div>
        </div>

        {/* All action buttons */}
        <div className="flex items-center gap-1">
          {hasAutonomousFlight && (
            <div className="flex-1 [&>*]:w-full">
              {hasMissions && flightMode === "AUTO" ? (
                <Tooltip content="Pause mission (Shift+P)" position="right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon={<Pause size={14} />}
                    onClick={() => {
                      if (protocol) protocol.pauseMission();
                      else setFlightMode("LOITER");
                    }}
                  />
                </Tooltip>
              ) : hasMissions && flightMode === "LOITER" && previousMode === "AUTO" ? (
                <Tooltip content="Resume mission (Shift+P)" position="right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon={<Play size={14} />}
                    onClick={() => {
                      if (protocol) protocol.resumeMission();
                      else setFlightMode("AUTO");
                    }}
                  />
                </Tooltip>
              ) : (
                <Tooltip content="Hold position (Shift+P)" position="right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon={<Pause size={14} />}
                    onClick={() => {
                      if (protocol) protocol.setFlightMode("LOITER");
                      else setFlightMode("LOITER");
                    }}
                  />
                </Tooltip>
              )}
            </div>
          )}
          {hasAutonomousFlight && (
            <div className="flex-1 [&>*]:w-full">
              <Tooltip content="Return to home (Shift+R)" position="right">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<PlaneLanding size={14} />}
                  className="w-full text-status-warning border-status-warning/30"
                  onClick={() => setShowRthConfirm(true)}
                />
              </Tooltip>
            </div>
          )}
          {hasAutonomousFlight && (
            <>
              <div className="flex-1 [&>*]:w-full">
                <Tooltip content="Takeoff altitude (1-120m)" position="right">
                  <input
                    type="number"
                    value={takeoffAlt}
                    onChange={(e) => setTakeoffAlt(e.target.value)}
                    className="w-full h-7 px-1 bg-bg-tertiary border border-border-default text-xs font-mono text-text-primary text-center focus:outline-none focus:border-accent-primary"
                    min="1"
                    max="120"
                    step="1"
                  />
                </Tooltip>
              </div>
              <div className="flex-1 [&>*]:w-full">
                <Tooltip content="Takeoff (Shift+T)" position="right">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon={<PlaneTakeoff size={14} />}
                    onClick={() => {
                      const alt = parseFloat(takeoffAlt);
                      if (isNaN(alt) || alt <= 0) return;
                      setShowTakeoffConfirm(true);
                    }}
                  />
                </Tooltip>
              </div>
              <div className="flex-1 [&>*]:w-full">
                <Tooltip content="Land (Shift+L)" position="left">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    icon={<PlaneLanding size={14} />}
                    onClick={() => setShowLandConfirm(true)}
                  />
                </Tooltip>
              </div>
            </>
          )}
          {mode === "full" && (
            <>
              <div className="flex-1 [&>*]:w-full">
                <Tooltip content="Abort (Shift+X)" position="left">
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    icon={<XOctagon size={14} />}
                    onClick={() => setShowAbortConfirm(true)}
                  />
                </Tooltip>
              </div>
              <div className="flex-1 [&>*]:w-full">
                <Tooltip content="Kill motors" position="left">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<Skull size={14} />}
                    className="w-full bg-red-800 hover:bg-red-700 border-red-600"
                    onClick={() => setShowKillConfirm(true)}
                  />
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
