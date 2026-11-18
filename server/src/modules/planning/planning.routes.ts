import { Router } from "express";
import { prisma } from "../../index";

export const planningRoutes = Router();

// ── helpers ──────────────────────────────────────────────
const iso = (d: Date) => d.toISOString().slice(0, 10);
const round = (n: number, dp = 2) => {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
};

function listDays(from: Date, to: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const end = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  while (cur.getTime() <= end && out.length < 5000) {
    out.push(new Date(cur.getTime()));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

async function loadSettings() {
  const cfg = await prisma.appConfig.findMany();
  const num = (key: string, fallback: number) => {
    const row = cfg.find((c) => c.key === key);
    return row ? parseFloat(row.value) : fallback;
  };
  const holidays = await prisma.orgHoliday.findMany();
  return {
    hrsPerDay: num("standard_hours_per_day", 7.3),
    greenMax: num("rag_green_max", 80),
    amberMax: num("rag_amber_max", 100),
    holidaySet: new Set(holidays.map((h) => iso(h.date))),
  };
}

// Every calendar day covered by an employee's approved personal leave
async function leaveDays(employeeId: number): Promise<Set<string>> {
  const rows = await prisma.employeeLeave.findMany({ where: { employeeId, status: "Approved" } });
  const set = new Set<string>();
  for (const r of rows) {
    for (const d of listDays(r.startDate, r.endDate)) set.add(iso(d));
  }
  return set;
}

// Mon-Fri, minus public/closure holidays, minus personal leave
function workingDaysBetween(from: Date, to: Date, holidays: Set<string>, leave: Set<string>): Date[] {
  return listDays(from, to).filter((d) => {
    const dow = d.getUTCDay();
    const key = iso(d);
    return dow !== 0 && dow !== 6 && !holidays.has(key) && !leave.has(key);
  });
}

interface Entry {
  employeeId: number;
  label: string;
  hours: number;
}

// Works out who owns how many hours on a project.
//  - Role hours come from the project type; split equally between everyone holding that role.
//  - PM and PD have their own separate hours (from the project type).
async function buildRoster(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      projectType: { include: { budgetTemplates: true } },
      pm: true,
      pd: true,
      assignments: { include: { employee: true } },
    },
  });
  if (!project) return null;

  const roles = await prisma.role.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const ptype = project.projectType;
  const entries: Entry[] = [];

  const roleBlocks = roles.map((role) => {
    const tpl = ptype ? ptype.budgetTemplates.find((t) => t.roleId === role.id) : undefined;
    const roleHours = tpl ? tpl.budgetedHours : 0;
    const seen = new Set<number>();
    const people: { id: number; name: string; fte: number }[] = [];
    for (const a of project.assignments) {
      if (a.roleId !== role.id || seen.has(a.employeeId)) continue;
      seen.add(a.employeeId);
      people.push(a.employee);
    }
    const share = people.length > 0 ? roleHours / people.length : 0;
    for (const p of people) entries.push({ employeeId: p.id, label: role.name, hours: share });
    return { roleId: role.id, roleName: role.name, roleHours, share, people };
  });

  const pmHours = ptype ? ptype.pmHours : 0;
  const pdHours = ptype ? ptype.pdHours : 0;
  if (project.pm) entries.push({ employeeId: project.pm.id, label: "PM", hours: pmHours });
  if (project.pd) entries.push({ employeeId: project.pd.id, label: "PD", hours: pdHours });

  return { project, roleBlocks, entries, pmHours, pdHours };
}

