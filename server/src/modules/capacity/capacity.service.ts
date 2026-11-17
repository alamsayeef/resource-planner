
import { prisma } from "../../index";
import { getWeeklyCalendar, WeekInfo } from "./capacity.helpers";

interface WeeklySlot {
  weekStart: string;
  grossCapacity: number;
  leaveHours: number;
  netAvailable: number;
  loadHours: number;
  utilisationPct: number;
  ragStatus: "GREEN" | "AMBER" | "RED" | "UNAVAILABLE";
  spareHours: number;
  breakdown: {
    projectId: number;
    projectName: string;
    roleId: number;
    roleName: string;
    weeklyHours: number;
  }[];
}

interface EmployeeCapacity {
  employeeId: number;
  employeeName: string;
  fte: number;
  weeks: WeeklySlot[];
}

export async function computeEmployeeCapacity(
  employeeId: number,
  rangeStart: Date,
  rangeEnd: Date
): Promise<EmployeeCapacity | null> {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee || !employee.isActive) return null;

  const config = await prisma.appConfig.findUnique({ where: { key: "standard_hours_per_day" } });
  const hrsPerDay = config ? parseFloat(config.value) : 7.3;
  const weeks = await getWeeklyCalendar(rangeStart, rangeEnd);

  const leave = await prisma.employeeLeave.findMany({
    where: {
      employeeId,
      status: "Approved",
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
    },
  });

  const assignments = await prisma.projectAssignment.findMany({
    where: {
      employeeId,
      startDate: { lte: rangeEnd },
      endDate: { gte: rangeStart },
      project: { status: { in: ["Active", "Draft"] } },
    },
    include: { project: true, role: true },
  });

  const assignmentWeekCounts = assignments.map((a) => {
    const aWeeks = getWeeksInRange(a.startDate, a.endDate, weeks);
    return { ...a, totalWeeks: aWeeks.length, activeWeekStarts: aWeeks };
  });

  const weeklySlots: WeeklySlot[] = weeks.map((w) => {
    const grossCapacity = roundTo(employee.fte * w.workingDays * hrsPerDay, 2);
    const leaveHours = computeLeaveHoursInWeek(leave, w, hrsPerDay);
    const netAvailable = roundTo(Math.max(grossCapacity - leaveHours, 0), 2);

    let loadHours = 0;
    const breakdown: WeeklySlot["breakdown"] = [];

    for (const a of assignmentWeekCounts) {
      if (a.activeWeekStarts.includes(w.weekStart)) {
        const weeklyHrs = roundTo(a.allocatedHours / Math.max(a.totalWeeks, 1), 2);
        loadHours += weeklyHrs;
        breakdown.push({
          projectId: a.projectId,
          projectName: a.project.name,
          roleId: a.roleId,
          roleName: a.role.name,
          weeklyHours: weeklyHrs,
        });
      }
    }

    loadHours = roundTo(loadHours, 2);
    const utilisationPct = netAvailable > 0 ? roundTo((loadHours / netAvailable) * 100, 1) : 0;

    let ragStatus: WeeklySlot["ragStatus"];
    if (netAvailable === 0) ragStatus = "UNAVAILABLE";
    else if (utilisationPct <= 80) ragStatus = "GREEN";
    else if (utilisationPct <= 100) ragStatus = "AMBER";
    else ragStatus = "RED";

    return {
      weekStart: w.weekStart,
      grossCapacity,
      leaveHours,
      netAvailable,
      loadHours,
      utilisationPct,
      ragStatus,
      spareHours: roundTo(netAvailable - loadHours, 2),
      breakdown,
    };
  });

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    fte: employee.fte,
    weeks: weeklySlots,
  };
}

export async function computeTeamCapacity(
  rangeStart: Date,
  rangeEnd: Date
): Promise<EmployeeCapacity[]> {
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  const results: EmployeeCapacity[] = [];
  for (const emp of employees) {
    const cap = await computeEmployeeCapacity(emp.id, rangeStart, rangeEnd);
    if (cap) results.push(cap);
  }
  return results;
}

export async function computeTeamSummary(rangeStart: Date, rangeEnd: Date) {
  const team = await computeTeamCapacity(rangeStart, rangeEnd);
  const summary = team.map((emp) => {
    const totalNet = emp.weeks.reduce((s, w) => s + w.netAvailable, 0);
    const totalLoad = emp.weeks.reduce((s, w) => s + w.loadHours, 0);
    const avgUtil = totalNet > 0 ? roundTo((totalLoad / totalNet) * 100, 1) : 0;
    const redWeeks = emp.weeks.filter((w) => w.ragStatus === "RED").length;
    const amberWeeks = emp.weeks.filter((w) => w.ragStatus === "AMBER").length;
    return {
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      fte: emp.fte,
      totalNetHours: roundTo(totalNet, 1),
      totalLoadHours: roundTo(totalLoad, 1),
      avgUtilisationPct: avgUtil,
      redWeeks,
      amberWeeks,
    };
  });
  return { rangeStart, rangeEnd, employees: summary };
}

// ── Helpers ──

function getWeeksInRange(start: Date, end: Date, calendar: WeekInfo[]): string[] {
  return calendar
    .filter((w) => {
      const ws = new Date(w.weekStart);
      const we = new Date(w.weekStart);
      we.setDate(we.getDate() + 4);
      return ws <= end && we >= start;
    })
    .map((w) => w.weekStart);
}

function computeLeaveHoursInWeek(
  leaves: { startDate: Date; endDate: Date; hours: number | null }[],
  week: WeekInfo,
  hrsPerDay: number
): number {
  let total = 0;
  const weekStart = new Date(week.weekStart);
  const weekEnd = new Date(week.weekStart);
  weekEnd.setDate(weekEnd.getDate() + 4);

  for (const l of leaves) {
    if (l.startDate > weekEnd || l.endDate < weekStart) continue;
    if (l.hours !== null) {
      total += l.hours;
    } else {
      const overlapStart = l.startDate > weekStart ? l.startDate : weekStart;
      const overlapEnd = l.endDate < weekEnd ? l.endDate : weekEnd;
      const days = countWeekdays(overlapStart, overlapEnd);
      total += days * hrsPerDay;
    }
  }
  return roundTo(total, 2);
}

function countWeekdays(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return count;
}

function roundTo(n: number, dp: number): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

