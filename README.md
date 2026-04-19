# 2am

the judgment-free ai companion for pregnancy & motherhood.
domain: **hey2am.app** · ai character: **myla**

mobile-first Next.js 14 (App Router) + TypeScript + Tailwind + Supabase + Anthropic Claude.

## stack

- Next.js 14 (App Router), TypeScript
- Tailwind CSS (custom theme with midnight / peach / coral / cream / sage / lavender / gold)
- Outfit (display) + DM Mono (labels)
- Anthropic Messages API (server-side only, `/api/chat`)
- Supabase (auth + database + RLS) — SQL at `supabase/schema.sql`

## setup

```bash
pnpm install   # or npm / yarn
cp .env.local.example .env.local
# fill in your keys, then:
pnpm dev
```

open http://localhost:3000 — it redirects to `/app`.

### env vars

```
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxx
```

the Anthropic key is **only** used in `/api/chat` (server). it never ships to the client.

### Supabase

in a new Supabase project, open the SQL editor and run `supabase/schema.sql`. it:

- creates `profiles`, `conversations`, `mood_logs`
- enables Row Level Security with self-only policies
- auto-provisions a profile row on `auth.users` insert
- adds `updated_at` triggers

Auth: email/password or magic links — both work out of the box with `@supabase/ssr`.

## pages

| route       | what                                                               |
| ----------- | ------------------------------------------------------------------ |
| `/app`      | splash — logo, tagline, `meet myla` CTA                            |
| `/app/chat` | core chat with myla (onboarding for first-timers)                  |
| `/app/home` | home hub — greeting, week card, check-in, CTAs, recents, mood row  |
| `/app/cani` | categorized `can i…?` questions, search, deep-links to chat        |

deep-linking from chips: `/app/chat?new=1&q=can%20i%20eat%20sushi?`
mood row: `/app/chat?new=1&mood=rough`

## api

`POST /api/chat` — body: `{ messages: [{role, content}], userProfile }`. Server prepends the Myla system prompt and a `[USER CONTEXT: ...]` line, then calls `claude-sonnet-4-20250514` with `max_tokens: 800`. System prompt uses prompt caching (`cache_control: { type: 'ephemeral' }`) to avoid re-billing the long persona on every turn.

## persistence

v1 persists profile + conversations to `localStorage` so the app works without Supabase wired up. to move to Supabase:

- add a session/auth flow (email or magic link)
- swap `lib/profile.ts` and `lib/conversations.ts` reads/writes for Supabase calls against `profiles` and `conversations`
- in `/api/chat`, read the profile server-side from Supabase using the user session cookie

## deploy

```bash
pnpm build
```

Vercel-ready — set the env vars in the project, point the domain at `hey2am.app`.

## brand

- all lowercase copy
- display: Outfit (400/600/800)
- mono labels: DM Mono (uppercase, tracked)
- peach gradient CTAs, subtle glow shadow, star-field splash
