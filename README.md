# Pacelli Cardinal Cash Bank

Student reward-balance website for **Pacelli Catholic Schools**.

Anyone can view student Cardinal Cash balances. Teachers sign in with individual accounts to add/subtract cash, scan student QR codes, import rosters, and run the school store.

## Features

- Public student balance directory and student pages
- Unique QR code per student (scan opens that student’s page)
- Teacher-only balance adjustments and store checkout
- Manual student entry + CSV import
- Individual teacher accounts
- Installable on phones (PWA / Add to Home Screen)

## Quick start

```bash
npm install
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Seeded teacher logins

Password for all seed teachers: `pacelli123`

- `admin@pacelli.edu`
- `smith@pacelli.edu`
- `johnson@pacelli.edu`

Change these before real school use.

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
