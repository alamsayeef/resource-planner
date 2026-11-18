import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, PLANNING_STATUSES } from "../lib/api";
import type { Employee, EmployeePlanning } from "../lib/api";

const selectClass =
  "text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pentag-accent focus:border-pentag-accent outline-none bg-white";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const statusColor = (status: string) => {
  switch (status) {
    case "Ongoing":   return "bg-emerald-100 text-emerald-800";
    case "Incoming":  return "bg-blue-100 text-blue-800";
    case "Completed": return "bg-gray-100 text-gray-800";
    default:          return "bg-gray-100 text-gray-600";
  }
};

const ragClass = (rag: string) => {
  switch (rag) {
    case "GREEN":       return "bg-emerald-200 text-emerald-900";
    case "AMBER":       return "bg-amber-200 text-amber-900";
    case "RED":         return "bg-red-300 text-red-900";
    default:            return "bg-gray-200 text-gray-500";
  }
};

export default function EmployeePage() {
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState("");
  const ready = employeeId !== "" && status !== "";

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: api.getEmployees,
  });

  const { data, isLoading, error } = useQuery<EmployeePlanning>({
    queryKey: ["planning", "employee", employeeId, status],
    queryFn: () => api.getEmployeePlanning(Number(employeeId), status),
    enabled: ready,
  });

  const maxHours = data
    ? Math.max(1, ...data.projects.flatMap((p) => Object.values(p.monthly)))
    : 1;

  return (
    <div className="space-y-6">
      {/* Card 1: selection + projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium text-pentag-dark">Select employee:</span>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Employee</label>
              <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={selectClass}>
                <option value="">Select employee…</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">Project status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
                <option value="">Select status…</option>
                {PLANNING_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {data && (
              <span className="text-xs text-gray-500">
                FTE {data.employee.fte.toFixed(1)}
                {data.employee.primaryRole ? ` · Primary role: ${data.employee.primaryRole}` : ""}
              </span>
            )}
          </div>
        </div>

        {!ready && (
          <div className="px-6 py-10 text-center text-gray-400">
            Select an employee and a project status to see their projects.
          </div>
        )}
        {ready && isLoading && <div className="px-6 py-10 text-center text-gray-400">Loading…</div>}
        {ready && error && <div className="px-6 py-10 text-center text-red-500">Failed to load employee planning.</div>}

        {ready && data && data.projects.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-400">
            No {status} projects for {data.employee.name}.
          </div>
        )}

        {ready && data && data.projects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-gray-600">
                  <th className="px-6 py-3 font-medium">Project</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">PM</th>
                  <th className="px-6 py-3 font-medium">PD</th>
                  <th className="px-6 py-3 font-medium">Start</th>
                  <th className="px-6 py-3 font-medium">End</th>
                  <th className="px-6 py-3 font-medium">Role(s)</th>
                  <th className="px-6 py-3 font-medium">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-pentag-dark">{p.name}</td>
                    <td className="px-6 py-3 text-gray-600">{p.typeName || "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{p.pm || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{p.pd || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{fmtDate(p.startDate)}</td>
                    <td className="px-6 py-3 text-gray-600">{fmtDate(p.endDate)}</td>
                    <td className="px-6 py-3 text-gray-700">{p.roles.join(", ")}</td>
                    <td className="px-6 py-3 text-gray-700">{p.totalHours.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 2: capacity heatmap */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-pentag-dark">Capacity Heatmap</h2>
          <p className="text-xs text-gray-400 mt-1">
            12 months from the start of the first {status || "selected-status"} project. Hours per project are spread
            equally over the employee's working days (after public and personal holidays); utilisation = load ÷
            (FTE × daily hours × working days).
          </p>
        </div>

        {(!ready || !data) && (
          <div className="px-6 py-10 text-center text-gray-400">Select an employee and a status to see the heatmap.</div>
        )}

        {ready && data && data.months.length === 0 && (
          <div className="px-6 py-10 text-center text-gray-400">There are no {status} projects to build a timeline from.</div>
        )}

        {ready && data && data.months.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-4 py-2 font-medium text-gray-600 w-56">Project</th>
                    {data.months.map((m) => (
                      <th key={m.key} className="px-1 py-2 text-center font-medium text-gray-600">{m.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.projects.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="px-4 py-2 text-gray-700 font-medium truncate">{p.name}</td>
                      {data.months.map((m) => {
                        const h = p.monthly[m.key] || 0;
                        return (
                          <td
                            key={m.key}
                            className="px-1 py-2 text-center text-gray-700"
                            style={h > 0 ? { backgroundColor: `rgba(0, 168, 126, ${0.12 + 0.6 * (h / maxHours)})` } : undefined}
                          >
                            {h > 0 ? h.toFixed(0) : ""}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-4 py-2 font-medium text-pentag-dark">Total load (h)</td>
                    {data.monthly.map((c) => (
                      <td key={c.key} className="px-1 py-2 text-center font-medium text-gray-700">{c.loadHours.toFixed(0)}</td>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-4 py-2 font-medium text-pentag-dark">Available (h)</td>
                    {data.monthly.map((c) => (
                      <td key={c.key} className="px-1 py-2 text-center text-gray-600">{c.availableHours.toFixed(0)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium text-pentag-dark">Utilisation</td>
                    {data.monthly.map((c) => (
                      <td key={c.key} className={`px-1 py-2 text-center font-semibold ${ragClass(c.rag)}`}>
                        {c.rag === "UNAVAILABLE" ? "n/a" : `${c.utilisationPct.toFixed(0)}%`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-200" /> ≤ 80%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-200" /> 81–100%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-300" /> &gt; 100%</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-200" /> No available hours</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
