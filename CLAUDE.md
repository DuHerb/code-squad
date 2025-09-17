# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server (Vinxi-based TanStack Start application)
- `npm run build` - Build the application for production
- `npm run start` - Start the production server

## Architecture Overview

This is a coding challenge platform built with TanStack Start and React. The application allows users to solve JavaScript coding challenges in a Monaco editor with real-time execution and testing.

### Key Technologies

- **TanStack Start** - Full-stack React framework with file-based routing
- **Vinxi** - Build system and dev server
- **Monaco Editor** - In-browser code editor via `@monaco-editor/react`
- **isolated-vm** - Secure JavaScript execution sandbox for running user code
- **TypeScript** - Type safety throughout the application

### Application Structure

```
app/
├── routes/               # File-based routing
│   ├── __root.tsx       # Root layout with navigation
│   ├── index.tsx        # Main challenge page
│   └── progress.tsx     # Progress dashboard
├── components/
│   └── CodeEditor.tsx   # Monaco editor wrapper
├── server/              # Server-side logic
│   ├── challenges.ts    # Challenge execution engine
│   ├── progress.ts      # Progress tracking
│   ├── progress.server.ts # Server functions for progress
│   └── repositories/    # Data access layer
└── styles/
    └── app.css         # Global styles
```

### Server-Side Architecture

The application uses a repository pattern for data access:

- **Challenge Repository** (`repositories/challenges.repository.ts`) - Manages challenge definitions and retrieval
- **Progress Repository** (`repositories/progress.repository.ts`) - Tracks user completion status
- **In-Memory Implementation** (`repositories/in-memory.progress.repository.ts`) - Simple in-memory storage

### Code Execution System

The platform uses `isolated-vm` to safely execute user JavaScript code:

1. Code is compiled and executed in an isolated V8 context
2. User functions are called with test case inputs
3. Results are compared against expected outputs
4. Memory and timeout limits prevent infinite loops/memory leaks

### Key Files

- `app/server/challenges.ts:42` - Main challenge execution handler `handleExecuteChallenge`
- `app/routes/index.tsx:17` - Server function that calls the execution handler
- `app/components/CodeEditor.tsx` - Monaco editor configuration
- `app/server/repositories/challenges.repository.ts` - Challenge data definitions

### Development Notes

- The application has no formal test suite currently
- Uses TypeScript with relaxed configuration (no strict mode)
- Monaco editor is client-side only (SSR bypassed with `isClient` state)
- Progress is stored in-memory and resets on server restart
- Challenge execution happens server-side for security

### Configuration Files

- `app.config.ts` - TanStack Start configuration with isolated-vm exclusions
- `vite.config.ts` - Vite configuration for development
- `tsconfig.json` - TypeScript configuration with React JSX support