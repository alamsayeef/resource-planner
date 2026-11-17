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
    { name: "Health Economist",       category: "Technical" },
    { name: "Systematic Reviewer",    category: "Technical" },
    { name: "Statistician",           category: "Technical" },
    { name: "Information Specialist", category: "Technical" },
    { name: "Project Lead",           category: "Management" },
    { name: "Administrator",          category: "Support" },
    { name: "Clinical Advisor",       category: "Advisory" },
    { name: "Quality Assurance",      category: "Review" },
  ];
  for (const r of roleNames) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  const roles = await prisma.role.findMany();
  console.log("  ✓ Roles seeded");

  // ── Employees ──
  const employeeData = [
    { name: "Alice Johnson",  email: "a.johnson@exeter.ac.uk",  fte: 1.0 },
    { name: "Bob Smith",      email: "b.smith@exeter.ac.uk",    fte: 0.8 },
    { name: "Carol Williams", email: "c.williams@exeter.ac.uk", fte: 1.0 },
    { name: "David Brown",    email: "d.brown@exeter.ac.uk",    fte: 0.6 },
    { name: "Emma Davis",     email: "e.davis@exeter.ac.uk",    fte: 1.0 },
    { name: "Frank Miller",   email: "f.miller@exeter.ac.uk",   fte: 0.5 },
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
    { name: "New Year's Day",        date: "2025-01-01" },
    { name: "Good Friday",           date: "2025-04-18" },
    { name: "Easter Monday",         date: "2025-04-21" },
    { name: "Early May Bank Holiday", date: "2025-05-05" },
    { name: "Spring Bank Holiday",   date: "2025-05-26" },
    { name: "Summer Bank Holiday",   date: "2025-08-25" },
    { name: "Christmas Day",         date: "2025-12-25" },
    { name: "Boxing Day",            date: "2025-12-26" },
    { name: "UoE Closure 1",         date: "2025-12-29", type: "UoE Closure" },
    { name: "UoE Closure 2",         date: "2025-12-30", type: "UoE Closure" },
    { name: "UoE Closure 3",         date: "2025-12-31", type: "UoE Closure" },
    { name: "New Year's Day",        date: "2026-01-01" },
    { name: "Good Friday",           date: "2026-04-03" },
    { name: "Easter Monday",         date: "2026-04-06" },
    { name: "Early May Bank Holiday", date: "2026-05-04" },
    { name: "Spring Bank Holiday",   date: "2026-05-25" },
    { name: "Summer Bank Holiday",   date: "2026-08-31" },
    { name: "Christmas Day",         date: "2026-12-25" },
    { name: "Boxing Day",            date: "2026-12-28" },
    { name: "UoE Closure 1",         date: "2026-12-29", type: "UoE Closure" },
    { name: "UoE Closure 2",         date: "2026-12-30", type: "UoE Closure" },
    { name: "UoE Closure 3",         date: "2026-12-31", type: "UoE Closure" },
    { name: "New Year's Day",        date: "2027-01-01" },
    { name: "Good Friday",           date: "2027-03-26" },
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
  const ptHTA = await prisma.projectType.upsert({
    where: { name: "HTA Report" },
    update: {},
    create: { name: "HTA Report", description: "Full health technology assessment", defaultDurationWeeks: 40, totalBudgetedHours: 1200 },
  });
  const ptRR = await prisma.projectType.upsert({
    where: { name: "Rapid Review" },
    update: {},
    create: { name: "Rapid Review", description: "Short-turnaround evidence review", defaultDurationWeeks: 12, totalBudgetedHours: 300 },
  });
  const ptER = await prisma.projectType.upsert({
    where: { name: "Evidence Review" },
    update: {},
    create: { name: "Evidence Review", description: "Systematic evidence review", defaultDurationWeeks: 26, totalBudgetedHours: 600 },
  });
  console.log("  ✓ Project types seeded");

  // ── Budget Templates (HTA) ──
  const heRole = roles.find(r => r.name === "Health Economist");
  const srRole = roles.find(r => r.name === "Systematic Reviewer");
  const stRole = roles.find(r => r.name === "Statistician");
  const isRole = roles.find(r => r.name === "Information Specialist");
  const plRole = roles.find(r => r.name === "Project Lead");
  const adRole = roles.find(r => r.name === "Administrator");
  const caRole = roles.find(r => r.name === "Clinical Advisor");
  const qaRole = roles.find(r => r.name === "Quality Assurance");

  const htaTemplates = [
    { projectTypeId: ptHTA.id, roleId: heRole!.id, budgetedHours: 350 },
    { projectTypeId: ptHTA.id, roleId: srRole!.id, budgetedHours: 300 },
    { projectTypeId: ptHTA.id, roleId: stRole!.id, budgetedHours: 150 },
    { projectTypeId: ptHTA.id, roleId: isRole!.id, budgetedHours: 100 },
    { projectTypeId: ptHTA.id, roleId: plRole!.id, budgetedHours: 120 },
    { projectTypeId: ptHTA.id, roleId: adRole!.id, budgetedHours: 50 },
    { projectTypeId: ptHTA.id, roleId: caRole!.id, budgetedHours: 80 },
    { projectTypeId: ptHTA.id, roleId: qaRole!.id, budgetedHours: 50 },
  ];
  for (const t of htaTemplates) {
    const existing = await prisma.roleBudgetTemplate.findUnique({
      where: { projectTypeId_roleId: { projectTypeId: t.projectTypeId, roleId: t.roleId } },
    });
    if (!existing) await prisma.roleBudgetTemplate.create({ data: t });
  }
  console.log("  ✓ Budget templates seeded");

  // ── Sample Projects ──
  const alice = employees.find(e => e.name === "Alice Johnson")!;
  const bob = employees.find(e => e.name === "Bob Smith")!;
  const carol = employees.find(e => e.name === "Carol Williams")!;
  const emma = employees.find(e => e.name === "Emma Davis")!;

  const projects = [
    {
      name: "Abiraterone for Prostate Cancer",
      projectTypeId: ptHTA.id,
      status: "Active",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      totalBudgetedHours: 1200,
      pmId: alice.id,
      pdId: carol.id,
    },
    {
      name: "Dupilumab for Eczema",
      projectTypeId: ptHTA.id,
      status: "Active",
      startDate: new Date("2026-10-15"),
      endDate: new Date("2027-08-15"),
      totalBudgetedHours: 1200,
      pmId: bob.id,
      pdId: emma.id,
    },
    {
      name: "AI in Diagnostics Review",
      projectTypeId: ptRR.id,
      status: "Active",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2027-01-31"),
      totalBudgetedHours: 300,
      pmId: carol.id,
      pdId: alice.id,
    },
    {
      name: "Gene Therapy Cost-Effectiveness",
      projectTypeId: ptER.id,
      status: "Draft",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-07-15"),
      totalBudgetedHours: 600,
      pmId: emma.id,
      pdId: alice.id,
    },
    {
      name: "Pembrolizumab for Lung Cancer",
      projectTypeId: ptHTA.id,
      status: "Draft",
      startDate: new Date("2027-02-01"),
      endDate: new Date("2027-11-30"),
      totalBudgetedHours: 1200,
      pmId: alice.id,
      pdId: bob.id,
    },
    {
      name: "Digital CBT Evidence Review",
      projectTypeId: ptRR.id,
      status: "Completed",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2026-05-31"),
      totalBudgetedHours: 300,
      pmId: bob.id,
      pdId: carol.id,
    },
    {
      name: "Biosimilars Market Assessment",
      projectTypeId: ptER.id,
      status: "Completed",
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-07-10"),
      totalBudgetedHours: 600,
      pmId: carol.id,
      pdId: emma.id,
    },
    {
      name: "Trastuzumab Deruxtecan HTA",
      projectTypeId: ptHTA.id,
      status: "On Hold",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2027-03-31"),
      totalBudgetedHours: 1200,
      pmId: emma.id,
      pdId: bob.id,
    },
    {
      name: "Obesity Pharmacotherapy Review",
      projectTypeId: ptER.id,
      status: "Archived",
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-03-01"),
      totalBudgetedHours: 600,
      pmId: alice.id,
      pdId: emma.id,
    },
  ];

  for (const p of projects) {
    const existing = await prisma.project.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.project.create({ data: p });
    }
  }
  console.log("  ✓ Projects seeded");

  // ── Sample Assignments ──
  const allProjects = await prisma.project.findMany();
  const proj1 = allProjects.find(p => p.name === "Abiraterone for Prostate Cancer");
  const proj2 = allProjects.find(p => p.name === "Dupilumab for Eczema");
  const proj3 = allProjects.find(p => p.name === "AI in Diagnostics Review");

  if (proj1 && heRole && srRole) {
    const existing = await prisma.projectAssignment.findFirst({ where: { projectId: proj1.id } });
    if (!existing) {
      await prisma.projectAssignment.create({
        data: {
          projectId: proj1.id, employeeId: alice.id, roleId: heRole.id,
          allocatedHours: 300, startDate: proj1.startDate, endDate: proj1.endDate,
        },
      });
      await prisma.projectAssignment.create({
        data: {
          projectId: proj1.id, employeeId: bob.id, roleId: srRole.id,
          allocatedHours: 250, startDate: proj1.startDate, endDate: proj1.endDate,
        },
      });
    }
  }

  if (proj2 && heRole) {
    const existing = await prisma.projectAssignment.findFirst({ where: { projectId: proj2.id } });
    if (!existing) {
      await prisma.projectAssignment.create({
        data: {
          projectId: proj2.id, employeeId: carol.id, roleId: heRole.id,
          allocatedHours: 350, startDate: proj2.startDate, endDate: proj2.endDate,
        },
      });
    }
  }

  if (proj3 && srRole) {
    const existing = await prisma.projectAssignment.findFirst({ where: { projectId: proj3.id } });
    if (!existing) {
      await prisma.projectAssignment.create({
        data: {
          projectId: proj3.id, employeeId: emma.id, roleId: srRole.id,
          allocatedHours: 200, startDate: proj3.startDate, endDate: proj3.endDate,
        },
      });
    }
  }
  console.log("  ✓ Assignments seeded");

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
