import { Router } from "express";
import { prisma } from "../../index";

export const projectRoutes = Router();

const projectIncludes = {
  projectType: true,
  pm: { select: { id: true, name: true, email: true } },
  pd: { select: { id: true, name: true, email: true } },
  roleBudgets: { include: { role: true } },
  assignments: { include: { employee: true, role: true } },
};

projectRoutes.get("/", async (_req, res) => {
  const projects = await prisma.project.findMany({
    include: projectIncludes,
    orderBy: { startDate: "desc" },
  });
  res.json(projects);
});

projectRoutes.get("/:id", async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: Number(req.params.id) },
    include: projectIncludes,
  });
  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);
});

projectRoutes.post("/", async (req, res) => {
  const { name, description, projectTypeId, status, startDate, endDate, totalBudgetedHours, pmId, pdId, notes } = req.body;
  const project = await prisma.project.create({
    data: {
      name, description, projectTypeId, status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      totalBudgetedHours, pmId, pdId, notes,
    },
  });

  if (projectTypeId) {
    const templates = await prisma.roleBudgetTemplate.findMany({ where: { projectTypeId } });
    for (const t of templates) {
      await prisma.projectRoleBudget.create({
        data: { projectId: project.id, roleId: t.roleId, budgetedHours: t.budgetedHours },
      });
    }
  }

  const full = await prisma.project.findUnique({
    where: { id: project.id },
    include: projectIncludes,
  });
  res.status(201).json(full);
});

projectRoutes.put("/:id", async (req, res) => {
  const { name, description, status, startDate, endDate, totalBudgetedHours, pmId, pdId, notes } = req.body;
  const project = await prisma.project.update({
    where: { id: Number(req.params.id) },
    data: {
      name, description, status, notes, totalBudgetedHours, pmId, pdId,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    },
    include: projectIncludes,
  });
  res.json(project);
});

projectRoutes.delete("/:id", async (req, res) => {
  await prisma.project.update({
    where: { id: Number(req.params.id) },
    data: { status: "Archived" },
  });
  res.json({ success: true });
});
