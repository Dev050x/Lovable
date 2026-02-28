"use client"
import { useState } from "react";
import { creatProject } from "./utils/actions";
import { useRouter } from "next/navigation";  
import { ArrowUp, Loader, Plus } from "lucide-react";

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSubmit = async () => {
    try {
      if (!input.trim()) return;
      setIsLoading(true);
      const result = await creatProject(input);
      router.push(`/projects/${result.projectId}`);
    } catch (error) {
      console.log("error", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="flex flex-col bg-[#141414] border border-[#2e2e2e] rounded-xl w-full max-w-3xl mx-auto overflow-hidden shadow-2xl">
        <textarea
          rows={2}
          placeholder="Build Anything....."
          className="w-full bg-transparent text-white text-sm placeholder-[#444] outline-none border-none resize-none px-4 pt-4 pb-2 overflow-y-scroll no-scrollbar   "
          value={input}
          onChange={(e) => setInput(e.target.value)}
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
          <button className="flex items-center justify-center w-8 h-8 rounded-xl bg-white text-black hover:bg-gray-400 active:scale-95 transition-all font-bold text-base" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader /> :  <ArrowUp />}
          </button>
        </div>

      </div>
    </div>
  );
} 
