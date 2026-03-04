"use client"
import CodeBrowser from "@/app/components/CodeBrowser";
import { PreviewToolbar } from "@/app/components/PreviewToolbar";
import ChatPanel from "@/app/components/ChatPanel";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useParams } from "next/navigation";
import { useState } from "react";
import { useProject } from "@/app/hooks/useProject";

export default function Project() {
    const { id } = useParams();
    const { chatHistory, url, input, setInput, isLoading, handleSubmit } = useProject(id as string);
    const [preview, setPreview] = useState(true);
    const [mobileView, setMobileView] = useState<"chat" | "preview">("chat");

    return (
        <>
            {/* ---------- MOBILE ---------- */}
            <div className="h-screen overflow-hidden md:hidden">
                {mobileView === "chat" ? (
                    <ChatPanel
                        chatHistory={chatHistory}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        onSubmit={handleSubmit}
                        onPreviewClick={() => setMobileView("preview")}
                    />
                ) : (
                    <div className="flex flex-col h-screen overflow-hidden">
                        <div className="flex-shrink-0 bg-[#0A0A0A] w-full text-white h-12 py-2 px-4">
                            <PreviewToolbar
                                onCode={() => setPreview(false)}
                                onPreview={() => setPreview(true)}
                                onBack={() => setMobileView("chat")}
                                url={url}
                            />
                        </div>
                        <div className="flex-1 min-h-0 w-full">
                            {preview
                                ? (url ? <iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="h-full w-full" /> : <h1>Generating...</h1>)
                                : (url ? <CodeBrowser projectId={id as string} /> : <h1>Generating the project...</h1>)
                            }
                        </div>
                    </div>
                )}
            </div>

            {/* ---------- DESKTOP ---------- */}
            <ResizablePanelGroup
                orientation="horizontal"
                className="hidden md:flex min-h-screen max-w-screen rounded-lg"
            >
                <ResizablePanel defaultSize="30%" maxSize="40%">
                    <ChatPanel
                        chatHistory={chatHistory}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        onSubmit={handleSubmit}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="70%">
                    <div className="flex flex-col h-full overflow-scroll no-scrollbar">
                        <div className="bg-[#000000] w-full text-white h-12 py-2 gap-2">
                            <PreviewToolbar onCode={() => setPreview(false)} onPreview={() => setPreview(true)} url={url} />
                        </div>
                        <div className="flex-1 w-full min-h-0 border border-[#292929] rounded-[6px]">
                            {preview
                                ? (url ? <iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="h-full w-full border border-[#292929] rounded-[6px]" /> : <h1>Generating...</h1>)
                                : (url ? <CodeBrowser projectId={id as string} /> : <h1>Generating the project...</h1>)
                            }
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </>
    );
}