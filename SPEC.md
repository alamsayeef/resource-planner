# PenTAG Resource Planner — Specification

**Version:** 0.4.0
**Last Updated:** 2026-11-18
**Author:** Sayeef / Exeter AI Assistant

---

## 1. Overview

A web-based resource and capacity planning tool for PenTAG (Peninsula Technology Assessment Group) at the University of Exeter. Replaces a complex shared Excel file on SharePoint with a modern, multi-user application.

### 1.1 Goals
- Track projects, employees, roles, and assignments in one place
- Visualise team capacity and utilisation over time
- Provide budget tracking per role per project
- Replace manual Excel-based planning with a live, filterable dashboard

### 1.2 Users
- PenTAG team members (researchers, project leads, administrators)
- Internal use only — no public access

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 18 + TypeScript | Single-page app |
| Styling | Tailwind CSS | PenTAG brand colours, Outfit font |
| Routing | React Router v6 | Tab-based navigation |
| Data Fetching | React Query (TanStack) | 30s stale time, caching |
| Backend | Express.js + TypeScript | RESTful API |
| ORM | Prisma | Type-safe DB access |
| Database | SQLite | File-based, zero-config for dev |
| Dev Environment | GitHub Codespaces | Node.js 20 via devcontainer |
| Future Hosting | Azure (App Service or Static Web Apps) or SharePoint | TBC based on access |

---

## 3. Database Schema

### 3.1 Core Models

- **Role** — name, description, category (Technical/Management/Support/Advisory/Review)
- **Employee** — name, email, department, FTE, active status
- **EmployeeFteHistory** — tracks FTE changes over time
- **OrgHoliday** — bank holidays and UoE closure days
- **EmployeeLeave** — annual leave, sick leave, etc.
- **ProjectType** — e.g. Project Type 1, Project Type 2, Project Type 3
- **RoleBudgetTemplate** — default hours per role for a project type
- **Project** — name, type, status, dates, PM (Employee), PD (Employee), budgeted hours
- **ProjectRoleBudget** — actual budgeted hours per role per project
- **ProjectAssignment** — links employee + role + project with allocated hours and dates
- **AppUser** — user accounts with roles (Viewer/Editor/Admin)
- **AppConfig** — key-value settings (hours per day, RAG thresholds, brand colours)

### 3.2 Key Relationships
- Project → ProjectType (many-to-one)
- Project → Employee as PM (many-to-one)
- Project → Employee as PD (many-to-one)
- Project → ProjectAssignment → Employee + Role (many-to-many)
- ProjectType → RoleBudgetTemplate → Role (budget defaults)

---

## 4. API Endpoints

### 4.1 Projects
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List all projects with type, PM, PD, budgets, assignments |
| GET | `/api/projects/:id` | Single project detail |
| POST | `/api/projects` | Create project (auto-creates role budgets from type template) |
| PUT | `/api/projects/:id` | Update project (name, status, dates, PM, PD, etc.) |
| DELETE | `/api/projects/:id` | Soft-delete (sets status to "Archived") |

### 4.2 Employees
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/employees` | List active employees with assignments |
| GET | `/api/employees/:id` | Employee detail with assignments, leave, FTE history |
| POST | `/api/employees` | Create employee + initial FTE history |
| PUT | `/api/employees/:id` | Update (auto-tracks FTE changes) |
| DELETE | `/api/employees/:id` | Soft-delete (sets isActive to false) |

### 4.3 Other Resources
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/roles` | List active roles |
| GET | `/api/project-types` | List project types with budget templates |
| GET/POST/DELETE | `/api/holidays` | Organisation holidays (filterable by year) |
| GET/POST/PUT/DELETE | `/api/leave` | Employee leave records |
| GET/POST/PUT/DELETE | `/api/assignments` | Project assignments with budget enforcement |

### 4.4 Capacity
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/capacity` | Team capacity (weekly breakdown per employee) |
| GET | `/api/capacity/employee/:id` | Individual employee capacity |
| GET | `/api/capacity/summary` | Team summary (total hours, utilisation, RAG counts) |

### 4.5 Config
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/config` | All config key-value pairs |
| PUT | `/api/config/:key` | Update a config value |

### 4.6 Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check (status + timestamp) |

---

## 5. Frontend Architecture

### 5.1 Pages

#### Projects Page (✅ Built — v0.3.0)
- **Status Summary Cards** — 3 cards showing counts for Ongoing, Completed, Incoming. Counts always reflect total projects regardless of active filters. Clickable to filter.
- **Cascading Filter Bar** — 4 dropdowns: Status, Project Type, PM, PD. Each dropdown dynamically limits options in downstream dropdowns. "Reset all" link when any filter is active.
- **Project Grid** — Columns: ID, Project Title, Type, Status, PM, PD, Start Date, End Date. Pagination: 5 (default) / 10 / 25 / 50 rows. Colour-coded status badges.
- **Gantt Chart** — Pure CSS/React (no charting library). Fixed 12-month timeline from earliest project start date. Projects sorted oldest (top) → newest (bottom). Colour-coded bars: Ongoing (green), Incoming (blue), Completed (grey), Removed (red). Bars clamped to visible window. Hover tooltip with project name, dates, status.

