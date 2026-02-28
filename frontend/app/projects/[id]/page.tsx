"use client"
import CodeBrowser from "@/app/components/CodeBrowser";
import InputField from "@/app/components/InputField";
import { PreviewToolbar } from "@/app/components/PreviewButton";
import { generateProject, getAllChats, getProject, updateProject } from "@/app/utils/actions";
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
    const [preview, setPreview] = useState(true);
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    console.log("project url is: ", url);

    const handleSubmit = async () => {
        try {
            if (!input.trim()) return;
            setUrl("");
            const prompt = input;
            setInput("");
            const result = await updateProject(id as string, input);
            setUrl(result.url);
        } catch (error) {
            console.log("error", error);
        } finally {
            setIsLoading(false);
        }
    }

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
                setChatHistory(chatHistory => [...conversationHistory]);
            }

            if (project_status === "READY") {
                let projectId = await getProject(id as string);
                console.log("projectId is: ", projectId);
                setUrl(projectId.url);
            }

        };
        chats();
    }, [id]);

    return (
        <ResizablePanelGroup
            orientation="horizontal"
            className="min-h-screen max-w-screen rounded-lg md:min-w-112.5"
        >
            <ResizablePanel defaultSize="30%" maxSize="40%">
                <div className="flex items-center justify-center p-2 h-screen">
                    <div className="flex flex-col h-screen w-full">
                        <div className="flex-5 border border-black w-full overflow-y-scroll no-scrollbar">
                            {chatHistory.map((item, key) => {
                                return <div key={key} className={`flex w-full ${item.from === "ASSISTANT" ? "justify-start" : "justify-end"}`}>
                                    <div>{item.content}</div>
                                </div>
                            })}
                        </div>
                        <div className="bg-gradient w-full">
                            <InputField onButtonClick={handleSubmit} input={input} setInput={setInput} isLoading={isLoading} setIsLoading={setIsLoading} />
                        </div>
                    </div>

                </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="70%">
                <div className="flex flex-col h-full">
                    <div className="bg-[#0A0A0A] w-full text-white h-12 py-2 px-4 gap-2">
                        <PreviewToolbar onCode={() => setPreview(false)} onPreview={() => setPreview(true)} />
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        {preview ? (url ? <iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="h-full w-full" /> : <h1>Generating...</h1>) : (url ? <CodeBrowser projectId={id as string} /> : <h1> Generating the project</h1>)}
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}