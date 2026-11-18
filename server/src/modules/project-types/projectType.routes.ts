import { Router } from "express";
import { prisma } from "../../index";

export const projectTypeRoutes = Router();

const typeInclude = { budgetTemplates: { include: { role: true } } };

projectTypeRoutes.get("/", async (_req, res) => {
  const types = await prisma.projectType.findMany({
    where: { isActive: true },
    include: typeInclude,
    orderBy: { name: "asc" },
  });
  res.json(types);
});

projectTypeRoutes.get("/:id", async (req, res) => {
  const pt = await prisma.projectType.findUnique({
    where: { id: Number(req.params.id) },
    include: typeInclude,
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

// Update PM/PD hours and per-role hours for a project type
// body: { pmHours?: number, pdHours?: number, roleHours?: { [roleId]: hours } }
projectTypeRoutes.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { pmHours, pdHours, roleHours } = req.body;

    if (pmHours !== undefined || pdHours !== undefined) {
      await prisma.projectType.update({
        where: { id },
        data: {
          ...(pmHours !== undefined && { pmHours: Number(pmHours) }),
          ...(pdHours !== undefined && { pdHours: Number(pdHours) }),
        },
      });
    }

    if (roleHours) {
      for (const key of Object.keys(roleHours)) {
        const roleId = Number(key);
        const hours = Number(roleHours[key]);
        await prisma.roleBudgetTemplate.upsert({
          where: { projectTypeId_roleId: { projectTypeId: id, roleId } },
          update: { budgetedHours: hours },
          create: { projectTypeId: id, roleId, budgetedHours: hours },
        });
      }
    }

    const pt = await prisma.projectType.findUnique({ where: { id }, include: typeInclude });
    res.json(pt);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update project type" });
  }
});
