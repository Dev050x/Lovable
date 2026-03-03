"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { syncUserInfo } from "../utils/actions";

//Creating entry in database for user if not exists, to sync auth state between frontend and backend
export default function AuthSync() {
    const { isSignedIn, isLoaded, getToken, userId } = useAuth();
    useEffect(() => {
        if (!isSignedIn || !isLoaded) return;

        const syncUser = async () => {
            const token = await getToken();
            console.log("Got token for auth sync:", token);
            if (token) {
                const res = await syncUserInfo(token, userId!);
                console.log("User info synced:", res);
            }
        };

        syncUser();
        console.log("Auth state synced with backend");
    }, [isSignedIn, isLoaded]);

    return null;
}