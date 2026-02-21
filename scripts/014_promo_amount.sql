-- Add fixed-amount discounts for promo codes
alter table public.promo_codes
  add column if not exists discount_amount numeric(12,2);

alter table public.promo_codes
  alter column discount_percent drop not null;
