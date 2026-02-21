-- Create tariffs table
create table if not exists public.tariffs (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_uz text not null,
  description_en text,
  description_uz text,
  base_fare numeric(12,2) not null default 5000,
  per_km_rate numeric(12,2) not null default 2000,
  per_min_rate numeric(12,2) not null default 500,
  min_fare numeric(12,2) not null default 8000,
  multiplier numeric(4,2) not null default 1.0,
  icon text default 'car',
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tariffs enable row level security;

-- Everyone can read tariffs
create policy "tariffs_select_all" on public.tariffs
  for select using (true);

-- Only admin can manage tariffs
create policy "tariffs_insert_admin" on public.tariffs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "tariffs_update_admin" on public.tariffs
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "tariffs_delete_admin" on public.tariffs
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Add tariff_id to rides table
alter table public.rides add column if not exists tariff_id uuid references public.tariffs(id);

-- Seed default tariffs
insert into public.tariffs (name_en, name_uz, description_en, description_uz, base_fare, per_km_rate, per_min_rate, min_fare, multiplier, icon, sort_order)
values
  ('Economy', 'Ekonom', 'Affordable rides for everyday trips', 'Kundalik sayohatlar uchun arzon narxlar', 5000, 2000, 500, 8000, 1.0, 'car', 1),
  ('Comfort', 'Komfort', 'Better cars with more comfort', 'Qulayroq avtomobillar', 8000, 3000, 700, 12000, 1.4, 'armchair', 2),
  ('Business', 'Biznes', 'Premium vehicles for business trips', 'Biznes safarlari uchun premium avtomobillar', 15000, 5000, 1000, 20000, 2.0, 'briefcase', 3),
  ('XL', 'XL', 'Spacious vehicles for groups', 'Guruhlar uchun keng avtomobillar', 10000, 4000, 800, 15000, 1.6, 'users', 4)
on conflict do nothing;
