-- Seed default pricing settings
insert into public.pricing_settings (base_fare, per_km_rate, per_min_rate, surge_multiplier)
values (5000, 2000, 500, 1.0)
on conflict do nothing;
