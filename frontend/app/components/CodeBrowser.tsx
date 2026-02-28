"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { getAllFiles, getFileContent } from "../utils/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Theme constants (screenshot-matched) ─────────────────────────────────────

const BG       = "#0A0A0A";
const BORDER   = "#1a1a1a";
const TEXT     = "#cccccc";
const TEXT_DIM = "#555555";
const HOVER_BG = "#111111";
const ACTIVE_BG= "#141414";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const IGNORE = new Set(["node_modules", ".next", ".npm", ".config", "public"]);

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

// ─── Icons (minimal outlines matching screenshot) ─────────────────────────────

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path
        d={open
          ? "M1.5 5h4.5l1.5 1.5H14.5V13H1.5V5z"
          : "M1.5 4.5h4l1.5 1.5H14.5V13H1.5V4.5z"
        }
        stroke="#666" strokeWidth="1" fill="none"
      />
      {open && <path d="M1.5 7h13" stroke="#555" strokeWidth="0.75" />}
    </svg>
  );
}

function FileIconSimple() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 1.5h6L13 5V14.5H4V1.5z" stroke="#555" strokeWidth="1" fill="none" />
      <path d="M10 1.5V5H13" stroke="#555" strokeWidth="1" fill="none" />
    </svg>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="9" height="9" viewBox="0 0 10 10" fill="none"
      style={{ flexShrink: 0, transition: "transform 0.12s", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
    >
      <path d="M3 2l4 3-4 3" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── File Tree Node ───────────────────────────────────────────────────────────

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
        {isDir ? (
          <>
            <Chevron open={isExpanded} />
            <FolderIcon open={isExpanded} />
          </>
        ) : (
          <>
            <div style={{ width: "9px" }} />
            <FileIconSimple />
          </>
        )}

        <span style={{
          fontSize: "13px",
          color: isActive ? "#d4d4d4" : TEXT,
          fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {node.name}
        </span>
      </div>

      {isDir && isExpanded && (
        <div>
          {[...node.children]
            .sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1)
            .map(child => (
              <FileTreeNode
                key={child.path} node={child} depth={depth + 1}
                activeTab={activeTab} expanded={expanded}
                onFileClick={onFileClick} onToggleDir={onToggleDir}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CodeBrowser({ projectId }: CodeBrowserProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [treeLoading, setTreeLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(220);
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
    if (tabs.find(t => t.path === path)) { setActiveTab(path); return; }
    setFileLoading(true);
    try {
      const data = await getFileContent(projectId, path);
      setTabs(prev => [...prev, { path, content: data.content ?? "" }]);
      setActiveTab(path);
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

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", backgroundColor: BG, fontFamily: "ui-monospace, 'Cascadia Code', Consolas, monospace" }}>
      
      {/* Sidebar */}
      <div style={{ width: sidebarWidth, flexShrink: 0, display: "flex", flexDirection: "column", backgroundColor: BG, borderRight: `1px solid ${BORDER}`, overflow: "hidden" }}>

        <div style={{ padding: "9px 12px 7px", fontSize: "11px", color: TEXT_DIM, textTransform: "uppercase", letterSpacing: "0.1em", borderBottom: `1px solid ${BORDER}` }}>
          Explorer
        </div>

        <div style={{ flex: 1, overflowY: "auto", paddingTop: "3px", scrollbarWidth: "thin", scrollbarColor: "#1a1a1a transparent" }}>
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
                <FileTreeNode
                  key={node.path} node={node} depth={0}
                  activeTab={activeTab} expanded={expanded}
                  onFileClick={handleFileClick} onToggleDir={toggleDir}
                />
              ))
          )}
        </div>
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={() => { dragging.current = true; }}
        style={{ width: "1px", flexShrink: 0, cursor: "col-resize", backgroundColor: BORDER }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "#333"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = BORDER; }}
      />

      {/* Editor pane */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "flex-end", height: "36px", borderBottom: `1px solid ${BORDER}`, backgroundColor: BG, overflowX: "auto", flexShrink: 0, scrollbarWidth: "none" }}>
          {tabs.length === 0 ? (
            <span style={{ padding: "0 12px", fontSize: "12px", color: TEXT_DIM, lineHeight: "36px" }}>No files open</span>
          ) : tabs.map(tab => {
            const isActive = activeTab === tab.path;
            const name = tab.path.split("/").pop() ?? "";
            return (
              <div
                key={tab.path}
                onClick={() => setActiveTab(tab.path)}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "0 12px", height: "100%", cursor: "pointer", flexShrink: 0,
                  borderRight: `1px solid ${BORDER}`,
                  backgroundColor: isActive ? ACTIVE_BG : "transparent",
                  borderTop: `1px solid ${isActive ? "#333" : "transparent"}`,
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = HOVER_BG; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
              >
                <FileIconSimple />
                <span style={{ fontSize: "12px", color: isActive ? "#d4d4d4" : "#666", whiteSpace: "nowrap" }}>{name}</span>
                <span
                  onClick={e => closeTab(e, tab.path)}
                  style={{ fontSize: "12px", color: "#333", marginLeft: "2px", lineHeight: 1, cursor: "pointer" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#999"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#333"; }}
                >×</span>
              </div>
            );
          })}
        </div>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 12px", height: "22px", borderBottom: `1px solid ${BORDER}`, backgroundColor: BG, flexShrink: 0 }}>
            {breadcrumb.map((part, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                {i > 0 && <span style={{ color: TEXT_DIM, fontSize: "10px" }}>›</span>}
                <span style={{ fontSize: "11px", color: i === breadcrumb.length - 1 ? "#888" : TEXT_DIM }}>{part}</span>
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
              options={{
                readOnly: true,
                minimap: { enabled: true },
                fontSize: 13,
                lineHeight: 21,
                fontFamily: "ui-monospace, 'Cascadia Code', 'Fira Code', Consolas, monospace",
                fontLigatures: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 12 },
                renderLineHighlight: "line",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
              }}
              beforeMount={monaco => {
                monaco.editor.defineTheme("screenshot-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [
                    { token: "comment",             foreground: "6A9955", fontStyle: "italic" },
                    { token: "keyword",              foreground: "C586C0" },
                    { token: "keyword.control",      foreground: "C586C0" },
                    { token: "keyword.operator",     foreground: "D4D4D4" },
                    { token: "storage.type",         foreground: "569CD6" },
                    { token: "storage.modifier",     foreground: "569CD6" },
                    { token: "string",               foreground: "CE9178" },
                    { token: "string.escape",        foreground: "D7BA7D" },
                    { token: "number",               foreground: "B5CEA8" },
                    { token: "constant.language",    foreground: "569CD6" },
                    { token: "type",                 foreground: "4EC9B0" },
                    { token: "entity.name.type",     foreground: "4EC9B0" },
                    { token: "entity.name.class",    foreground: "4EC9B0" },
                    { token: "entity.name.function", foreground: "DCDCAA" },
                    { token: "support.function",     foreground: "DCDCAA" },
                    { token: "variable",             foreground: "9CDCFE" },
                    { token: "variable.parameter",   foreground: "9CDCFE" },
                    { token: "attribute.name",       foreground: "9CDCFE" },
                    { token: "attribute.value",      foreground: "CE9178" },
                    { token: "punctuation",          foreground: "D4D4D4" },
                    { token: "delimiter",            foreground: "D4D4D4" },
                    { token: "operator",             foreground: "D4D4D4" },
                    { token: "identifier",           foreground: "D4D4D4" },
                    { token: "regexp",               foreground: "D16969" },
                    { token: "decorator",            foreground: "DCDCAA" },
                  ],
                  colors: {
                    "editor.background":                   "#0A0A0A",
                    "editor.foreground":                   "#D4D4D4",
                    "editor.lineHighlightBackground":      "#111111",
                    "editor.selectionBackground":          "#264F78",
                    "editor.inactiveSelectionBackground":  "#1a1a1a",
                    "editorLineNumber.foreground":         "#333333",
                    "editorLineNumber.activeForeground":   "#666666",
                    "editorCursor.foreground":             "#AEAFAD",
                    "editorWhitespace.foreground":         "#1a1a1a",
                    "editorIndentGuide.background1":       "#1a1a1a",
                    "editorIndentGuide.activeBackground1": "#2a2a2a",
                    "editorBracketMatch.background":       "#0a0a0a",
                    "editorBracketMatch.border":           "#444",
                    "scrollbarSlider.background":          "#1a1a1a",
                    "scrollbarSlider.hoverBackground":     "#252525",
                    "minimap.background":                  "#0A0A0A",
                    "editorGutter.background":             "#0A0A0A",
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

        {/* Status bar — minimal */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", height: "20px", borderTop: `1px solid ${BORDER}`, backgroundColor: BG, flexShrink: 0 }}>
          <span style={{ fontSize: "10px", color: TEXT_DIM }}>
            {activeFile?.path.replace("/home/user/", "") ?? ""}
          </span>
          {activeFile && (
            <span style={{ fontSize: "10px", color: TEXT_DIM }}>
              {getLanguage(activeFile.path)}
            </span>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


































































// import {
//   ResizableHandle,
//   ResizablePanel,
//   ResizablePanelGroup,
// } from "@/components/ui/resizable"
// import { useState } from "react";

// export default function CodeBrowser() {

//   const [expanded, setExpanded] = useState<Set<string>>(new Set(["/home/user/pages"]))

//   const toggleFolder = (path: string) => {
//     setExpanded(prev => {
//       const next = new Set(prev)
//       next.has(path) ? next.delete(path) : next.add(path)
//       return next
//     })
//   }

//   return (
//     <ResizablePanelGroup
//       orientation="horizontal"
//       className="h-screen bg-[#0A0A0A] text-[#ffffff] font-mono"
//     >
//       {/* Left Side */}
//       <ResizablePanel
//         defaultSize="20%"  
//         minSize="20%"     
//         maxSize="40%"      
//         className="border-r border-[#2a2a2a]"
//       >
//         <div className="px-3 py-2 border-b border-[#2a2a2a] ]">
//           <span className="text-[10px] uppercase tracking-widest">Files</span>
//         </div>

//         <div className="overflow-y-auto pt-1">
//           {FAKE_TREE.map(node => (
//             <TreeNode key={node.path} node={node} depth={0} expanded={expanded} onToggle={toggleFolder} />
//           ))}
//         </div>
//       </ResizablePanel>

//       <ResizableHandle className="bg-neutral-900 hover:bg-neutral-600 transition-colors w-px" />

//       <ResizablePanel defaultSize={80} className="flex flex-col">

//         <div className="h-9 border-b border-[#2a2a2a] flex items-center px-4">
//           <p className="text-xs ">tabs go here</p>
//         </div>

//         <div className="flex flex-1 items-center justify-center">
//           <p className="text-xs ">editor goes here</p>
//         </div>

//       </ResizablePanel>

//     </ResizablePanelGroup>
//   )
// }\

