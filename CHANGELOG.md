
# PenTAG Resource Planner — Changelog

All notable changes to this project will be documented in this file.

---

## [0.4.4] — 2026-11-18

### Changed
- Dropped the old separate PM/PD hour columns (`pm_hours`, `pd_hours`) from project types; PM/PD hours now come only from the Project Manager / Project Director roles in the Roles card
- Reverted the PM/PD tags in the Roles card and the PM/PD dropdown rows in the Project tab (PM/PD are shown read-only at the top and changed on Overview, as before)
- Removed the one-off migration script

---

## [0.4.3] — 2026-11-18

### Changed
- Roles named PM or PD are rejected (they have built-in hours columns); roles can now be removed with × on the Input tab (deactivated, hidden everywhere)

---

## [0.4.3] — 2026-11-18

### Changed
- **PM and PD are now roles** ("Project Manager", "Project Director", flagged by `Role.systemKey`) instead of separate hour columns. They appear in the Roles card (renamable, tagged PM/PD) and as one hours column each in the project types table
- Project tab: PM/PD rows sit with the other roles and are single-person dropdowns (still editable on Overview); regular roles still allow several people
- Planning logic reads PM/PD hours from their role's template; assigning someone to the PM/PD role via the assign endpoint is rejected
- Migration script `server/prisma/migrate-pm-pd.ts` carried the old PM/PD hours into role templates (old `pm_hours`/`pd_hours` columns are now unused)

---

## [0.4.2] — 2026-11-18

### Added
- **Input tab:** "+ Add role" button. New roles get 50h in every existing project type and appear automatically in the Project tab, Employee primary-role dropdown and the hours table

---

## [0.4.1] — 2026-11-18

### Added
- **Input tab:** editable employee names, role names and project type names; "+ Add employee" and "+ Add project type" buttons (new types start at 50h per role/PM/PD)
- **Project tab:** assign / remove employees per role ("+ Add employee" dropdown under each role, × to remove)
- `POST/DELETE /api/planning/project/:id/assign`; `POST /api/employees`, `PUT /api/roles/:id` and project-type routes now validate and return friendly errors (duplicate names/emails)

### Fixed
- Overview inline edit of project **Type** was silently ignored by the API (`PUT /api/projects/:id` ignored `projectTypeId`)
- Overview edits now refresh all tabs

---

## [0.4.0] — 2026-11-18

### Summary
Renamed Projects tab to Overview. Added Project, Employee and Input tabs with a role/hours-based capacity model.

### Added
- **Project tab** — pick status, then project; shows type, dates, PM, PD and who holds which role, with role hours, FTE-adjusted available hours and load
- **Employee tab** — pick employee + status (Ongoing/Incoming/Completed); card 1 lists their projects, card 2 is a 12-month capacity heatmap (utilisation RAG)
- **Input tab** — edit employees (primary role, active/inactive, FTE, personal holiday date ranges) and per-project-type hours for Role 1-4, PM and PD (default 50h each)
- **Planning API** — `/api/planning/project/:id`, `/api/planning/employee/:id?status=`
- `PUT /api/project-types/:id`, `GET /api/employees?all=true`
- Schema: `Employee.primaryRoleId`, `ProjectType.pmHours`, `ProjectType.pdHours`

### Changed
- Tab "Projects" renamed "Overview" (route `/overview`)
- Roles replaced with Role 1-4; budget templates seeded at 50h per role per type; seed now assigns employees to roles and adds sample leave

---

## [0.3.0] — 2026-11-17

### Summary
Built the full Projects tab with cascading filters, paginated data grid, and Gantt timeline chart.

### Added — Frontend
- **ProjectsPage** (`client/src/pages/ProjectsPage.tsx`) — Main projects dashboard composing status cards, filters, grid, and Gantt chart
- **ProjectFilters** (`client/src/components/ProjectFilters.tsx`) — Cascading dropdown filters for Status, Project Type, PM, PD. Changing an upstream filter resets downstream filters and dynamically limits available options
- **ProjectGrid** (`client/src/components/ProjectGrid.tsx`) — Data table displaying ID, Project Title, Type, Status, PM, PD, Start Date, End Date. Pagination with 5/10/25/50 rows per page
- **GanttChart** (`client/src/components/GanttChart.tsx`) — Pure CSS/React timeline chart. Fixed 12-month window starting from earliest project start date. Projects sorted oldest → newest (top to bottom). Colour-coded bars by status. No external charting library
- **Layout** (`client/src/components/Layout.tsx`) — App shell with header, PenTAG branding, and tab navigation (Projects / Employees)
- **API helper** (`client/src/lib/api.ts`) — Centralised fetch wrapper with typed interfaces for Project, Employee, ProjectType. Includes CRUD methods for projects
- **React Router** — Tab-based navigation via `react-router-dom`
- **React Query** — Data fetching with `@tanstack/react-query`, 30s stale time, single retry

### Added — Backend
- **PM/PD fields** on Project model (`pmId`, `pdId`) — links projects to employees as Project Manager and Project Director
- **PM/PD relations** on Employee model (`managedProjects`, `directedProjects`)
- **Project API updated** (`server/src/modules/projects/project.routes.ts`) — All endpoints now include PM and PD data with select (id, name, email)
- **Project Types endpoint** exposed via `api.getProjectTypes()`

