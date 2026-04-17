# HNG Stage 1: Data Persistence & API Design Assessment

This is the backend solution for HNG Stage 1 Data Persistence.

## Stack
- Node.js + Express
- PostgreSQL (via Supabase / Prisma ORM)
- Auto-configured for deployment on Vercel Serverless Functions

## Local Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your database connection in your `.env` file. Find your **URI** string from Supabase settings (make sure to include your password):
   ```env
   DATABASE_URL="postgres://postgres.xxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgres://postgres.xxxxxx:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
   ```

   **IMPORTANT FOR SUPABASE:** In order to use Supabase connection pooling effectively with Prisma, you should update `prisma/schema.prisma` datasource section to include `directUrl`:
   ```prisma
   datasource db {
     provider  = "postgresql"
     url       = env("DATABASE_URL")
     directUrl = env("DIRECT_URL")
   }
   ```

3. Push the Prisma schema to create the table structure in your Supabase database:
   ```bash
   npx prisma db push
   ```

4. Generate the Prisma client (also runs on `postinstall`):
   ```bash
   npx prisma generate
   ```

5. Run the server locally:
   ```bash
   npm start
   ```
   Your Local API will be active on `http://localhost:3000`

## Vercel Deployment

1. Make sure to commit all files to GitHub:
   ```bash
   git add .
   git commit -m "Init HNG Stage 1 backend"
   git push origin main
   ```
2. Connect the repository to Vercel.
3. Include the `DATABASE_URL` (and `DIRECT_URL` if used) in the **Vercel Environment Variables** before the first deployment.

## API Endpoints

- `POST /api/profiles`: Creates a new profile by calling out to Genderize, Agify, and Nationalize API and returning classification payload.
- `GET /api/profiles`: Get all profiles (Supports optional query parameters `gender`, `country_id`, `age_group` for case-insensitive filtering).
- `GET /api/profiles/:id`: Get a profile by standard UUIDv7 ID.
- `DELETE /api/profiles/:id`: Deletes a profile by UUID returning 204.
