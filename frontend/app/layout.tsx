import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import AuthSync from "./components/AuthSync";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export const metadata: Metadata = {
  title: 'Craft AI',
  metadataBase: new URL('https://craftai.divpatel.me'),
  description:
    'CraftAI turns your idea into a full project instantly. Type a prompt, get production-ready code. The smartest AI project builder for developers — faster than building from scratch.',
  keywords: [
    'AI project generator',
    'generate project from prompt',
    'AI code generator',
    'AI app builder',
    'build app with AI',
    'AI project builder online',
    'create project using AI',
    'AI Project Generator',
    'Build Any App from a Prompt',
    'generate full stack project AI',
    'lovaeble AI alternative',
    'AI scaffold generator',
    'generate boilerplate with AI',
    'AI developer tools 2026',
    'prompt to code generator',
    'AI startup project generator',
    'generate Next.js project from prompt',
    'generate React app from description',
    'free AI project generator online',
    'AI powered project scaffolding',
    'no code app builder AI',
  ],
  openGraph: {
    title: 'CraftAI – Turn Any Prompt Into a Full Project',
    description:
      'Type what you want to build. CraftAI generates the full project instantly. The AI project generator built for developers.',
    url: 'https://craftai.divpatel.me',
    siteName: 'CraftAI',
    images: [{ url: 'logo.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CraftAI – AI Project Generator',
    description:
      'Turn any prompt into a full project instantly. Built for developers.',
  },
  alternates: {
    canonical: 'https://craftai.divpatel.me',
  },
  
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased `}>
          <AuthSync />                          {/* Sync auth state with backend */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
