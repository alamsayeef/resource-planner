import { Router } from "express";
import * as controller from "./employee.controller";

export const employeeRoutes = Router();

employeeRoutes.get("/",       controller.list);
employeeRoutes.get("/:id",    controller.getById);
employeeRoutes.post("/",      controller.create);
employeeRoutes.put("/:id",    controller.update);
employeeRoutes.delete("/:id", controller.remove);
