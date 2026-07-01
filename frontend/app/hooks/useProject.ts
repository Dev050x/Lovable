"use client";
import { getAllChats, getProject } from "@/app/utils/actions";
import { answerQuestion } from "@/app/utils/actions";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { QuestionEvent, SseEvent } from "../utils/stream-types";
import { streamGenerate } from "../utils/stream-generate";

type ChatItem = { from: string; content: string };

const mapToChatItems = (history: any[]): ChatItem[] => {
    return history.map(({ from, content }) => ({ from, content }));
};

export function useProject(id: string) {
    const { getToken } = useAuth();
    const [chatHistory, setChatHistory] = useState<ChatItem[]>([]);
    const [url, setUrl] = useState<string>("");
    const [input, setInput] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pendingQuestion, setPendingQuestion] = useState<QuestionEvent | null>(null);
    const isMounted = useRef(true);

    const syncChats = async () => {
        const chats = await getAllChats(id);
        if (!isMounted.current) return chats;
        setChatHistory(mapToChatItems(chats.converSationHistory));
        return chats;
    };

    // shared handler for both /generate and /update streams
    const runStream = async (endpoint: "generate" | "update", body: Record<string, unknown>) => {
        const token = await getToken();
        if (!token) return;

        await streamGenerate(endpoint, body, token, (event: SseEvent) => {
            if (!isMounted.current) return;

            switch (event.type) {
                case "url":
                    setUrl(event.url);
                    break;
                case "question":
                    setPendingQuestion(event);
                    break;
                case "done":
                    setIsLoading(false);
                    syncChats();
                    break;
                case "error":
                    console.log("stream error", event.message);
                    setIsLoading(false);
                    break;
            }
        });
    };

    const handleSubmit = async () => {
        if (!input.trim()) return;
        setUrl("");
        setIsLoading(true);
        const current_input = input;
        setChatHistory(prev => [...prev, { from: "USER", content: current_input }]);
        setInput("");

        try {
            await runStream("update", { projectId: id, prompt: current_input });
        } catch (error) {
            console.log("error", error);
            setIsLoading(false);
        }
    };

    const handleAnswer = async (answer: string) => {
        if (!pendingQuestion) return;
        const questionId = pendingQuestion.questionId;
        const questionText = pendingQuestion.question;
        setPendingQuestion(null);
        setChatHistory(prev => [
            ...prev,
            {
                from: "ASSISTANT",
                content: `[QUESTION_ANSWER]:${JSON.stringify({ question: questionText, answer })}`
            }
        ]);
        try {
            await answerQuestion(questionId, answer);
        } catch (error) {
            console.log("error answering question", error);
        }
        // isLoading stays true — the stream is still running on the backend
    };

    useEffect(() => {
        isMounted.current = true;

        const init = async () => {
            let chats = await getAllChats(id);
            if (!isMounted.current) return;

            const { projectStatus, chatId, converSationHistory } = chats;
            setChatHistory(mapToChatItems(converSationHistory));

            if (projectStatus === "PENDING") {
                setIsLoading(true);
                await runStream("generate", { projectId: id, chatId });
            }

            if (projectStatus === "READY") {
                let project = await getProject(id);
                if (!isMounted.current) return;
                setUrl(project.url);
            }
        };

        init();
        return () => { isMounted.current = false; };
    }, [id]);

    return {
        chatHistory,
        url,
        input,
        setInput,
        isLoading,
        setIsLoading,
        handleSubmit,
        pendingQuestion,
        handleAnswer,
    };
}