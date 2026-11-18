import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Employee, ProjectType, Role } from "../lib/api";

const fieldClass =
  "text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-pentag-accent focus:border-pentag-accent outline-none bg-white";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

// ── One employee row ──
function EmployeeRow({ emp, roles, onChanged }: { emp: Employee; roles: Role[]; onChanged: () => void }) {
  const [fte, setFte] = useState(String(emp.fte ?? 1));
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (data: Record<string, any>) => {
    setBusy(true);
    try {
      await api.updateEmployee(emp.id, data);
      onChanged();
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  const commitFte = () => {
    const n = parseFloat(fte);
    if (isNaN(n) || n < 0 || n > 1) {
      setFte(String(emp.fte ?? 1));
      return;
    }
    if (n !== emp.fte) save({ fte: n });
  };

  const addLeave = async () => {
    if (!start || !end || end < start) return;
    setBusy(true);
    try {
      await api.createLeave({ employeeId: emp.id, startDate: start, endDate: end, leaveType: "Annual" });
      setStart("");
      setEnd("");
      onChanged();
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  const removeLeave = async (id: number) => {
    setBusy(true);
    try {
      await api.deleteLeave(id);
      onChanged();
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  };

  return (
    <tr className="align-top">
      <td className="px-6 py-3 font-medium text-pentag-dark whitespace-nowrap">
        {emp.name}
        {busy && <span className="ml-2 text-xs text-pentag-accent animate-pulse">Saving…</span>}
      </td>
      <td className="px-6 py-3">
        <select
          value={emp.primaryRoleId ? String(emp.primaryRoleId) : ""}
          onChange={(e) => save({ primaryRoleId: e.target.value ? Number(e.target.value) : null })}
          className={fieldClass}
        >
          <option value="">— None —</option>
          {roles.map((r) => (
            <option key={r.id} value={String(r.id)}>{r.name}</option>
          ))}
        </select>
      </td>
      <td className="px-6 py-3">
        <select
          value={emp.isActive === false ? "Inactive" : "Active"}
          onChange={(e) => save({ isActive: e.target.value === "Active" })}
          className={fieldClass}
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </td>
      <td className="px-6 py-3">
        <input
          type="number"
          min="0"
          max="1"
          step="0.1"
          value={fte}
          onChange={(e) => setFte(e.target.value)}
          onBlur={commitFte}
          onKeyDown={(e) => { if (e.key === "Enter") commitFte(); }}
          className={fieldClass + " w-20"}
        />
      </td>
      <td className="px-6 py-3">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(emp.leave || []).length === 0 && <span className="text-xs text-gray-400">No personal holidays</span>}
          {(emp.leave || []).map((l) => (
            <span key={l.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 rounded-full px-2.5 py-0.5 text-xs">
              {fmtDate(l.startDate)} – {fmtDate(l.endDate)}
              <button onClick={() => removeLeave(l.id)} className="text-gray-400 hover:text-red-600" aria-label="Remove holiday">×</button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={fieldClass} />
          <span className="text-xs text-gray-400">to</span>
          <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} className={fieldClass} />
          <button
            onClick={addLeave}
            disabled={!start || !end || end < start}
            className="text-xs px-3 py-1.5 rounded-lg bg-pentag-primary text-white hover:bg-pentag-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Add
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── One project type row ──
function TypeRow({ pt, roles, onChanged }: { pt: ProjectType; roles: Role[]; onChanged: () => void }) {
  const dirty = useRef(false);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = { pm: String(pt.pmHours ?? 50), pd: String(pt.pdHours ?? 50) };
    roles.forEach((r) => {
      const t = (pt.budgetTemplates || []).find((b) => b.roleId === r.id);
      v["r" + r.id] = String(t ? t.budgetedHours : 0);
    });
    return v;
  });

  const setVal = (k: string, v: string) => {
    dirty.current = true;
    setVals((prev) => ({ ...prev, [k]: v }));
  };

  const commit = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    const pmHours = parseFloat(vals.pm);
    const pdHours = parseFloat(vals.pd);
    let valid = !isNaN(pmHours) && !isNaN(pdHours) && pmHours >= 0 && pdHours >= 0;
    const roleHours: Record<string, number> = {};
    roles.forEach((r) => {
      const v = parseFloat(vals["r" + r.id]);
      if (isNaN(v) || v < 0) valid = false;
      else roleHours[String(r.id)] = v;
    });
    if (!valid) return;
    try {
      await api.updateProjectType(pt.id, { pmHours, pdHours, roleHours });
      onChanged();
    } catch (e) {
      console.error(e);
    }
  };

  const total = Object.keys(vals).reduce((sum, k) => sum + (parseFloat(vals[k]) || 0), 0);

  const cell = (k: string) => (
    <td className="px-4 py-3" key={k}>
      <input
        type="number"
        min="0"
        step="1"
        value={vals[k]}
        onChange={(e) => setVal(k, e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
        className={fieldClass + " w-20"}
      />
    </td>
  );

  return (
    <tr>
      <td className="px-6 py-3 font-medium text-pentag-dark whitespace-nowrap">{pt.name}</td>
      {roles.map((r) => cell("r" + r.id))}
      {cell("pm")}
      {cell("pd")}
      <td className="px-4 py-3 text-gray-600 font-medium">{total.toFixed(0)}</td>
    </tr>
  );
}

export default function InputPage() {
  const queryClient = useQueryClient();
  const refresh = () => { queryClient.invalidateQueries(); };

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["employees", "all"],
    queryFn: api.getAllEmployees,
  });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["roles"], queryFn: api.getRoles });
  const { data: types = [] } = useQuery<ProjectType[]>({ queryKey: ["projectTypes"], queryFn: api.getProjectTypes });

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400 text-lg">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Card 1: employees */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-pentag-dark">Employees</h2>
          <p className="text-xs text-gray-400 mt-1">
            Changes save automatically. Personal holidays are date ranges (weekends are skipped automatically).
            Project-level role assignments are separate from the primary role.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-6 py-3 font-medium">Employee</th>
                <th className="px-6 py-3 font-medium">Primary role</th>
                <th className="px-6 py-3 font-medium">Employment status</th>
                <th className="px-6 py-3 font-medium">FTE</th>
                <th className="px-6 py-3 font-medium">Personal holidays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} roles={roles} onChanged={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: project types x role hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-pentag-dark">Project Types — Allocated Hours</h2>
          <p className="text-xs text-gray-400 mt-1">
            Hours per role for each project type. Role hours are split equally between everyone holding the role on a
            project; PM and PD hours are separate and go to the project's PM and PD.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-6 py-3 font-medium">Project type</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-4 py-3 font-medium">{r.name}</th>
                ))}
                <th className="px-4 py-3 font-medium">PM</th>
                <th className="px-4 py-3 font-medium">PD</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {types.map((pt) => (
                <TypeRow key={pt.id} pt={pt} roles={roles} onChanged={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
