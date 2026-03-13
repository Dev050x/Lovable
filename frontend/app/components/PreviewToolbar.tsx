"use client"
import { useState } from 'react'
import { Globe, Code2, ArrowLeft, LaptopMinimal, ExternalLink, ExternalLinkIcon, RefreshCcw, RotateCw } from 'lucide-react'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'

type ActiveButton = 'preview' | 'code' | null

export function PreviewToolbar({ onPreview, onCode, onBack, url }: { onPreview: () => void, onCode: () => void, onBack?: () => void, url: string | null }) {
    const [active, setActive] = useState<ActiveButton>('preview')
    console.log("preview toolbar url is: ", url);
    const btn = (id: ActiveButton, icon: React.ReactNode, label: string) => {
        const isActive = active === id
        return (
            <div key={id} className="relative group">
                <button
                    onClick={() => {
                        setActive(id)
                        if (id === 'preview') onPreview?.()
                        if (id === 'code') onCode?.()
                    }}
                    className={[
                        'relative inline-flex items-center justify-center h-7 rounded-md text-sm text-[#faf9f5] transition-all duration-200 ease-in-out overflow-hidden hover:bg-white/5',
                        isActive
                            ? 'border-[0.5px] border-[#2d5ff5] bg-[#2d5ff5]/10 pl-1.5 pr-2 w-auto'
                            : 'border-[0.5px] border-[#908F8E] w-7 px-0',
                    ].join(' ')}
                >
                    <span className="flex-shrink-0 w-[18px] flex items-center justify-center">{icon}</span>
                    {isActive && (
                        <span className="whitespace-nowrap ml-1 text-sm">{label}</span>
                    )}
                </button>
                {!isActive && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                        {label}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative flex w-full items-center pr-2 justify-between h-10">
            {/* preview and code button */}
            <div className="flex items-center gap-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden h-7 w-7 flex items-center justify-center rounded-md text-[#faf9f5] border-[0.5px] border-[#908F8E] hover:bg-white/5 mr-1"
                    >
                        <ArrowLeft size={14} />
                    </button>
                )}
                {btn('preview', <Globe size={14} />, 'Preview')}
                {btn('code', <Code2 size={14} />, 'Code')}
            </div>

            {/* navigtaion ui for external tab */}
            <div className="hidden md:flex items-center gap-1 border-[0.5px] border-[#faf9f5] rounded-md h-7.5 px-2 w-[220px]">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    <LaptopMinimal size={12} className="text-[#faf9f5] flex-shrink-0" />
                    <span className="text-[#faf9f5] text-xs">/</span>
                    <input
                        type="text"
                        readOnly
                        className="bg-transparent text-[#faf9f5] text-xs outline-none w-full min-w-0 caret-[#2d5ff5]"
                    />
                </div>                
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button className="h-5 w-5 flex items-center justify-center rounded hover:bg-white/10 transition-colors" disabled={!url} onClick={() => window.open(url!, "_blank")}>
                        <ExternalLink size={12} className="text-[#faf9f5]
                        " />
                    </button>
                    
                </div>
            </div>

            {/* button for authentication */}
            <button className="h-7 w-7 flex items-center justify-center rounded-md text-[#faf9f5] hover:bg-white/5">
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button variant="ghost" className="text-white hover:text-black hover:bg-white border text-sm h-8 px-3">
                            Login
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <Button className="bg-white text-black hover:bg-white/90 text-sm h-8 px-3 rounded-md font-medium">
                            Get Started
                        </Button>
                    </SignUpButton>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
            </button>
        </div>
    )
}