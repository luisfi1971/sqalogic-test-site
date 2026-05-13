<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Supabase migrations: explicit grants required

Starting **2026-05-30** (new projects) and **2026-10-30** (all existing projects, including SQAtest), tables created in `public` are **not** auto-exposed to the Data API. PostgREST/supabase-js will return `42501` until grants exist.

Every new migration that does `create table public.<x>` must follow it with explicit grants. Since this app is a public QA site where anon needs full CRUD, the pattern is:

```sql
create table if not exists public.your_table (...);

grant all on public.your_table to anon, authenticated, service_role;

alter table public.your_table enable row level security;
drop policy if exists "anon all your_table" on public.your_table;
create policy "anon all your_table" on public.your_table
  for all to anon using (true) with check (true);
```

For tables that should be more restrictive (auth-only, service-role-only), grant only what's needed — don't blanket-grant.
