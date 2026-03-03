import type { Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { clerkClient } from "@clerk/express";
import { prisma } from "../utils/prisma.js";

export const syncUser = async (req: Request, res: Response) => {
  const { userId } = getAuth(req);
  console.log("try to authenticate uesr...", userId);
  const existingUser = await prisma.user.findUnique({
    where: { clerkId: userId! },
  });

  if (existingUser) {
    return res.json({ user: existingUser });
  }


  const clerkUser = await clerkClient.users.getUser(userId!);
  const username =
    clerkUser.username ||
    clerkUser.emailAddresses[0]?.emailAddress.split("@")[0] ||
    "user";


  const newUser = await prisma.user.create({
    data: {
      clerkId: userId!,
      username,
    },
  });

  console.log("new user is: ", newUser);

  return res.json({ user: newUser });
};