// ── GET /api/planning/project/:id ────────────────────────
planningRoutes.get("/project/:id", async (req, res) => {
  try {
    const roster = await buildRoster(Number(req.params.id));
    if (!roster) return res.status(404).json({ error: "Project not found" });
    const { project, roleBlocks, entries, pmHours, pdHours } = roster;
    const s = await loadSettings();

    const totals = new Map<number, number>();
    for (const e of entries) totals.set(e.employeeId, (totals.get(e.employeeId) || 0) + e.hours);

    const person = async (emp: { id: number; name: string; fte: number }, hours: number) => {
      const leave = await leaveDays(emp.id);
      const days = workingDaysBetween(project.startDate, project.endDate, s.holidaySet, leave).length;
      return {
        employeeId: emp.id,
        name: emp.name,
        fte: emp.fte,
        hours: round(hours),
        projectTotalHours: round(totals.get(emp.id) || 0),
        availableHours: round(emp.fte * s.hrsPerDay * days),
        workingDays: days,
      };
    };

    const pm = project.pm ? await person(project.pm, pmHours) : null;
    const pd = project.pd ? await person(project.pd, pdHours) : null;

    const roles: any[] = [];
    for (const rb of roleBlocks) {
      const assignees: any[] = [];
      for (const p of rb.people) assignees.push(await person(p, rb.share));
      roles.push({ roleId: rb.roleId, roleName: rb.roleName, roleHours: rb.roleHours, assignees });
    }

    res.json({
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        typeName: project.projectType ? project.projectType.name : null,
        startDate: project.startDate,
        endDate: project.endDate,
      },
      pm,
      pd,
      pmHours,
      pdHours,
      roles,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute project details" });
  }
});

// ── GET /api/planning/employee/:id?status=Ongoing ────────
planningRoutes.get("/employee/:id", async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const status = String(req.query.status || "");
    const emp = await prisma.employee.findUnique({ where: { id: employeeId }, include: { primaryRole: true } });
    if (!emp) return res.status(404).json({ error: "Employee not found" });

    const employee = {
      id: emp.id,
      name: emp.name,
      fte: emp.fte,
      primaryRole: emp.primaryRole ? emp.primaryRole.name : null,
    };

    const statusProjects = await prisma.project.findMany({ where: { status }, orderBy: { startDate: "asc" } });
    if (statusProjects.length === 0) {
      return res.json({ employee, status, months: [], projects: [], monthly: [] });
    }

    const s = await loadSettings();
    const leave = await leaveDays(emp.id);

    // 12-month window from the earliest project start (of the selected status)
    const earliest = new Date(Math.min(...statusProjects.map((p) => p.startDate.getTime())));
    const y = earliest.getUTCFullYear();
    const m = earliest.getUTCMonth();
    const months: { key: string; label: string; start: Date; end: Date }[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(y, m + i, 1));
      months.push({
        key: iso(d).slice(0, 7),
        label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" }),
        start: d,
        end: new Date(Date.UTC(y, m + i + 1, 0)),
      });
    }

    const projects: any[] = [];
    const raws: Record<string, number>[] = [];

    for (const p of statusProjects) {
      const roster = await buildRoster(p.id);
      if (!roster) continue;
      const mine = roster.entries.filter((e) => e.employeeId === emp.id);
      if (mine.length === 0) continue;

      const total = mine.reduce((sum, e) => sum + e.hours, 0);
      // spread equally across this person's working days within the project window
      const days = workingDaysBetween(p.startDate, p.endDate, s.holidaySet, leave);
      const daily = days.length > 0 ? total / days.length : 0;

      const raw: Record<string, number> = {};
      for (const d of days) {
        const k = iso(d).slice(0, 7);
        raw[k] = (raw[k] || 0) + daily;
      }
      const rounded: Record<string, number> = {};
      for (const k of Object.keys(raw)) rounded[k] = round(raw[k]);

      raws.push(raw);
      projects.push({
        id: p.id,
        name: p.name,
        status: p.status,
        typeName: roster.project.projectType ? roster.project.projectType.name : null,
        startDate: p.startDate,
        endDate: p.endDate,
        pm: roster.project.pm ? roster.project.pm.name : null,
        pd: roster.project.pd ? roster.project.pd.name : null,
        roles: mine.map((e) => e.label),
        totalHours: round(total),
        workingDays: days.length,
        monthly: rounded,
      });
    }

    const capacity = months.map((mo) => {
      const days = workingDaysBetween(mo.start, mo.end, s.holidaySet, leave).length;
      const available = round(emp.fte * s.hrsPerDay * days);
      let load = 0;
      for (const r of raws) load += r[mo.key] || 0;
      load = round(load);
      const util = available > 0 ? round((load / available) * 100, 1) : 0;
      let rag = "GREEN";
      if (available === 0) rag = "UNAVAILABLE";
      else if (util > s.amberMax) rag = "RED";
      else if (util > s.greenMax) rag = "AMBER";
      return { key: mo.key, availableHours: available, loadHours: load, utilisationPct: util, rag, workingDays: days };
    });

    res.json({
      employee,
      status,
      months: months.map((mo) => ({ key: mo.key, label: mo.label })),
      projects,
      monthly: capacity,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to compute employee planning" });
  }
});
