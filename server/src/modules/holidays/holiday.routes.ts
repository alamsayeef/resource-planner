import { Router } from "express";
import { prisma } from "../../index";

export const holidayRoutes = Router();

holidayRoutes.get("/", async (req, res) => {
  const { year } = req.query;
  const where: any = {};
  if (year) {
    where.date = {
      gte: new Date(year + "-01-01"),
      lte: new Date(year + "-12-31"),
    };
  }
  const holidays = await prisma.orgHoliday.findMany({ where, orderBy: { date: "asc" } });
  res.json(holidays);
});

holidayRoutes.post("/", async (req, res) => {
  const { name, date, holidayType } = req.body;
  const holiday = await prisma.orgHoliday.create({
    data: { name, date: new Date(date), holidayType },
  });
  res.status(201).json(holiday);
});

holidayRoutes.delete("/:id", async (req, res) => {
  await prisma.orgHoliday.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});
