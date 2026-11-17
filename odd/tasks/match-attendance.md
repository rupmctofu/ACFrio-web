# Match attendance: passwordless identity, call-up buttons and the scanned acta

AC FRÍO · feature doc. Source of truth for specs, tasks and decisions.

## Specs

**S1 — Passwordless identity.** On entering, the site asks who you are and shows the whole squad with their photos. Selecting a face remembers that player on the device, the site greets that player, and the player can change user.

**S2 — Call-up buttons on the next match.** The next match on the home page carries two buttons, "Asistiré" and "No asistiré". The answers are recorded and shown: who comes, who does not. Attendance is marked from those answers.

**S3 — The acta is passed after the match.** After the match the owner uploads the acta so it can be checked whether the declared list was correct.

**S4 — The acta is a hand-filled paper sheet.** Owner's exact words: "el acta es un escaneo de una hoja que el arbitro rellena en fisico con boli". Consequence: the acta is evidence, not machine-readable input. The app stores the scan and the owner reconciles the list against it by hand. Nothing in the app infers attendance from the image.

**S5 — Storage and identity level, decided by the owner.** Supabase (Postgres + API) holds the data. Identity is open: one tap on your face, no password. Anyone can mark for anyone; the acta is what corrects it.

**S6 — The site must keep building and deploying with no Supabase credentials.** When the environment variables are absent the site renders exactly as today, and the attendance surfaces explain that they are not connected instead of failing silently.

## Tasks

| ID | Specs | Status | Evidence |
| --- | --- | --- | --- |
| T1 | S5, S6 | done | SQL schema, env contract, platform client and data layer — `ca880bb`, hardened in `HEAD`. `npm run build` exit 0 with no env; `npm test` 3/3. Live SQL unverified: no project exists yet. |
| T2 | S1 | done | "¿Quién eres?" over the squad photos, remembered on the device, change-user — `216b690`. Browser-checked at 1440 and 390: tap Pablo → `localStorage.acfrio.player = 1`, survives reload, "Cambiar" clears it and returns the face strip. |
| T3 | S2 | done, live round trip unverified | Asistiré / No asistiré plus the live list on the hero card — `5ef7bf6`. Disconnected state checked in the browser at 390; the connected path needs the project. |
| T4 | S3, S4 | pending | Acta upload and the pending/reviewed badge. `uploadActa`, `fetchActas`, `actaUrl`, `fetchActaState` exist in the data layer with zero call sites. |
| T5 | S3, S4 | pending | Owner panel: sign in by magic link, file the scan, compare it with the declared list, close the match. |
| T6 | S1–S6 | pending | Folding the closed actas back into `club-record.json` attendance, and the owner-side how-to. `supabase/README.md` covers setup and filing. |

## Log

**L1 — owner, original request (verbatim).**
"Podemos hacer que de alguna manera los jugadores se puedan loguear sin tener que hacer contraseña, simplemente cuando entre le diga quién eres y le salga toda la plantilla con sus fotos y puede seleccionar tal y se guarde si entras Jo, pues que el geo le da ahí en plan soy yo y que puedas cambiar de usuario en plan. Entonces, cuando hay el próximo partido que se ve ahí al inicio, haya un botón de asistiré o no asistiré y que queden registrados en plan quién viene y quién no viene a jugar el partido y que así la asistencia se marque automáticamente, aunque después pasaré el acta después del partido pasaré el acta para que revise si es correcto o no. Podemos hacer eso"

**L2 — owner, on the acta (verbatim).** "el acta es un escaneo de una hoja que el arbitro rellena en fisico con boli"

**L3 — decisions taken in the questionnaire.** Storage: Supabase (Postgres + API). Identity protection: open, one tap, anyone can mark for another, the acta corrects it. Acta closure: the physical scanned sheet, not an app-side workflow.

**L6 — owner, on what the list is for (verbatim).** "Simplemente será a nivel informativo para nosotros saber cuántos somos para el partido y luego si alguien en el último momento no puede venir y no lo ha cambiado en la web, pues en el acta se verá realmente quién vino y esos datos son los que luego suman o no suman, así has existido o no."

Decision from L6: the declared list is informational only — a headcount. The acta is authoritative, and the reconciled acta is what feeds appearances and totals. A last-minute no-show who never touched the web is corrected by the acta, never by the app guessing. This settles S4 and removes any temptation to auto-reconcile.

