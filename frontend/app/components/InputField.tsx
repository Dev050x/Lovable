import { ArrowUp, Plus } from "lucide-react";

export default function InputField() {
    return (
        <div className="flex flex-col bg-[#141414] border border-[#2e2e2e] rounded-xl w-full max-w-3xl mx-auto overflow-hidden shadow-2xl">
            <textarea
                rows={2}
                placeholder="Build Anything....."
                className="w-full bg-transparent text-white text-sm placeholder-[#444] outline-none border-none resize-none px-4 pt-4 pb-2 overflow-y-scroll no-scrollbar   "
            />

            <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-2">
                    <button
                        disabled
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-[#333] cursor-not-allowed text-xl leading-none"
                    >
                        <Plus />
                    </button>
                </div>
                <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-black hover:bg-gray-200 active:scale-95 transition-all font-bold text-base">
                    <ArrowUp />
                </button>
            </div>

        </div>
    )
}

