import { Router } from "express";
import { create_project, generateProject, getAllchats, getAllFiles, getFileContent, getProjectUrl, } from "../handler/ai_task_handler.js";


const aiRouter = Router();
aiRouter.post("/project/create", create_project);
aiRouter.post("/project/generate", generateProject);
aiRouter.get("/project/", getProjectUrl);       //get project url
aiRouter.get("/project/chats", getAllchats);    //get chats
aiRouter.get("/project/files", getAllFiles);    //get files 
aiRouter.get("/project/file", getFileContent)   //get file content

export default aiRouter;