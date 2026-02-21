# Admin Account Setup

## Problem
Public signup allows users to choose any role. Admin panel should only be accessible to authorized admins.

## Solution
Only customer and driver roles are available in the signup form. To make someone an admin, follow these steps:

### Step 1: Register as Normal User
1. Go to `http://localhost:3000/auth/sign-up`
2. Choose "Yo'lovchi" (Customer) or "Haydovchi" (Driver)
3. Fill in your details:
   - Full Name: `Bobur Admin`
   - Phone: `+998999999999`
   - Email: `admin@taxigo.com`
   - Password: `Bobur1122`
4. Click "Sign Up"

### Step 2: Update User Role in Database
Once registered, you need to update their role to 'admin' in the `profiles` table.

**Using Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@taxigo.com'
);
```

**Or using the API endpoint:**
```bash
curl -X POST http://localhost:3000/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@taxigo.com",
    "password": "Bobur1122",
    "fullName": "Bobur Admin",
    "phone": "+998999999999"
  }'
```

### Step 3: Login as Admin
1. Go to `http://localhost:3000/auth/login`
2. Enter your email and password
3. You'll be redirected to `/admin` dashboard

## Admin Dashboard
Once logged in as admin, you can:
- Manage drivers (approve, reject, suspend)
- View all riders and their profiles
- Analytics for rides
- **Manage tariffs (pricing)** - Set multipliers for Economy, Comfort, Business, XL
- Manage promo codes

## Security Notes
- ⚠️ The `/api/setup/create-admin` endpoint should be disabled in production
- Only update the database role for trusted users
- Admin is now restricted - only those with admin role in database can access `/admin`
