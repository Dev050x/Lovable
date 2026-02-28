"use client"
import { useState } from "react";
import { creatProject } from "./utils/actions";
import { useRouter } from "next/navigation";  
import { ArrowUp, Loader, Plus } from "lucide-react";
import InputField from "./components/InputField";

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
      <InputField onButtonClick={handleSubmit} input={input} setInput={setInput} isLoading={isLoading} setIsLoading={setIsLoading} />
    </div>
  );
} 
