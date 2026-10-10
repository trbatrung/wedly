-- Run after schema.sql. Online invitations: guest answers (RSVP) and photos.
-- Kept outside the revision-checked workspace payload so guest submissions
-- never conflict with planners' saves.
create table public.rsvps (
  id uuid primary key,
  team_id uuid not null references public.teams(id) on delete cascade,
  wedding_id text not null,
  name text not null check (length(trim(name)) between 1 and 120),
  phone text not null default '' check (length(phone) <= 30),
  attending boolean not null,
  guests integer not null default 0 check (guests between 0 and 10),
  guest_names text not null default '' check (length(guest_names) <= 500),
  side text not null default '' check (side in ('', 'bride', 'groom')),
  dietary text not null default '' check (length(dietary) <= 300),
  message text not null default '' check (length(message) <= 1000),
  source text not null default 'invite' check (source in ('invite', 'manual')),
  ip_hash text,
  sheet_status text not null default 'none' check (sheet_status in ('none', 'sent', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rsvps_team_wedding on public.rsvps(team_id, wedding_id, updated_at desc);
create index rsvps_rate_limit on public.rsvps(team_id, ip_hash, updated_at);
-- Speeds up public invitation lookups by token inside workspace payloads.
create index workspaces_payload on public.workspaces using gin (payload jsonb_path_ops);

alter table public.rsvps enable row level security;
create policy rsvp_read on public.rsvps for select to authenticated
  using (public.is_team_member(team_id));
-- Team members add or edit phone/in-person confirmations only.
create policy rsvp_insert on public.rsvps for insert to authenticated
  with check (public.is_team_member(team_id) and source = 'manual');
create policy rsvp_update on public.rsvps for update to authenticated
  using (public.is_team_member(team_id) and source = 'manual')
  with check (public.is_team_member(team_id) and source = 'manual');
create policy rsvp_delete on public.rsvps for delete to authenticated
  using (public.is_team_member(team_id));
grant select, insert, update, delete on public.rsvps to authenticated;
-- Guest answers are written by /api/rsvp with the server-only service role
-- after the invitation token, publish state and rate limit are checked.

-- Invitation photos are meant for guests, so the bucket is public-read by URL.
-- There are no storage.objects policies: uploads and deletions only happen in
-- /api/invite-images after checking team membership, using the service role.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('invitation-images','invitation-images',true,3145728,array['image/jpeg','image/png','image/webp']);
