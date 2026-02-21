-- Create rides table
create table if not exists public.rides (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id),
  driver_id uuid references public.driver_profiles(id),
  pickup_address text not null,
  pickup_lat double precision not null,
  pickup_lng double precision not null,
  dropoff_address text not null,
  dropoff_lat double precision not null,
  dropoff_lng double precision not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'arriving', 'in_progress', 'completed', 'cancelled')),
  fare_estimate numeric(12,2),
  fare_final numeric(12,2),
  distance_km numeric(8,2),
  duration_min numeric(8,2),
  promo_code text,
  cancel_reason text,
  created_at timestamptz default now(),
  accepted_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz
);

alter table public.rides enable row level security;

-- Customer can see own rides
create policy "rides_select_customer" on public.rides
  for select using (auth.uid() = customer_id);

-- Customer can insert own rides
create policy "rides_insert_customer" on public.rides
  for insert with check (auth.uid() = customer_id);

-- Customer can update own rides (cancel)
create policy "rides_update_customer" on public.rides
  for update using (auth.uid() = customer_id);

-- Driver can see assigned rides
create policy "rides_select_driver" on public.rides
  for select using (auth.uid() = driver_id);

-- Driver can update assigned rides
create policy "rides_update_driver" on public.rides
  for update using (auth.uid() = driver_id);

-- Driver can see pending rides (to accept them)
create policy "rides_select_pending" on public.rides
  for select using (status = 'pending');

-- Admin can see all rides
create policy "rides_select_admin" on public.rides
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Admin can update all rides
create policy "rides_update_admin" on public.rides
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Create indexes for performance
create index if not exists idx_rides_customer_id on public.rides(customer_id);
create index if not exists idx_rides_driver_id on public.rides(driver_id);
create index if not exists idx_rides_status on public.rides(status);
create index if not exists idx_rides_created_at on public.rides(created_at desc);
