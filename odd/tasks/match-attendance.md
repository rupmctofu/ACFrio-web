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

| ID | Specs | Route | What it delivers |
| --- | --- | --- | --- |
| T1 | S5, S6 | inline | SQL schema, env contract, platform client and the attendance data layer |
| T2 | S1 | inline | "¿Quién eres?" panel over the squad photos, remembered choice, change-user |
| T3 | S2 | inline | Asistiré / No asistiré on the next match plus the live list of who is in and out |
| T4 | S3, S4 | inline | Acta upload: the owner files the scan and the match shows whether the acta is pending or reviewed |
| T5 | S3, S4 | inline | Owner reconciliation panel: correct the list against the acta and close the match |
| T6 | S1–S6 | inline | Docs: environment, deploy steps and how the owner files an acta |

## Log

**L1 — owner, original request (verbatim).**
"Podemos hacer que de alguna manera los jugadores se puedan loguear sin tener que hacer contraseña, simplemente cuando entre le diga quién eres y le salga toda la plantilla con sus fotos y puede seleccionar tal y se guarde si entras Jo, pues que el geo le da ahí en plan soy yo y que puedas cambiar de usuario en plan. Entonces, cuando hay el próximo partido que se ve ahí al inicio, haya un botón de asistiré o no asistiré y que queden registrados en plan quién viene y quién no viene a jugar el partido y que así la asistencia se marque automáticamente, aunque después pasaré el acta después del partido pasaré el acta para que revise si es correcto o no. Podemos hacer eso"

**L2 — owner, on the acta (verbatim).** "el acta es un escaneo de una hoja que el arbitro rellena en fisico con boli"

**L3 — decisions taken in the questionnaire.** Storage: Supabase (Postgres + API). Identity protection: open, one tap, anyone can mark for another, the acta corrects it. Acta closure: the physical scanned sheet, not an app-side workflow.

**L6 — owner, on what the list is for (verbatim).** "Simplemente será a nivel informativo para nosotros saber cuántos somos para el partido y luego si alguien en el último momento no puede venir y no lo ha cambiado en la web, pues en el acta se verá realmente quién vino y esos datos son los que luego suman o no suman, así has existido o no."

Decision from L6: the declared list is informational only — a headcount. The acta is authoritative, and the reconciled acta is what feeds appearances and totals. A last-minute no-show who never touched the web is corrected by the acta, never by the app guessing. This settles S4 and removes any temptation to auto-reconcile.

**L4 — decision, orchestrator.** S6 added so a missing environment never breaks the live site: every attendance surface degrades to an explanation instead of an error.

**L5 — decision, orchestrator.** The owner's own surfaces (filing an acta, closing a match) are the only protected ones: Supabase magic-link login for the addresses listed in `admins`. Players stay passwordless, as decided in L3. No shared password is invented.
