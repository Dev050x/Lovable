import { Router } from "express";
import { clerkAuth, requireAuth } from "../middleware/auth.middleware.js";
import { syncUser } from "../handler/auth.handler.js";

const authRouter = Router();

authRouter.post("/auth/sync", requireAuth, syncUser); 

export default authRouter;