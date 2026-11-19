# Project instructions

## Design work

This project ships the **design-taste-frontend** skill at
`.agents/skills/design-taste-frontend/` (tasteskill 2.5.1, from
`Leonxlnx/taste-skill`). It is installed for this repository only, not globally.

Load `SKILL.md` before any of this work:

- designing or redesigning a page, section or card;
- restyling or polishing an existing screen;
- reviewing a design or judging whether it looks generated;
- choosing type, colour, layout, imagery or motion.

Its references live in `references/`, the art-direction library in `library/`,
and the licensed stand-in photographs in `assets/`. Read only the references the
brief needs; `SKILL.md` says which.

Constraints worth remembering without loading the skill:

- one section per screen, hero alone on the first screen;
- equal left and right content edges;
- every visual renders at 1440, 1024, 768 and 390 — never an empty ground;
- real photographs and real product UI, credits in one footer line, and no
  caption or description under any image.

Runtime: the skill's checks need Node 22+ and Chrome, Edge or Chromium. Its
`Stop` hook is a Claude Code hook and does not run under Pi, so run
`node .agents/skills/design-taste-frontend/scripts/gate.mjs` by hand after a
build.

Club-specific exceptions that override the skill where they conflict: the club
palette (`#E61C24` red on `#0D0D0D`), the existing card system described in
`design/system.md`, and Spanish copy in a dry, deadpan register.
