# Lovable AI - Full-Stack AI Web Application Builder

Lovable AI is an AI-powered web application generator and iterative development platform. It enables users to describe web applications using natural language, automatically provisions isolated cloud sandbox environments, streams live project creation, provides an embedded code editor, and supports interactive human-in-the-loop requirement gathering.

---

## Key Features

- Natural Language Application Generation: Transform text prompts into functional Next.js applications using advanced LLM reasoning.
- Isolated Cloud Sandboxes: Dynamically provision and connect to E2B containerized environments for secure file execution and live HTTP previews.
- Interactive Requirement Gathering: Built-in human-in-the-loop tool (`askUser`) allowing the AI agent to ask structured clarifying questions (single-choice, multiple-choice, or freeform text) before and during construction.
- Real-Time Server-Sent Events (SSE): Live streaming of agent status, preview URLs, interactive prompts, and completion events.
- Integrated Monaco Code Browser: Interactive file explorer and full syntax-highlighted code viewer with breadcrumbs, file tabs, and custom dark mode themes.
- Live App Preview: Embedded responsive iFrame preview pointing directly to the sandbox development server port.
- User Management & Persistence: Full authentication integration with Clerk and persistent relational database storage via Prisma and PostgreSQL.

---

## System Architecture

```
+-----------------------------------------------------------------------+
|                           NEXT.JS FRONTEND                            |
|  +-------------------+   +--------------------+   +----------------+  |
|  |  Prompt Input UI  |   | Monaco Code Editor |   | Live App Preview| |
|  +-------------------+   +--------------------+   +----------------+  |
|            |                      ^                        ^          |
|            | User Prompt          | Fetch Code Files       | Live URL |
|            v                      |                        |          |
+------------|----------------------|------------------------|----------+
             | REST / SSE           | REST API               | iFrame
             v                      |                        |
+-----------------------------------|------------------------|----------+
|                            EXPRESS SERVER                             |
|  +-------------------+   +--------------------+                    |
|  |  Clerk Auth Gate  |   | AI Orchestrator    |                    |
|  +-------------------+   +--------------------+                    |
|                                   |                                   |
|       +---------------------------+------------------------+          |
|       |                           |                        |          |
|       v                           v                        v          |
| +-----------+             +---------------+         +--------------+  |
| | Prisma DB |             | LLMs          |         | E2B Sandbox  |  |
| | Postgres  |             | (Groq/Google) |         | Containers   |  |
| +-----------+             +---------------+         +--------------+  |
+-----------------------------------------------------------------------+
```

---

## Tech Stack

### Frontend (`/frontend`)
- Framework: Next.js 16 (App Router), React 19, TypeScript
- Styling: Tailwind CSS v4, Radix UI primitives, Lucide React
- Code Editor: `@monaco-editor/react` (Monaco Editor integration)
- Authentication: `@clerk/nextjs`
- Layout & UI: `react-resizable-panels`, custom SSE client for live streaming
- Package Manager: `npm`

### Backend (`/server`)
- Framework: Express.js (ES Modules, TypeScript)
- Database ORM: Prisma ORM with PostgreSQL (`@prisma/adapter-pg`)
- Authentication: `@clerk/express` middleware
- Cloud Sandbox Engine: `@e2b/code-interpreter` (E2B Sandboxes)
- AI SDK & LLMs: Vercel AI SDK (`ai`), `@ai-sdk/groq` (`openai/gpt-oss-120b`), `@ai-sdk/google` (`gemini-3.5-flash`)
- Validation: Zod schemas (`zod`)

---

## Database Model

The database schema (`server/prisma/schema.prisma`) defines three primary entities:

1. User: Stores authenticated user accounts synced from Clerk.
   - `id`: CUID primary key
   - `clerkId`: Unique Clerk user identification
   - `username`: Account identifier
   - `projects`: Relation to created projects

2. Project: Represents an individual generated web application.
   - `id`: UUID primary key
   - `title`: AI-generated short project title
   - `SandboxId`: Unique E2B sandbox container ID
   - `Files`: JSON representation of current file structure
   - `status`: Enum (`PENDING`, `READY`, `FAILED`, `UPDATING`)
   - `userId`: Foreign key linking to User

