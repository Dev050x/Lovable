"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { getAllFiles, getFileContent } from "../utils/actions";

interface FileNode {
  name: string;
  path: string;
  type: "file" | "dir";
  children: FileNode[];
}

interface Tab {
  path: string;
  content: string;
}

interface CodeBrowserProps {
  projectId: string;
}

const BG = "#0A0A0A";
const BORDER = "#2E2E2E";
const TEXT = "#cccccc";
const TEXT_DIM = "#999999";
const HOVER_BG = "#111111";
const ACTIVE_BG = "#141414";

const IGNORE = new Set(["node_modules", ".next", ".npm", ".config", "public", "fonts", "api"]);

function buildTree(files: { path: string; type: string }[]): FileNode[] {
  const root: FileNode[] = [];
  for (const file of files) {
    const parts = file.path.replace("/home/user/", "").split("/");
    let current = root;
    parts.forEach((part, i) => {
      let node = current.find((n) => n.name === part);
      if (!node) {
        node = { name: part, path: file.path, type: i === parts.length - 1 ? (file.type as "file" | "dir") : "dir", children: [] };
        current.push(node);
      }
      current = node.children;
    });
  }
  return root;
}

function getLanguage(filename: string): string {
  const ext = filename.split(".").pop() ?? "";
  const map: Record<string, string> = {
    ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript",
    css: "css", scss: "scss", json: "json", md: "markdown",
    mjs: "javascript", yaml: "yaml", yml: "yaml", html: "html",
  };
  return map[ext] ?? "plaintext";
}

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-folder-closed-icon lucide-folder-closed"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /><path d="M2 10h20" /></svg>
  );
}

