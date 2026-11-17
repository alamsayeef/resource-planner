
# PenTAG Resource Planner — Master Changelog

All notable changes to project files are tracked here.

---

## Legend

- **Status:** `Created` | `Revised` | `Deleted`
- **Revisions** are numbered sequentially: `REV-001`, `REV-002`, etc.
- Each revision includes: date, file(s), what changed, why, and a diff where helpful.

---

## Project Setup — 2026-11-17

### Design Decisions (Pre-Code)

Before any files were created, the following architectural decisions were made:

| Decision | Choice | Rationale |
|---|---|---|
| Source of truth | Replace complex shared Excel on SharePoint | Excel doesn't scale; web app gives concurrent access, audit trail, and validation |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS | Modern, fast, type-safe; Tailwind matches PenTAG brand easily |
| Backend | Express + TypeScript + Prisma ORM | Lightweight, type-safe end-to-end, Prisma gives auto-generated queries |
| Database (dev) | SQLite via Prisma | Zero-config, file-based, perfect for local/Codespace dev |
| Database (prod) | PostgreSQL (Azure) | Production-grade; Prisma makes the switch a one-line config change |
| Dev environment | GitHub Codespaces | No local Node.js install required (user has no admin rights to install); runs in browser |
| Working hours | 7.3 hrs/day × 5 days = 36.5 hrs/week | UoE standard contract |
| Holidays | UK Bank Holidays + UoE closure days | Pre-seeded for 2025–2026 |
| Font | Outfit (Google Fonts) | User preference |
| Colour palette | PenTAG greens: #022020, #003c3c, #007d69, #00a87e, #00c896 | User preference |
| RAG thresholds | GREEN ≤80%, AMBER ≤100%, RED >100% | Standard capacity planning convention |
| Hosting (future) | Azure (institutional licence) or SharePoint embedded | User has UoE Azure access; SharePoint is fallback |

### Codespaces Resource Estimate

| Resource | Estimated Usage | Free Tier Limit |
|---|---|---|
| Core-hours/month | ~40–50 hrs | 120 hrs |
| Storage | ~0.5–1 GB | 15 GB |

### Initial File Creation

All 34 files were created on 2026-11-17.

