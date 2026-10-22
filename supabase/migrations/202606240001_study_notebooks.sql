create table if not exists public.study_notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  source_name text not null check (char_length(source_name) between 1 and 200),
  source_type text not null check (source_type in ('pdf', 'pptx', 'docx', 'text', 'audio', 'video')),
  content text not null check (char_length(content) between 1 and 90000),
  created_at timestamptz not null default now()
);

create index if not exists study_notebooks_user_created_idx
  on public.study_notebooks (user_id, created_at desc);

alter table public.study_notebooks enable row level security;

create policy "Users can read their own study notebooks"
  on public.study_notebooks for select
  using ((select auth.uid()) = user_id);

create policy "Users can create their own study notebooks"
  on public.study_notebooks for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own study notebooks"
  on public.study_notebooks for delete
  using ((select auth.uid()) = user_id);

create table if not exists public.study_messages (
  id uuid primary key default gen_random_uuid(),
  notebook_id uuid not null references public.study_notebooks (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create index if not exists study_messages_notebook_created_idx
  on public.study_messages (notebook_id, created_at);

alter table public.study_messages enable row level security;

create policy "Users can read messages in their own notebooks"
  on public.study_messages for select
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_messages.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  );

create policy "Users can create messages in their own notebooks"
  on public.study_messages for insert
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_messages.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  );
