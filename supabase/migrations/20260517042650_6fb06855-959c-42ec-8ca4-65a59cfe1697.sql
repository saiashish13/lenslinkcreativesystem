
-- Editor workspace: assignments, file versions, revisions, delivery

create type public.editor_status as enum ('open','in_progress','in_review','delivered','cancelled');
create type public.file_kind as enum ('source','draft','revision','delivery');

create table public.editor_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid,
  creator_user_id uuid not null,
  editor_user_id uuid,
  title text not null,
  brief text,
  category text,
  deadline date,
  status public.editor_status not null default 'open',
  budget_inr integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.editor_assignments enable row level security;

create policy "Creators view own assignments" on public.editor_assignments
  for select using (auth.uid() = creator_user_id);
create policy "Editors view assigned or open" on public.editor_assignments
  for select using (
    public.has_role(auth.uid(), 'editor')
    and (editor_user_id is null or auth.uid() = editor_user_id)
  );
create policy "Admins view all assignments" on public.editor_assignments
  for select using (public.has_role(auth.uid(), 'admin'));

create policy "Creators insert assignments" on public.editor_assignments
  for insert with check (auth.uid() = creator_user_id);
create policy "Creators update own assignments" on public.editor_assignments
  for update using (auth.uid() = creator_user_id);
create policy "Editors claim or update assigned" on public.editor_assignments
  for update using (
    public.has_role(auth.uid(), 'editor')
    and (editor_user_id is null or auth.uid() = editor_user_id)
  );
create policy "Creators delete own assignments" on public.editor_assignments
  for delete using (auth.uid() = creator_user_id);

create trigger touch_editor_assignments
  before update on public.editor_assignments
  for each row execute function public.touch_updated_at();

create index idx_editor_assignments_editor on public.editor_assignments(editor_user_id);
create index idx_editor_assignments_creator on public.editor_assignments(creator_user_id);
create index idx_editor_assignments_status on public.editor_assignments(status);

-- File versions
create table public.project_files (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.editor_assignments(id) on delete cascade,
  version integer not null default 1,
  kind public.file_kind not null default 'draft',
  file_url text not null,
  note text,
  uploaded_by uuid not null,
  created_at timestamptz not null default now()
);

alter table public.project_files enable row level security;

create policy "Files visible to participants" on public.project_files
  for select using (
    exists (
      select 1 from public.editor_assignments a
      where a.id = assignment_id
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid()
             or public.has_role(auth.uid(),'admin'))
    )
  );
create policy "Participants insert files" on public.project_files
  for insert with check (
    auth.uid() = uploaded_by and exists (
      select 1 from public.editor_assignments a
      where a.id = assignment_id
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid())
    )
  );
create policy "Uploader deletes own files" on public.project_files
  for delete using (auth.uid() = uploaded_by);

create index idx_project_files_assignment on public.project_files(assignment_id);

-- Revisions / feedback notes
create table public.project_revisions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.editor_assignments(id) on delete cascade,
  author_id uuid not null,
  message text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.project_revisions enable row level security;

create policy "Revisions visible to participants" on public.project_revisions
  for select using (
    exists (
      select 1 from public.editor_assignments a
      where a.id = assignment_id
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid()
             or public.has_role(auth.uid(),'admin'))
    )
  );
create policy "Participants add revisions" on public.project_revisions
  for insert with check (
    auth.uid() = author_id and exists (
      select 1 from public.editor_assignments a
      where a.id = assignment_id
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid())
    )
  );
create policy "Participants update revisions" on public.project_revisions
  for update using (
    exists (
      select 1 from public.editor_assignments a
      where a.id = assignment_id
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid())
    )
  );

create index idx_project_revisions_assignment on public.project_revisions(assignment_id);

-- Deliverables bucket (private)
insert into storage.buckets (id, name, public) values ('deliverables', 'deliverables', false)
  on conflict (id) do nothing;

create policy "Deliverables read participants"
  on storage.objects for select
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.editor_assignments a
      where a.id::text = (storage.foldername(name))[1]
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid()
             or public.has_role(auth.uid(),'admin'))
    )
  );

create policy "Deliverables upload participants"
  on storage.objects for insert
  with check (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.editor_assignments a
      where a.id::text = (storage.foldername(name))[1]
        and (a.creator_user_id = auth.uid() or a.editor_user_id = auth.uid())
    )
  );

create policy "Deliverables delete own"
  on storage.objects for delete
  using (
    bucket_id = 'deliverables'
    and owner = auth.uid()
  );
