import { Router } from "express";
import { prisma } from "../../index";
import { sortRoles } from "./role.helpers";

export const roleRoutes = Router();

roleRoutes.get("/", async (_req, res) => {
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json(sortRoles(roles));
});

roleRoutes.post("/", async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (["PM", "PD"].includes(name.toUpperCase())) return res.status(400).json({ error: "PM and PD are built in and have their own hours column" });
    const role = await prisma.role.create({ data: { name, category: req.body.category || "Technical" } });
    const types = await prisma.projectType.findMany();
    for (const t of types) {
      await prisma.roleBudgetTemplate.upsert({
        where: { projectTypeId_roleId: { projectTypeId: t.id, roleId: role.id } },
        update: {},
        create: { projectTypeId: t.id, roleId: role.id, budgetedHours: 50 },
      });
    }
    res.status(201).json(role);
  } catch (e: any) {
    res.status(400).json({ error: e.code === "P2002" ? "A role with that name already exists" : "Failed to create role" });
  }
});

roleRoutes.put("/:id", async (req, res) => {
  try {
    const data: any = {};
    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ error: "Name cannot be empty" });
      if (["PM", "PD"].includes(name.toUpperCase())) return res.status(400).json({ error: "PM and PD are built in and have their own hours column" });
      data.name = name;
    }
    if (req.body.description !== undefined) data.description = req.body.description;
    const role = await prisma.role.update({ where: { id: Number(req.params.id) }, data });
    res.json(role);
  } catch (e: any) {
    res.status(400).json({ error: e.code === "P2002" ? "A role with that name already exists" : "Failed to update role" });
  }
});

// Deactivate a role (hidden everywhere; history kept)
roleRoutes.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.employee.updateMany({ where: { primaryRoleId: id }, data: { primaryRoleId: null } });
    await prisma.role.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to remove role" });
  }
});
