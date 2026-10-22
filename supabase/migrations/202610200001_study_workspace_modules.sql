create table if not exists public.study_chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  notebook_id uuid references public.study_notebooks (id) on delete cascade,
  title text not null default 'New study chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists study_chat_threads_global_user_idx
  on public.study_chat_threads (user_id)
  where notebook_id is null;
create unique index if not exists study_chat_threads_notebook_user_idx
  on public.study_chat_threads (user_id, notebook_id)
  where notebook_id is not null;

alter table public.study_chat_threads enable row level security;
drop policy if exists "Users can manage their own study chat threads" on public.study_chat_threads;
create policy "Users can manage their own study chat threads"
  on public.study_chat_threads for all
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      notebook_id is null
      or exists (
        select 1 from public.study_notebooks
        where study_notebooks.id = study_chat_threads.notebook_id
          and study_notebooks.user_id = (select auth.uid())
      )
    )
  );

create table if not exists public.study_chat_entries (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.study_chat_threads (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  created_at timestamptz not null default now()
);

create index if not exists study_chat_entries_thread_created_idx
  on public.study_chat_entries (thread_id, created_at);

alter table public.study_chat_entries enable row level security;
drop policy if exists "Users can manage their own study chat entries" on public.study_chat_entries;
create policy "Users can manage their own study chat entries"
  on public.study_chat_entries for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_chat_threads
      where study_chat_threads.id = study_chat_entries.thread_id
        and study_chat_threads.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_chat_threads
      where study_chat_threads.id = study_chat_entries.thread_id
        and study_chat_threads.user_id = (select auth.uid())
    )
  );

create table if not exists public.study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  notebook_id uuid not null references public.study_notebooks (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  content text not null default '' check (char_length(content) <= 45000),
  updated_at timestamptz not null default now(),
  unique (user_id, notebook_id)
);

alter table public.study_notes enable row level security;
drop policy if exists "Users can manage their own study notes" on public.study_notes;
create policy "Users can manage their own study notes"
  on public.study_notes for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_notes.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_notes.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  );

create table if not exists public.study_flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  notebook_id uuid not null references public.study_notebooks (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  cards jsonb not null check (jsonb_typeof(cards) = 'array'),
  created_at timestamptz not null default now()
);

create index if not exists study_flashcard_decks_user_created_idx
  on public.study_flashcard_decks (user_id, created_at desc);
alter table public.study_flashcard_decks enable row level security;
drop policy if exists "Users can manage their own flashcard decks" on public.study_flashcard_decks;
create policy "Users can manage their own flashcard decks"
  on public.study_flashcard_decks for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_flashcard_decks.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_flashcard_decks.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  );

create table if not exists public.study_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  notebook_id uuid not null references public.study_notebooks (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  questions jsonb not null check (jsonb_typeof(questions) = 'array'),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  score integer,
  feedback text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists study_quiz_attempts_user_created_idx
  on public.study_quiz_attempts (user_id, created_at desc);
alter table public.study_quiz_attempts enable row level security;
drop policy if exists "Users can manage their own quiz attempts" on public.study_quiz_attempts;
create policy "Users can manage their own quiz attempts"
  on public.study_quiz_attempts for all
  using (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_quiz_attempts.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  )
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.study_notebooks
      where study_notebooks.id = study_quiz_attempts.notebook_id
        and study_notebooks.user_id = (select auth.uid())
    )
  );

alter table public.study_notebooks alter column user_id set default auth.uid();
alter table public.study_messages alter column user_id set default auth.uid();
alter table public.study_chat_threads alter column user_id set default auth.uid();
alter table public.study_chat_entries alter column user_id set default auth.uid();
alter table public.study_notes alter column user_id set default auth.uid();
alter table public.study_flashcard_decks alter column user_id set default auth.uid();
alter table public.study_quiz_attempts alter column user_id set default auth.uid();
