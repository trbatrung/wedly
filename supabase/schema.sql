-- Run once in the SQL editor of a new Supabase project.
-- Private team workspaces. No public read policies or public storage URLs.
create table public.teams (id uuid primary key default gen_random_uuid(), name text not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now());
create table public.team_members (team_id uuid not null references public.teams(id) on delete cascade, user_id uuid not null references auth.users(id) on delete cascade, display_name text not null, role text not null check (role in ('owner','member')), primary key (team_id,user_id), unique (user_id));
create table public.workspaces (team_id uuid primary key references public.teams(id) on delete cascade, payload jsonb not null, revision integer not null default 0, updated_at timestamptz not null default now());
create table public.screenshots (id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade, wedding_id text not null, filename text not null, object_path text not null unique, hash text not null, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '48 hours', retained boolean not null default false, deleted_at timestamptz, analysis jsonb, unique(team_id,hash));
create index screenshots_expiration on public.screenshots(expires_at) where retained=false and deleted_at is null;
create table public.team_invites (token uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade, expires_at timestamptz not null default now()+interval '7 days');
create table public.ai_usage (team_id uuid not null references public.teams(id) on delete cascade, day date not null, requests integer not null default 0, primary key(team_id,day));

create function public.is_team_member(p_team_id uuid) returns boolean language sql stable security definer set search_path=public as $$select exists(select 1 from public.team_members where team_id=p_team_id and user_id=auth.uid());$$;
revoke all on function public.is_team_member(uuid) from public;
grant execute on function public.is_team_member(uuid) to authenticated;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.workspaces enable row level security;
alter table public.screenshots enable row level security;
alter table public.team_invites enable row level security;
alter table public.ai_usage enable row level security;
create policy team_read on public.teams for select to authenticated using(public.is_team_member(id));
create policy membership_read on public.team_members for select to authenticated using(public.is_team_member(team_id));
create policy workspace_read on public.workspaces for select to authenticated using(public.is_team_member(team_id));
-- Workspace writes only through the revision-checked RPC.
create policy screenshot_read on public.screenshots for select to authenticated using(public.is_team_member(team_id));
create policy screenshot_insert on public.screenshots for insert to authenticated with check(public.is_team_member(team_id) and created_by=auth.uid() and object_path like team_id::text||'/%' and expires_at<=now()+interval '48 hours' and expires_at>now() and retained=false and deleted_at is null);
create policy screenshot_update on public.screenshots for update to authenticated using(public.is_team_member(team_id)) with check(public.is_team_member(team_id));
create function public.protect_screenshot_source() returns trigger language plpgsql set search_path=public as $$
begin
  if new.id<>old.id or new.team_id<>old.team_id or new.wedding_id<>old.wedding_id or new.object_path<>old.object_path or new.created_at<>old.created_at or new.expires_at<>old.expires_at or new.hash<>old.hash or new.created_by<>old.created_by then raise exception 'immutable_source'; end if;
  if new.retained=true and old.retained=false and (old.deleted_at is not null or old.expires_at<=now()) then raise exception 'source_expired'; end if;
  if old.deleted_at is not null and new.deleted_at is null then raise exception 'source_deleted'; end if;
  return new;
end;$$;
create trigger screenshot_immutable before update on public.screenshots for each row execute function public.protect_screenshot_source();

create function public.create_team(p_name text,p_member text,p_payload jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare team uuid;
begin
  if auth.uid() is null or exists(select 1 from public.team_members where user_id=auth.uid()) then raise exception 'team_exists_or_unauthorized'; end if;
  if length(trim(p_name))<1 or length(p_name)>120 or length(trim(p_member))<1 or length(p_member)>80 then raise exception 'invalid_name'; end if;
  insert into public.teams(name,created_by) values(p_name,auth.uid()) returning id into team;
  insert into public.team_members values(team,auth.uid(),p_member,'owner');
  insert into public.workspaces(team_id,payload) values(team,p_payload);
  return team;
end;$$;
create function public.save_workspace(p_team_id uuid,p_payload jsonb,p_revision integer) returns integer language plpgsql security definer set search_path=public as $$
declare next_revision integer;
begin
  if not public.is_team_member(p_team_id) then raise exception 'unauthorized'; end if;
  if jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>5000000 then raise exception 'invalid_payload'; end if;
  update public.workspaces set payload=p_payload,revision=revision+1,updated_at=now() where team_id=p_team_id and revision=p_revision returning revision into next_revision;
  if not found then raise exception 'revision_conflict'; end if;
  return next_revision;
end;$$;
create function public.create_team_invite(p_team_id uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare invite uuid;
begin
  if not exists(select 1 from public.team_members where team_id=p_team_id and user_id=auth.uid() and role='owner') then raise exception 'unauthorized'; end if;
  delete from public.team_invites where team_id=p_team_id;
  insert into public.team_invites(team_id) values(p_team_id) returning token into invite;
  return invite;
end;$$;
create function public.accept_team_invite(p_token uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare team uuid; member_name text;
begin
  if auth.uid() is null or exists(select 1 from public.team_members where user_id=auth.uid()) then raise exception 'already_in_team'; end if;
  select team_id into team from public.team_invites where token=p_token and expires_at>now();
  if team is null then raise exception 'invite_expired'; end if;
  select left(split_part(email,'@',1),80) into member_name from auth.users where id=auth.uid();
  insert into public.team_members values(team,auth.uid(),member_name,'member');
  update public.workspaces set payload=jsonb_set(payload,'{members}',(payload->'members')||jsonb_build_array(member_name)),revision=revision+1,updated_at=now() where team_id=team;
  return team;
end;$$;
create function public.consume_ai_request(p_team_id uuid) returns boolean language plpgsql security definer set search_path=public as $$
declare used integer;
begin
  if not public.is_team_member(p_team_id) then raise exception 'unauthorized'; end if;
  insert into public.ai_usage(team_id,day,requests) values(p_team_id,(now() at time zone 'Asia/Ho_Chi_Minh')::date,1)
  on conflict(team_id,day) do update set requests=public.ai_usage.requests+1 where public.ai_usage.requests<100 returning requests into used;
  return used is not null;
end;$$;
revoke all on function public.create_team(text,text,jsonb),public.save_workspace(uuid,jsonb,integer),public.create_team_invite(uuid),public.accept_team_invite(uuid),public.consume_ai_request(uuid) from public;
grant execute on function public.create_team(text,text,jsonb),public.save_workspace(uuid,jsonb,integer),public.create_team_invite(uuid),public.accept_team_invite(uuid),public.consume_ai_request(uuid) to authenticated;
grant select on public.teams,public.team_members,public.workspaces to authenticated;
grant select,insert,update on public.screenshots to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('screenshots','screenshots',false,5242880,array['image/png','image/jpeg','image/webp']);
-- No storage.objects policy: files are only read/written by authenticated API handlers
-- using a server-only service role key after checking membership and expiry.
