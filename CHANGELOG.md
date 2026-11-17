
# PenTAG Resource Planner — Changelog

All notable changes to this project will be documented in this file.

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

