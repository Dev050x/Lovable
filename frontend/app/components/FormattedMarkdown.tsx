"use client";
import React, { useState } from "react";
import { Check, Copy, Code2 } from "lucide-react";

interface FormattedMarkdownProps {
  content: string;
}

export default function FormattedMarkdown({ content }: FormattedMarkdownProps) {
  if (!content) return null;

  // Separate text blocks and multiline ``` code blocks
  const blocks: { type: "text" | "code"; content: string; language?: string }[] = [];
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: "text", content: content.substring(lastIndex, match.index) });
    }
    blocks.push({
      type: "code",
      language: match[1] || "code",
      content: match[2].trim(),
    });
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    blocks.push({ type: "text", content: content.substring(lastIndex) });
  }

  return (
    <div className="flex flex-col gap-2 leading-relaxed text-zinc-200">
      {blocks.map((block, bIdx) => {
        if (block.type === "code") {
          return (
            <CodeCard key={bIdx} language={block.language || "code"} code={block.content} />
          );
        }

        // Render text lines inside text block
        const lines = block.content.split("\n");
        return (
          <div key={bIdx} className="flex flex-col gap-1.5">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={lIdx} className="h-1" />;

              if (trimmed.startsWith("### ")) {
                return (
                  <h3 key={lIdx} className="text-white font-semibold text-base mt-2 mb-0.5">
                    {renderFormattedText(trimmed.slice(4))}
                  </h3>
                );
              }

              if (trimmed.startsWith("## ")) {
                return (
                  <h2 key={lIdx} className="text-white font-bold text-lg mt-2 mb-1">
                    {renderFormattedText(trimmed.slice(3))}
                  </h2>
                );
              }

              if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-2">
                    <span className="text-zinc-400 mt-1.5 text-xs">•</span>
                    <span className="flex-1">{renderFormattedText(trimmed.slice(2))}</span>
                  </div>
                );
              }

              const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-2">
                    <span className="text-zinc-400 font-medium">{numMatch[1]}.</span>
                    <span className="flex-1">{renderFormattedText(numMatch[2])}</span>
                  </div>
                );
              }

              return <p key={lIdx}>{renderFormattedText(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function CodeCard({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 rounded-lg border border-[#27272A] bg-[#09090B] overflow-hidden shadow-md">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#18181B] border-b border-[#27272A] text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Code2 size={13} className="text-zinc-400" />
          <span className="uppercase text-[11px] tracking-wider font-semibold text-zinc-300">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors text-[11px] bg-[#27272A] px-2 py-0.5 rounded border border-[#3F3F46]"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <pre className="p-3.5 text-xs font-mono text-zinc-200 overflow-x-auto no-scrollbar leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function renderFormattedText(text: string) {
  const parts: (string | React.ReactNode)[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    const matchText = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    if (matchText.startsWith("**") && matchText.endsWith("**")) {
      const boldContent = matchText.slice(2, -2);
      parts.push(
        <strong key={matchIndex} className="font-semibold text-white">
          {boldContent}
        </strong>
      );
    } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
      const codeContent = matchText.slice(1, -1);
      parts.push(
        <code
          key={matchIndex}
          className="bg-[#27272A] text-zinc-200 px-1.5 py-0.5 rounded text-xs font-mono border border-[#3F3F46]"
        >
          {codeContent}
        </code>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
