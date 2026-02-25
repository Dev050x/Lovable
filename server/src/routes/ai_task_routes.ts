import { Router } from "express";
import { create_project, generateProject, getAllchats, getProject, } from "../handler/ai_task_handler.js";

const aiRouter = Router();
aiRouter.post("/project/create", create_project);
aiRouter.post("/project/generate", generateProject);
aiRouter.get("/project/:projectId/chats", getAllchats);
aiRouter.get("/project/:projectId", getProject);

export default aiRouter;