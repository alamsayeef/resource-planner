
import { Router } from "express";
import { prisma } from "../../index";

export const roleRoutes = Router();

roleRoutes.get("/", async (_req, res) => {
  const roles = await prisma.role.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  res.json(roles);
});

roleRoutes.post("/", async (req, res) => {
  const role = await prisma.role.create({ data: req.body });
  res.status(201).json(role);
});

roleRoutes.put("/:id", async (req, res) => {
  const role = await prisma.role.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  res.json(role);
});

