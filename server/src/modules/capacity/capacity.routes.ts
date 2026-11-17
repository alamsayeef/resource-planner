
import { Router } from "express";
import * as controller from "./capacity.controller";

export const capacityRoutes = Router();

capacityRoutes.get("/",             controller.getTeamCapacity);
capacityRoutes.get("/employee/:id", controller.getEmployeeCapacity);
capacityRoutes.get("/summary",      controller.getTeamSummary);

