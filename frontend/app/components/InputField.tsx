"use client"
import { SignInButton, useAuth } from "@clerk/nextjs";
import { ArrowUp, Loader, Plus } from "lucide-react";

export default function InputField({ onButtonClick, input, setInput, isLoading }: { onButtonClick: () => void, input: string, setInput: React.Dispatch<React.SetStateAction<string>>, isLoading: boolean }) {
    const { isSignedIn } = useAuth();
    return (
        <div className="flex flex-col bg-[#121212] border border-[#2E2E2E] rounded-[10px] mx-auto w-full max-w-2xl mx-172.5 overflow-hidden shadow-2xl">
            <textarea
                rows={1}
                placeholder="Ask to Build....."
                className="w-full bg-transparent text-white text-sm placeholder-[#A0A0A0] outline-none border-none resize-none px-4 pt-4 pb-4 overflow-y-scroll no-scrollbar   "
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-2">
                    <button
                        disabled
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-[#A0A0A0] cursor-not-allowed leading-none px-[2px]"
                    >
                        <Plus />
                    </button>
                </div>
                {isSignedIn ? <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-black hover:bg-gray-200 active:scale-95 transition-all font-bold text-base" onClick={() => onButtonClick()} disabled={isLoading}>
                    {isLoading ? <Loader /> : <ArrowUp />}
                </button> : <SignInButton mode="modal">
                    <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-black hover:bg-gray-200 active:scale-95 transition-all font-bold text-base" onClick={() => onButtonClick()} disabled={isLoading}>
                        {isLoading ? <Loader /> : <ArrowUp />}
                    </button>
                </SignInButton>}

            </div>

        </div>
    )
}

