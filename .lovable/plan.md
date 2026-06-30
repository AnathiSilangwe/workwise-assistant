## WorkWise AI — Build Plan

Using the **Systemic utility** design direction (clean dark-mode SaaS, Inter, surface cards with subtle ring borders, blue #2563EB primary / cyan #06B6D4 accent). Dark mode is the default; a light toggle is included.

### Stack mapping
- **Frontend**: TanStack Start + React + Tailwind v4 + shadcn (already scaffolded).
- **Backend**: Lovable Cloud (Postgres + auth) instead of Express/Mongo.
- **AI**: Lovable AI Gateway (`google/gemini-3-flash-preview`) instead of direct OpenAI key.
- **Auth**: Email/password via Lovable Cloud (matches the user's JWT spec functionally).

### Routes
```
/                       Landing (hero, 5 features, stats, testimonial, CTA, footer)
/auth                   Login + Register (tabbed)
/responsible-ai         Responsible AI page (public)
/_authenticated/
  dashboard             Overview (stats + recent history)
  email                 Smart Email Generator
  summarizer            Meeting Notes Summarizer
  planner               AI Task Planner
  research              AI Research Assistant
  chat                  Workplace AI Chatbot (threaded)
  chat/$threadId        Single chat thread
  history               Prompt history (search, delete, reuse)
  settings              Profile + dark mode toggle
```

### Database (Lovable Cloud / Postgres)
- `profiles` — id (→ auth.users), full_name, created_at. Auto-created via trigger.
- `history` — id, user_id, feature ('email'|'summary'|'planner'|'research'|'chat'), prompt (jsonb of inputs), response (text), created_at.
- `chat_threads` — id, user_id, title, created_at, updated_at.
- `chat_messages` — id, thread_id, role ('user'|'assistant'), content, created_at.
- RLS: all tables scoped to `auth.uid()`. GRANT statements included per public-schema rule.

### Server functions (`src/lib/*.functions.ts`, all `requireSupabaseAuth`)
- `generateEmail({ audience, purpose, tone, notes })` → calls Gateway, saves to history.
- `summarizeMeeting({ notes })` → structured output (summary, decisions, actions, deadlines).
- `planTasks({ tasks, workingHours })` → structured schedule + tips.
- `researchTopic({ topic })` → markdown response (summary, key concepts, examples, etc.).
- `listHistory()`, `deleteHistoryItem(id)`.
- `createThread()`, `listThreads()`, `renameThread()`, `deleteThread()`.

### Server route
- `src/routes/api/chat.ts` — streaming chatbot using AI SDK `useChat` + Gateway. Persists messages per thread.

### UI surfaces
- **Landing**: hero, 5-feature grid, productivity stats comparison bars (Email 15→1, Summary 40→0.5, Planning 20→1, Research 45→2), testimonial, footer with Responsible AI link.
- **Auth**: tabbed login/register with zod validation.
- **Dashboard shell**: collapsible sidebar (shadcn Sidebar), header with theme toggle + user menu, main outlet.
- **Each feature page**: structured input form on left, AI output card on right with Copy / Download / Regenerate buttons, loading skeleton during generation.
- **Chat**: thread list rail, message stream with markdown rendering, new/rename/delete thread actions.
- **History**: searchable table, filter by feature, reuse-loads-into-form, delete.
- **Responsible AI**: static page covering Transparency, Human Verification, Privacy, Bias, Security.
- **Dark mode**: default dark; toggle in header persists to localStorage + sets `.dark` class.

### Design tokens (src/styles.css)
- Update theme: bg `#09090b` (dark) / `#F8FAFC` (light), surface, primary #2563EB, accent #06B6D4, semantic muted/border. Inter font via `@fontsource/inter`. Soft shadow + rounded-xl cards.

### Out of scope for v1 (can add later)
- Social OAuth (Google/Apple), password reset flow, file uploads, export-to-Gmail integrations.

### Technical notes
- Lovable Cloud will be enabled at start of build.
- `LOVABLE_API_KEY` provisioned for Gateway.
- All AI calls server-side; surface 402/429 errors as toasts.
- Streaming chat uses `withLovableAiGatewayRunIdHeader` + `convertToModelMessages`.
- Structured outputs (summarizer, planner) use Gemini (no `structuredOutputs` flag needed).
