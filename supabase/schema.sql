-- Run this in Supabase SQL Editor.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('setter','reviewer','admin','controller')),
  created_at timestamptz not null default now()
);

create table if not exists public.question_papers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text,
  encrypted_file_path text not null,
  file_name text not null,
  file_size bigint,
  sha256_hash text not null,
  status text not null default 'PENDING_REVIEW'
    check (status in ('PENDING_REVIEW','APPROVED','REJECTED','RELEASED')),
  exam_date timestamptz not null,
  uploaded_by uuid references public.users(id) on delete restrict,
  approved_by uuid references public.users(id) on delete set null,
  approved_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  question_paper_id uuid references public.question_papers(id) on delete set null,
  ip_address text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- The application uses the server-side Supabase service key.
-- Keep the service key only in the backend environment; never put it in frontend code.
create index if not exists idx_question_papers_status on public.question_papers(status);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Create a PRIVATE storage bucket named: question-papers
-- In Supabase Dashboard: Storage -> New bucket -> name "question-papers" -> Private.
