-- Create withdrawals table
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null,
  phone_number text not null,
  status text default 'pending' check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.withdrawals enable row level security;

-- Drivers can view their own withdrawals
create policy "withdrawals_select_own" on public.withdrawals
  for select using (auth.uid() = driver_id);

-- Drivers can create withdrawal requests
create policy "withdrawals_insert_own" on public.withdrawals
  for insert with check (auth.uid() = driver_id);

-- Admin can view all withdrawals
create policy "withdrawals_select_admin" on public.withdrawals
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Admin can update withdrawal status
create policy "withdrawals_update_admin" on public.withdrawals
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
