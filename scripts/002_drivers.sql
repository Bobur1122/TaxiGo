-- Create driver_profiles table
create table if not exists public.driver_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  license_number text,
  vehicle_model text,
  vehicle_color text,
  vehicle_plate text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'suspended')),
  current_lat double precision default 41.3111,
  current_lng double precision default 69.2797,
  is_online boolean default false,
  rating_avg numeric(3,2) default 0,
  total_rides integer default 0,
  wallet_balance numeric(12,2) default 0,
  documents_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.driver_profiles enable row level security;

-- Driver can read and update own profile
create policy "driver_profiles_select_own" on public.driver_profiles
  for select using (auth.uid() = id);

create policy "driver_profiles_update_own" on public.driver_profiles
  for update using (auth.uid() = id);

create policy "driver_profiles_insert_own" on public.driver_profiles
  for insert with check (auth.uid() = id);

-- Admin can read and update all driver profiles
create policy "driver_profiles_select_admin" on public.driver_profiles
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "driver_profiles_update_admin" on public.driver_profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Customers can see online approved drivers (for nearby drivers feature)
create policy "driver_profiles_select_online" on public.driver_profiles
  for select using (is_online = true and status = 'approved');

-- Auto-create driver profile when a driver signs up
create or replace function public.handle_new_driver()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'driver' then
    insert into public.driver_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_created_driver on public.profiles;

create trigger on_profile_created_driver
  after insert on public.profiles
  for each row
  execute function public.handle_new_driver();
