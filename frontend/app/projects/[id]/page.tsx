    "use client"
    import CodeBrowser from "@/app/components/CodeBrowser";
    import { PreviewToolbar } from "@/app/components/PreviewButton";
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
        const { chatHistory, url, input, setInput, isLoading, setIsLoading, handleSubmit } = useProject(id as string);
        const [preview, setPreview] = useState(true);

        return (
            <ResizablePanelGroup
                orientation="horizontal"
                className="min-h-screen max-w-screen rounded-lg md:min-w-112.5"
            >
                <ResizablePanel defaultSize="30%" maxSize="40%">
                    <ChatPanel
                        chatHistory={chatHistory}
                        input={input}
                        setInput={setInput}
                        isLoading={isLoading}
                        setIsLoading={setIsLoading}
                        onSubmit={handleSubmit}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize="70%">
                    <div className="flex flex-col h-full">
                        <div className="bg-[#0A0A0A] w-full text-white h-12 py-2 px-4 gap-2">
                            <PreviewToolbar onCode={() => setPreview(false)} onPreview={() => setPreview(true)} />
                        </div>
                        <div className="flex-1 w-full min-h-0">
                            {preview
                                ? (url ? <iframe src={url} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" className="h-full w-full" /> : <h1>Generating...</h1>)
                                : (url ? <CodeBrowser projectId={id as string} /> : <h1>Generating the project........</h1>)
                            }
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        );
    }