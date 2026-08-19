"use client"
import InputField from "@/app/components/InputField";
import FormattedMarkdown from "@/app/components/FormattedMarkdown";
import LoadingState from "@/app/components/LoadingState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Globe } from "lucide-react";
import { QuestionEvent } from "../utils/stream-types";
import { useState, useEffect } from "react";

type ChatItem = { from: string, content: string };

type ChatPanelProps = {
    chatHistory: ChatItem[];
    input: string;
    setInput: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    onSubmit: () => void;
    onPreviewClick?: () => void;
    pendingQuestion?: QuestionEvent | null;
    onAnswer?: (answer: string) => void;
}

export default function ChatPanel({
    chatHistory,
    input,
    setInput,
    isLoading,
    onSubmit,
    onPreviewClick,
    pendingQuestion,
    onAnswer,
}: ChatPanelProps) {
    const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
    const [otherValue, setOtherValue] = useState("");

    useEffect(() => {
        setSelectedOptions([]);
        setOtherValue("");
    }, [pendingQuestion?.questionId]);

    const handleOptionClick = (value: string) => {
        const type = pendingQuestion?.questionType ?? "single";
        if (type === "single") {
            setSelectedOptions([value]);
        } else {
            if (selectedOptions.includes(value)) {
                setSelectedOptions(selectedOptions.filter(v => v !== value));
            } else {
                setSelectedOptions([...selectedOptions, value]);
            }
        }
    };

    const handleAnswerSubmit = () => {
        const parts: string[] = [];
        if (selectedOptions.length > 0) {
            parts.push(selectedOptions.join(", "));
        }
        if (otherValue.trim()) {
            parts.push(otherValue.trim());
        }
        if (parts.length === 0) return;
        onAnswer?.(parts.join(" - "));
    };

    return (
        <div className="flex flex-col h-full w-full p-2 overflow-hidden bg-[#09090B]" style={{ height: '100dvh' }}   >
            {/* mobile only top bar */}
            <div className="flex items-center justify-between mb-2 md:hidden">
                <span className="font-semibold text-xl text-white">CraftAi</span>
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

            <div className="hidden md:flex w-full bg-[#09090B] h-14 items-center px-4" >
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8">
                        <img src="../logo.png" alt="Craft AI Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-white font-bold text-xl tracking-tight">Craft AI</span>
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full overflow-y-scroll no-scrollbar py-4">
                <div className="max-w-2xl mx-auto w-full flex flex-col gap-4 px-4">
                    {chatHistory.map((item, index) => {
                        const isQA = item.content.startsWith("[QUESTION_ANSWER]:");
                        if (isQA) {
                            try {
                                const qaData = JSON.parse(item.content.slice("[QUESTION_ANSWER]:".length));
                                return (
                                    <div key={index} className="w-full flex justify-start py-1">
                                        <div className="w-full border border-[#27272A] bg-[#18181B] rounded-[10px] p-4 shadow-sm flex flex-col gap-2">
                                            <h4 className="text-zinc-100 text-base font-normal leading-snug">
                                                {qaData.question}
                                            </h4>
                                            <p className="text-zinc-400 text-[15px] font-normal leading-relaxed">
                                                {qaData.answer}
                                            </p>
                                        </div>
                                    </div>
                                );
                            } catch (e) {
                                // Fallback to standard rendering below
                            }
                        }

                        const isAssistant = item.from === "ASSISTANT";
                        return (
                            <div key={index} className={`flex w-full ${isAssistant ? "justify-start" : "justify-end"} py-1`}>
                                <div className={`rounded-[10px] py-2.5 px-4 max-w-[85%] break-words text-base shadow-sm leading-relaxed ${
                                    isAssistant 
                                        ? "bg-[#18181B] border border-[#27272A] text-zinc-100" 
                                        : "bg-[#27272A] border border-[#3F3F46] text-white"
                                }`}>
                                    <FormattedMarkdown content={item.content} />
                                </div>
                            </div>
                        );
                    })}

                    {pendingQuestion && (
                        <div className="flex w-full justify-start py-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="w-full border border-[#27272A] bg-[#18181B] rounded-[10px] p-4 shadow-xl flex flex-col gap-3">
                                {pendingQuestion.score !== undefined && (
                                    <div className="text-sm font-normal text-[#FF453A] mb-1">
                                        Agent detected prompt score : {pendingQuestion.score}%
                                    </div>
                                )}

                                <h3 className="text-zinc-100 text-base font-normal leading-snug">
                                    {pendingQuestion.question}
                                </h3>

                                {pendingQuestion.options && pendingQuestion.options.length > 0 && (
                                    <div className="flex flex-col gap-2.5">
                                        {pendingQuestion.options.map((opt, idx) => {
                                            const value = typeof opt === "string" ? opt : opt.value;
                                            const description = typeof opt === "string" ? undefined : opt.description;
                                            const isSelected = selectedOptions.includes(value);
                                            const isMultiple = pendingQuestion.questionType === "multiple";

                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleOptionClick(value)}
                                                    className={`flex items-start gap-3 py-3 px-3.5 rounded-md border cursor-pointer transition-all duration-200 ${
                                                        isSelected
                                                            ? "border-white bg-[#27272A]"
                                                            : "border-[#27272A] bg-[#09090B] hover:bg-[#18181B]"
                                                    }`}
                                                >
                                                    {/* Selection Indicator */}
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {isMultiple ? (
                                                            <div className={`w-4.5 h-4.5 rounded-sm border flex items-center justify-center transition-all ${
                                                                isSelected ? "border-white bg-white text-black" : "border-gray-600"
                                                            }`}>
                                                                {isSelected && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                                                        <polyline points="20 6 9 17 4 12"></polyline>
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center transition-all ${
                                                                isSelected ? "border-white" : "border-gray-600"
                                                            }`}>
                                                                {isSelected && (
                                                                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Text content */}
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-normal text-white">{value}</span>
                                                        {description && (
                                                            <span className="text-sm text-[#8E8E93] mt-0.5 leading-normal">
                                                                {description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {pendingQuestion.allowOther && (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm text-[#8E8E93] font-normal">
                                            {pendingQuestion.otherLabel ?? "Other / Additional Information"}
                                        </label>
                                        <input
                                            value={otherValue}
                                            onChange={(e) => setOtherValue(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleAnswerSubmit()}
                                            placeholder="Type your answer here..."
                                            className="w-full bg-[#09090B] border border-[#27272A] rounded-md px-4 py-2.5 text-base text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
                                        />
                                    </div>
                                )}

                                <Button
                                    onClick={handleAnswerSubmit}
                                    disabled={selectedOptions.length === 0 && !otherValue.trim()}
                                    className="w-full mt-1 bg-white text-black hover:bg-gray-200 transition-colors font-medium py-2.5 rounded-md text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Submit
                                </Button>
                            </div>
                        </div>
                    )}

                    {isLoading && !pendingQuestion && (
                        <div className="flex w-full justify-start py-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <LoadingState label="Crafting solution..." variant="Drive" />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-shrink-0 w-full pt-2 bg-[#09090B]">
                <InputField
                    onButtonClick={onSubmit}
                    input={input}
                    setInput={setInput}
                    isLoading={isLoading || !!pendingQuestion}
                />
            </div>

        </div>
    );
}