#!/usr/bin/env node

/**
 * Create Admin User Script
 * Usage: node scripts/create-admin.js <email> <password> <fullName> <phone>
 * Example: node scripts/create-admin.js admin@taxigo.com Bobur1122 "Admin User" "+998999999999"
 */

const args = process.argv.slice(2)

if (args.length < 2) {
  console.error('Usage: node scripts/create-admin.js <email> <password> [fullName] [phone]')
  console.error('Example: node scripts/create-admin.js admin@taxigo.com Bobur1122 "Admin User" "+998999999999"')
  process.exit(1)
}

const [email, password, fullName = 'Admin', phone = ''] = args

const payload = { email, password, fullName, phone }

console.log('Creating admin user...')
console.log('Email:', email)
console.log('Password: ••••••')
console.log('Full Name:', fullName)
console.log('Phone:', phone)

// For local development, make HTTP request to your dev server
const apiUrl = process.env.API_URL || 'http://localhost:3000'

fetch(`${apiUrl}/api/setup/create-admin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.error) {
      console.error('Error:', data.error)
      process.exit(1)
    }
    console.log('✓ Admin user created successfully!')
    console.log('User ID:', data.user.id)
    console.log('Email:', data.user.email)
    console.log('\nYou can now login at: http://localhost:3000/auth/login')
  })
  .catch((err) => {
    console.error('Failed to create admin user:', err.message)
    process.exit(1)
  })
