
# PenTAG Resource Planner — Session State

**Last updated:** 2026-11-17
**Current version:** 0.3.0

---

## What's Working (Do Not Touch)
- ✅ Backend API — all 32 endpoints functional (Express + Prisma + SQLite)
- ✅ Database schema with PM/PD relations on Project model
- ✅ Seed data — 12 projects, 6 employees, 3 project types, UK holidays
- ✅ Status cards — Ongoing (4), Completed (3), Incoming (3) — counts ignore filters
- ✅ Cascading filter dropdowns — Status, Project Type, PM, PD
- ✅ Project grid — ID, Title, Type, Status, PM, PD, Start/End Date, pagination 5/10/25/50
- ✅ Gantt chart — fixed 12-month timeline, sorted oldest→newest, colour-coded, no red line
- ✅ Layout shell with Projects/Employees tab navigation
- ✅ Codespace dev environment (devcontainer.json configured)
- ✅ Vite proxy from client (5173) → API (3001)

## Statuses In Use
- **Ongoing** | **Incoming** | **Completed** | **Removed**

## Project Types In Use
- Project Type 1 | Project Type 2 | Project Type 3

## Known Issues / Quirks
- Node.js v24 in Codespace (specified v20 but ignored) — use `npx tsx` not `tsx`
- `.env` not pushed to GitHub — must create manually in Codespace: `export DATABASE_URL="file:./dev.db"`
- Array index `[0]` gets stripped in terminal heredoc copy-paste — use `Math.min(...array.map())` pattern instead
- Must run `npm install` at root level (not just server/client) to get `concurrently`

## Next Session TODO
1. Inline editing on project grid
2. Employee tab
3. Capacity heatmap
4. Update CHANGELOG + SPEC after each change

## File Map (Source Files)
### Backend (server/src/)
- `index.ts` — Express entry, route registration
- `modules/employees/employee.routes.ts` + `employee.controller.ts`
- `modules/roles/role.routes.ts`
- `modules/project-types/projectType.routes.ts`
- `modules/projects/project.routes.ts`
- `modules/assignments/assignment.routes.ts`
- `modules/leave/leave.routes.ts`
- `modules/holidays/holiday.routes.ts`
- `modules/capacity/capacity.routes.ts` + `capacity.controller.ts` + `capacity.service.ts` + `capacity.helpers.ts`
- `modules/config/config.routes.ts`

### Frontend (client/src/)
- `App.tsx` — Router + QueryClient
- `lib/api.ts` — Fetch wrapper + types
- `components/Layout.tsx` — Shell + tabs
- `components/ProjectFilters.tsx` — Cascading dropdowns
- `components/ProjectGrid.tsx` — Data table + pagination
- `components/GanttChart.tsx` — Timeline chart
- `pages/ProjectsPage.tsx` — Projects dashboard

### Config
- `.devcontainer/devcontainer.json`
- `server/prisma/schema.prisma`
- `server/prisma/seed.ts`
- `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`