function FileIconSimple() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-icon lucide-file"><path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"/><path d="M14 2v5a1 1 0 0 0 1 1h5"/></svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none"
      style={{ flexShrink: 0, transition: "transform 0.12s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>
      <path d="M3 2l4 3-4 3" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FileTreeNode({ node, depth, activeTab, expanded, onFileClick, onToggleDir }: {
  node: FileNode; depth: number; activeTab: string | null;
  expanded: Set<string>; onFileClick: (p: string) => void; onToggleDir: (p: string) => void;
}) {
  const isActive = activeTab === node.path;
  const isExpanded = expanded.has(node.path);
  const isDir = node.type === "dir";
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      <div
        onClick={() => isDir ? onToggleDir(node.path) : onFileClick(node.path)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          paddingLeft: `${depth * 14 + 8}px`,
          paddingRight: "8px", paddingTop: "3px", paddingBottom: "3px",
          cursor: "pointer", userSelect: "none",
          backgroundColor: isActive ? ACTIVE_BG : hovered ? HOVER_BG : "transparent",
        }}
      >
        {isDir ? (<><Chevron open={isExpanded} /><FolderIcon open={isExpanded} /></>) : (<><div style={{ width: "9px" }} /><FileIconSimple /></>)}
        <span style={{ fontSize: "13px", color: isActive ? "#d4d4d4" : TEXT, fontFamily: "sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
      </div>
      {isDir && isExpanded && (
        <div>
          {[...node.children]
            .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1)
            .map(child => (
              <FileTreeNode key={child.path} node={child} depth={depth + 1}
                activeTab={activeTab} expanded={expanded}
                onFileClick={onFileClick} onToggleDir={onToggleDir} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function CodeBrowser({ projectId }: CodeBrowserProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [treeLoading, setTreeLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [mobileView, setMobileView] = useState<"tree" | "editor">("tree"); // ← mobile state
  const dragging = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        setTreeLoading(true);
        const data = await getAllFiles(projectId);
        const files: { path: string; type: string }[] = data.files ?? [];
        const filtered = files.filter(f =>
          !f.path.replace("/home/user/", "").split("/").some(p => IGNORE.has(p))
        );
        const built = buildTree(filtered);
        setTree(built);
        built.filter(n => n.type === "dir").forEach(n =>
          setExpanded(prev => new Set([...prev, n.path]))
        );
      } catch {
        setError("Failed to load files");
      } finally {
        setTreeLoading(false);
      }
    };
    if (projectId) load();
  }, [projectId]);

  const handleFileClick = async (path: string) => {
    if (tabs.find(t => t.path === path)) {
      setActiveTab(path);
      setMobileView("editor"); // ← switch to editor on mobile
      return;
    }
    setFileLoading(true);
    try {
      const data = await getFileContent(projectId, path);
      setTabs(prev => [...prev, { path, content: data.content ?? "" }]);
      setActiveTab(path);
      setMobileView("editor"); // ← switch to editor on mobile
    } catch {
      setError("Failed to read file");
    } finally {
      setFileLoading(false);
    }
  };

  const closeTab = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    const next = tabs.filter(t => t.path !== path);
    setTabs(next);
    if (activeTab === path) {
      const idx = tabs.findIndex(t => t.path === path);
      setActiveTab(next[idx]?.path ?? next[idx - 1]?.path ?? null);
      if (next.length === 0) setMobileView("tree"); // ← back to tree if no tabs
    }
  };

  const toggleDir = (path: string) =>
    setExpanded(prev => { const s = new Set(prev); s.has(path) ? s.delete(path) : s.add(path); return s; });

  useEffect(() => {
    const move = (e: MouseEvent) => { if (dragging.current) setSidebarWidth(Math.max(150, Math.min(400, e.clientX))); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, []);

  const activeFile = tabs.find(t => t.path === activeTab);
  const breadcrumb = activeTab?.replace("/home/user/", "").split("/") ?? [];

  const Sidebar = (
    <div style={{ display: "flex", flexDirection: "column", backgroundColor: BG, borderRight: `1px solid ${BORDER}`, overflow: "hidden", height: "100%" }}>
      <div style={{ padding: "9px 12px 7px", fontSize: "11px", color: TEXT, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${BORDER}`, height: "36px" }}>
        Explorer
      </div>
      <div style={{ flex: 1, overflowY: "auto", paddingTop: "3px", scrollbarWidth: "thin", scrollbarColor: "2B3238 transparent" }}>
        {treeLoading ? (
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: "7px" }}>
            {[...Array(10)].map((_, i) => (
              <div key={i} style={{ height: "12px", borderRadius: "2px", backgroundColor: "#111", width: `${35 + (i * 17) % 48}%`, marginLeft: i % 3 !== 0 ? "14px" : 0 }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: "12px", fontSize: "12px", color: "#555" }}>{error}</div>
        ) : (
          [...tree]
            .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1)
            .map(node => (
              <FileTreeNode key={node.path} node={node} depth={0}
                activeTab={activeTab} expanded={expanded}
                onFileClick={handleFileClick} onToggleDir={toggleDir} />
            ))
        )}
      </div>
    </div>
  );

  const EditorPane = (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* mobile back button */}
      <div className="flex items-center gap-2 md:hidden px-3 py-2" style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: BG }}>
        <button
          onClick={() => setMobileView("tree")}
          className="text-xs px-2 py-1 rounded border text-[#cccccc] border-[#2B3238] hover:bg-[#111111]"
        >
          ← Files
        </button>
        <span className="text-xs truncate" style={{ color: TEXT_DIM }}>
          {activeTab?.replace("/home/user/", "") ?? ""}
        </span>
      </div>

      {/* Tabs — desktop only */}
      <div className="hidden md:flex" style={{ alignItems: "flex-end", height: "36px", borderBottom: `1px solid ${BORDER}`, backgroundColor: BG, overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}>
        {tabs.length === 0 ? (
          <span style={{ padding: "0 12px", fontSize: "12px", color: TEXT, lineHeight: "36px" }}>No files open</span>
        ) : tabs.map(tab => {
          const isActive = activeTab === tab.path;
          const name = tab.path.split("/").pop() ?? "";
          return (
            <div key={tab.path} onClick={() => setActiveTab(tab.path)}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 12px", height: "100%", cursor: "pointer", flexShrink: 0, borderRight: `1px solid ${BORDER}`, backgroundColor: isActive ? ACTIVE_BG : "transparent", borderTop: `1px solid ${isActive ? "#333" : "transparent"}` }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = HOVER_BG; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
            >
              <FileIconSimple />
              <span style={{ fontSize: "12px", color: isActive ? "#cccccc" : "#999999", whiteSpace: "nowrap" }}>{name}</span>
              <span onClick={e => closeTab(e, tab.path)}
                style={{ fontSize: "12px", color: "#dbd7d7", marginLeft: "2px", lineHeight: 1, cursor: "pointer" }}
              >×</span>
            </div>
          );
        })}
      </div>

      {/* Breadcrumb — desktop only */}
      {breadcrumb.length > 0 && (
        <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px", padding: "0 12px", height: "22px", borderBottom: `1px solid ${BORDER}`, backgroundColor: BG, flexShrink: 0 }}>
          {breadcrumb.map((part, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              {i > 0 && <span style={{ color: TEXT_DIM, fontSize: "10px" }}>›</span>}
              <span style={{ fontSize: "11px", color: i === breadcrumb.length - 1 ? "#cccccc" : "#999999" }}>{part}</span>
            </span>
          ))}
        </div>
      )}

      {/* Monaco */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {fileLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: BG, zIndex: 10 }}>
            <div style={{ width: "15px", height: "15px", border: "1.5px solid #222", borderTopColor: "#555", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
        {activeFile ? (
          <Editor
            height="100%"
            path={activeFile.path}
            language={getLanguage(activeFile.path)}
            value={activeFile.content}  
            options={{ readOnly: true, minimap: { enabled: true }, fontSize: 13, lineHeight: 21, fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace", fontLigatures: true, scrollBeyondLastLine: false, wordWrap: "on", padding: { top: 12 }, renderLineHighlight: "line", smoothScrolling: true, bracketPairColorization: { enabled: true } }}
            beforeMount={monaco => {
              monaco.editor.defineTheme("screenshot-dark", {
                base: "vs-dark", inherit: true,
                rules: [
                  { token: "comment", foreground: "6A9955", fontStyle: "italic" },
                  { token: "keyword", foreground: "C586C0" },
                  { token: "keyword.control", foreground: "C586C0" },
                  { token: "keyword.operator", foreground: "D4D4D4" },
                  { token: "storage.type", foreground: "569CD6" },
                  { token: "storage.modifier", foreground: "569CD6" },
                  { token: "string", foreground: "CE9178" },
                  { token: "string.escape", foreground: "D7BA7D" },
                  { token: "number", foreground: "2B3238" },
                  { token: "constant.language", foreground: "569CD6" },
                  { token: "type", foreground: "4EC9B0" },
                  { token: "entity.name.type", foreground: "4EC9B0" },
                  { token: "entity.name.class", foreground: "4EC9B0" },
                  { token: "entity.name.function", foreground: "DCDCAA" },
                  { token: "support.function", foreground: "DCDCAA" },
                  { token: "variable", foreground: "9CDCFE" },
                  { token: "variable.parameter", foreground: "9CDCFE" },
                  { token: "attribute.name", foreground: "9CDCFE" },
                  { token: "attribute.value", foreground: "CE9178" },
                  { token: "punctuation", foreground: "D4D4D4" },
                  { token: "delimiter", foreground: "D4D4D4" },
                  { token: "operator", foreground: "D4D4D4" },
                  { token: "identifier", foreground: "D4D4D4" },
                  { token: "regexp", foreground: "D16969" },
                  { token: "decorator", foreground: "DCDCAA" },
                ],
                colors: {
                  "editor.background": "#0A0A0A", "editor.foreground": "#D4D4D4",
                  "editor.lineHighlightBackground": "#2B3238", "editor.selectionBackground": "#264F78",
                  "editor.inactiveSelectionBackground": "#2B3238", "editorLineNumber.foreground": "#2B3238",
                  "editorLineNumber.activeForeground": "#2B3238", "editorCursor.foreground": "#AEAFAD",
                  "editorWhitespace.foreground": "#2B3238", "editorIndentGuide.background1": "#2B3238",
                  "editorIndentGuide.activeBackground1": "#2a2a2a", "editorBracketMatch.background": "#0a0a0a",
                  "editorBracketMatch.border": "#444", "scrollbarSlider.background": "#2B3238",
                  "scrollbarSlider.hoverBackground": "#252525", "minimap.background": "#0A0A0A",
                  "editorGutter.background": "#0A0A0A",
                },
              });
            }}
            onMount={(_, monaco) => monaco.editor.setTheme("screenshot-dark")}
          />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", backgroundColor: BG }}>
            <span style={{ fontSize: "12px", color: "#222" }}>Open a file</span>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: "20px", borderTop: `1px solid ${BORDER}`, backgroundColor: BG, flexShrink: 0 }}>
        <span style={{ fontSize: "10px", color: TEXT }}>{activeFile?.path.replace("/home/user/", "") ?? ""}</span>
        {activeFile && <span style={{ fontSize: "10px", color: TEXT }}>{getLanguage(activeFile.path)}</span>}
      </div>
    </div>
  );

  return (
    <>
      {/* MOBILE */}
      <div className="flex flex-col h-full md:hidden" style={{ backgroundColor: BG }}>
        {mobileView === "tree" ? (
          <div className="flex-1 min-h-0">{Sidebar}</div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">{EditorPane}</div>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:flex h-full" style={{ overflow: "hidden", backgroundColor: BG, fontFamily: "sans-serif" }}>
        <div style={{ width: sidebarWidth, flexShrink: 0 }}>{Sidebar}</div>
        <div onMouseDown={() => { dragging.current = true; }}
          style={{ flexShrink: 0, cursor: "col-resize", backgroundColor: BORDER }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#333"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = BORDER; }}
        />
        {EditorPane}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}