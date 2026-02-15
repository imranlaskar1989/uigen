# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI to generate React components dynamically based on user descriptions, displays them in a live preview using a virtual file system, and allows users to iterate on designs through chat.

## Coding Style

- Use comments sparingly. Only comment complex code that isn't self-explanatory.

## Development Commands

### Setup
```bash
npm run setup
```
Installs dependencies, generates Prisma client, and runs database migrations.

### Development Server
```bash
npm run dev              # Start dev server (foreground)
npm run dev:daemon       # Start dev server in background (logs to logs.txt)
```
Starts Next.js development server with Turbopack on http://localhost:3000. Requires `NODE_OPTIONS='--require ./node-compat.cjs'` for compatibility.

### Testing
```bash
npm test
```
Runs Vitest test suite with jsdom environment.

### Database
```bash
npm run db:reset
```
Resets the SQLite database (force resets migrations).

### Build & Production
```bash
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Core Concept: Virtual File System

The app operates on a **VirtualFileSystem** (`src/lib/file-system.ts`) that exists only in memory—no files are written to disk during component generation. This is the heart of the application:

- Files are stored in a `Map<string, FileNode>` structure
- Supports full CRUD operations: create, read, update, delete, rename
- Handles path normalization and parent directory auto-creation
- Serializes to JSON for persistence in the database
- Entry point is always `/App.jsx`

### AI Generation Flow

1. **User sends message** → `ChatContext` (`src/lib/contexts/chat-context.tsx`)
2. **Request sent to API route** → `/api/chat/route.ts` with serialized file system
3. **AI processes with tools** → Two tools available:
   - `str_replace_editor`: View, create, edit files (str_replace, insert)
   - `file_manager`: Rename and delete files
4. **Tool calls execute** → Modify the VirtualFileSystem instance
5. **UI updates** → `FileSystemContext` triggers re-renders on changes
6. **Preview renders** → JSX transformer converts code to browser-executable format

### Key Components

**Context Providers** (wrap entire app):
- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`): Manages virtual file system state, selected files, and tool call handlers
- `ChatContext` (`src/lib/contexts/chat-context.tsx`): Manages AI chat messages using Vercel AI SDK

**AI System** (`src/lib/provider.ts`):
- Uses `claude-haiku-4-5` model (configurable via `ANTHROPIC_API_KEY` in `.env`)
- Falls back to `MockLanguageModel` when `ANTHROPIC_API_KEY` is missing (app works without API key)
- Mock provider generates static Counter/Form/Card components for demo purposes
- System prompt in `src/lib/prompts/generation.tsx` instructs AI on React/Tailwind patterns

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`):
- Transforms JSX/TSX to browser-executable code using Babel standalone
- Creates import maps with blob URLs for in-browser module loading
- Handles `@/` import aliases (maps to root `/`)
- Processes CSS imports separately
- Generates preview HTML with Tailwind CDN and error boundaries
- Returns syntax errors for files that fail to compile

**Database** (Prisma + SQLite):
- `User`: Authenticated users (email/password with bcrypt)
- `Project`: Stores serialized messages and file system data
- Prisma client generated to `src/generated/prisma`
- Anonymous users can work without auth; data stored in localStorage via `anon-work-tracker.ts`
- **Schema Definition**: The database schema is defined in `prisma/schema.prisma`. Reference this file anytime you need to understand the structure of data stored in the database.

**Authentication** (`src/lib/auth.ts`):
- JWT-based sessions using `jose` library
- 7-day cookie expiration
- Middleware in `src/middleware.ts` handles session validation

### File Organization

```
src/
├── actions/          # Server actions (get-projects, create-project, etc.)
├── app/              # Next.js App Router
│   ├── api/chat/     # AI streaming API endpoint
│   ├── [projectId]/  # Dynamic project route
│   └── page.tsx      # Home (redirects authenticated users)
├── components/       # React components (editor, chat, preview)
├── lib/
│   ├── contexts/     # React contexts (FileSystem, Chat)
│   ├── tools/        # AI tool definitions (str-replace, file-manager)
│   ├── transform/    # JSX to JS transformer
│   ├── file-system.ts    # Virtual file system implementation
│   ├── auth.ts       # JWT session management
│   ├── provider.ts   # AI model provider (Claude/Mock)
│   └── prompts/      # System prompts for AI
├── hooks/            # Custom React hooks
└── generated/        # Prisma client (auto-generated)
```

### Tech Stack Notes

- **Next.js 15**: Uses App Router, React Server Components, and Server Actions
- **React 19**: Leverages latest features
- **TypeScript**: Strict mode enabled
- **Tailwind CSS v4**: Uses new `@tailwindcss/postcss` plugin
- **Vercel AI SDK**: Handles streaming chat responses and tool calls
- **Prisma**: ORM with SQLite for development (can migrate to PostgreSQL for production)
- **Babel Standalone**: Client-side JSX transformation (runs in browser)
- **Monaco Editor**: Code editor component (`@monaco-editor/react`)

## Important Development Notes

### Database Schema
- Database schema is defined in `prisma/schema.prisma`
- Always reference this file when working with database models or queries
- After schema changes, run `npx prisma generate` to update the client
- Prisma client is generated to `src/generated/prisma`

### Import Aliases
- `@/` maps to `src/` in TypeScript (configured in `tsconfig.json`)
- In generated components, `@/` maps to the virtual file system root `/`

### Testing
- Tests use Vitest with `@testing-library/react`
- Test files located in `__tests__` directories adjacent to source files
- Run specific test: `npm test -- <test-file-pattern>`

### API Behavior
- `/api/chat/route.ts` has `maxDuration = 120` seconds
- Streams responses using Vercel AI SDK's `streamText`
- `maxSteps = 40` for real API, `4` for mock provider (prevents repetition)
- Chat API expects: `{ messages, files, projectId }`

### Virtual File System Rules
- All paths must start with `/`
- Entry point for preview is always `/App.jsx`
- Parent directories are auto-created when creating files
- Case-sensitive paths
- No actual disk I/O during generation

### Tool Call Handling
- AI makes tool calls that are intercepted by `onToolCall` in `ChatContext`
- `FileSystemContext.handleToolCall()` executes changes on the virtual FS
- Changes trigger React re-renders via `refreshTrigger` state
- Tool results are sent back to AI for continuation

### Authentication Flow
1. Anonymous users work without sign-up (data stored in localStorage via `anon-work-tracker.ts`)
2. Sign up creates User in database and migrates anonymous localStorage work to their first Project
3. Authenticated users: each session auto-saves to Project record in database
4. Projects are auto-created on first visit if user has none

### Preview System
- Preview iframe receives dynamically generated HTML from `createPreviewHTML()`
- Import map resolves module imports to blob URLs
- Tailwind CSS loaded via CDN (script tag)
- Error boundary catches runtime errors in preview
- Syntax errors displayed in styled error panel before mounting React

## Common Workflows

### Adding a New AI Tool
1. Create tool definition in `src/lib/tools/`
2. Add to `tools` object in `/api/chat/route.ts`
3. Implement handler in `FileSystemContext.handleToolCall()`
4. Update system prompt if needed

### Modifying File System Behavior
- Core logic in `VirtualFileSystem` class
- Context wrapper handles React integration
- Tool definitions in `src/lib/tools/` use VFS methods
- Serialization format affects database storage

### Running Tests for a Specific Module
```bash
npm test -- file-system           # Test file system
npm test -- jsx-transformer       # Test JSX transformation
npm test -- chat-context          # Test chat context
```
