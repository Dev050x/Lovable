"use client"
import InputField from "@/app/components/InputField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { ArrowRight, ExternalLink, Globe } from "lucide-react";

type ChatItem = { from: string, content: string };

type ChatPanelProps = {
    chatHistory: ChatItem[];
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    onSubmit: () => void;
    onPreviewClick?: () => void;
}

export default function ChatPanel({ chatHistory, input, setInput, isLoading, onSubmit, onPreviewClick }: ChatPanelProps) {
    return (
        <div className="flex flex-col h-full w-full p-2 overflow-hidden bg-[#000000]" style={{ height: '100dvh' }}   >
            {/* mobile only top bar */}
            <div className="flex items-center justify-between mb-2 md:hidden">
                <span className="font-semibold text-xl">CraftAi</span>
                <div className="flex gap-2">
                    <Button onClick={onPreviewClick} className="inline-flex items-center justify-center h-7 text-sm border-[0.5px] border-[#908F8E] w-7 px-0">
                        <Globe size={14} />
                    </Button>

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
                            <UserButton />
                        </SignedIn>
                    </div>
                </div>

            </div>

            <div className="hidden md:flex w-full bg-[#000000] h-12.5 items-center px-4" >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8">
                        <img src="../logo.png" alt="Craft AI Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">Craft AI</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 border border-black w-full overflow-y-scroll no-scrollbar">
                {chatHistory.map((item, index) => (
                    <div key={index} className={`flex w-full ${item.from === "ASSISTANT" ? "justify-start" : "justify-end"}`}>
                        <Card className="rounded-2xl bg-muted p-3 shadow-none border-none max-w-[80%] break-words m-2 bg-[#1F1F1F] text-white-200">
                            {item.content}
                        </Card>
                    </div>
                ))}
            </div>

            <div className="flex-shrink-0 w-full">
                <InputField onButtonClick={onSubmit} input={input} setInput={setInput} isLoading={isLoading} />
            </div>

        </div>
    );
}