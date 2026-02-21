-- Add a 'name' column for simpler access, and fix icon values
alter table public.tariffs add column if not exists name text;

-- Update name from name_en
update public.tariffs set name = name_en where name is null;

-- Update icons to match frontend tariff icon keys
update public.tariffs set icon = 'economy' where name_en = 'Economy';
update public.tariffs set icon = 'comfort' where name_en = 'Comfort';
update public.tariffs set icon = 'business' where name_en = 'Business';
update public.tariffs set icon = 'xl' where name_en = 'XL';

-- Also add estimated_fare column to rides if not exists
alter table public.rides add column if not exists estimated_fare numeric(12,2);
alter table public.rides add column if not exists tariff_id uuid references public.tariffs(id);
