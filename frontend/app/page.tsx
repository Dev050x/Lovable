"use client"
import { useState } from "react";
import { creatProject } from "./utils/actions";
import { useRouter } from "next/navigation";
import InputField from "./components/InputField";
import NavBar from "./components/NavBar";

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
    <div className="min-h-screen bg-black-100 relative">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 -z-10 bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-black to-pink-600/50" />
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-pink-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
      </div>
      <div>
        <NavBar />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <InputField onButtonClick={handleSubmit} input={input} setInput={setInput} isLoading={isLoading} />
      </div>
      <div>Kem cho </div>
    </div>
  );
} 
