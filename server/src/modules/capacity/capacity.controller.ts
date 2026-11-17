import { Request, Response } from "express";
import * as service from "./capacity.service";

export async function getTeamCapacity(req: Request, res: Response) {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date();
  const end = endDate
    ? new Date(endDate as string)
    : new Date(start.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

  const capacity = await service.computeTeamCapacity(start, end);
  res.json(capacity);
}

export async function getEmployeeCapacity(req: Request, res: Response) {
  const employeeId = Number(req.params.id);
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date();
  const end = endDate
    ? new Date(endDate as string)
    : new Date(start.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

  const capacity = await service.computeEmployeeCapacity(employeeId, start, end);
  if (!capacity) return res.status(404).json({ error: "Employee not found" });
  res.json(capacity);
}

export async function getTeamSummary(req: Request, res: Response) {
  const { startDate, endDate } = req.query;
  const start = startDate ? new Date(startDate as string) : new Date();
  const end = endDate
    ? new Date(endDate as string)
    : new Date(start.getTime() + 12 * 7 * 24 * 60 * 60 * 1000);

  const summary = await service.computeTeamSummary(start, end);
  res.json(summary);
}
