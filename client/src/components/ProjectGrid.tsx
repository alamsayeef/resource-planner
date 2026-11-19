import { useMemo, useState, useEffect, useRef } from "react";
import type { Project, Employee, ProjectType } from "../lib/api";

interface Props {
  projects: Project[];
  employees: Employee[];
  projectTypes: ProjectType[];
  onSave: (id: number, data: Record<string, any>) => Promise<void>;
}

const PAGE_OPTIONS = [5, 10, 25, 50];
const STATUSES = ["Ongoing", "Incoming", "Completed", "Removed"];

type SortKey = "id" | "code" | "name" | "type" | "status" | "pm" | "pd" | "startDate" | "endDate";
type SortDir = "asc" | "desc";

interface EditState {
  rowId: number;
  field: string;
  value: string;
}

export default function ProjectGrid({ projects, employees, projectTypes, onSave }: Props) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [editing, setEditing] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  // Reset page when projects change
  useMemo(() => setPage(0), [projects.length]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...projects];
    arr.sort((a, b) => {
      let valA: any;
      let valB: any;
      switch (sortKey) {
        case "id":        valA = a.id; valB = b.id; break;
        case "code":      valA = (a.code || "").toLowerCase(); valB = (b.code || "").toLowerCase(); break;
        case "name":      valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case "type":      valA = (a.projectType?.name || "").toLowerCase(); valB = (b.projectType?.name || "").toLowerCase(); break;
        case "status":    valA = a.status.toLowerCase(); valB = b.status.toLowerCase(); break;
        case "pm":        valA = (a.pm?.name || "").toLowerCase(); valB = (b.pm?.name || "").toLowerCase(); break;
        case "pd":        valA = (a.pd?.name || "").toLowerCase(); valB = (b.pd?.name || "").toLowerCase(); break;
        case "startDate": valA = a.startDate; valB = b.startDate; break;
        case "endDate":   valA = a.endDate; valB = b.endDate; break;
        default:          valA = a.id; valB = b.id;
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [projects, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const pageData = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const startEdit = (rowId: number, field: string, currentValue: string) => {
    if (field === "id") return; // ID is not editable
    setEditing({ rowId, field, value: currentValue });
  };

  const cancelEdit = () => setEditing(null);

  const commitEdit = async () => {
    if (!editing) return;
    setSaving(true);

    try {
      const payload: Record<string, any> = {};
      switch (editing.field) {
        case "code":
          payload.code = editing.value;
          break;
        case "name":
          payload.name = editing.value;
          break;
        case "type":
          payload.projectTypeId = editing.value ? Number(editing.value) : null;
          break;
        case "status":
          payload.status = editing.value;
          break;
        case "pm":
          payload.pmId = editing.value ? Number(editing.value) : null;
          break;
        case "pd":
          payload.pdId = editing.value ? Number(editing.value) : null;
          break;
        case "startDate":
          payload.startDate = editing.value;
          break;
        case "endDate":
          payload.endDate = editing.value;
          break;
      }
      await onSave(editing.rowId, payload);
    } catch (e) {
      console.error("Save failed:", e);
      window.alert(e instanceof Error ? e.message : "Save failed");
    }

    setSaving(false);
    setEditing(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const toInputDate = (iso: string) => {
    return new Date(iso).toISOString().slice(0, 10);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Ongoing":   return "bg-emerald-100 text-emerald-800";
      case "Incoming":  return "bg-blue-100 text-blue-800";
      case "Completed": return "bg-gray-100 text-gray-800";
      case "Removed":   return "bg-red-100 text-red-700";
      default:          return "bg-gray-100 text-gray-600";
    }
  };

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return " \u2195";
    return sortDir === "asc" ? " \u2191" : " \u2193";
  };

  const headerClass = "px-6 py-3 font-medium text-gray-600 cursor-pointer hover:text-pentag-primary select-none whitespace-nowrap";

  const isEditing = (rowId: number, field: string) =>
    editing?.rowId === rowId && editing?.field === field;

  const renderCell = (p: Project, field: string) => {
    if (isEditing(p.id, field)) {
      switch (field) {
        case "code":
        case "name":
          return (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={editing!.value}
              onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-pentag-accent rounded focus:outline-none focus:ring-1 focus:ring-pentag-accent"
            />
          );
        case "type":
          return (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editing!.value}
              onChange={(e) => { setEditing({ ...editing!, value: e.target.value }); }}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-pentag-accent rounded focus:outline-none focus:ring-1 focus:ring-pentag-accent"
            >
              <option value="">— None —</option>
              {projectTypes.map((pt) => (
                <option key={pt.id} value={String(pt.id)}>{pt.name}</option>
              ))}
            </select>
          );
        case "status":
          return (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editing!.value}
              onChange={(e) => { setEditing({ ...editing!, value: e.target.value }); }}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-pentag-accent rounded focus:outline-none focus:ring-1 focus:ring-pentag-accent"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          );
        case "pm":
        case "pd":
          return (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editing!.value}
              onChange={(e) => { setEditing({ ...editing!, value: e.target.value }); }}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-pentag-accent rounded focus:outline-none focus:ring-1 focus:ring-pentag-accent"
            >
              <option value="">— None —</option>
              {employees.map((emp) => (
                <option key={emp.id} value={String(emp.id)}>{emp.name}</option>
              ))}
            </select>
          );
        case "startDate":
        case "endDate":
          return (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="date"
              value={editing!.value}
              onChange={(e) => setEditing({ ...editing!, value: e.target.value })}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              className="w-full px-2 py-1 text-sm border border-pentag-accent rounded focus:outline-none focus:ring-1 focus:ring-pentag-accent"
            />
          );
        default:
          return null;
      }
    }

    // Display mode
    switch (field) {
      case "code":
        return (
          <span
            className="font-mono text-gray-700 cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "code", p.code || "")}
          >
            {p.code || "—"}
          </span>
        );
      case "name":
        return (
          <span
            className="font-medium text-pentag-dark cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "name", p.name)}
          >
            {p.name}
          </span>
        );
      case "type":
        return (
          <span
            className="text-gray-600 cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "type", p.projectType ? String(p.projectType.id) : "")}
          >
            {p.projectType?.name || "—"}
          </span>
        );
      case "status":
        return (
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer ${statusColor(p.status)}`}
            onClick={() => startEdit(p.id, "status", p.status)}
          >
            {p.status}
          </span>
        );
      case "pm":
        return (
          <span
            className="text-gray-700 cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "pm", p.pm ? String(p.pm.id) : "")}
          >
            {p.pm?.name || "—"}
          </span>
        );
      case "pd":
        return (
          <span
            className="text-gray-700 cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "pd", p.pd ? String(p.pd.id) : "")}
          >
            {p.pd?.name || "—"}
          </span>
        );
      case "startDate":
        return (
          <span
            className="text-gray-600 cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "startDate", toInputDate(p.startDate))}
          >
            {formatDate(p.startDate)}
          </span>
        );
      case "endDate":
        return (
          <span
            className="text-gray-600 cursor-pointer hover:bg-pentag-accent/10 px-1 -mx-1 rounded"
            onClick={() => startEdit(p.id, "endDate", toInputDate(p.endDate))}
          >
            {formatDate(p.endDate)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-pentag-dark">Projects</h2>
          <span className="text-sm text-gray-500">{projects.length} results</span>
          {saving && <span className="text-xs text-pentag-accent animate-pulse">Saving...</span>}
        </div>
        <span className="text-xs text-gray-400">Click any cell to edit</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className={headerClass + " w-16"} onClick={() => handleSort("id")}>#{sortArrow("id")}</th>
              <th className={headerClass} onClick={() => handleSort("code")}>ID{sortArrow("code")}</th>
              <th className={headerClass} onClick={() => handleSort("name")}>Project Title{sortArrow("name")}</th>
              <th className={headerClass} onClick={() => handleSort("type")}>Type{sortArrow("type")}</th>
              <th className={headerClass} onClick={() => handleSort("status")}>Status{sortArrow("status")}</th>
              <th className={headerClass} onClick={() => handleSort("pm")}>PM{sortArrow("pm")}</th>
              <th className={headerClass} onClick={() => handleSort("pd")}>PD{sortArrow("pd")}</th>
              <th className={headerClass} onClick={() => handleSort("startDate")}>Start Date{sortArrow("startDate")}</th>
              <th className={headerClass} onClick={() => handleSort("endDate")}>End Date{sortArrow("endDate")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              pageData.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-500 font-mono">{p.id}</td>
                  <td className="px-6 py-3">{renderCell(p, "code")}</td>
                  <td className="px-6 py-3">{renderCell(p, "name")}</td>
                  <td className="px-6 py-3">{renderCell(p, "type")}</td>
                  <td className="px-6 py-3">{renderCell(p, "status")}</td>
                  <td className="px-6 py-3">{renderCell(p, "pm")}</td>
                  <td className="px-6 py-3">{renderCell(p, "pd")}</td>
                  <td className="px-6 py-3">{renderCell(p, "startDate")}</td>
                  <td className="px-6 py-3">{renderCell(p, "endDate")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Show</span>
          {PAGE_OPTIONS.map((size) => (
            <button
              key={size}
              onClick={() => handlePageSizeChange(size)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                pageSize === size
                  ? "bg-pentag-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
