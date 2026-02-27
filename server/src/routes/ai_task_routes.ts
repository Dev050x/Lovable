import { Router } from "express";
import { create_project, generateProject, getAllchats, getAllFiles, getProjectUrl, } from "../handler/ai_task_handler.js";

const aiRouter = Router();
aiRouter.post("/project/create", create_project);
aiRouter.post("/project/generate", generateProject);
aiRouter.get("/project/files", getAllFiles);    //get files 
aiRouter.get("/project/chats", getAllchats);    //get chats
aiRouter.get("/project/", getProjectUrl);       //get project url

export default aiRouter;