**L4 — decision, orchestrator.** S6 added so a missing environment never breaks the live site: every attendance surface degrades to an explanation instead of an error.

**L5 — decision, orchestrator.** The owner's own surfaces (filing an acta, closing a match) are the only protected ones: Supabase magic-link login for the addresses listed in `admins`. Players stay passwordless, as decided in L3. No shared password is invented.

**L7 — independent verification, findings and fixes.** A read-only verifier reviewed the first three commits (specs S1–S6, RLS, privileges, client failure modes, build). No blocking finding: anon cannot touch `closed_at`, cannot read `actas.storage_path`, cannot read `admins`, and the no-env path makes zero network calls. Two real defects and five nits were reported, all fixed here:

- `closeMatch` closed a match with no acta, setting `closed_at` on a reconciliation that never happened. It now throws unless the acta row was actually updated (S3/S4).
- `ensure_match` referenced the existing row schema-qualified (`public.matches.kickoff`) inside `ON CONFLICT DO UPDATE`, which Postgres rejects; every attendance write would have failed on first tap. Now unqualified.
- The match key had no season, so next season's cup matchday 1 would have reused this season's answers and acta. Key is now `(season, competition, matchday)`.
- `supabase/README.md` now says to turn password sign-in off: owner powers ride on the `email` claim, so an open sign-up could let anyone claim the owner address first.
- Added a storage DELETE policy, or the owner could never remove a bad scan.
- Load failures no longer read as "no se pudo guardar", and the scan timestamp comes from `fixtureKickoffIso` instead of being rebuilt inline.

**L8 — decision, orchestrator.** The project had no test runner, and the verifier could not establish any automated guard (item 6). `tests/no-backend.test.mjs` is now the first one, behind `npm test`: it proves the data layer imports outside a browser, that every call rejects with `backend-unavailable`, and that an unconfigured build makes no network request (S6). It needs no dependency and no build step.

**L9 — still unverified, needs the project.** The schema has never been executed: whether it runs at all, whether it runs twice, and every RLS behaviour at runtime. The declared write path (tap → upsert → live list) has not round-tripped. Those are the first checks once the owner hands over the URL and anon key.

**L11 — owner, first successful run (verbatim).** "Success. No rows returned" — `supabase/schema.sql` executed cleanly against the new project. The tables, the three functions and the 9 public-schema policies now exist.

**L12 — owner, storage (verbatim).** "Success. No rows returned" — `supabase/storage.sql` also ran clean, so the SQL-editor role could create policies on `storage.objects`; the interface fallback was not needed.

**L13 — live verification against the real project.** The pasted anon key was corrupted in transit: its JWT decoded to ref `exusfuwlpwjdmynbyx` (18 chars) while the real project ref is `exusfuwlpxfjqdmynbyx` (20), so every host lookup returned NXDOMAIN. With the publishable key and the real URL, `npm run verify:supabase` passed **8/8**: `ensure_match` is idempotent, anon reads matches but cannot close one, `admins` and `actas` are unreadable to anon, `acta_state` answers only its three states, and a declared answer upserts without duplicating.

**L14 — the connected UI, in the browser.** On the production build pointed at the real project: tapping Pablo then "Asistiré" showed `APUNTADO`, `1 DE 15 APUNTADOS` and `VAN: PABLO`, and the row was read back from Postgres as `{match_id: 3, player_id: 1, status: in}` for the real cup matchday 1 fixture. The React wiring is no longer unverified.

**L15 — test rows to clean up.** The probe left `matches` id 1 (`matchday 999`, rival PROBE) with an `attendance` row for player 1, and the real matchday 1 fixture (id 3) holds the browser test's `in` for Pablo. Both are removable with `delete from public.matches where matchday = 999;` and `delete from public.attendance where match_id = 3;`.

Action taken: `schema.sql` was split. The four policies and the bucket insert moved to `supabase/storage.sql`, because they are the only statements touching `storage.objects`, a table owned by Supabase's internal roles, and a rejection there is the most common failure in this setup. The public schema now runs on its own, unaffected by storage permissions, and the README documents the interface fallback (bucket + four policies with `bucket_id = 'actas' and public.is_owner()`).
