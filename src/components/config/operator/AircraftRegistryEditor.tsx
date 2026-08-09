"use client";

/**
 * Aircraft registry editor — table of all known aircraft + per-row edit form.
 *
 * Reads from {@link useAircraftRegistryStore}. Aircraft are auto-seeded by
 * the flight lifecycle on first connect, but can also be manually added here
 * for off-platform / pre-existing fleet entries.
 *
 * @license GPL-3.0-only
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useAircraftRegistryStore } from "@/stores/aircraft-registry-store";
import type { AircraftRecord, VehicleType, AircraftCategory } from "@/lib/types/operator";

export function AircraftRegistryEditor() {
  const t = useTranslations("operator");
  const aircraftMap = useAircraftRegistryStore((s) => s.aircraft);
  const upsert = useAircraftRegistryStore((s) => s.upsert);
  const update = useAircraftRegistryStore((s) => s.update);
  const remove = useAircraftRegistryStore((s) => s.remove);
  const loadFromIDB = useAircraftRegistryStore((s) => s.loadFromIDB);

  useEffect(() => {
    void loadFromIDB();
  }, [loadFromIDB]);

  const aircraft = Object.values(aircraftMap);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? aircraftMap[selectedId] : undefined;

  const vehicleOptions = [
    { value: "copter", label: t("typeMultirotor") },
    { value: "plane", label: t("typePlane") },
    { value: "vtol", label: t("typeVtol") },
    { value: "rover", label: t("typeRover") },
    { value: "sub", label: t("typeSub") },
  ];

  const categoryOptions = [
    { value: "nano", label: t("catNano") },
    { value: "micro", label: t("catMicro") },
    { value: "small", label: t("catSmall") },
    { value: "medium", label: t("catMedium") },
    { value: "large", label: t("catLarge") },
  ];

  const vehicleLabels: Record<string, string> = {
    copter: t("typeMultirotor"),
    plane: t("typePlane"),
    vtol: t("typeVtol"),
    rover: t("typeRover"),
    sub: t("typeSub"),
  };

  const handleAdd = () => {
    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const fresh: AircraftRecord = {
      id,
      name: t("newAircraft") || "New aircraft",
      vehicleType: "copter",
      totalFlightHours: 0,
      totalFlights: 0,
    };
    upsert(fresh);
    setSelectedId(id);
  };

  const handleDelete = (id: string) => {
    if (typeof window !== "undefined" && !window.confirm(t("delConfirmAircraft"))) return;
    remove(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <Card title={t("aircraft")} padding={true}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-secondary">
            {t("aircraftRegistered", { count: aircraft.length })}
          </span>
          <Button variant="secondary" size="sm" icon={<Plus size={12} />} onClick={handleAdd}>
            {t("addAircraft")}
          </Button>
        </div>

        {aircraft.length === 0 ? (
          <p className="text-[10px] text-text-tertiary">
            {t("noAircraft")}
          </p>
        ) : (
          <div className="border border-border-default rounded">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-default">
                  <th className="px-2 py-1.5 text-left text-[10px] uppercase text-text-secondary">{t("tblName")}</th>
                  <th className="px-2 py-1.5 text-left text-[10px] uppercase text-text-secondary">{t("tblReg")}</th>
                  <th className="px-2 py-1.5 text-left text-[10px] uppercase text-text-secondary">{t("tblType")}</th>
                  <th className="px-2 py-1.5 text-right text-[10px] uppercase text-text-secondary">{t("tblHours")}</th>
                  <th className="px-2 py-1.5 text-right text-[10px] uppercase text-text-secondary">{t("tblFlights")}</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {aircraft.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`border-b border-border-default cursor-pointer hover:bg-bg-tertiary ${
                      selectedId === a.id ? "bg-accent-primary/10" : ""
                    }`}
                  >
                    <td className="px-2 py-1.5 text-text-primary">{a.name}</td>
                    <td className="px-2 py-1.5 text-text-primary font-mono">{a.registrationNumber ?? "—"}</td>
                    <td className="px-2 py-1.5 text-text-secondary">
                      {a.vehicleType ? (vehicleLabels[a.vehicleType] ?? a.vehicleType) : "—"}
                    </td>
                    <td className="px-2 py-1.5 text-text-primary font-mono text-right tabular-nums">
                      {(a.totalFlightHours ?? 0).toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-text-primary font-mono text-right tabular-nums">
                      {a.totalFlights ?? 0}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(a.id);
                        }}
                        className="text-text-tertiary hover:text-status-error transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selected && (
          <div className="border-t border-border-default pt-3">
            <h4 className="text-[11px] uppercase tracking-wider text-text-secondary mb-2">
              {selected.name}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t("name")}
                value={selected.name}
                onChange={(e) => update(selected.id, { name: e.target.value })}
              />
              <Input
                label={t("registration")}
                value={selected.registrationNumber ?? ""}
                onChange={(e) => update(selected.id, { registrationNumber: e.target.value })}
                placeholder="UIN / N-number / EASA reg"
              />
              <Input
                label={t("manufacturer")}
                value={selected.manufacturer ?? ""}
                onChange={(e) => update(selected.id, { manufacturer: e.target.value })}
              />
              <Input
                label={t("model")}
                value={selected.model ?? ""}
                onChange={(e) => update(selected.id, { model: e.target.value })}
              />
              <Input
                label={t("serialNumber")}
                value={selected.serialNumber ?? ""}
                onChange={(e) => update(selected.id, { serialNumber: e.target.value })}
              />
              <Input
                label={t("remoteIdSerial")}
                value={selected.remoteIdSerial ?? ""}
                onChange={(e) => update(selected.id, { remoteIdSerial: e.target.value })}
              />
              <Select
                label={t("vehicleType")}
                value={selected.vehicleType ?? "copter"}
                onChange={(v) => update(selected.id, { vehicleType: v as VehicleType })}
                options={vehicleOptions}
              />
              <Select
                label={t("category")}
                value={selected.category ?? "small"}
                onChange={(v) => update(selected.id, { category: v as AircraftCategory })}
                options={categoryOptions}
              />
              <Input
                label={t("mtom")}
                type="number"
                step="0.1"
                value={selected.mtomKg?.toString() ?? ""}
                onChange={(e) => update(selected.id, { mtomKg: e.target.value ? Number(e.target.value) : undefined })}
              />
              <Input
                label={t("airworthinessCert")}
                value={selected.airworthinessCertNumber ?? ""}
                onChange={(e) => update(selected.id, { airworthinessCertNumber: e.target.value })}
              />
              <Input
                label={t("airworthinessExpiry")}
                type="date"
                value={selected.airworthinessExpiry ?? ""}
                onChange={(e) => update(selected.id, { airworthinessExpiry: e.target.value })}
              />
              <Input
                label={t("lastMaintenance")}
                type="date"
                value={selected.lastMaintenanceDate ?? ""}
                onChange={(e) => update(selected.id, { lastMaintenanceDate: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
