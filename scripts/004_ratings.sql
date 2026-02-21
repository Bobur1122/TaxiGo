-- Create ratings table
create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id),
  to_user_id uuid not null references public.profiles(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique(ride_id, from_user_id)
);

alter table public.ratings enable row level security;

-- Users can see ratings about them
create policy "ratings_select_own" on public.ratings
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- Users can insert their own ratings
create policy "ratings_insert_own" on public.ratings
  for insert with check (auth.uid() = from_user_id);

-- Admin can see all ratings
create policy "ratings_select_admin" on public.ratings
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