### Changed — Data
- **Statuses** changed from Active/Draft/Completed/On Hold/Archived → **Ongoing/Incoming/Completed/Removed**
- **Project Types** simplified to Project Type 1, Project Type 2, Project Type 3
- **Projects** renamed to Project Name 1 through Project Name 12, with varied statuses, types, PMs, and PDs
- **Employees** renamed to Employee 1 through Employee 6
- **Status cards** now show only Ongoing, Completed, Incoming — counts always reflect total projects regardless of active filters

### Fixed
- **Gantt "Invalid Date" bug** — Array index notation (`sorted[0]`) was being stripped during terminal copy-paste. Replaced with `Math.min(...sorted.map(...))` pattern to reliably extract earliest date
- **`devcontainer.json` warnings** — Removed `esbenp.prettier-vscode` from default formatter (not pre-installed). Replaced deprecated `javascript.preferences.importModuleSpecifier` with `js/ts.preferences.importModuleSpecifier`
- **Gantt red "today" line** — Removed per user request
- **Gantt timeline** — Fixed to 12 months from first project start, does not shift with filters

---

## [0.2.0] — 2026-11-17

### Summary
Created all 14 backend source files, resolved Node.js v24 compatibility issues, and achieved first successful app launch in GitHub Codespaces.

### Added — Backend Source Files
- `server/src/index.ts` — Express server entry point, CORS, route registration, Prisma client
- `server/src/modules/employees/employee.routes.ts` — Employee CRUD routes
- `server/src/modules/employees/employee.controller.ts` — Employee list, getById, create, update, soft-delete with FTE history tracking
- `server/src/modules/roles/role.routes.ts` — Role CRUD (inline handlers)
- `server/src/modules/project-types/projectType.routes.ts` — Project type CRUD with budget templates
- `server/src/modules/projects/project.routes.ts` — Project CRUD with role budget auto-creation from templates
- `server/src/modules/assignments/assignment.routes.ts` — Assignment CRUD with budget enforcement
- `server/src/modules/leave/leave.routes.ts` — Leave record CRUD
- `server/src/modules/holidays/holiday.routes.ts` — Organisation holiday CRUD with year filtering
- `server/src/modules/capacity/capacity.routes.ts` — Capacity endpoint routing
- `server/src/modules/capacity/capacity.controller.ts` — Team/employee/summary capacity endpoints
- `server/src/modules/capacity/capacity.helpers.ts` — Weekly calendar builder, working days calculator, holiday-aware
- `server/src/modules/capacity/capacity.service.ts` — Full capacity computation engine (gross capacity, leave deductions, load calculation, RAG status, utilisation %)
- `server/src/modules/config/config.routes.ts` — App configuration key-value CRUD

### Fixed
- **Node.js v24 / tsx compatibility** — Codespace defaulted to Node v24 instead of v20, causing ESM resolution errors with tsx. Resolved by using `npx tsx` directly
- **Missing .env in Codespace** — `.env` file was in `.gitignore` and not pushed. Fixed by creating it manually and setting `DATABASE_URL` via export
- **Missing `concurrently` package** — Root-level `node_modules` not installed. Fixed by running `npm install` at project root

---

## [0.1.0] — 2026-11-17

### Summary
Initial project scaffold — database schema, seed data, configuration files, and basic frontend health-check page.

### Added — Project Configuration
- `.devcontainer/devcontainer.json` — Codespace config with Node.js 20, port forwarding (3001, 5173), VS Code extensions
- `package.json` (root) — Workspace scripts: `setup`, `dev` (concurrently), `dev:server`, `dev:client`
- `server/package.json` — Express, Prisma, cors, tsx dependencies
- `server/tsconfig.json` — TypeScript config for server (ES2022, NodeNext)
- `client/package.json` — React 18, Vite, React Router, React Query, Tailwind CSS, Axios
- `client/tsconfig.json` — TypeScript config for client
- `client/vite.config.ts` — Vite config with API proxy to port 3001
- `client/tailwind.config.js` — Tailwind with PenTAG brand colours (pentag-dark, pentag-primary, pentag-accent)
- `client/postcss.config.js` — PostCSS with Tailwind and Autoprefixer
- `.gitignore` — Node modules, dist, .env, SQLite files

### Added — Database
- `server/prisma/schema.prisma` — Full schema: Role, Employee, EmployeeFteHistory, OrgHoliday, EmployeeLeave, ProjectType, RoleBudgetTemplate, Project, ProjectRoleBudget, ProjectAssignment, AppUser, AppConfig
- `server/prisma/seed.ts` — Seed script with config values, 8 roles, sample employees, UK bank holidays (2025–2027), UoE closure days, project types with budget templates, sample project and assignments

### Added — Frontend
- `client/index.html` — HTML entry point
- `client/src/main.tsx` — React DOM render entry
- `client/src/App.tsx` — Health-check landing page showing API connection status
- `client/src/index.css` — Tailwind base/components/utilities imports, Outfit font

### Design Decisions
- **SQLite** chosen for zero-config development (file-based, no server needed)
- **GitHub Codespaces** chosen as dev environment (user cannot install Node.js locally)
- **Prisma ORM** for type-safe database access
- **Tailwind CSS** for utility-first styling with UoE/PenTAG brand colours
- **Outfit font** per user preference

