import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { employeeRoutes } from "./modules/employees/employee.routes";
import { roleRoutes } from "./modules/roles/role.routes";
import { projectTypeRoutes } from "./modules/project-types/projectType.routes";
import { projectRoutes } from "./modules/projects/project.routes";
import { assignmentRoutes } from "./modules/assignments/assignment.routes";
import { leaveRoutes } from "./modules/leave/leave.routes";
import { holidayRoutes } from "./modules/holidays/holiday.routes";
import { capacityRoutes } from "./modules/capacity/capacity.routes";
import { configRoutes } from "./modules/config/config.routes";
import { planningRoutes } from "./modules/planning/planning.routes";

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/employees",     employeeRoutes);
app.use("/api/roles",         roleRoutes);
app.use("/api/project-types", projectTypeRoutes);
app.use("/api/projects",      projectRoutes);
app.use("/api/assignments",   assignmentRoutes);
app.use("/api/leave",         leaveRoutes);
app.use("/api/holidays",      holidayRoutes);
app.use("/api/capacity",      capacityRoutes);
app.use("/api/config",        configRoutes);

app.use("/api/planning", planningRoutes);

app.listen(PORT, () => {
  console.log("PenTAG Resource Planner API running on http://localhost:" + PORT);
});
