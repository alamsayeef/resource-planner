import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Employee, ProjectType, Role } from "../lib/api";

const fieldClass =
  "text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-pentag-accent focus:border-pentag-accent outline-none bg-white";
const addBtn =
  "text-xs px-3 py-1.5 rounded-lg bg-pentag-primary text-white hover:bg-pentag-dark disabled:opacity-40 disabled:cursor-not-allowed";
const ghostBtn = "text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

const fail = (e: any) => window.alert(e && e.message ? e.message : "Something went wrong");

// ── One employee row ──
function EmployeeRow({ emp, roles, onChanged }: { emp: Employee; roles: Role[]; onChanged: () => void }) {
  const [name, setName] = useState(emp.name);
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
      fail(e);
      setName(emp.name);
    }
    setBusy(false);
  };

  const commitName = () => {
    const n = name.trim();
    if (!n) { setName(emp.name); return; }
    if (n !== emp.name) save({ name: n });
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
      fail(e);
    }
    setBusy(false);
  };

  const removeLeave = async (id: number) => {
    setBusy(true);
    try {
      await api.deleteLeave(id);
      onChanged();
    } catch (e) {
      fail(e);
    }
    setBusy(false);
  };

  return (
    <tr className="align-top">
      <td className="px-6 py-3 whitespace-nowrap">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className={fieldClass + " w-44 font-medium text-pentag-dark"}
        />
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
          <button onClick={addLeave} disabled={!start || !end || end < start} className={addBtn}>Add</button>
        </div>
      </td>
    </tr>
  );
}

