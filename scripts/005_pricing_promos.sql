-- Create pricing_settings table (single row)
create table if not exists public.pricing_settings (
  id uuid primary key default gen_random_uuid(),
  base_fare numeric(12,2) not null default 5000,
  per_km_rate numeric(12,2) not null default 2000,
  per_min_rate numeric(12,2) not null default 500,
  surge_multiplier numeric(4,2) not null default 1.0,
  updated_at timestamptz default now()
);

alter table public.pricing_settings enable row level security;

-- Everyone can read pricing
create policy "pricing_select_all" on public.pricing_settings
  for select using (true);

-- Only admin can update pricing
create policy "pricing_update_admin" on public.pricing_settings
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Create promo_codes table
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent >= 1 and discount_percent <= 100),
  max_uses integer default 100,
  current_uses integer default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.promo_codes enable row level security;

-- Everyone can read active promo codes
create policy "promos_select_all" on public.promo_codes
  for select using (true);

-- Only admin can insert/update/delete promo codes
create policy "promos_insert_admin" on public.promo_codes
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "promos_update_admin" on public.promo_codes
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "promos_delete_admin" on public.promo_codes
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
