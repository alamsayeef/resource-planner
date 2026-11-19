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

export const PLANNING_STATUSES = ["Ongoing", "Incoming", "Completed"];

export interface Role {
  id: number;
  name: string;
  systemKey?: string | null;
}

export interface LeaveRecord {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string | null;
  fte?: number;
  isActive?: boolean;
  primaryRoleId?: number | null;
  primaryRole?: Role | null;
  leave?: LeaveRecord[];
}

export interface BudgetTemplate {
  roleId: number;
  budgetedHours: number;
}

export interface ProjectType {
  id: number;
  name: string;
  budgetTemplates?: BudgetTemplate[];
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  code: string | null;
  status: string;
  startDate: string;
  endDate: string;
  totalBudgetedHours: number | null;
  projectType: ProjectType | null;
  pm: Employee | null;
  pd: Employee | null;
}

// ── Planning (computed server-side) ──
export interface ProjectPerson {
  employeeId: number;
  name: string;
  fte: number;
  hours: number;
  projectTotalHours: number;
  availableHours: number;
  workingDays: number;
}

export interface ProjectRoleBlock {
  roleId: number;
  roleName: string;
  roleHours: number;
  assignees: ProjectPerson[];
  systemKey?: string | null;
}

export interface ProjectDetail {
  project: {
    id: number;
    name: string;
    status: string;
    typeName: string | null;
    startDate: string;
    endDate: string;
  };
  pm: ProjectPerson | null;
  pd: ProjectPerson | null;
  pmHours: number;
  pdHours: number;
  roles: ProjectRoleBlock[];
}

export interface PlanningMonth {
  key: string;
  label: string;
}

export interface PlanningProject {
  id: number;
  name: string;
  status: string;
  typeName: string | null;
  startDate: string;
  endDate: string;
  pm: string | null;
  pd: string | null;
  roles: string[];
  totalHours: number;
  workingDays: number;
  monthly: Record<string, number>;
}

export interface PlanningMonthly {
  key: string;
  availableHours: number;
  loadHours: number;
  utilisationPct: number;
  rag: "GREEN" | "AMBER" | "RED" | "UNAVAILABLE";
  workingDays: number;
}

export interface EmployeePlanning {
  employee: { id: number; name: string; fte: number; primaryRole: string | null };
  status: string;
  months: PlanningMonth[];
  projects: PlanningProject[];
  monthly: PlanningMonthly[];
}

export const api = {
  // Projects
  getProjects: () => request<Project[]>("/projects"),
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (data: Partial<Project>) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  updateProject: (id: number, data: Record<string, any>) =>
    request<Project>(`/projects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProject: (id: number) =>
    request<{ success: boolean }>(`/projects/${id}`, { method: "DELETE" }),

  // Employees
  getEmployees: () => request<Employee[]>("/employees"),
  getAllEmployees: () => request<Employee[]>("/employees?all=true"),
  updateEmployee: (id: number, data: Record<string, any>) =>
    request<Employee>(`/employees/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Personal leave
  createLeave: (data: { employeeId: number; startDate: string; endDate: string; leaveType?: string }) =>
    request<LeaveRecord>("/leave", { method: "POST", body: JSON.stringify(data) }),
  deleteLeave: (id: number) =>
    request<{ success: boolean }>(`/leave/${id}`, { method: "DELETE" }),

  // Project Types
  getProjectTypes: () => request<ProjectType[]>("/project-types"),
  updateProjectType: (
    id: number,
    data: { name?: string; roleHours?: Record<string, number> }
  ) => request<ProjectType>(`/project-types/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Planning
  getProjectDetail: (id: number) => request<ProjectDetail>(`/planning/project/${id}`),
  getEmployeePlanning: (id: number, status: string) =>
    request<EmployeePlanning>(`/planning/employee/${id}?status=${encodeURIComponent(status)}`),

  createEmployee: (data: { name: string; email?: string | null; fte?: number; primaryRoleId?: number | null }) =>
    request<Employee>("/employees", { method: "POST", body: JSON.stringify(data) }),
  createProjectType: (data: { name: string }) =>
    request<ProjectType>("/project-types", { method: "POST", body: JSON.stringify(data) }),
  deleteRole: (id: number) =>
    request<{ success: boolean }>(`/roles/${id}`, { method: "DELETE" }),
  createRole: (data: { name: string }) =>
    request<Role>("/roles", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: number, data: { name?: string }) =>
    request<Role>(`/roles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  assignEmployee: (projectId: number, employeeId: number, roleId: number) =>
    request<{ success: boolean }>(`/planning/project/${projectId}/assign`, {
      method: "POST",
      body: JSON.stringify({ employeeId, roleId }),
    }),
  unassignEmployee: (projectId: number, employeeId: number, roleId: number) =>
    request<{ success: boolean }>(
      `/planning/project/${projectId}/assign?employeeId=${employeeId}&roleId=${roleId}`,
      { method: "DELETE" }
    ),

  // Other
  getRoles: () => request<Role[]>("/roles"),
  getCapacity: () => request<any[]>("/capacity"),
  getCapacitySummary: () => request<any>("/capacity/summary"),
  getConfig: () => request<Record<string, string>>("/config"),
  healthCheck: () => request<{ status: string; timestamp: string }>("/health"),
};
