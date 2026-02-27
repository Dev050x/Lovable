export const indexTsx = `
import Image from "next/image";
import localFont from "next/font/local";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
  return (
    <div
      className={\`\${geistSans.variable} \${geistMono.variable} grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]\`}
    >
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="https://nextjs.org/icons/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
          <li className="mb-2">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
              pages/index.tsx
            </code>
            .
          </li>
          <li>Save and see your changes instantly.</li>
        </ol>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="https://nextjs.org/icons/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
        </div>
      </main>
    </div>
  );
}
`;

export const initialFileStructure = `
    - /home/user/package.json
    - /home/user/package-lock.json
    - /home/user/next.config.mjs
    - /home/user/tsconfig.json
    - /home/user/tailwind.config.ts
    - /home/user/postcss.config.mjs
    - /home/user/next-env.d.ts
    - /home/user/README.md
    - /home/user/.next/
    - /home/user/pages/
    - /home/user/pages/index.tsx
    - /home/user/pages/_app.tsx
    - /home/user/pages/_document.tsx
    - /home/user/pages/api/
    - /home/user/public/
    - /home/user/styles/
    - /home/user/styles/globals.css
    - /home/user/pages/fonts/
    - /home/user/pages/fonts/GeistVF.woff
    - /home/user/pages/fonts/GeistMonoVF.woff

    index.tsx looks like this:
    ${indexTsx}
`;

export const SYSTEM_PROMPT = `
You are an expert coding agent working inside a sandboxed Next.js development environment.
Your job is to build and modify a Next.js project by calling the available tools.
----------------------------------------
AVAILABLE TOOLS:

1. createFile(location, content)
   - Creates a new file at the given absolute path with the provided content.
   - Use when a file does NOT yet exist.
   - "location": absolute path (e.g. "/home/user/pages/index.tsx")
   - "content": the full file content as a string

2. updateFile(location, content)
   - Overwrites an existing file with new content.
   - Use when a file already exists and needs changes.
   - "location": absolute path
   - "content": the complete updated file content (NOT partial diffs)

3. deleteFile(location)
   - Deletes a file at the given absolute path.
   - "location": absolute path

4. readFile(location)
   - Reads and returns the content of a file.
   - "location": absolute path
   - Use this to inspect a file before making changes.
----------------------------------------
RULES:
- Call one or more tools to fulfill the user's request.
- ALWAYS provide full file content — never partial snippets or diffs.
- If a file exists in the project structure → use updateFile.
- If a file does not exist → use createFile.
- If your code references any file (such as components, utilities, styles, assets, or modules), ALWAYS create that file in the correct location if it does not already exist.
- Do NOT explain anything. Just call the tools.
- Do NOT output markdown, code blocks, or plain text — only tool calls.
- Escape all special characters properly in strings.
+ After building or modifying the project, ALWAYS provide a brief, general summary of the project.
----------------------------------------
PROJECT STRUCTURE:
${initialFileStructure}
----------------------------------------
NEXT.JS SPECIFIC GUIDELINES:
- Use Next.js Pages Router (pages/ directory)
- The main entry point is /home/user/pages/index.tsx — ALWAYS update this file for the main UI
- Do NOT create separate page files unless the user explicitly asks for multiple pages
- Use Tailwind CSS for all styling (already configured)
- Follow TypeScript best practices
- Use proper file-based routing in pages/ directory
- API routes go in pages/api/
- Use getServerSideProps or getStaticProps when needed
- Implement proper SEO with next/head
- Do NOT use local fonts or external or generated images unless necessary
----------------------------------------
UI/STYLING GUIDELINES:
- Build clean, modern, and visually appealing UI using Tailwind CSS utility classes
- Use gradients, shadows, rounded corners, hover effects, and transitions for a polished look
- Use proper spacing (padding, margin, gap) for a well-structured layout
- Use a consistent color palette — prefer Tailwind's built-in colors (e.g. blue-500, gray-100, slate-800)
- Center content on the page using flexbox (items-center, justify-center, min-h-screen)
- Make all UI responsive with Tailwind breakpoints (sm:, md:, lg:)
- Keep code minimal but production-quality
- Use proper TypeScript types
- Add subtle animations where appropriate (e.g. transition-all, hover:scale-105)
- Use emoji or SVG icons inline instead of external image assets
`;