3. ConversationHistory: Stores all messages, agent actions, and Q&A responses.
   - `id`: UUID primary key
   - `content`: Message text or JSON payload
   - `projectId`: Foreign key linking to Project
   - `from`: Enum (`USER`, `ASSISTANT`)
   - `type`: Enum (`TOOL_CALL`, `TEXT_MESSAGE`)

---

## Environment Configuration

### Server Environment Variables (`server/.env`)

Create a `.env` file inside the `server/` directory with the following variables:

```env
# AI Model Provider Credentials
GROQ_API_KEY=your_groq_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# E2B Sandbox Credentials
E2B_API_KEY=your_e2b_api_key

# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database_name?sslmode=verify-full

# Clerk Authentication Credentials
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

### Frontend Environment Variables (`frontend/.env.local`)

Create a `.env.local` file inside the `frontend/` directory with the following variables:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_BASE_URL=http://localhost:8080
```

---

## Getting Started

### Prerequisites
- Node.js version 18.x or higher
- npm package manager
- PostgreSQL database instance (or Neon DB connection)
- Clerk account for authentication
- E2B API Key for sandbox management
- Groq / Google AI API Keys for model inference

### 1. Backend Setup

Navigate to the `server/` directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Generate Prisma client and run database migrations:

```bash
npx prisma generate
npx prisma db push
```

Start the backend development server:

```bash
npm run dev
```

The Express server will run on `http://localhost:8080`.

### 2. Frontend Setup

In a separate terminal window, navigate to the `frontend/` directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your web browser.

---

## API Reference

### Authentication Endpoints
- `POST /api/auth/sync`: Sync user profile from Clerk token to local PostgreSQL database.

### Project & AI Task Endpoints
- `POST /api/project/create`: Initialize project entry in database and request E2B sandbox allocation.
- `POST /api/project/generate`: Stream project generation via Server-Sent Events (SSE).
- `POST /api/project/update`: Submit follow-up prompt to modify existing sandbox project.
- `GET /api/project/`: Retrieve live preview web URL for the project's sandbox port.
- `GET /api/project/chats`: Retrieve message history and status for a specific project.
- `GET /api/project/files`: List file directory tree from the project's sandbox.
- `GET /api/project/file`: Fetch contents of a specific file from the sandbox.
- `POST /api/project/answer`: Submit user's answer to an agent clarification question (`askUser`).

---

## Agent Tool System

The backend AI agent uses custom tools defined in `server/src/tool.ts` to inspect and modify the Next.js app running inside E2B sandboxes:

1. `createFile`: Writes new files to absolute paths inside the sandbox container.
2. `updateFile`: Overwrites contents of existing files inside the sandbox.
3. `deleteFile`: Removes target files from the container filesystem.
4. `readFile`: Reads and returns content of sandbox files for agent verification.
5. `listAllFiles`: Recursively fetches active file structure from sandbox.
6. `askUser`: Pauses agent execution, emits an SSE question event to the frontend UI, displays interactive choices or text fields to the user, and waits for submission before continuing.

---

## Project Layout

```
Lovable/
├── frontend/                  # Next.js Frontend Application
│   ├── app/                   # App router pages and layouts
│   │   ├── components/        # ChatPanel, CodeBrowser, PreviewToolbar, InputField, etc.
│   │   ├── hooks/             # Custom hooks (useProject)
│   │   ├── projects/[id]/     # Project workstation page
│   │   └── utils/             # API client & SSE stream handlers
│   ├── components/ui/         # Shared UI components (shadcn / Radix UI)
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── tsconfig.json          # TypeScript config
│
├── server/                    # Express.js Backend Application
│   ├── prisma/                # Database schema & migrations
│   ├── src/                   # Server source code
│   │   ├── e2b/               # E2B sandbox templates
│   │   ├── handler/           # Express request handlers (AI tasks, Auth)
│   │   ├── middleware/        # Clerk authentication middleware
│   │   ├── routes/            # Express route definitions
│   │   ├── schema/            # Zod validation schemas
│   │   ├── index.ts           # Server entry point
│   │   ├── system_prompt.ts   # AI agent system prompt & guidelines
│   │   └── tool.ts            # E2B sandbox AI tools
│   ├── package.json           # Server dependencies
│   └── tsconfig.json          # TypeScript config
│
└── README.md                  # Project Documentation
```