// ── Add employee form ──
function AddEmployeeForm({ roles, onDone }: { roles: Role[]; onDone: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [fte, setFte] = useState("1");
  const [roleId, setRoleId] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const n = name.trim();
    const f = parseFloat(fte);
    if (!n || isNaN(f) || f < 0 || f > 1) {
      window.alert("Enter a name and an FTE between 0 and 1.");
      return;
    }
    setBusy(true);
    try {
      await api.createEmployee({ name: n, email: email.trim() || null, fte: f, primaryRoleId: roleId ? Number(roleId) : null });
      onDone();
    } catch (e) {
      fail(e);
    }
    setBusy(false);
  };

  return (
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass + " w-44"} autoFocus />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Email (optional)</label>
        <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldClass + " w-52"} />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Primary role</label>
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} className={fieldClass}>
          <option value="">— None —</option>
          {roles.map((r) => (
            <option key={r.id} value={String(r.id)}>{r.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">FTE</label>
        <input type="number" min="0" max="1" step="0.1" value={fte} onChange={(e) => setFte(e.target.value)} className={fieldClass + " w-20"} />
      </div>
      <button onClick={submit} disabled={busy} className={addBtn}>Save employee</button>
    </div>
  );
}

// ── Role name row ──
function RoleRow({ role, onChanged }: { role: Role; onChanged: () => void }) {
  const [name, setName] = useState(role.name);
  const commit = async () => {
    const n = name.trim();
    if (!n) { setName(role.name); return; }
    if (n === role.name) return;
    try {
      await api.updateRole(role.id, { name: n });
      onChanged();
    } catch (e) {
      fail(e);
      setName(role.name);
    }
  };
  return (
    <div className="inline-flex items-center gap-1">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        className={fieldClass + " w-48"}
      />
      <button
        onClick={async () => {
          if (!window.confirm("Remove role \"" + role.name + "\"? It will disappear from all tabs and from anyone's primary role.")) return;
          try {
            await api.deleteRole(role.id);
            onChanged();
          } catch (e) {
            fail(e);
          }
        }}
        className="text-gray-400 hover:text-red-600 px-1"
        aria-label="Remove role"
        title="Remove role"
      >
        ×
      </button>
    </div>
  );
}

// ── One project type row ──
function TypeRow({ pt, roles, onChanged }: { pt: ProjectType; roles: Role[]; onChanged: () => void }) {
  const dirty = useRef(false);
  const [name, setName] = useState(pt.name);
  const [vals, setVals] = useState<Record<string, string>>(() => {
    const v: Record<string, string> = {};
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

  const commitName = async () => {
    const n = name.trim();
    if (!n) { setName(pt.name); return; }
    if (n === pt.name) return;
    try {
      await api.updateProjectType(pt.id, { name: n });
      onChanged();
    } catch (e) {
      fail(e);
      setName(pt.name);
    }
  };

  const commit = async () => {
    if (!dirty.current) return;
    dirty.current = false;
    let valid = true;
    const roleHours: Record<string, number> = {};
    roles.forEach((r) => {
      const v = parseFloat(vals["r" + r.id]);
      if (isNaN(v) || v < 0) valid = false;
      else roleHours[String(r.id)] = v;
    });
    if (!valid) return;
    try {
      await api.updateProjectType(pt.id, { roleHours });
      onChanged();
    } catch (e) {
      fail(e);
    }
  };

  const total = Object.keys(vals).reduce((sum, k) => sum + (parseFloat(vals[k]) || 0), 0);

  const cell = (k: string) => (
    <td className="px-4 py-3" key={k}>
      <input
        type="number"
        min="0"
        step="1"
        value={vals[k] ?? ""}
        onChange={(e) => setVal(k, e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
        className={fieldClass + " w-20"}
      />
    </td>
  );

  return (
    <tr>
      <td className="px-6 py-3 whitespace-nowrap">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
          className={fieldClass + " w-44 font-medium text-pentag-dark"}
        />
      </td>
      {roles.map((r) => cell("r" + r.id))}
      <td className="px-4 py-3 text-gray-600 font-medium">{total.toFixed(0)}</td>
    </tr>
  );
}

export default function InputPage() {
  const queryClient = useQueryClient();
  const refresh = () => { queryClient.invalidateQueries(); };
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [newType, setNewType] = useState("");
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRole, setNewRole] = useState("");

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["employees", "all"],
    queryFn: api.getAllEmployees,
  });
  const { data: roles = [] } = useQuery<Role[]>({ queryKey: ["roles"], queryFn: api.getRoles });
  const { data: types = [] } = useQuery<ProjectType[]>({ queryKey: ["projectTypes"], queryFn: api.getProjectTypes });

  const addType = async () => {
    const n = newType.trim();
    if (!n) return;
    try {
      await api.createProjectType({ name: n });
      setNewType("");
      setShowAddType(false);
      refresh();
    } catch (e) {
      fail(e);
    }
  };

  const addRole = async () => {
    const n = newRole.trim();
    if (!n) return;
    try {
      await api.createRole({ name: n });
      setNewRole("");
      setShowAddRole(false);
      refresh();
    } catch (e) {
      fail(e);
    }
  };

  if (isLoading) {
    return <div className="text-center py-20 text-gray-400 text-lg">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {/* Card 1: employees */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-pentag-dark">Employees</h2>
            <p className="text-xs text-gray-400 mt-1">
              Changes save automatically (names, FTE, status, role). Personal holidays are date ranges; weekends inside a
              range are skipped. Renaming updates every tab. Project-level role assignments are done on the Project tab.
            </p>
          </div>
          <button onClick={() => setShowAddEmp((v) => !v)} className={showAddEmp ? ghostBtn : addBtn}>
            {showAddEmp ? "Cancel" : "+ Add employee"}
          </button>
        </div>
        {showAddEmp && (
          <AddEmployeeForm roles={roles} onDone={() => { setShowAddEmp(false); refresh(); }} />
        )}
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

      {/* Card 2: role names */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-pentag-dark">Roles</h2>
            <p className="text-xs text-gray-400 mt-1">
              Rename roles by editing them in place; new names appear everywhere. The PM and PD roles are held by each project's PM and PD. A new role gets 50 hours in every
              project type (editable in the card below) and shows as unassigned on each project.
            </p>
          </div>
          <button onClick={() => setShowAddRole((v) => !v)} className={showAddRole ? ghostBtn : addBtn}>
            {showAddRole ? "Cancel" : "+ Add role"}
          </button>
        </div>
        {showAddRole && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role name</label>
              <input
                type="text"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addRole(); }}
                className={fieldClass + " w-56"}
                autoFocus
              />
            </div>
            <button onClick={addRole} disabled={!newRole.trim()} className={addBtn}>Save role</button>
          </div>
        )}
        <div className="px-6 py-4 flex flex-wrap gap-3">
          {roles.map((r) => (
            <RoleRow key={r.id + "-" + r.name} role={r} onChanged={refresh} />
          ))}
        </div>
      </div>

      {/* Card 3: project types x role hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-pentag-dark">Project Types — Allocated Hours</h2>
            <p className="text-xs text-gray-400 mt-1">
              Hours per role for each project type. Role hours are split equally between everyone holding the role on a
              project. The PM and PD roles are held by each project's PM and PD (one person each), who get those hours in full.
            </p>
          </div>
          <button onClick={() => setShowAddType((v) => !v)} className={showAddType ? ghostBtn : addBtn}>
            {showAddType ? "Cancel" : "+ Add project type"}
          </button>
        </div>
        {showAddType && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Project type name</label>
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addType(); }}
                className={fieldClass + " w-56"}
                autoFocus
              />
            </div>
            <button onClick={addType} disabled={!newType.trim()} className={addBtn}>Save project type</button>
            <span className="text-xs text-gray-400">New types start with 50 hours for every role.</span>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-600">
                <th className="px-6 py-3 font-medium">Project type</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-4 py-3 font-medium">{r.name}</th>
                ))}
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.length > 0 && types.map((pt) => (
                <TypeRow key={pt.id + "-" + roles.length} pt={pt} roles={roles} onChanged={refresh} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
