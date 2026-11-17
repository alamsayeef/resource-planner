import { useMemo, useState } from "react";
import type { Project } from "../lib/api";

interface Props {
  projects: Project[];
}

const PAGE_OPTIONS = [5, 10, 25, 50];

export default function ProjectGrid({ projects }: Props) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  // Reset page when projects change
  useMemo(() => setPage(0), [projects]);

  // Paginate
  const totalPages = Math.ceil(projects.length / pageSize);
  const pageData = projects.slice(page * pageSize, (page + 1) * pageSize);

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPage(0);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "Ongoing":    return "bg-emerald-100 text-emerald-800";
      case "Incoming":   return "bg-blue-100 text-blue-800";
      case "Completed":  return "bg-gray-100 text-gray-800";
      case "Removed":    return "bg-red-100 text-red-700";
      default:           return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-pentag-dark">Projects</h2>
          <span className="text-sm text-gray-500">{projects.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-6 py-3 font-medium text-gray-600 w-16">ID</th>
              <th className="px-6 py-3 font-medium text-gray-600">Project Title</th>
              <th className="px-6 py-3 font-medium text-gray-600">Type</th>
              <th className="px-6 py-3 font-medium text-gray-600">Status</th>
              <th className="px-6 py-3 font-medium text-gray-600">PM</th>
              <th className="px-6 py-3 font-medium text-gray-600">PD</th>
              <th className="px-6 py-3 font-medium text-gray-600">Start Date</th>
              <th className="px-6 py-3 font-medium text-gray-600">End Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              pageData.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 text-gray-500 font-mono">{p.id}</td>
                  <td className="px-6 py-3 font-medium text-pentag-dark">{p.name}</td>
                  <td className="px-6 py-3 text-gray-600">{p.projectType?.name || "—"}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-gray-700">{p.pm?.name || "—"}</td>
                  <td className="px-6 py-3 text-gray-700">{p.pd?.name || "—"}</td>
                  <td className="px-6 py-3 text-gray-600">{formatDate(p.startDate)}</td>
                  <td className="px-6 py-3 text-gray-600">{formatDate(p.endDate)}</td>
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