| # | File Path | Status | Notes |
|---|---|---|---|
| 1 | `.devcontainer/devcontainer.json` | Created → **Revised ×2** | See REV-001, REV-002 |
| 2 | `.gitignore` | Created | — |
| 3 | `package.json` (root) | Created | Monorepo scripts: setup, dev, db:reset, db:studio, build |
| 4 | `README.md` | Created | Quick start guide + tech stack summary |
| 5 | `server/.env` | Created | SQLite URL, port 3001, CORS origin |
| 6 | `server/package.json` | Created | Express, Prisma, Zod, tsx |
| 7 | `server/tsconfig.json` | Created | ES2022, CommonJS, strict mode |
| 8 | `server/prisma/schema.prisma` | Created | 11 models: Role, Employee, EmployeeFteHistory, OrgHoliday, EmployeeLeave, ProjectType, RoleBudgetTemplate, Project, ProjectRoleBudget, ProjectAssignment, AppUser, AppConfig |
| 9 | `server/prisma/seed.ts` | Created | Seeds: 8 config keys, 8 roles, 24 holidays (2025–2026), 4 sample employees, 2 project types (HTA Report, Rapid Review), HTA budget templates, 1 sample project with assignment |
| 10 | `server/src/index.ts` | Created | Express app entry point, 9 route modules mounted |
| 11 | `server/src/modules/employees/employee.routes.ts` | Created | GET /, GET /:id, POST /, PUT /:id, DELETE /:id |
| 12 | `server/src/modules/employees/employee.controller.ts` | Created | CRUD + automatic FTE history tracking on update |
| 13 | `server/src/modules/roles/role.routes.ts` | Created | GET /, POST /, PUT /:id |
| 14 | `server/src/modules/project-types/projectType.routes.ts` | Created | GET /, GET /:id, POST / (with nested budget templates) |
| 15 | `server/src/modules/projects/project.routes.ts` | Created | Full CRUD + auto-copies budget templates from project type on create |
| 16 | `server/src/modules/assignments/assignment.routes.ts` | Created | CRUD + budget overrun validation on create |
| 17 | `server/src/modules/leave/leave.routes.ts` | Created | CRUD, filterable by employeeId |
| 18 | `server/src/modules/holidays/holiday.routes.ts` | Created | GET (filterable by year), POST, DELETE |
| 19 | `server/src/modules/capacity/capacity.routes.ts` | Created | GET / (team), GET /employee/:id, GET /summary |
| 20 | `server/src/modules/capacity/capacity.controller.ts` | Created | Parses date range from query params, defaults to 12-week window |
| 21 | `server/src/modules/capacity/capacity.helpers.ts` | Created | Weekly calendar generator; accounts for holidays; getMonday utility |
| 22 | `server/src/modules/capacity/capacity.service.ts` | Created | Core capacity engine: gross capacity, leave deduction, load spreading, utilisation %, RAG status, per-project breakdown |
| 23 | `server/src/modules/config/config.routes.ts` | Created | GET / (all config as key-value), PUT /:key |
| 24 | `client/package.json` | Created | React 18, React Router, TanStack Query/Table, Lucide icons, date-fns, clsx |
| 25 | `client/vite.config.ts` | Created | Port 5173, proxy /api → localhost:3001 |
| 26 | `client/tailwind.config.js` | Created | Outfit font, PenTAG colour palette (5 greens) |
| 27 | `client/postcss.config.js` | Created | Tailwind + Autoprefixer |
| 28 | `client/tsconfig.json` | Created | ES2020, ESNext modules, bundler resolution, strict |
| 29 | `client/index.html` | Created | Loads Outfit from Google Fonts, mounts React |
| 30 | `client/src/vite-env.d.ts` | Created | Vite type reference |
| 31 | `client/src/index.css` | Created | Tailwind directives + body defaults (Outfit, #f8faf9 bg, #022020 text) |
| 32 | `client/src/main.tsx` | Created | React 18 createRoot, StrictMode |
| 33 | `client/src/App.tsx` | Created | Landing page with API health check (shows Connected/Not connected) |
| 34 | `CHANGELOG.md` | Created | This file |

---

## Revisions

### REV-001 — 2026-11-17 — `.devcontainer/devcontainer.json`

**Reason:** Codespaces validation warnings on initial creation

| # | Change | Before | After |
|---|---|---|---|
| 1 | Removed `extensions` array | Listed 5 marketplace extensions: `Prisma.prisma`, `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `bradlc.vscode-tailwindcss`, `ms-vscode.vscode-typescript-next` | Removed entirely — Codespaces flagged them as not in the approved list; they are nice-to-haves and can be installed manually |
| 2 | Renamed deprecated setting | `typescript.preferences.importModuleSpecifier` | `js/ts.preferences.importModuleSpecifier` |

---

### REV-002 — 2026-11-17 — `.devcontainer/devcontainer.json`

**Reason:** Codespaces validation error — `esbenp.prettier-vscode` is not a valid value for `editor.defaultFormatter` because the Prettier extension isn't pre-installed in the Codespace image

| # | Change | Before | After |
|---|---|---|---|
| 1 | Removed `editor.defaultFormatter` | `"editor.defaultFormatter": "esbenp.prettier-vscode"` | Removed — VS Code's built-in formatter handles TypeScript/JSON fine |

**Cumulative diff (REV-001 + REV-002 combined):**
```diff
  "customizations": {
    "vscode": {
-     "extensions": [
-       "Prisma.prisma",
-       "dbaeumer.vscode-eslint",
-       "esbenp.prettier-vscode",
-       "bradlc.vscode-tailwindcss",
-       "ms-vscode.vscode-typescript-next"
-     ],
      "settings": {
-       "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.formatOnSave": true,
        "editor.tabSize": 2,
-       "typescript.preferences.importModuleSpecifier": "relative"
+       "js/ts.preferences.importModuleSpecifier": "relative"
      }
    }
  }
