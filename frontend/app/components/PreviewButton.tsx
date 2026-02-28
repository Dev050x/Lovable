import { useState } from 'react'
import { Globe, Code2, MoreHorizontal, X } from 'lucide-react'

type ActiveButton = 'preview' | 'cloud' | 'theme' | 'code' | 'analytics' | null

const PRIMARY = '#faf9f5'
const AFFIRMATIVE = '#2d5ff5'
const AFFIRMATIVE_10 = '#2d5ff51a'
const INACTIVE_BORDER = '#908F8E'

export function PreviewToolbar({ onPreview, onCode }: { onPreview: () => void, onCode: () => void }) {
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
                    style={isActive ? {
                        border: `0.5px solid ${AFFIRMATIVE}`,
                        color: PRIMARY,
                        backgroundColor: AFFIRMATIVE_10,
                        paddingLeft: '6px',
                        paddingRight: '8px',
                        width: 'auto',
                    } : {
                        color: PRIMARY,
                        border: `0.5px solid ${INACTIVE_BORDER}`,
                        width: '28px',
                        paddingLeft: '0',
                        paddingRight: '0',
                    }}
                    className="relative inline-flex items-center justify-center h-7 rounded-md text-sm transition-all duration-200 ease-in-out overflow-hidden hover:bg-white/5"
                >
                    <span className="flex-shrink-0 w-[18px] flex items-center justify-center">{icon}</span>
                    {isActive && (
                        <span className="whitespace-nowrap ml-1 text-sm">{label}</span>
                    )}
                </button>
                {/* Tooltip */}
                {!isActive && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50">
                        {label}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative flex w-full items-center justify-between px-2 h-10">
            <div className="flex items-center gap-1">
                {btn('preview', <Globe size={14} />, 'Preview')}
                {btn('code', <Code2 size={14} />, 'Code')}
                <button
                    style={{ color: PRIMARY, border: `0.5px solid ${INACTIVE_BORDER}` }}
                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/5"
                >
                    <MoreHorizontal size={14} />
                </button>
            </div>

            <p className="absolute left-1/2 -translate-x-1/2 text-sm font-medium capitalize"
                style={{ color: PRIMARY }}>
                {active ?? ''}
            </p>

            <button
                style={{ color: PRIMARY }}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-white/5"
            >
                <X size={14} />
            </button>
        </div>
    )
}