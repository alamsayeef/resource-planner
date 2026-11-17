
import { Router } from "express";
import { prisma } from "../../index";

export const leaveRoutes = Router();

leaveRoutes.get("/", async (req, res) => {
  const { employeeId } = req.query;
  const where: any = {};
  if (employeeId) where.employeeId = Number(employeeId);

  const leave = await prisma.employeeLeave.findMany({
    where,
    include: { employee: true },
    orderBy: { startDate: "desc" },
  });
  res.json(leave);
});

leaveRoutes.post("/", async (req, res) => {
  const { employeeId, leaveType, startDate, endDate, hours, notes } = req.body;
  const record = await prisma.employeeLeave.create({
    data: {
      employeeId, leaveType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      hours, notes,
    },
    include: { employee: true },
  });
  res.status(201).json(record);
});

leaveRoutes.put("/:id", async (req, res) => {
  const record = await prisma.employeeLeave.update({
    where: { id: Number(req.params.id) },
    data: {
      ...req.body,
      ...(req.body.startDate && { startDate: new Date(req.body.startDate) }),
      ...(req.body.endDate && { endDate: new Date(req.body.endDate) }),
    },
  });
  res.json(record);
});

leaveRoutes.delete("/:id", async (req, res) => {
  await prisma.employeeLeave.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

