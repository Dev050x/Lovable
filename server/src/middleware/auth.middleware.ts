import { clerkMiddleware, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export const clerkAuth = clerkMiddleware({
    clockSkewInMs: 10000
}); //verify jwt

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {       //route level protection
    console.log("trying to authenticate user...");
    console.log("Route:", req.method, req.path); 
    const { userId } = getAuth(req);
    console.log("userID: ", userId);
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    console.log("user is authenticated");
    next();
}
