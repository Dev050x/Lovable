import { useState } from 'react'
import { Globe, Code2, MoreHorizontal, X, ArrowLeft } from 'lucide-react'

type ActiveButton = 'preview' | 'code' | null

export function PreviewToolbar({ onPreview, onCode, onBack }: { onPreview: () => void, onCode: () => void, onBack?: () => void }) {
    const [active, setActive] = useState<ActiveButton>('preview')

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
                    className={`relative inline-flex items-center justify-center h-7 rounded-md text-sm text-[#faf9f5] transition-all duration-200 ease-in-out overflow-hidden hover:bg-white/5 px-2 w-auto
                        ${isActive
                            ? 'border border-[#2d5ff5] bg-[#2d5ff5]/10'
                            : 'border border-[#908F8E]'
                        }`}
                >
                    <span className="flex-shrink-0 w-[18px] flex items-center justify-center">{icon}</span>
                    <span className="whitespace-nowrap ml-1 text-sm">{label}</span>
                </button>
            </div>
        )
    }

    return (
        <div className="relative flex w-full items-center justify-between px-2 h-10">
            <div className="flex items-center gap-1">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="md:hidden h-7 w-7 flex items-center justify-center rounded-md text-[#faf9f5] border border-[#908F8E] hover:bg-white/5 mr-1"
                    >
                        <ArrowLeft size={14} />
                    </button>
                )}
                {btn('preview', <Globe size={14} />, 'Preview')}
                {btn('code', <Code2 size={14} />, 'Code')}
                <button className="h-7 w-7 flex items-center justify-center rounded-md text-[#faf9f5] border border-[#908F8E] hover:bg-white/5">
                    <MoreHorizontal size={14} />
                </button>
            </div>

            <p className="hidden md:block absolute left-1/2 -translate-x-1/2 text-sm font-medium capitalize text-[#faf9f5]">
                {active ?? ''}
            </p>

            <button className="h-7 w-7 flex items-center justify-center rounded-md text-[#faf9f5] hover:bg-white/5">
                <X size={14} />
            </button>
        </div>
    )
}