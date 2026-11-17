
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── App Config ──
  const config = [
    { key: "standard_hours_per_day",  value: "7.3",    description: "UoE standard working hours per day" },
    { key: "working_days_per_week",   value: "5",      description: "Monday-Friday" },
    { key: "standard_hours_per_week", value: "36.5",   description: "Derived: 7.3 x 5" },
    { key: "utilisation_green_max",   value: "80",     description: "Utilisation % cap for GREEN" },
    { key: "utilisation_amber_max",   value: "100",    description: "Utilisation % cap for AMBER" },
    { key: "theme_font",             value: "Outfit",  description: "Google Font" },
    { key: "theme_color_primary",    value: "#007d69", description: "PenTAG primary" },
    { key: "organisation_name",      value: "PenTAG",  description: "Peninsula Technology Assessment Group" },
  ];
  for (const c of config) {
    await prisma.appConfig.upsert({ where: { key: c.key }, update: c, create: c });
  }
  console.log("  Config done");

  // ── Roles ──
  const roles = [
    { name: "Health Economist",       description: "Health economics analysis and modelling",       category: "Technical" },
    { name: "Systematic Reviewer",    description: "Systematic review and evidence synthesis",      category: "Technical" },
    { name: "Statistician",           description: "Statistical analysis and meta-analysis",        category: "Technical" },
    { name: "Information Specialist", description: "Literature searching and information retrieval", category: "Technical" },
    { name: "Project Lead",           description: "Overall project management and delivery",       category: "Hybrid" },
    { name: "Administrator",          description: "Administrative and operational support",         category: "Administrative" },
    { name: "Clinical Advisor",       description: "Clinical expertise and advisory input",         category: "Technical" },
    { name: "Quality Assurance",      description: "Review and QA of deliverables",                 category: "Technical" },
  ];
  for (const r of roles) {
    await prisma.role.upsert({ where: { name: r.name }, update: r, create: r });
  }
  console.log("  Roles done");

  // ── Holidays ──
  const holidays = [
    { name: "New Year",    date: "2025-01-01", holidayType: "Bank Holiday" },
    { name: "Good Friday", date: "2025-04-18", holidayType: "Bank Holiday" },
    { name: "Easter Mon",  date: "2025-04-21", holidayType: "Bank Holiday" },
    { name: "Early May",   date: "2025-05-05", holidayType: "Bank Holiday" },
    { name: "Spring",      date: "2025-05-26", holidayType: "Bank Holiday" },
    { name: "Summer",      date: "2025-08-25", holidayType: "Bank Holiday" },
    { name: "Christmas",   date: "2025-12-25", holidayType: "Bank Holiday" },
    { name: "Boxing Day",  date: "2025-12-26", holidayType: "Bank Holiday" },
    { name: "New Year",    date: "2026-01-01", holidayType: "Bank Holiday" },
    { name: "Good Friday", date: "2026-04-03", holidayType: "Bank Holiday" },
    { name: "Easter Mon",  date: "2026-04-06", holidayType: "Bank Holiday" },
    { name: "Early May",   date: "2026-05-04", holidayType: "Bank Holiday" },
    { name: "Spring",      date: "2026-05-25", holidayType: "Bank Holiday" },
    { name: "Summer",      date: "2026-08-31", holidayType: "Bank Holiday" },
    { name: "Christmas",   date: "2026-12-25", holidayType: "Bank Holiday" },
    { name: "Boxing Day",  date: "2026-12-28", holidayType: "Bank Holiday" },
    { name: "Uni Closure", date: "2025-12-24", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2025-12-29", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2025-12-30", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2025-12-31", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2026-12-24", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2026-12-29", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2026-12-30", holidayType: "University Closure" },
    { name: "Uni Closure", date: "2026-12-31", holidayType: "University Closure" },
  ];
  for (const h of holidays) {
    const d = new Date(h.date + "T00:00:00Z");
    await prisma.orgHoliday.upsert({
      where: { date: d },
      update: { name: h.name, holidayType: h.holidayType },
      create: { name: h.name, date: d, holidayType: h.holidayType },
    });
  }
  console.log("  Holidays done");

  // ── Employees (sample) ──
  const employees = [
    { name: "User 1", email: "user1@exeter.ac.uk", fte: 1.0 },
    { name: "User 2", email: "user2@exeter.ac.uk", fte: 0.8 },
    { name: "User 3", email: "user3@exeter.ac.uk", fte: 1.0 },
    { name: "User 4", email: "user4@exeter.ac.uk", fte: 0.6 },
  ];
  for (const e of employees) {
    const emp = await prisma.employee.upsert({
      where: { email: e.email },
      update: { name: e.name, fte: e.fte },
      create: { name: e.name, email: e.email, department: "PenTAG", fte: e.fte },
    });
    const existing = await prisma.employeeFteHistory.findFirst({ where: { employeeId: emp.id } });
    if (!existing) {
      await prisma.employeeFteHistory.create({
        data: { employeeId: emp.id, fte: e.fte, effectiveFrom: new Date() },
      });
    }
  }
  console.log("  Employees done");

  // ── Project Types + Budget Templates ──
  const htaType = await prisma.projectType.upsert({
    where: { name: "HTA Report" },
    update: {},
    create: { name: "HTA Report", description: "NICE HTA report", defaultDurationWeeks: 40, totalBudgetedHours: 1200 },
  });
  await prisma.projectType.upsert({
    where: { name: "Rapid Review" },
    update: {},
    create: { name: "Rapid Review", description: "Short-turnaround evidence review", defaultDurationWeeks: 12, totalBudgetedHours: 300 },
  });

  const allRoles = await prisma.role.findMany();
  const roleMap = Object.fromEntries(allRoles.map((r) => [r.name, r.id]));
  const htaBudgets: Record<string, number> = {
    "Health Economist": 300, "Systematic Reviewer": 250, "Statistician": 150,
    "Information Specialist": 100, "Project Lead": 200, "Administrator": 50,
    "Clinical Advisor": 80, "Quality Assurance": 70,
  };
  for (const [roleName, hours] of Object.entries(htaBudgets)) {
    await prisma.roleBudgetTemplate.upsert({
      where: { projectTypeId_roleId: { projectTypeId: htaType.id, roleId: roleMap[roleName] } },
      update: { budgetedHours: hours },
      create: { projectTypeId: htaType.id, roleId: roleMap[roleName], budgetedHours: hours },
    });
  }
  console.log("  Project types done");

  // ── Sample Project ──
  const project = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "Sample HTA Project", description: "Sample project",
      projectTypeId: htaType.id, status: "Active",
      startDate: new Date("2026-11-01"), endDate: new Date("2027-08-31"),
      totalBudgetedHours: 1200,
    },
  });
  for (const [roleName, hours] of Object.entries(htaBudgets)) {
    await prisma.projectRoleBudget.upsert({
      where: { projectId_roleId: { projectId: project.id, roleId: roleMap[roleName] } },
      update: { budgetedHours: hours },
      create: { projectId: project.id, roleId: roleMap[roleName], budgetedHours: hours },
    });
  }

  const user1 = await prisma.employee.findUnique({ where: { email: "user1@exeter.ac.uk" } });
  if (user1) {
    await prisma.projectAssignment.upsert({
      where: { projectId_employeeId_roleId: { projectId: project.id, employeeId: user1.id, roleId: roleMap["Health Economist"] } },
      update: {},
      create: {
        projectId: project.id, employeeId: user1.id, roleId: roleMap["Health Economist"],
        allocatedHours: 300, startDate: new Date("2026-11-01"), endDate: new Date("2027-08-31"),
      },
    });
  }
  console.log("  Sample project done");
  console.log("Seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

