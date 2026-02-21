-- Create admin user in auth.users table
-- Email: admin@taxigo.com
-- Password will be set via Supabase auth admin API
-- Note: This script creates the profile entry. The actual auth user must be created via API or signup.

-- This is a placeholder - admin users are created via sign-up with role='admin'
-- Or use Supabase dashboard Auth > Users > Add User

-- For local testing, create a profile entry for admin
INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
VALUES (
  'admin-placeholder-id',
  'Admin User',
  '+998 99 999 99 99',
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
