# QuoteFlow

Turn messy customer inquiries into organized quotes and bookings.

QuoteFlow is an owner-first SaaS for small service businesses. The MVP is being built phase by phase on:

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase Postgres and Storage
- Better Auth
- Resend
- OpenRouter

## Current Status

This repository is prepared for the foundation and authentication phases of the MVP:

- route groups and core surfaces are scaffolded
- Drizzle is configured for the initial app schema
- Better Auth is wired for email/password signup, login, logout, password reset, and session helpers
- Supabase, Resend, and OpenRouter wrappers are in place
- feature folders, schema files, and shared UI shells are established
- dashboard routes are protected server-side in the App Router

Core product features such as inquiry intake, quotes, knowledge tools, analytics, and workspace settings are intentionally scaffolded but not fully implemented yet.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file and fill in real values:

```bash
cp .env.example .env.local
```

3. Generate and apply the database schema:

```bash
npm run db:generate
npm run db:push
```

4. Start the app:

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run check
npm run db:generate
npm run db:push
npm run db:studio
```

## Next Build Order

The intended implementation sequence is:

1. foundation and shared architecture
2. authentication and workspace bootstrap
3. inquiry intake and inbox
4. quotes and outbound email
5. knowledge base and AI drafting
6. analytics and settings
