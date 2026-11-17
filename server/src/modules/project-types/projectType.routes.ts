
import { Router } from "express";
import { prisma } from "../../index";

export const projectTypeRoutes = Router();

projectTypeRoutes.get("/", async (_req, res) => {
  const types = await prisma.projectType.findMany({
    where: { isActive: true },
    include: { budgetTemplates: { include: { role: true } } },
    orderBy: { name: "asc" },
  });
  res.json(types);
});

projectTypeRoutes.get("/:id", async (req, res) => {
  const pt = await prisma.projectType.findUnique({
    where: { id: Number(req.params.id) },
    include: { budgetTemplates: { include: { role: true } } },
  });
  if (!pt) return res.status(404).json({ error: "Not found" });
  res.json(pt);
});

projectTypeRoutes.post("/", async (req, res) => {
  const { name, description, defaultDurationWeeks, totalBudgetedHours, budgetTemplates } = req.body;
  const pt = await prisma.projectType.create({
    data: {
      name, description, defaultDurationWeeks, totalBudgetedHours,
      budgetTemplates: budgetTemplates
        ? { create: budgetTemplates.map((t: any) => ({ roleId: t.roleId, budgetedHours: t.budgetedHours })) }
        : undefined,
    },
    include: { budgetTemplates: true },
  });
  res.status(201).json(pt);
});

