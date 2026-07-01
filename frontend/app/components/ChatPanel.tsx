"use client"
import InputField from "@/app/components/InputField";
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
                {chatHistory.map((item, index) => {
                    const isQA = item.content.startsWith("[QUESTION_ANSWER]:");
                    if (isQA) {
                        try {
                            const qaData = JSON.parse(item.content.slice("[QUESTION_ANSWER]:".length));
                            return (
                                <div key={index} className="w-full flex justify-start px-3 py-1">
                                    <div className="w-full max-w-[95%] border border-[#232325] bg-[#0A0A0C] rounded-2xl p-5 shadow-sm my-1 flex flex-col gap-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                                                Question
                                            </span>
                                            <h4 className="text-white text-sm font-semibold leading-snug">
                                                {qaData.question}
                                            </h4>
                                        </div>
                                        <div className="border-t border-[#1C1C1E] my-1"></div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">
                                                Selected Answer
                                            </span>
                                            <p className="text-gray-300 text-sm font-medium leading-normal">
                                                {qaData.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        } catch (e) {
                            // Fallback to standard rendering below
                        }
                    }

                    return (
                        <div key={index} className={`flex w-full ${item.from === "ASSISTANT" ? "justify-start" : "justify-end"}`}>
                            <Card className="rounded-2xl bg-muted p-3 shadow-none border-none max-w-[80%] break-words m-2 bg-[#1F1F1F] text-white-200">
                                {item.content}
                            </Card>
                        </div>
                    );
                })}

                {pendingQuestion && (
                    <div className="flex w-full justify-start px-3 py-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-full max-w-[95%] border border-[#292929] bg-[#0A0A0C] rounded-2xl p-5 shadow-xl my-2 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider bg-[#1C1C1E] px-2 py-0.5 rounded">
                                    Product Blueprint
                                </span>
                                {pendingQuestion.score !== undefined && (
                                    <span className="text-xs font-semibold text-[#FF453A]">
                                        Revised prompt score: {pendingQuestion.score}%
                                    </span>
                                )}
                            </div>

                            <h3 className="text-white text-base font-semibold leading-snug">
                                {pendingQuestion.question}
                            </h3>

                            {pendingQuestion.options && pendingQuestion.options.length > 0 && (
                                <div className="flex flex-col gap-2.5 mt-1">
                                    {pendingQuestion.options.map((opt, idx) => {
                                        const value = typeof opt === "string" ? opt : opt.value;
                                        const description = typeof opt === "string" ? undefined : opt.description;
                                        const isSelected = selectedOptions.includes(value);
                                        const isMultiple = pendingQuestion.questionType === "multiple";

                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleOptionClick(value)}
                                                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                                                    isSelected
                                                        ? "border-white bg-[#1C1C1E]"
                                                        : "border-[#232325] bg-[#161618] hover:bg-[#1C1C1E]/50"
                                                }`}
                                            >
                                                {/* Selection Indicator */}
                                                <div className="mt-0.5 flex-shrink-0">
                                                    {isMultiple ? (
                                                        <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
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
                                                    <span className="text-sm font-medium text-white">{value}</span>
                                                    {description && (
                                                        <span className="text-xs text-[#8E8E93] mt-0.5 leading-normal">
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
                                <div className="flex flex-col gap-1.5 mt-1">
                                    <label className="text-xs text-[#8E8E93] font-medium">
                                        {pendingQuestion.otherLabel ?? "Other / Additional Information"}
                                    </label>
                                    <input
                                        value={otherValue}
                                        onChange={(e) => setOtherValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAnswerSubmit()}
                                        placeholder="Type your answer here..."
                                        className="w-full bg-[#161618] border border-[#292929] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                                    />
                                </div>
                            )}

                            <Button
                                onClick={handleAnswerSubmit}
                                disabled={selectedOptions.length === 0 && !otherValue.trim()}
                                className="w-full mt-2 bg-white text-black hover:bg-gray-200 transition-colors font-semibold py-2.5 rounded-xl text-sm shadow disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Submit
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 w-full">
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