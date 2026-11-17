
import { Router } from "express";
import { prisma } from "../../index";

export const configRoutes = Router();

configRoutes.get("/", async (_req, res) => {
  const config = await prisma.appConfig.findMany({ orderBy: { key: "asc" } });
  const obj: Record<string, string> = {};
  config.forEach((c) => (obj[c.key] = c.value));
  res.json(obj);
});

configRoutes.put("/:key", async (req, res) => {
  const record = await prisma.appConfig.update({
    where: { key: req.params.key },
    data: { value: req.body.value },
  });
  res.json(record);
});

