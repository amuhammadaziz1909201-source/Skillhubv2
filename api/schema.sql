-- SkillHub V2 — Supabase Schema v2
-- Supabase SQL Editor da ishga tushiring

-- 1. Profiles (auth.users dan avtomatik sync)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  first_name text default '',
  last_name text default '',
  avatar text default '',
  bio text default '',
  role text default 'user' check (role in ('user','admin')),
  skills text[] default '{}',
  job_role text default '',
  location text default '',
  links jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  description text default '',
  tags text[] default '{}',
  image text default '',
  project_url text default '',
  views integer default 0,
  likes integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Notifications
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  message text not null,
  type text default 'info' check (type in ('info','warning','error','success')),
  read boolean default false,
  created_at timestamptz default now()
);

-- 4. Comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- 5. Likes
create table if not exists project_likes (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- 6. Follows
create table if not exists follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Indexes
create index if not exists idx_projects_user on projects(user_id);
create index if not exists idx_projects_created on projects(created_at desc);
create index if not exists idx_notifications_user on notifications(user_id);
create index if not exists idx_comments_project on comments(project_id);

-- RLS
alter table profiles enable row level security;
alter table projects enable row level security;
alter table notifications enable row level security;
alter table comments enable row level security;
alter table project_likes enable row level security;
alter table follows enable row level security;

-- Profiles policies
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles for select using (true);
drop policy if exists "profiles_insert" on profiles;
create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update" on profiles;
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Projects policies
drop policy if exists "projects_select" on projects;
create policy "projects_select" on projects for select using (true);
drop policy if exists "projects_insert" on projects;
create policy "projects_insert" on projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update" on projects;
create policy "projects_update" on projects for update using (auth.uid() = user_id);
drop policy if exists "projects_delete" on projects;
create policy "projects_delete" on projects for delete using (auth.uid() = user_id);

-- Notifications policies
drop policy if exists "notif_select" on notifications;
create policy "notif_select" on notifications for select using (auth.uid() = user_id);
drop policy if exists "notif_insert" on notifications;
create policy "notif_insert" on notifications for insert with check (true);
drop policy if exists "notif_update" on notifications;
create policy "notif_update" on notifications for update using (auth.uid() = user_id);
drop policy if exists "notif_delete" on notifications;
create policy "notif_delete" on notifications for delete using (auth.uid() = user_id);

-- Comments policies
drop policy if exists "comments_select" on comments;
create policy "comments_select" on comments for select using (true);
drop policy if exists "comments_insert" on comments;
create policy "comments_insert" on comments for insert with check (auth.uid() = user_id);

-- Likes policies
drop policy if exists "likes_select" on project_likes;
create policy "likes_select" on project_likes for select using (true);
drop policy if exists "likes_all" on project_likes;
create policy "likes_all" on project_likes for all using (auth.uid() = user_id);

-- Follows policies
drop policy if exists "follows_select" on follows;
create policy "follows_select" on follows for select using (true);
drop policy if exists "follows_all" on follows;
create policy "follows_all" on follows for all using (auth.uid() = follower_id);

-- Auto profile on signup (trigger)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, first_name, last_name, avatar, bio, role, skills, links)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar', ''),
    coalesce(new.raw_user_meta_data->>'bio', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    coalesce(new.raw_user_meta_data->>'skills', '[]')::text[],
    coalesce(new.raw_user_meta_data->'links', '{}'::jsonb)
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at before update on profiles for each row execute function update_updated_at();
drop trigger if exists projects_updated_at on projects;
create trigger projects_updated_at before update on projects for each row execute function update_updated_at();

-- Storage buckets (Supabase Dashboard > Storage > New Bucket)
-- Create "avatars" bucket (public)
-- Create "project-images" bucket (public)
-- Run these in SQL Editor if buckets don't exist:
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('project-images', 'project-images', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('site-backups', 'site-backups', true) on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Avatar uploads" on storage.objects;
create policy "Avatar uploads" on storage.objects for all using (bucket_id = 'avatars');
drop policy if exists "Project image uploads" on storage.objects;
create policy "Project image uploads" on storage.objects for all using (bucket_id = 'project-images');
drop policy if exists "Site backups write" on storage.objects;
create policy "Site backups write" on storage.objects for all using (bucket_id = 'site-backups');
drop policy if exists "Avatar public read" on storage.objects;
create policy "Avatar public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Project images public read" on storage.objects;
create policy "Project images public read" on storage.objects for select using (bucket_id = 'project-images');
drop policy if exists "Site backups read" on storage.objects;
create policy "Site backups read" on storage.objects for select using (bucket_id = 'site-backups');

-- Migration: add job_role and location to profiles
alter table profiles add column if not exists job_role text default '';
alter table profiles add column if not exists location text default '';
