# QuoteFlow

Turn messy customer inquiries into organized quotes and bookings.

QuoteFlow is an owner-first SaaS MVP for small service businesses such as print shops, repair shops, event suppliers, and small agencies. It gives the business owner a public inquiry page, an authenticated dashboard, quote creation, a lightweight knowledge base, AI-assisted drafting, analytics, and workspace settings.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui
- Supabase Postgres and Storage
- Better Auth
- Resend
- OpenRouter
- Drizzle ORM

## MVP Surface

- Public landing page and public inquiry form
- Better Auth email/password auth with forgot/reset password
- Automatic workspace bootstrap on first signup
- Inquiry inbox with notes, activity, status changes, and attachment support
- Quotes with line items, totals, preview, and send via Resend
- Knowledge dashboard with file uploads and FAQs
- Internal AI assistant on inquiry detail using workspace context
- Workspace analytics and settings

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Create your env file

Copy `.env.example` to `.env` and fill in the real values.

macOS / Linux:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Use `.env` for local setup. The Drizzle commands and demo seed script load `.env` directly.

### 3. Run migrations

```bash
npm run db:migrate
```

Use `db:migrate`, not `db:push`, for normal setup. This repo includes custom SQL migrations for:

- RLS policies
- timestamp triggers
- Supabase storage buckets

`db:push` is still useful for throwaway local experimentation, but it is not the source-of-truth workflow for this repo.

### 4. Seed demo data

```bash
npm run db:seed-demo
```

By default this creates a demo owner and refreshes a sample workspace with:

- several inquiries across all inquiry statuses
- sample notes and activity
- five quotes across quote statuses
- sample FAQs

Default demo credentials:

- Email: `demo@quoteflow.local`
- Password: `ChangeMe123456!`

You can override the demo seed values with the optional `DEMO_*` env variables in `.env`.

### 5. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Required Environment Variables

### Database

- `DATABASE_URL`
- `DATABASE_DIRECT_URL`

For local Postgres, both can usually point to the same database.

### Better Auth

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`

Notes:

- `BETTER_AUTH_SECRET` must be at least 32 characters.
- `BETTER_AUTH_URL` must match the origin you use in the browser, usually `http://localhost:3000`.
- Changing the auth secret invalidates existing sessions.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Supabase is used for:

- Postgres hosting
- private attachment storage
- private knowledge file storage
- private workspace asset storage

### Resend

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO_EMAIL`

### OpenRouter

- `OPENROUTER_API_KEY`
- `OPENROUTER_DEFAULT_MODEL`

The default model in `.env.example` is `openai/gpt-5-mini`. Any OpenRouter model ID that supports text generation is valid here.

## Migration and Setup Notes

### Drizzle migration workflow

Fresh setup:

```bash
npm run db:migrate
```

After schema changes:

```bash
npm run db:generate
npm run db:migrate
```

Optional local inspection:

```bash
npm run db:studio
```

Current migrations create:

- Better Auth tables
- QuoteFlow app tables
- RLS policies and helper functions
- private Supabase buckets:
  - `inquiry-attachments`
  - `knowledge-files`
  - `workspace-assets`

### Better Auth setup

The Better Auth route is already wired at `app/api/auth/[...all]/route.ts`.

This repo uses Better Auth for:

- signup
- login
- logout
- session handling
- forgot/reset password

On first successful signup, the app automatically:

- creates the profile if missing
- creates a workspace
- creates an owner membership
- assigns a default slug

The server-side auth utilities live in `lib/auth/session.ts` and route protection is handled in App Router layouts and server actions.

### Resend sender configuration

Resend is required for:

- forgot/reset password emails
- public inquiry notification emails
- quote delivery emails

Setup checklist:

1. Create a Resend API key.
2. Verify a sender domain or sender address in Resend.
3. Set `RESEND_FROM_EMAIL` to the verified sender email.
4. Set `RESEND_REPLY_TO_EMAIL` to the inbox where business replies should land.

Important:

- This repo validates plain email addresses in envs, so use `hello@example.com`, not `QuoteFlow <hello@example.com>`.
- Inquiry notification and password reset sending are best-effort when Resend is not configured.
- Quote sending intentionally fails if Resend is not configured, because that action is user-facing and explicit.

### OpenRouter model configuration

OpenRouter is used for the internal inquiry assistant. The API key stays server-only.

Setup checklist:

1. Create an OpenRouter API key.
2. Set `OPENROUTER_API_KEY`.
3. Set `OPENROUTER_DEFAULT_MODEL`, for example:
   - `openai/gpt-5-mini`
   - `openai/gpt-5`
   - another supported OpenRouter text model

The assistant builds context from:

- workspace settings
- inquiry details
- internal notes
- FAQs
- uploaded knowledge snippets

The prompt rules in the app enforce:

- no invented exact pricing or policies
- explicit mention of missing information
- concise, business-usable outputs

If OpenRouter is not configured, the AI panel will return a configuration-related error instead of silently fabricating results.

## Demo Seed Notes

`npm run db:seed-demo` uses the real Better Auth signup flow, so the demo owner is created the same way a normal owner account is created. The script then refreshes a fixed set of sample records for that demo workspace.

The seed currently includes:

- one sample workspace
- six inquiries
- five quotes
- four FAQs
- several notes and activity entries so the inbox and quote detail screens are populated

The seed does not upload binary storage files. Inquiry attachments and knowledge uploads still need to be tested manually through the UI.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run check
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:studio
npm run db:seed-demo
```

## Obvious Cleanup Completed In This Slice

- Added a real demo seed path instead of leaving setup to manual record creation.
- Updated the README to match the current MVP instead of the earlier scaffold state.
- Added direct `.env` loading for Drizzle and the demo seed script so setup commands work without shell-specific export steps.

## Remaining Gaps After The MVP

- No public customer quote acceptance or rejection flow yet
- No real team permissions beyond owner-first groundwork
- No automated quote expiry job or scheduled reminders
- No attachment seeding or sample knowledge-file uploads
- No end-to-end test suite yet for auth, inquiries, quotes, knowledge, and AI flows
- No production deployment guide yet for Supabase, Resend, and OpenRouter

## Safest Next Improvements

1. Add Playwright end-to-end coverage for signup, public inquiry submission, quote send, and settings updates.
2. Add a public quote view with customer accept/reject actions and a simple audit trail.
3. Add better retry and observability around Resend and OpenRouter failures.
4. Add a minimal deployment guide for Vercel plus Supabase environment wiring.
5. Add background cleanup or reminders for expired quotes and stalled inquiries.
