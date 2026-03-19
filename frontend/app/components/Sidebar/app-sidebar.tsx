"use client"
import * as React from "react"
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { LayoutGrid, TableOfContents, Clock, CircleDashed } from "lucide-react";

const data = {
    items: [
        {
            title: "Chats",
            url: "#",
            icon: TableOfContents,
        },
        {
            title: "Projects",
            url: "#",
            icon: LayoutGrid,
        },
    ],
    recentHistory: [
        { title: "Todo app", url: "#" },
        { title: "Finance app landing page", url: "#" },
        { title: "LeetCode clone", url: "#" },
        { title: "Resume screenshot remake", url: "#" },
        { title: "Supabase Community Starter", url: "#" },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useUser();
    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="flex items-center gap-2">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <Button variant="ghost" className="text-white hover:text-black hover:bg-white border text-sm h-8 px-3">
                                Login
                            </Button>
                        </SignInButton>
                        <SignInButton mode="modal">
                            <Button className="bg-white text-black hover:bg-white/90 text-sm h-8 px-3 rounded-md font-medium">
                                Get Started
                            </Button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <div className="mx-1">
                            <UserButton />
                        </div>
                        <div className="font-bold text-white">{user?.firstName} {user?.lastName}</div>
                    </SignedIn>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Main nav items */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url} className="flex items-center gap-2 text-[#b9aaaa] ">
                                            <item.icon size={16} />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Recent History */}
                <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center gap-2 text-[#b9aaaa]">
                        <Clock size={13} />
                        Recent
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.recentHistory.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <a href={item.url} className="truncate text-sm ml-2 text-[#b9aaaa]">
                                            <CircleDashed />
                                            {item.title}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    )
}