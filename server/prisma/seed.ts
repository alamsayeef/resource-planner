import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── App Config ──
  const config = [
    { key: "standard_hours_per_day",  value: "7.3",    description: "Contracted hours per working day" },
    { key: "standard_days_per_week",  value: "5",      description: "Working days per week" },
    { key: "standard_hours_per_week", value: "36.5",   description: "Contracted hours per week" },
    { key: "rag_green_max",           value: "80",     description: "Utilisation % upper bound for GREEN" },
    { key: "rag_amber_max",           value: "100",    description: "Utilisation % upper bound for AMBER" },
    { key: "theme_primary",           value: "#003c3c", description: "Primary brand colour" },
    { key: "theme_accent",            value: "#00a87e", description: "Accent colour" },
    { key: "organisation_name",       value: "PenTAG",  description: "Peninsula Technology Assessment Group" },
  ];
  for (const c of config) {
    await prisma.appConfig.upsert({
      where: { key: c.key },
      update: { value: c.value, description: c.description },
      create: c,
    });
  }
  console.log("  ✓ Config seeded");

  // ── Roles ──
  const roleNames = [
    { name: "Role 1", category: "Technical" },
    { name: "Role 2", category: "Technical" },
    { name: "Role 3", category: "Technical" },
    { name: "Role 4", category: "Technical" },
  ];
  for (const r of roleNames) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log("  ✓ Roles seeded");

  // ── Employees ──
  const employeeData = [
    { name: "Employee 1", email: "employee1@exeter.ac.uk", fte: 1.0 },
    { name: "Employee 2", email: "employee2@exeter.ac.uk", fte: 0.8 },
    { name: "Employee 3", email: "employee3@exeter.ac.uk", fte: 1.0 },
    { name: "Employee 4", email: "employee4@exeter.ac.uk", fte: 0.6 },
    { name: "Employee 5", email: "employee5@exeter.ac.uk", fte: 1.0 },
    { name: "Employee 6", email: "employee6@exeter.ac.uk", fte: 0.5 },
  ];
  for (const e of employeeData) {
    const existing = await prisma.employee.findUnique({ where: { email: e.email } });
    if (!existing) {
      const emp = await prisma.employee.create({ data: e });
      await prisma.employeeFteHistory.create({
        data: { employeeId: emp.id, fte: emp.fte, effectiveFrom: new Date() },
      });
    }
  }
  const employees = await prisma.employee.findMany();
  console.log("  ✓ Employees seeded");

  // ── Holidays 2025–2027 ──
  const holidays = [
    { name: "New Year's Day",          date: "2025-01-01" },
    { name: "Good Friday",             date: "2025-04-18" },
    { name: "Easter Monday",           date: "2025-04-21" },
    { name: "Early May Bank Holiday",  date: "2025-05-05" },
    { name: "Spring Bank Holiday",     date: "2025-05-26" },
    { name: "Summer Bank Holiday",     date: "2025-08-25" },
    { name: "Christmas Day",           date: "2025-12-25" },
    { name: "Boxing Day",              date: "2025-12-26" },
    { name: "UoE Closure 1",           date: "2025-12-29", type: "UoE Closure" },
    { name: "UoE Closure 2",           date: "2025-12-30", type: "UoE Closure" },
    { name: "UoE Closure 3",           date: "2025-12-31", type: "UoE Closure" },
    { name: "New Year's Day",          date: "2026-01-01" },
    { name: "Good Friday",             date: "2026-04-03" },
    { name: "Easter Monday",           date: "2026-04-06" },
    { name: "Early May Bank Holiday",  date: "2026-05-04" },
    { name: "Spring Bank Holiday",     date: "2026-05-25" },
    { name: "Summer Bank Holiday",     date: "2026-08-31" },
    { name: "Christmas Day",           date: "2026-12-25" },
    { name: "Boxing Day",              date: "2026-12-28" },
    { name: "UoE Closure 1",           date: "2026-12-29", type: "UoE Closure" },
    { name: "UoE Closure 2",           date: "2026-12-30", type: "UoE Closure" },
    { name: "UoE Closure 3",           date: "2026-12-31", type: "UoE Closure" },
    { name: "New Year's Day",          date: "2027-01-01" },
    { name: "Good Friday",             date: "2027-03-26" },
  ];
  for (const h of holidays) {
    const d = new Date(h.date);
    const existing = await prisma.orgHoliday.findUnique({ where: { date: d } });
    if (!existing) {
      await prisma.orgHoliday.create({
        data: { name: h.name, date: d, holidayType: h.type || "Bank Holiday" },
      });
    }
  }
  console.log("  ✓ Holidays seeded");

  // ── Project Types ──
  const pt1 = await prisma.projectType.upsert({
    where: { name: "Project Type 1" },
    update: {},
    create: { name: "Project Type 1", description: "Full health technology assessment", defaultDurationWeeks: 40, totalBudgetedHours: 1200 },
  });
  const pt2 = await prisma.projectType.upsert({
    where: { name: "Project Type 2" },
    update: {},
    create: { name: "Project Type 2", description: "Short-turnaround evidence review", defaultDurationWeeks: 12, totalBudgetedHours: 300 },
  });
  const pt3 = await prisma.projectType.upsert({
    where: { name: "Project Type 3" },
    update: {},
    create: { name: "Project Type 3", description: "Systematic evidence review", defaultDurationWeeks: 26, totalBudgetedHours: 600 },
  });
  console.log("  ✓ Project types seeded");

  // ── Budget Templates ──
  const roles = await prisma.role.findMany({ orderBy: { name: "asc" } });
  for (const t of [pt1, pt2, pt3]) {
    for (const r of roles) {
      await prisma.roleBudgetTemplate.upsert({
        where: { projectTypeId_roleId: { projectTypeId: t.id, roleId: r.id } },
        update: {},
        create: { projectTypeId: t.id, roleId: r.id, budgetedHours: 50 },
      });
    }
  }
  console.log("  Budget templates seeded (Role 1-4, 50h each)");

  // ── Sample Projects ──
  const emp1 = employees.find(e => e.name === "Employee 1")!;
  const emp2 = employees.find(e => e.name === "Employee 2")!;
  const emp3 = employees.find(e => e.name === "Employee 3")!;
  const emp4 = employees.find(e => e.name === "Employee 4")!;
  const emp5 = employees.find(e => e.name === "Employee 5")!;

  const projects = [
    {
      name: "Project Name 1",
      projectTypeId: pt1.id,
      status: "Ongoing",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      totalBudgetedHours: 1200,
      pmId: emp1.id,
      pdId: emp3.id,
    },
    {
      name: "Project Name 2",
      projectTypeId: pt1.id,
      status: "Ongoing",
      startDate: new Date("2026-10-15"),
      endDate: new Date("2027-08-15"),
      totalBudgetedHours: 1200,
      pmId: emp2.id,
      pdId: emp5.id,
    },
    {
      name: "Project Name 3",
      projectTypeId: pt2.id,
      status: "Ongoing",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-01-31"),
      totalBudgetedHours: 300,
      pmId: emp3.id,
      pdId: emp1.id,
    },
    {
      name: "Project Name 4",
      projectTypeId: pt3.id,
      status: "Incoming",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-07-15"),
      totalBudgetedHours: 600,
      pmId: emp5.id,
      pdId: emp1.id,
    },
    {
      name: "Project Name 5",
      projectTypeId: pt1.id,
      status: "Incoming",
      startDate: new Date("2027-02-01"),
      endDate: new Date("2027-11-30"),
      totalBudgetedHours: 1200,
      pmId: emp1.id,
      pdId: emp2.id,
    },
    {
      name: "Project Name 6",
      projectTypeId: pt2.id,
      status: "Completed",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-05-31"),
      totalBudgetedHours: 300,
      pmId: emp2.id,
      pdId: emp3.id,
    },
    {
      name: "Project Name 7",
      projectTypeId: pt3.id,
      status: "Completed",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-07-10"),
      totalBudgetedHours: 600,
      pmId: emp3.id,
      pdId: emp5.id,
    },
    {
      name: "Project Name 8",
      projectTypeId: pt1.id,
      status: "Removed",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-03-31"),
      totalBudgetedHours: 1200,
      pmId: emp5.id,
      pdId: emp2.id,
    },
    {
      name: "Project Name 9",
      projectTypeId: pt3.id,
      status: "Removed",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-03-01"),
      totalBudgetedHours: 600,
      pmId: emp1.id,
      pdId: emp5.id,
    },
    {
      name: "Project Name 10",
      projectTypeId: pt2.id,
      status: "Ongoing",
      startDate: new Date("2026-08-01"),
      endDate: new Date("2026-12-31"),
      totalBudgetedHours: 300,
      pmId: emp4.id,
      pdId: emp3.id,
    },
    {
      name: "Project Name 11",
      projectTypeId: pt3.id,
      status: "Incoming",
      startDate: new Date("2027-03-01"),
      endDate: new Date("2027-09-30"),
      totalBudgetedHours: 600,
      pmId: emp3.id,
      pdId: emp4.id,
    },
    {
      name: "Project Name 12",
      projectTypeId: pt1.id,
      status: "Completed",
      startDate: new Date("2025-11-01"),
      endDate: new Date("2026-08-30"),
      totalBudgetedHours: 1200,
      pmId: emp4.id,
      pdId: emp1.id,
    },
  ];

  for (const p of projects) {
    const existing = await prisma.project.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.project.create({ data: p });
    }
  }
  console.log("  ✓ Projects seeded");

  // ── Primary roles, project assignments, sample leave ──
  const roleRows = await prisma.role.findMany();
  const roleId = (n: string) => roleRows.find((r) => r.name === n)!.id;
  const primary: Record<string, string> = {
    "Employee 1": "Role 1", "Employee 2": "Role 1", "Employee 3": "Role 2",
    "Employee 4": "Role 3", "Employee 5": "Role 4", "Employee 6": "Role 2",
  };
  const allEmployees = await prisma.employee.findMany();
  for (const e of allEmployees) {
    const rn = primary[e.name];
    if (rn) await prisma.employee.update({ where: { id: e.id }, data: { primaryRoleId: roleId(rn) } });
  }

  const upsertAssignment = async (p: { id: number; startDate: Date; endDate: Date }, employeeId: number, rId: number) => {
    await prisma.projectAssignment.upsert({
      where: { projectId_employeeId_roleId: { projectId: p.id, employeeId, roleId: rId } },
      update: {},
      create: { projectId: p.id, employeeId, roleId: rId, allocatedHours: 0, startDate: p.startDate, endDate: p.endDate },
    });
  };

  const holders: Record<string, string[]> = {
    "Role 1": ["Employee 1", "Employee 2"],
    "Role 2": ["Employee 3", "Employee 6"],
    "Role 3": ["Employee 4"],
    "Role 4": ["Employee 5"],
  };
  const liveProjects = await prisma.project.findMany({ orderBy: { id: "asc" } });
  let counter = 0;
  for (const p of liveProjects) {
    if (p.status === "Removed") continue;
    counter++;
    for (const rn of Object.keys(holders)) {
      const names = counter % 2 === 0 ? holders[rn] : holders[rn].slice(0, 1);
      for (const en of names) {
        const emp = allEmployees.find((e) => e.name === en);
        if (emp) await upsertAssignment(p, emp.id, roleId(rn));
      }
    }
    // some PMs also hold a technical role (shared with the others)
    if (p.pmId && counter % 3 === 0) await upsertAssignment(p, p.pmId, roleId("Role 1"));
  }
  console.log("  Assignments seeded");

  const e1 = allEmployees.find((e) => e.name === "Employee 1");
  const e3 = allEmployees.find((e) => e.name === "Employee 3");
  if (e1 && (await prisma.employeeLeave.count({ where: { employeeId: e1.id } })) === 0) {
    await prisma.employeeLeave.create({ data: { employeeId: e1.id, leaveType: "Annual", startDate: new Date("2026-12-21"), endDate: new Date("2026-12-24") } });
  }
  if (e3 && (await prisma.employeeLeave.count({ where: { employeeId: e3.id } })) === 0) {
    await prisma.employeeLeave.create({ data: { employeeId: e3.id, leaveType: "Annual", startDate: new Date("2027-02-15"), endDate: new Date("2027-02-19") } });
  }
  console.log("  Leave seeded");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
