import { Router } from "express";
import { handleAiPrompt } from "../handler/ai_task_handler.js";

const aiRouter = Router();
aiRouter.post("/prompt", handleAiPrompt);

export default aiRouter;