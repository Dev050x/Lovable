"use client"
import { generateProject, getAllChats } from "@/app/utils/actions";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
type ChatItem = { from: string, content: string };

export default function Project() {
    const { id } = useParams();
    const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
    const [url, setUrl] = useState<string>("");
    useEffect(() => {
        const chats = async () => {
            let chats = await getAllChats(id as string);
            const project_status = chats.projectStatus;
            const conversationHistory = chats.converSationHistory.map((item: any) => ({ from: item.from, content: item.content }));
            const chatId = chats.chatId;
            setChatHistory(chatHistory => [...chatHistory, ...conversationHistory]);
            console.log("projectId: ", id);
            console.log("chats is: ", chats);
            console.log("chatId is: ", chatId);
            console.log("project_status is: ", project_status);
            console.log("conversationHistory is: ", conversationHistory);

            if (project_status === "PENDING") {
                console.log("start generating project...");
                const result = await generateProject(id as string, chatId);
                console.log("result is: ", result);
                setUrl(result.url);
                let chats = await getAllChats(id as string);
                const project_status = chats.projectStatus;
                const conversationHistory = chats.converSationHistory.map((item: any) => ({ from: item.from, content: item.content }));
                setChatHistory(chatHistory => [...chatHistory, ...conversationHistory]);
            }
        };
        chats();
    }, [id]);

    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-screen max-w-screen rounded-lg md:min-w-112.5"
        >
            <ResizablePanel defaultSize="25%">
                <div className="flex items-center justify-center p-6 h-screen">
                    <div className="flex flex-col h-screen w-full">
                        <div className="flex-5 border border-black w-full">
                            {chatHistory.map((item, key) => {
                                return <div key={key} className={`flex w-full ${item.from === "ASSISTANT" ? "justify-start" : "justify-end"}`}>
                                    <div>{item.content}</div>
                                </div>
                            })}
                        </div>
                        <div className="flex-1 w-full">
                            <input type="text" placeholder="type your query here" className="border border-black w-full h-full" />
                        </div>
                    </div>

                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="75%">
                <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">{url}</span>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}