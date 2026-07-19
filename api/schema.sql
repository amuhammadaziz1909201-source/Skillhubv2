-- SkillHub V2 Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  full_name text not null default '',
  first_name text default '',
  last_name text default '',
  password_hash text not null,
  avatar text default '',
  bio text default '',
  role text default 'user' check (role in ('user', 'admin')),
  skills text[] default '{}',
  links jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects table
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
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

-- Notifications table
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  message text not null,
  type text default 'info' check (type in ('info', 'warning', 'error', 'success')),
  read boolean default false,
  created_at timestamptz default now()
);

-- Comments table
create table if not exists comments (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);

-- Likes junction table
create table if not exists project_likes (
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- Follows junction table
create table if not exists follows (
  follower_id uuid references users(id) on delete cascade,
  following_id uuid references users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

-- Indexes
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_comments_project_id on comments(project_id);
create index if not exists idx_projects_created_at on projects(created_at desc);

-- Row Level Security
alter table users enable row level security;
alter table projects enable row level security;
alter table notifications enable row level security;
alter table comments enable row level security;
alter table project_likes enable row level security;
alter table follows enable row level security;

-- Policies
create policy "Users can read all profiles" on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

create policy "Anyone can read projects" on projects for select using (true);
create policy "Users can create projects" on projects for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on projects for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on projects for delete using (auth.uid() = user_id);

create policy "Users can read own notifications" on notifications for select using (auth.uid() = user_id);
create policy "System can create notifications" on notifications for insert with check (true);

create policy "Anyone can read comments" on comments for select using (true);
create policy "Users can create comments" on comments for insert with check (auth.uid() = user_id);

create policy "Anyone can read likes" on project_likes for select using (true);
create policy "Users can toggle likes" on project_likes for all using (auth.uid() = user_id);

create policy "Anyone can read follows" on follows for select using (true);
create policy "Users can toggle follows" on follows for all using (auth.uid() = follower_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at before update on users for each row execute function update_updated_at();
create trigger projects_updated_at before update on projects for each row execute function update_updated_at();
