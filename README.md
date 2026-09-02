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


## Update: connected dashboards (this package)

This package wires up the full role set and the designs from `ui/`:

- **New roles**: Principal, AO II, PSDS, HR - AO IV. HRMPSB and SDS still
  have no dashboard (no design exists for them yet). `admin_officer` is
  kept for backward compatibility with existing accounts.
- **Teacher**: dashboard, digital folder (upload MOVs by PPST domain),
  notifications, profile, readiness checker.
- **Principal / AO II / PSDS / HR - AO IV**: each gets a real queue at
  their stage, a document review panel (verify/reject MOVs with remarks),
  and Forward / Return actions with an audit trail.
- **AO Evaluation Dashboard** (`/ao/dashboard`, `admin_officer` role):
  the rank recommendation table — every submitted candidate scored and
  sorted by verified COI/NCOI points plus experience.
- Score only counts **verified** documents now, not just uploaded ones —
  a document has to be reviewed before it contributes points.
- Files are stored as bytes directly in MySQL (`documents.file_data`) —
  no external file-storage service is configured yet, so uploads stay
  free. Revisit if you outgrow it (Cloudflare R2 / Google Drive were
  discussed earlier as options).
- The ranking/scoring formula is deterministic, not a trained model —
  worth saying plainly if it comes up in your defense.

### Run all three migrations before deploying

None of them touch existing data — only new tables/columns, and a widened
`role` enum. Run them once, in order:

```bash
mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_002_expand_roles_and_features.sql
mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_003_document_review.sql
mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_004_teacher_demographics.sql
```

No new environment variables needed.

### Sprint 3 addition: demographic ranking statistics

The AO Evaluation Dashboard now shows candidate counts and average scores
broken down by **sex** and **age group**, below the ranking table. Age is
computed from the teacher's birth date. Both fields are optional on the
Profile page — a teacher who hasn't filled them in shows up under "Not
specified" in the breakdown rather than being excluded.

## Update: real DepEd scoring framework (sourced from Figma Make prototype)

You shared a Figma Make prototype (EVALPRO_Prototype.make) as a reference.
It had researched the actual DepEd RFTP/CAReER framework in depth — real
data this app's scoring was missing. Ported in, keeping this app's
existing depedBlue design (not the prototype's own visual style):

- **The 37 official PPST Proficient-level indicators** (21 COI + 16 NCOI),
  sourced from DO s2025_024 / DBM-DepEd JC Form No. 2-A. Seeded into
  `ppst_indicators` by migration 005.
- **Real point structure**: Education(10) + Training(10) + Experience(10)
  + Performance(30) + COI(25) + NCOI(15) = 100, replacing the old
  arbitrary placeholder formula.
- **Performance requirements per target position** (Teacher II through
  Master Teacher III) — a genuine pass/fail gate based on how many
  indicators are rated Outstanding/Very Satisfactory, separate from the
  numeric score.
- **New Teacher page**: `/teacher/qualifications` — self-declare
  Education/Training/Experience/Eligibility records, set a target
  position, log IPCRF ratings.
- **New Principal capability**: an "Evaluate PPST Indicators" panel
  (rate all 37 indicators O/VS/X) plus numeric COI/NCOI score entry,
  inside the existing queue view.
- **AO Evaluation Dashboard** ranking table now shows the full real
  breakdown and a Requirements Met/Not Met column per candidate.

Honest note on what's *not* auto-computed: COI/NCOI numeric scores and
IPCRF-based Performance points are evaluator/teacher-entered, not derived
by a formula — that matches the real system, where these come from actual
classroom observation and portfolio review, not something a document
count could approximate.

### One more migration to run

```bash
mysql -h <host> -P <port> -u <user> -p evalpro < database/migration_005_ppst_scoring_framework.sql
```

### Verified before packaging

Tested against a real MySQL-compatible server this time, not just a
type-check: all 5 migrations run in sequence, then a full flow —
register (all 6 roles) → login → submit application → Principal rates an
indicator and sets scores → forwards to AO II → AO Evaluation Dashboard
ranking reflects it correctly, including a false "Requirements Met" when
the position's indicator threshold genuinely isn't met yet.
