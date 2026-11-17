
import { Router } from "express";
import { prisma } from "../../index";

export const assignmentRoutes = Router();

assignmentRoutes.get("/", async (req, res) => {
  const { projectId, employeeId } = req.query;
  const where: any = {};
  if (projectId) where.projectId = Number(projectId);
  if (employeeId) where.employeeId = Number(employeeId);

  const assignments = await prisma.projectAssignment.findMany({
    where,
    include: { project: true, employee: true, role: true },
    orderBy: { startDate: "asc" },
  });
  res.json(assignments);
});

assignmentRoutes.post("/", async (req, res) => {
  const { projectId, employeeId, roleId, allocatedHours, startDate, endDate, notes } = req.body;

  const roleBudget = await prisma.projectRoleBudget.findUnique({
    where: { projectId_roleId: { projectId, roleId } },
  });
  if (roleBudget) {
    const existingAllocated = await prisma.projectAssignment.aggregate({
      where: { projectId, roleId },
      _sum: { allocatedHours: true },
    });
    const currentTotal = existingAllocated._sum.allocatedHours || 0;
    if (currentTotal + allocatedHours > roleBudget.budgetedHours) {
      return res.status(400).json({
        error: "Budget exceeded",
        detail: "Role budget: " + roleBudget.budgetedHours + "h, already allocated: " + currentTotal + "h, requested: " + allocatedHours + "h",
      });
    }
  }

  const assignment = await prisma.projectAssignment.create({
    data: {
      projectId, employeeId, roleId, allocatedHours,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      notes,
    },
    include: { project: true, employee: true, role: true },
  });
  res.status(201).json(assignment);
});

assignmentRoutes.put("/:id", async (req, res) => {
  const { allocatedHours, startDate, endDate, notes } = req.body;
  const assignment = await prisma.projectAssignment.update({
    where: { id: Number(req.params.id) },
    data: {
      allocatedHours, notes,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    },
    include: { project: true, employee: true, role: true },
  });
  res.json(assignment);
});

assignmentRoutes.delete("/:id", async (req, res) => {
  await prisma.projectAssignment.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

