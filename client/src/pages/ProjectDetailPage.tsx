import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, PLANNING_STATUSES } from "../lib/api";
import type { Project, ProjectDetail, ProjectPerson } from "../lib/api";

const selectClass =
  "text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-pentag-accent focus:border-pentag-accent outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const statusColor = (status: string) => {
  switch (status) {
    case "Ongoing":   return "bg-emerald-100 text-emerald-800";
    case "Incoming":  return "bg-blue-100 text-blue-800";
    case "Completed": return "bg-gray-100 text-gray-800";
    case "Removed":   return "bg-red-100 text-red-700";
    default:          return "bg-gray-100 text-gray-600";
  }
};

interface Row {
  key: string;
  label: string;
  roleHours: number | null;
  person: ProjectPerson | null;
  first: boolean;
  emptyText: string;
}

function LoadCell({ person }: { person: ProjectPerson }) {
  if (person.availableHours <= 0) return <span className="text-gray-400">—</span>;
  const pct = (person.projectTotalHours / person.availableHours) * 100;
  const cls = pct > 100 ? "text-red-600" : pct > 80 ? "text-amber-600" : "text-emerald-700";
  return <span className={`font-medium ${cls}`}>{pct.toFixed(0)}%</span>;
}

export default function ProjectDetailPage() {
  const [status, setStatus] = useState("");
  const [projectId, setProjectId] = useState("");

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  const options = projects
    .filter((p) => p.status === status)
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  const { data: detail, isLoading, error } = useQuery<ProjectDetail>({
    queryKey: ["planning", "project", projectId],
    queryFn: () => api.getProjectDetail(Number(projectId)),
    enabled: projectId !== "",
  });

  const rows: Row[] = [];
  if (detail) {
    rows.push({ key: "pm", label: "Project Manager (PM)", roleHours: detail.pmHours, person: detail.pm, first: true, emptyText: "Not set" });
    rows.push({ key: "pd", label: "Project Director (PD)", roleHours: detail.pdHours, person: detail.pd, first: true, emptyText: "Not set" });
    detail.roles.forEach((r) => {
      if (r.assignees.length === 0) {
        rows.push({ key: `r${r.roleId}`, label: r.roleName, roleHours: r.roleHours, person: null, first: true, emptyText: "Unassigned" });
      } else {
        r.assignees.forEach((a, i) => {
          rows.push({ key: `r${r.roleId}-${a.employeeId}`, label: r.roleName, roleHours: r.roleHours, person: a, first: i === 0, emptyText: "" });
        });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Selector card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-pentag-dark">Select project:</span>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Status</label>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setProjectId(""); }}
              className={selectClass}
            >
              <option value="">Select status…</option>
              {PLANNING_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!status}
              className={selectClass}
            >
              <option value="">{status ? "Select project…" : "Select a status first"}</option>
              {options.map((p) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!projectId && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-10 text-center text-gray-400">
          Select a status and a project to see its details.
        </div>
      )}

      {projectId && isLoading && <div className="text-center py-10 text-gray-400">Loading project…</div>}
      {projectId && error && <div className="text-center py-10 text-red-500">Failed to load project details.</div>}

      {detail && (
        <>
          {/* Details card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <h2 className="text-lg font-semibold text-pentag-dark">{detail.project.name}</h2>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(detail.project.status)}`}>
                {detail.project.status}
              </span>
            </div>
            <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
              <div><p className="text-xs text-gray-500">Project type</p><p className="font-medium text-pentag-dark">{detail.project.typeName || "—"}</p></div>
              <div><p className="text-xs text-gray-500">Start date</p><p className="font-medium text-pentag-dark">{fmtDate(detail.project.startDate)}</p></div>
              <div><p className="text-xs text-gray-500">End date</p><p className="font-medium text-pentag-dark">{fmtDate(detail.project.endDate)}</p></div>
              <div><p className="text-xs text-gray-500">PM</p><p className="font-medium text-pentag-dark">{detail.pm ? detail.pm.name : "—"}</p></div>
              <div><p className="text-xs text-gray-500">PD</p><p className="font-medium text-pentag-dark">{detail.pd ? detail.pd.name : "—"}</p></div>
            </div>
          </div>

          {/* Roles card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-pentag-dark">Roles &amp; Hours</h2>
              <p className="text-xs text-gray-400 mt-1">
                Role hours come from the project type and are split equally between everyone holding the role.
                Available hours = FTE × daily hours × working days in the project window (minus public and personal holidays).
                Load = the person's total hours on this project ÷ their available hours.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-gray-600">
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Role hours</th>
                    <th className="px-6 py-3 font-medium">Employee</th>
                    <th className="px-6 py-3 font-medium">FTE</th>
                    <th className="px-6 py-3 font-medium">Hours on this role</th>
                    <th className="px-6 py-3 font-medium">Total on project</th>
                    <th className="px-6 py-3 font-medium">Available hours</th>
                    <th className="px-6 py-3 font-medium">Load</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.key} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-pentag-dark">{r.first ? r.label : ""}</td>
                      <td className="px-6 py-3 text-gray-600">{r.first && r.roleHours !== null ? r.roleHours.toFixed(1) : ""}</td>
                      {r.person ? (
                        <>
                          <td className="px-6 py-3 text-gray-700">{r.person.name}</td>
                          <td className="px-6 py-3 text-gray-600">{r.person.fte.toFixed(1)}</td>
                          <td className="px-6 py-3 text-gray-600">{r.person.hours.toFixed(1)}</td>
                          <td className="px-6 py-3 text-gray-600">{r.person.projectTotalHours.toFixed(1)}</td>
                          <td className="px-6 py-3 text-gray-600">{r.person.availableHours.toFixed(1)}</td>
                          <td className="px-6 py-3"><LoadCell person={r.person} /></td>
                        </>
                      ) : (
                        <td className="px-6 py-3 text-gray-400 italic" colSpan={6}>{r.emptyText}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
