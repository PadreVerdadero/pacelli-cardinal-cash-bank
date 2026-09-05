# Pacelli Cardinal Cash Bank

Student reward-balance website for **Pacelli Catholic Schools**.

Anyone can view student Cardinal Cash balances. Teachers sign in with individual accounts to add/subtract cash, scan student QR codes, import rosters, and run the school store.

## Features

- Role-based logins: Super Admin, Admin, Teacher, Student
- Students only see their own balance (view-only)
- Staff can view all students, scan QR codes, and record transactions
- Admins manage store catalog items and activity reward values
- Manual student entry + CSV import
- Installable on phones (PWA / Add to Home Screen)

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeded logins

| Role | Username | Password |
|------|----------|----------|
| Super Admin | `jesse` | `CardinalCash#Jesse1` |
| Admin | `admin` | `pacelli123` |
| Teacher | `smith` | `pacelli123` |
| Student | `eanderson` | `student123` |

Change passwords before real school use. Super Admin accounts can never be deleted.

## CSV import format

```csv
firstName,lastName,studentNumber,grade,initialBalance
Maya,Foster,2001,9,10.00
```

`firstName` and `lastName` are required. Other columns are optional. A sample file is included as `sample-students.csv`.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — PostgreSQL connection string (Prisma Postgres, Neon, etc.)
- `AUTH_SECRET` — long random string
- `AUTH_URL` / `NEXT_PUBLIC_APP_URL` — your site URL (needed for correct QR links)

For production, set these in your host’s environment settings (for example Vercel Project Settings → Environment Variables).

## Using it like an app

On a phone or tablet browser, open the site and use **Add to Home Screen**. Teachers can then use **Scan QR** with the device camera.

## Branding

School colors used throughout: cardinal red, white, and navy blue.
