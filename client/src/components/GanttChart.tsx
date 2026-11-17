import { useMemo } from "react";
import type { Project } from "../lib/api";

interface Props {
  projects: Project[];
}

export default function GanttChart({ projects }: Props) {
  const { sortedProjects, months, totalDays, timelineStart, timelineEnd } = useMemo(() => {
    if (projects.length === 0) {
      return {
        sortedProjects: [],
        months: [] as { label: string; startPct: number; widthPct: number }[],
        totalDays: 1,
        timelineStart: new Date(),
        timelineEnd: new Date(),
      };
    }

    const sorted = [...projects].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    // Use sorted to get the first element of the array
    const firstStart = new Date(sorted.startDate);
    const tStart = new Date(firstStart.getFullYear(), firstStart.getMonth(), 1);
    const tEnd = new Date(tStart.getFullYear(), tStart.getMonth() + 12, 0);
    const total = daysBetween(tStart, tEnd);

    const monthList: { label: string; startPct: number; widthPct: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const mStart = new Date(tStart.getFullYear(), tStart.getMonth() + i, 1);
      const mEnd = new Date(tStart.getFullYear(), tStart.getMonth() + i + 1, 0);
      const clampedEnd = mEnd > tEnd ? tEnd : mEnd;
      const startPct = (daysBetween(tStart, mStart) / total) * 100;
      const widthPct = (daysBetween(mStart, clampedEnd) / total) * 100;
      monthList.push({
        label: mStart.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }),
        startPct,
        widthPct,
      });
    }

    return { sortedProjects: sorted, months: monthList, totalDays: total, timelineStart: tStart, timelineEnd: tEnd };
  }, [projects]);

  const statusBarColor = (status: string) => {
    switch (status) {
      case "Ongoing":    return "bg-pentag-accent";
      case "Incoming":   return "bg-blue-400";
      case "Completed":  return "bg-gray-400";
      case "Removed":    return "bg-red-300";
      default:           return "bg-gray-300";
    }
  };

  if (sortedProjects.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-8 text-center text-gray-400">
        No projects to display on the timeline.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-pentag-dark">Project Timeline</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Month headers */}
          <div className="relative h-8 bg-gray-50 border-b border-gray-200 ml-56">
            {months.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 h-full flex items-center border-l border-gray-200 px-2"
                style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}
              >
                <span className="text-xs text-gray-500 font-medium truncate">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {/* Project rows */}
          <div className="relative">
            {sortedProjects.map((p) => {
              const pStart = new Date(p.startDate);
              const pEnd = new Date(p.endDate);

              const clampedStart = pStart < timelineStart ? timelineStart : pStart;
              const clampedEnd = pEnd > timelineEnd ? timelineEnd : pEnd;

              if (clampedStart >= timelineEnd || clampedEnd <= timelineStart) {
                return null;
              }

              const leftPct = Math.max(0, (daysBetween(timelineStart, clampedStart) / totalDays) * 100);
              const widthPct = Math.max(1, (daysBetween(clampedStart, clampedEnd) / totalDays) * 100);

              return (
                <div
                  key={p.id}
                  className="flex items-center border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  style={{ height: "44px" }}
                >
                  <div className="w-56 min-w-56 px-4 text-sm text-gray-700 font-medium truncate border-r border-gray-100">
                    {p.name}
                  </div>
                  <div className="flex-1 relative h-full">
                    <div
                      className={`absolute top-2.5 h-5 rounded-full ${statusBarColor(p.status)} opacity-90 hover:opacity-100 transition-opacity cursor-default`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        minWidth: "8px",
                      }}
                      title={`${p.name}
${formatDateShort(pStart)} – ${formatDateShort(pEnd)}
Status: ${p.status}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-4">
            {["Ongoing", "Incoming", "Completed", "Removed"].map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${statusBarColor(s)}`} />
                <span className="text-xs text-gray-500">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function daysBetween(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000)));
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
