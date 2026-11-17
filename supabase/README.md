# Attendance backend — setup

The site now has a backend for one thing only: knowing how many players are
coming to the next match, and keeping the referee's scanned acta next to that
headcount. Everything else stays a static build.

## What the model assumes

- **The declared list is informational.** It answers "how many are we?".
- **The acta is authoritative.** It is a paper sheet the referee fills in with a
  pen. It gets scanned, filed here, and the owner checks the list against it.
- Nothing in the app reads the scan or infers attendance from it. A last-minute
  no-show who never touched the site is corrected by the acta, not by code.

## One-time setup

1. Create a project at [supabase.com](https://supabase.com) (free plan is enough
   for a 15-player squad).
2. Open **SQL Editor**, paste all of `supabase/schema.sql` and run it.
3. In **Authentication → Sign In / Providers**, keep **Email** enabled. The owner
   signs in with a magic link; no password is ever created.
4. Register the owner address, so the write policies apply to it:

   ```sql
   insert into public.admins (email) values ('you@example.com')
     on conflict (email) do nothing;
   ```

5. In **Project Settings → API**, copy **Project URL** and the **anon public**
   key into `.env.local` at the repository root:

   ```
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon public key>
   ```

   Both values are public and ship in the bundle. The data is protected by the
   row level security policies in the schema, not by hiding these keys.

6. To deploy, add the same two variables in Vercel (Production and Preview) and
   redeploy.

With no `.env.local` the site builds and deploys exactly as before; the
attendance surfaces say they are not connected instead of showing empty data.

## What each table is for

| Table | Written by | Read by | Meaning |
| --- | --- | --- | --- |
| `attendance` | anyone (upsert) | anyone | the declared answer per player and match |
| `matches` | created on first use via `ensure_match()` | anyone | one row per fixture, plus `closed_at` once checked |
| `actas` | owner only | owner only | the scan's path and its review state |
| `admins` | SQL editor only | nobody | which addresses count as the owner |

Players read the acta's state through `acta_state(match_id)` — `none`,
`pending` or `reviewed` — never the table, so no storage path leaks.

## Filing an acta

1. Photograph or scan the referee's sheet.
2. Sign in on the site with the owner address (magic link).
3. Upload the scan for that match; it is stored privately and shown as pending.
4. Compare it with the declared list, fix what is wrong, and close the match.
5. The closed acta is the record: it is what counts for appearances and totals.
