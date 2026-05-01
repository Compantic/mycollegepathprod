"use client";

import { geoCentroid } from "d3-geo";
import { ComposableMap, Geographies, Geography, Marker, type PreparedGeography } from "react-simple-maps";
import usStatesTopo from "us-atlas/states-10m.json";
import { FIPS_TO_STATE_POSTAL, postalFromGeoFeature } from "@/lib/geo/usStateCodes";
import { cn } from "@/lib/utils";

const US_POSTALS = new Set(Object.values(FIPS_TO_STATE_POSTAL));

/** Smaller labels where polygons are tiny on Albers USA */
const COMPACT_STATE_LABEL = new Set(["RI", "DE", "DC", "CT", "NH", "VT", "MA", "NJ", "MD"]);

function centroidLngLat(geo: PreparedGeography): [number, number] | null {
  if (!geo.geometry) return null;
  try {
    const c = geoCentroid(geo as Parameters<typeof geoCentroid>[0]);
    if (c.length === 2 && c.every((n: number) => Number.isFinite(n))) return c as [number, number];
  } catch {
    /* invalid geometry */
  }
  return null;
}

export function UsStatesMapPicker({
  selected,
  onToggle,
  className,
}: {
  selected: string[];
  onToggle: (postal: string) => void;
  className?: string;
}) {
  const selectedSet = new Set(selected);

  function parseGeographies(geos: PreparedGeography[]) {
    return geos.filter((g) => {
      const p = postalFromGeoFeature(g);
      return p != null && US_POSTALS.has(p);
    });
  }

  return (
    <div className={cn("rounded-2xl border-2 border-bg-border bg-white p-3 shadow-sm sm:p-4", className)}>
      <p className="mb-3 text-center text-xs text-text-muted sm:text-sm">
        Click states to add or remove. Selected: {selected.length ? [...selected].sort().join(", ") : "none yet"}
      </p>
      <div className="relative mx-auto w-full max-w-[720px] overflow-hidden rounded-xl border border-bg-border bg-secondary-100/40">
        <ComposableMap
          projection="geoAlbersUsa"
          width={800}
          height={500}
          className="h-auto w-full text-text-primary [&_.rsm-svg]:max-h-[min(55vh,520px)] [&_.rsm-svg]:w-full"
        >
          <Geographies geography={usStatesTopo as object} parseGeographies={parseGeographies}>
            {({ geographies }) => (
              <>
                {geographies.map((geo) => {
                  const abbr = postalFromGeoFeature(geo);
                  if (!abbr) return null;
                  const isOn = selectedSet.has(abbr);
                  const label = geo.properties?.name ?? abbr;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => onToggle(abbr)}
                      aria-label={`${isOn ? "Deselect" : "Select"} ${label}`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onToggle(abbr);
                        }
                      }}
                      style={{
                        default: {
                          fill: isOn ? "#2B5FD9" : "#EEF3FF",
                          stroke: isOn ? "#1F4DB8" : "#C7D2E0",
                          strokeWidth: 0.65,
                          outline: "none",
                        },
                        hover: {
                          fill: isOn ? "#3F76E8" : "#D6E4FF",
                          stroke: "#2B5FD9",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "#1F4DB8",
                          stroke: "#1F4DB8",
                          strokeWidth: 1,
                          outline: "none",
                          cursor: "pointer",
                        },
                      }}
                    />
                  );
                })}
                {geographies.map((geo) => {
                  const abbr = postalFromGeoFeature(geo);
                  if (!abbr) return null;
                  const coords = centroidLngLat(geo);
                  if (!coords) return null;
                  const isOn = selectedSet.has(abbr);
                  const fontPx = COMPACT_STATE_LABEL.has(abbr) ? 7.5 : 10.5;
                  return (
                    <Marker key={`${geo.rsmKey}-abbr`} coordinates={coords} className="pointer-events-none">
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        className="font-semibold tracking-tight"
                        style={{
                          fontSize: fontPx,
                          fill: isOn ? "rgba(255,255,255,0.95)" : "#334155",
                          paintOrder: "stroke fill",
                          stroke: isOn ? "rgba(31,77,184,0.35)" : "rgba(255,255,255,0.85)",
                          strokeWidth: isOn ? 0.35 : 0.45,
                          pointerEvents: "none",
                          userSelect: "none",
                        }}
                      >
                        {abbr}
                      </text>
                    </Marker>
                  );
                })}
              </>
            )}
          </Geographies>
        </ComposableMap>
      </div>
    </div>
  );
}
