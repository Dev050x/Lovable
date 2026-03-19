"use client"
import { useState } from "react";
import { creatProject } from "./utils/actions";
import { useRouter } from "next/navigation";
import InputField from "./components/InputField";
import NavBar from "./components/NavBar";
import { useAuth } from "@clerk/nextjs";
import SideBar from "./components/Sidebar/SideBar";

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const handleSubmit = async () => {
    try {
      if (!input.trim()) return;
      if (!isSignedIn) {
        console.log("User not signed in");
        return;
      }
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
    <div className="flex flex-col bg-[#000000]" style={{ height: "100dvh" }}>
      <div>
        <NavBar />
      </div>
      <div className="flex flex-col flex-1 items-center justify-center bg-[#0A0A0A] border border-[#292929] rounded-[6px] mx-2 mb-2 px-4 relative">
        <div className="absolute top-2 left-2">
          <SideBar />
        </div>
        <div className="flex flex-col items-center w-full max-w-xl gap-4 -mt-8 relative z-10">
          {/* Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute select-none -z-10 left-1/2 -translate-x-1/2 text-white"
            style={{
              top: "clamp(24px, 6vw, 72px)",
              width: "clamp(340px, 50vw, 642px)",
              height: "clamp(162px, 20vw, 212px)",
              opacity: 1
            }}
          >
            <svg width="642" height="212" viewBox="0 0 642 212" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-current" preserveAspectRatio="xMidYMid meet">
              <mask id="mask0_603_1196-responsive" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="642" height="212">
                <rect width="642" height="212" fill="url(#paint0_linear_603_1196-responsive)" />
              </mask>
              <g mask="url(#mask0_603_1196-responsive)">
                <path
                  d="M114.193 56.7002L247.3 189.807V56.7002H297.5V225C297.5 244.606 281.606 260.5 262 260.5C252.632 260.5 243.391 256.887 236.754 250.25L43.207 56.7002H114.193ZM507.6 5.5C547.088 5.5 579.1 37.5116 579.1 77V209.3H528.9V91.3926L409.993 210.3H527.9V260.5H395.6C356.111 260.5 324.1 228.488 324.1 189V56.7002H374.3V175.007L375.153 174.153L492.754 56.5537L493.607 55.7002H375.3V5.5H507.6Z"
                  stroke="currentColor"
                  strokeOpacity="0.15"
                  fill="none"
                />
              </g>
              <defs>
                <linearGradient id="paint0_linear_603_1196-responsive" x1="321" y1="212" x2="321" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0" />
                  <stop offset="0.987475" stopColor="white" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="text-center text-white text-2xl font-semibold">
            What do you want to Create?
          </h1>
          <div className="relative w-full">
            <InputField onButtonClick={handleSubmit} input={input} setInput={setInput} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}


// bg-[#0A0A0A]
