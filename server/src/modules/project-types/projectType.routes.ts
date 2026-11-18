import { Router } from "express";
import { prisma } from "../../index";

export const projectTypeRoutes = Router();

const typeInclude = { budgetTemplates: { include: { role: true } } };
const dupMsg = "A project type with that name already exists";

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

// New type: 50h default for every active role
projectTypeRoutes.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name is required" });
    const roles = await prisma.role.findMany({ where: { isActive: true } });
    const pt = await prisma.projectType.create({
      data: {
        name,
        description: req.body.description,
        budgetTemplates: { create: roles.map((r) => ({ roleId: r.id, budgetedHours: 50 })) },
      },
      include: typeInclude,
    });
    res.status(201).json(pt);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.code === "P2002" ? dupMsg : "Failed to create project type" });
  }
});

// body: { name?, roleHours?: { [roleId]: hours } }
projectTypeRoutes.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, roleHours } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ error: "Name cannot be empty" });
      await prisma.projectType.update({ where: { id }, data: { name: String(name).trim() } });
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
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e.code === "P2002" ? dupMsg : "Failed to update project type" });
  }
});
