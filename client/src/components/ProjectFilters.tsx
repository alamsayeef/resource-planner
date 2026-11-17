import { useMemo } from "react";
import type { Project } from "../lib/api";

interface Filters {
  status: string;
  projectType: string;
  pm: string;
  pd: string;
}

interface Props {
  projects: Project[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

export default function ProjectFilters({ projects, filters, onFiltersChange }: Props) {
  // Apply filters progressively so each dropdown only shows options valid for current selections
  const afterStatus = useMemo(() => {
    if (filters.status === "All") return projects;
    return projects.filter((p) => p.status === filters.status);
  }, [projects, filters.status]);

  const afterType = useMemo(() => {
    if (filters.projectType === "All") return afterStatus;
    return afterStatus.filter((p) => p.projectType?.name === filters.projectType);
  }, [afterStatus, filters.projectType]);

  const afterPm = useMemo(() => {
    if (filters.pm === "All") return afterType;
    return afterType.filter((p) => p.pm?.name === filters.pm);
  }, [afterType, filters.pm]);

  // Available options based on progressive filtering
  const statusOptions = useMemo(() => {
    const set = new Set(projects.map((p) => p.status));
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  const typeOptions = useMemo(() => {
    const set = new Set(afterStatus.map((p) => p.projectType?.name).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [afterStatus]);

  const pmOptions = useMemo(() => {
    const set = new Set(afterType.map((p) => p.pm?.name).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [afterType]);

  const pdOptions = useMemo(() => {
    const set = new Set(afterPm.map((p) => p.pd?.name).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [afterPm]);

  const update = (key: keyof Filters, value: string) => {
    const next = { ...filters, [key]: value };
    // Reset downstream filters when an upstream one changes
    if (key === "status") {
      next.projectType = "All";
      next.pm = "All";
      next.pd = "All";
    } else if (key === "projectType") {
      next.pm = "All";
      next.pd = "All";
    } else if (key === "pm") {
      next.pd = "All";
    }
    onFiltersChange(next);
  };

  const selectClass =
    "text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pentag-accent focus:border-pentag-accent outline-none bg-white";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-sm font-medium text-pentag-dark">Filters:</span>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Status</label>
          <select value={filters.status} onChange={(e) => update("status", e.target.value)} className={selectClass}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Project Type */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">Type</label>
          <select value={filters.projectType} onChange={(e) => update("projectType", e.target.value)} className={selectClass}>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* PM */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">PM</label>
          <select value={filters.pm} onChange={(e) => update("pm", e.target.value)} className={selectClass}>
            {pmOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* PD */}
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500">PD</label>
          <select value={filters.pd} onChange={(e) => update("pd", e.target.value)} className={selectClass}>
            {pdOptions.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* Reset */}
        {(filters.status !== "All" || filters.projectType !== "All" || filters.pm !== "All" || filters.pd !== "All") && (
          <button
            onClick={() => onFiltersChange({ status: "All", projectType: "All", pm: "All", pd: "All" })}
            className="text-xs text-pentag-accent hover:underline"
          >
            Reset all
          </button>
        )}
      </div>
    </div>
  );
}
