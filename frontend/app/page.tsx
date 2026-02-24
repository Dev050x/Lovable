"use client"
import { useState } from "react";
import { creatProject } from "./utils/actions";
import { useRouter } from "next/navigation";

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
      <input type="text" placeholder="Enter text here" className="border-white" value={input} onChange={(e) => { setInput(e.target.value) }} />
      <button className="border-white" onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Creating....": "Submit"}
        </button>
    </div>
  );
} 
