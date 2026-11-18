import { Request, Response } from "express";
import { prisma } from "../../index";

export async function list(_req: Request, res: Response) {
  const employees = await prisma.employee.findMany({
    where: _req.query.all === "true" ? {} : { isActive: true },
    include: { assignments: { include: { project: true, role: true } }, primaryRole: true, leave: { orderBy: { startDate: "asc" } } },
    orderBy: { name: "asc" },
  });
  res.json(employees);
}

export async function getById(req: Request, res: Response) {
  const employee = await prisma.employee.findUnique({
    where: { id: Number(req.params.id) },
    include: {
      assignments: { include: { project: true, role: true } },
      leave: { orderBy: { startDate: "desc" } },
      fteHistory: { orderBy: { effectiveFrom: "desc" } },
    },
  });
  if (!employee) return res.status(404).json({ error: "Employee not found" });
  res.json(employee);
}

export async function create(req: Request, res: Response) {
  const { name, email, department, fte, notes, primaryRoleId } = req.body;
  const employee = await prisma.employee.create({
    data: { name, email, department, fte: fte ?? 1.0, notes, primaryRoleId },
  });
  await prisma.employeeFteHistory.create({
    data: { employeeId: employee.id, fte: employee.fte, effectiveFrom: new Date() },
  });
  res.status(201).json(employee);
}

export async function update(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { name, email, department, fte, notes, isActive, primaryRoleId } = req.body;

  if (fte !== undefined) {
    const current = await prisma.employee.findUnique({ where: { id } });
    if (current && current.fte !== fte) {
      const lastHistory = await prisma.employeeFteHistory.findFirst({
        where: { employeeId: id, effectiveTo: null },
        orderBy: { effectiveFrom: "desc" },
      });
      if (lastHistory) {
        await prisma.employeeFteHistory.update({
          where: { id: lastHistory.id },
          data: { effectiveTo: new Date() },
        });
      }
      await prisma.employeeFteHistory.create({
        data: { employeeId: id, fte, effectiveFrom: new Date() },
      });
    }
  }

  const employee = await prisma.employee.update({
    where: { id },
    data: { name, email, department, fte, notes, isActive, primaryRoleId },
  });
  res.json(employee);
}

export async function remove(req: Request, res: Response) {
  await prisma.employee.update({
    where: { id: Number(req.params.id) },
    data: { isActive: false },
  });
  res.json({ success: true });
}
