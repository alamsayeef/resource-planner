import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Project } from "../lib/api";
import ProjectFilters from "../components/ProjectFilters";
import ProjectGrid from "../components/ProjectGrid";
import GanttChart from "../components/GanttChart";

interface Filters {
  status: string;
  projectType: string;
  pm: string;
  pd: string;
}

const defaultFilters: Filters = {
  status: "All",
  projectType: "All",
  pm: "All",
  pd: "All",
};

export default function ProjectsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  // Apply all filters
  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filters.status !== "All" && p.status !== filters.status) return false;
      if (filters.projectType !== "All" && p.projectType?.name !== filters.projectType) return false;
      if (filters.pm !== "All" && p.pm?.name !== filters.pm) return false;
      if (filters.pd !== "All" && p.pd?.name !== filters.pd) return false;
      return true;
    });
  }, [projects, filters]);

  // Status counts always from ALL projects (not filtered)
  const displayStatuses = ["Ongoing", "Completed", "Incoming"];
  const totalStatusCounts = projects.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    Ongoing:   { bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
    Completed: { bg: "bg-gray-50",     text: "text-gray-700",    border: "border-gray-200" },
    Incoming:  { bg: "bg-blue-50",     text: "text-blue-700",    border: "border-blue-200" },
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-400 text-lg">Loading projects...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-red-500 text-lg">
          Failed to load projects. Is the API server running?
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Summary Cards — always show total counts */}
      <div className="grid grid-cols-3 gap-4">
        {displayStatuses.map((status) => {
          const count = totalStatusCounts[status] || 0;
          const style = statusStyles[status];
          const isSelected = filters.status === status;

          return (
            <button
              key={status}
              onClick={() =>
                setFilters((f) => ({
                  ...f,
                  status: isSelected ? "All" : status,
                  projectType: "All",
                  pm: "All",
                  pd: "All",
                }))
              }
              className={`rounded-xl border px-5 py-4 text-left transition-all ${
                style.bg
              } ${style.border} ${
                isSelected
                  ? "ring-2 ring-pentag-accent shadow-md scale-[1.02]"
                  : "hover:shadow-sm hover:scale-[1.01]"
              }`}
            >
              <p className={`text-3xl font-bold ${style.text}`}>{count}</p>
              <p className="text-sm text-gray-500 font-medium mt-1">{status}</p>
            </button>
          );
        })}
      </div>

      {/* Cascading Filters */}
      <ProjectFilters
        projects={projects}
        filters={filters}
        onFiltersChange={setFilters}
      />

      {/* Project Grid */}
      <ProjectGrid projects={filtered} />

      {/* Gantt Chart */}
      <GanttChart projects={filtered} />
    </div>
  );
}
