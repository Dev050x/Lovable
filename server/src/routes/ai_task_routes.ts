import { Router } from "express";
import { create_project, generateProject, } from "../handler/ai_task_handler.js";

const aiRouter = Router();
aiRouter.post("/project/create", create_project);
aiRouter.post("/project/generate", generateProject);

export default aiRouter;