#### Employees Page (🔲 Planned)
- Employee list with FTE, department, active assignments
- Individual capacity view
- Assignment management

### 5.2 Components
| Component | File | Purpose |
|-----------|------|---------|
| Layout | `components/Layout.tsx` | App shell, header, tab navigation |
| ProjectFilters | `components/ProjectFilters.tsx` | Cascading dropdown filter bar |
| ProjectGrid | `components/ProjectGrid.tsx` | Paginated data table |
| GanttChart | `components/GanttChart.tsx` | Timeline visualisation |

### 5.3 Shared
| Module | File | Purpose |
|--------|------|---------|
| API client | `lib/api.ts` | Typed fetch wrapper, all API methods |

---

## 6. Statuses

### 6.1 Project Statuses
| Status | Colour (Badge) | Colour (Gantt) | Description |
|--------|----------------|-----------------|-------------|
| Ongoing | Emerald | Green | Currently active projects |
| Incoming | Blue | Blue | Planned/upcoming projects |
| Completed | Grey | Grey | Finished projects |
| Removed | Red | Red | Cancelled/removed projects |

### 6.2 Capacity RAG Status
| RAG | Threshold | Meaning |
|-----|-----------|---------|
| GREEN | ≤ 80% utilisation | Capacity available |
| AMBER | 81–100% utilisation | Near capacity |
| RED | > 100% utilisation | Overloaded |
| UNAVAILABLE | 0 net hours | On leave / no capacity |

---

## 7. Seed Data (Development)

### 7.1 Project Types
- Project Type 1 (40 weeks, 1200 hours)
- Project Type 2 (12 weeks, 300 hours)
- Project Type 3 (26 weeks, 600 hours)

### 7.2 Employees
- Employee 1 through Employee 6 (FTEs: 1.0, 0.8, 1.0, 0.6, 1.0, 0.5)

### 7.3 Projects
- 12 sample projects (Project Name 1–12) with mixed statuses, types, PMs, and PDs

### 7.4 Holidays
- UK bank holidays 2025–2027
- UoE closure days (Christmas period)

---

## 8. Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `standard_hours_per_day` | 7.3 | Contracted hours per working day |
| `standard_days_per_week` | 5 | Working days per week |
| `standard_hours_per_week` | 36.5 | Contracted hours per week |
| `rag_green_max` | 80 | Utilisation % upper bound for GREEN |
| `rag_amber_max` | 100 | Utilisation % upper bound for AMBER |
| `theme_primary` | #003c3c | Primary brand colour |
| `theme_accent` | #00a87e | Accent colour |
| `organisation_name` | PenTAG | Organisation display name |

---

## 9. Brand / Design

- **Font:** Outfit (Google Fonts)
- **Colours:** #022020, #003c3c, #007d69, #00a87e, #00c896
- **Tailwind tokens:** `pentag-dark`, `pentag-primary`, `pentag-accent`

---

## 10. Roadmap

| Priority | Feature | Status |
|----------|---------|--------|
| 1 | Projects tab — grid, filters, Gantt | ✅ Done |
| 2 | Inline editing on project grid | 🔲 Next |
| 3 | Employees tab | 🔲 Planned |
| 4 | Capacity heatmap | 🔲 Planned |
| 5 | Assignment management UI | 🔲 Planned |
| 6 | Authentication (Azure AD) | 🔲 Planned |
| 7 | Deployment to Azure | 🔲 Planned |


---

## 11. Planning Logic (v0.4.0)

### 11.1 Tabs
Overview (former Projects tab) · Project · Employee · Input. Tabs are independent (no cross-navigation).

### 11.2 Hours allocation
- Roles are fixed: Role 1-4. Hours per role per project type are edited on the Input tab (default 50).
- PM and PD have their own separate hours per project type (default 50) and are given to the project's PM / PD.
- Role hours are split equally between all employees assigned to that role on the project. A PM/PD who also holds a technical role counts as one of the holders.
- An employee's total hours on a project are spread equally across their working days within the project dates.
- Working days = Mon-Fri minus public/UoE closure days minus the employee's personal leave.

### 11.3 Capacity
- Monthly available hours = FTE x standard hours/day x working days in the month.
- Utilisation = load / available. RAG: GREEN <= 80%, AMBER <= 100%, RED > 100%, n/a if no available hours.
- Heatmap spans 12 months from the earliest project start within the selected status.
