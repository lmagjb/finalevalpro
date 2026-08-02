# EVALPRO — Web App Shell

Phase 1 deliverable: **Functional Web & Mobile App Shell, Database Schema,
Login/Registration & Role Routing** for EVALPRO: A PPST-Based Teacher
Promotion Readiness and Scoring System.

This package is the **web** side (Next.js). It covers:

- Database schema (`database/schema.sql`) — users/roles, teacher &
  admin officer profiles, and placeholder tables for the promotion
  workflow that gets built out next.
- Login & registration (email/password, hashed with bcrypt).
- Role-based routing: teachers land on `/teacher/dashboard`, admin
  officers land on `/ao/dashboard`; middleware blocks cross-role access.

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Create the database**
   ```bash
   mysql -u root -p < database/schema.sql
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your MySQL credentials and set `NEXTAUTH_SECRET` to a long
   random string (e.g. `openssl rand -base64 32`).

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000

## How the pieces fit together

```
src/
  app/
    page.tsx                  Landing page; redirects signed-in users by role
    login/page.tsx            Login form
    register/page.tsx         Registration form (choose Teacher or Admin Officer)
    teacher/dashboard/page.tsx Teacher-only page
    ao/dashboard/page.tsx      Admin-officer-only page
    api/auth/[...nextauth]/    NextAuth credentials provider
    api/auth/register/        Registration endpoint (hashes password, inserts user)
  lib/
    db.ts                     MySQL connection pool + user queries
    auth.ts                   NextAuth config (JWT session carries role)
  middleware.ts               Redirects if role doesn't match the route
database/
  schema.sql                  Full MySQL schema
```

## Next phases (not yet built)

- Teacher digital folder + document upload (MOVs)
- Automated COI/NCOI scoring against PPST indicators
- Promotion readiness checker
- Admin officer review/validation workflow
- React Native (Expo) mobile app, sharing the same API/auth patterns
