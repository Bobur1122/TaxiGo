-- Add additional driver profile fields
alter table public.driver_profiles
  add column if not exists vehicle_class text,
  add column if not exists vehicle_year integer,
  add column if not exists experience_years integer;
