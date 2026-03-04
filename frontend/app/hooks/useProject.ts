import { generateProject, getAllChats, getProject, updateProject } from "@/app/utils/actions";
import { useEffect, useRef, useState } from "react";

type ChatItem = { from: string, content: string };

const mapToChatItems = (history: any[]): ChatItem[] => {
    return history.map(({ from, content }) => ({ from, content }));
};

export function useProject(id: string) {
    const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
    const [url, setUrl] = useState<string>("");
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const isMounted = useRef(true);
    console.log("project url is: ", url);

    const syncChats = async () => {
        const chats = await getAllChats(id);
        setChatHistory(mapToChatItems(chats.converSationHistory));
        return chats;
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;
        setUrl("");
        setIsLoading(true);
        const current_input = input;
        setChatHistory(prev => [...prev, { from: "USER", content: current_input }]);
        setInput("");
        try {
            const result = await updateProject(id as string, current_input);
            setUrl(result.url);
            await syncChats();
        } catch (error) {
            console.log("error", error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        isMounted.current = true;

        const init = async () => {
            let chats = await getAllChats(id as string);
            if (!isMounted.current) return;

            const { projectStatus, chatId, converSationHistory } = chats;
            setChatHistory(mapToChatItems(converSationHistory));

            console.log("projectId: ", id);
            console.log("chats is: ", chats);
            console.log("chatId is: ", chatId);
            console.log("project_status is: ", projectStatus);
            console.log("conversationHistory is: ", projectStatus);

            if (projectStatus === "PENDING") {
                console.log("start generating project...");
                const result = await generateProject(id as string, chatId);
                if (!isMounted.current) return;
                console.log("result is: ", result);
                setUrl(result.url);
                await syncChats();
            }

            if (projectStatus === "READY") {
                let projectId = await getProject(id as string);
                if (!isMounted.current) return;
                console.log("projectId is: ", projectId);
                setUrl(projectId.url);
            }
        };

        init();
        return () => { isMounted.current = false; };
    }, [id]);

    return { chatHistory, url, input, setInput, isLoading, setIsLoading, handleSubmit };
}