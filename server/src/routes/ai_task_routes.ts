import { Router } from "express";
import { create_project, generateProject, getAllchats, } from "../handler/ai_task_handler.js";

const aiRouter = Router();
aiRouter.post("/project/create", create_project);
aiRouter.post("/project/generate", generateProject);
aiRouter.get("/project/:projectId/chats", getAllchats);

export default aiRouter;