const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json();
}

export interface Employee {
  id: number;
  name: string;
  email: string | null;
}

export interface ProjectType {
  id: number;
  name: string;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  totalBudgetedHours: number | null;
  projectType: ProjectType | null;
  pm: Employee | null;
  pd: Employee | null;
}

export const api = {
  // Projects
  getProjects: () => request<Project[]>("/projects"),
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: number, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id: number) =>
    request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),

  // Employees
  getEmployees: () => request<Employee[]>("/employees"),

  // Project Types
  getProjectTypes: () => request<ProjectType[]>("/project-types"),

  // Other
  getRoles: () => request<any[]>("/roles"),
  getCapacity: () => request<any[]>("/capacity"),
  getCapacitySummary: () => request<any>("/capacity/summary"),
  getConfig: () => request<Record<string, string>>("/config"),
  healthCheck: () => request<{ status: string; timestamp: string }>("/health"),
};
