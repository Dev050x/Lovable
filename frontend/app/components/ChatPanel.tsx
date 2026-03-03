"use client"
import InputField from "@/app/components/InputField";
import { Card } from "@/components/ui/card";

type ChatItem = { from: string, content: string };

type ChatPanelProps = {
    chatHistory: ChatItem[];
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
    onSubmit: () => void;
}

export default function ChatPanel({ chatHistory, input, setInput, isLoading, setIsLoading, onSubmit }: ChatPanelProps) {
    return (
        <div className="flex items-center justify-center p-2 h-screen">
            <div className="flex flex-col h-screen w-full">
                <div className="flex-5 border border-black w-full overflow-y-scroll no-scrollbar">
                    {chatHistory.map((item, index) => (
                        <div key={index} className={`flex w-full ${item.from === "ASSISTANT" ? "justify-start" : "justify-end"}`}>
                            <Card className="rounded-lg bg-muted p-2 shadow-none border-none max-w-[80%] break-words m-2">
                                {item.content}
                            </Card>
                        </div>
                    ))}
                </div>
                <div className="bg-gradient w-full">
                    <InputField onButtonClick={onSubmit} input={input} setInput={setInput} isLoading={isLoading} />
                </div>
            </div>
        </div>
    );
}