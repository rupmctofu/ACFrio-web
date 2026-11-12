#!/usr/bin/env node
/**
 * Sync AC FRÍO's real competition data from the official CEGARRAF source.
 *
 * Writes src/data/competition.json and downloads every team crest to
 * public/assets/badges/<slug>.webp.
 *
 * The source pages are plain GET, UTF-8, and carry the whole season in one
 * response, so the Joomla matchday filter (a POST) is not needed and there is
 * no browser CORS problem: the data is fetched here, at build time, never by
 * the app.
 *
 * Usage: node scripts/sync-competition.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "https://cegarraf.gespic.com";
const SEASON = "2026-2027";
const CLUB_SLUG = "ac-frio";

const COMPETITIONS = [
  {
    key: "league",
    name: "3ª Divisió Grup B",
    slug: "tercera-divisio/grup-b",
  },
  {
    key: "cup",
    name: "La Copa 2027 Grup B",
    slug: "la-copa-2027/grup-b",
  },
];

const urlFor = (kind, slug) => `${BASE}/${kind}/${SEASON}/ceg/futbol/senior/${slug}`;

/* ---------------------------------------------------------------- helpers */

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  middot: "·",
  ndash: "–",
  mdash: "—",
};

function decodeEntities(value) {
  return value.replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === "#") {
      const code =
        entity[1].toLowerCase() === "x"
          ? Number.parseInt(entity.slice(2), 16)
          : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

function text(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** "22-10-2026" -> "2026-10-22" */
function isoDate(value) {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value.trim();
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { "user-agent": "acfrio-web-sync/1.0" } });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.text();
}

async function fetchBinary(url) {
  const response = await fetch(url, { headers: { "user-agent": "acfrio-web-sync/1.0" } });
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

/** Split a row into cells: the opening tag's attributes and the cell body. */
function cellsOf(rowHtml) {
  return rowHtml
    .split(/<td[\s>]/i)
    .slice(1)
    .map((chunk) => {
      const open = chunk.indexOf(">");
      const attributes = open === -1 ? chunk : chunk.slice(0, open);
      const classMatch = /^class="?([^">]*)"?/i.exec(attributes.trim());
      return {
        cls: classMatch ? classMatch[1].trim() : "",
        html: open === -1 ? "" : chunk.slice(open + 1),
      };
    });
}

const classIs = (cell, name) => cell.cls === name || cell.cls.startsWith(`${name} `);
const classHas = (cell, name) => cell.cls.split(" ").includes(name);

/* ---------------------------------------------------------------- parsing */

/**
 * The calendar page carries every matchday of the season. Each matchday is a
 * <th> with "Jornada N<span>(dd-mm-yyyy)</span>" followed by its rows.
 */
function parseCalendar(html) {
  const marks = [
    ...html.matchAll(
      /Jornada\s*(\d+)\s*<span class="fw-light ms-2">\s*\((\d{2}-\d{2}-\d{4})\)\s*<\/span>/g,
    ),
  ];

  const fixtures = [];

  marks.forEach((mark, index) => {
    const chunk = html.slice(
      mark.index,
      index + 1 < marks.length ? marks[index + 1].index : html.length,
    );
    const matchday = Number(mark[1]);

    for (const row of chunk.split(/<tr[\s>]/i).slice(1)) {
      const cells = cellsOf(row);
      const home = cells.find((cell) => classIs(cell, "1_team"));
      const away = cells.find((cell) => classIs(cell, "2_team"));
      const result = cells.find((cell) => classHas(cell, "match-result"));
      if (!home || !away || !result) continue; // the team that rests has no fixture row

      const homeTeam = /href=\/equip\/futbol\/senior\/([a-z0-9-]+)[^>]*>([^<]*)</i.exec(home.html);
      const awayTeam = /href=\/equip\/futbol\/senior\/([a-z0-9-]+)[^>]*>([^<]*)</i.exec(away.html);
      if (!homeTeam || !awayTeam) continue;

      const homeShield = cells.find((cell) => classIs(cell, "_1_team_shield"));
      const awayShield = cells.find((cell) => classIs(cell, "_2_team_shield"));
      // Teams without a picture source still carry a plain <img src>, and the
      // crest is also published on the team page, so keep a fallback chain.
      const crestOf = (cell) => {
        const html = cell?.html ?? "";
        return (
          (/srcset=(\S+?\.webp)/i.exec(html) ?? [])[1] ??
          (/<img[^>]+src=(\S+?\.(?:jpg|jpeg|png))/i.exec(html) ?? [])[1] ??
          null
        );
      };

      const schedule = /match-schedule>\s*(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2})/i.exec(result.html);
      const field = /match-field[^>]*>\s*<div[^>]*>([^<]*)<\/div>\s*([^<]*)</i.exec(result.html);
      const score = /<strong>\s*(\d+)\s*-\s*(\d+)\s*<\/strong>/i.exec(result.html);

      fixtures.push({
        matchday,
        date: schedule ? isoDate(schedule[1]) : null,
        time: schedule ? schedule[2] : null,
        field: field ? `${text(field[1])} ${text(field[2])}`.trim() : null,
        home: { slug: homeTeam[1], name: text(homeTeam[2]) },
        away: { slug: awayTeam[1], name: text(awayTeam[2]) },
        score: score ? { home: Number(score[1]), away: Number(score[2]) } : null,
        status: score ? "played" : "scheduled",
        crests: { home: crestOf(homeShield), away: crestOf(awayShield) },
      });
    }
  });

  return fixtures;
}

/**
 * Standings rows carry, in fixed order: rank, crest, team name, then 16 stat
 * columns (Partits PJ G E P | Casa PJ G E P | Fora PJ G E P | Gols GF GC DIF | Pts).
 * A competition without results yet leaves those cells empty, which means zero,
 * not "unknown", so the mapping is positional rather than a list of numbers.
 */
function parseTable(html) {
  const rows = [
    ...html.matchAll(/<tr class="?white"?[^>]*>([\s\S]*?)(?=<tr|<\/table|<\/tbody)/gi),
  ];

  return rows
    .map((row) => {
      const cells = cellsOf(row[1]);
      const rankCell = cells.find((cell) => classHas(cell, "rank"));
      const teamCell = cells.find((cell) => /link-team/i.test(cell.html));
      const teamMatch = /href=\/equip\/futbol\/senior\/([a-z0-9-]+)[^>]*>([^<]*)</i.exec(
        teamCell?.html ?? "",
      );

      // Rank, crest and team name come first; every cell after the team name is
      // a stat column, in the order documented above.
      const values = cells
        .slice(cells.indexOf(teamCell) + 1)
        .map((cell) => text(cell.html))
        .map((value) => (value === "" ? 0 : Number(value)))
        .map((value) => (Number.isFinite(value) ? value : 0));

      const base = {
        rank: rankCell ? Number(text(rankCell.html)) : null,
        slug: teamMatch ? teamMatch[1] : null,
        name: teamMatch ? text(teamMatch[2]) : null,
      };

      const stats =
        values.length >= 16
          ? { played: values[0], won: values[1], drawn: values[2], lost: values[3], goalsFor: values[12], goalsAgainst: values[13], goalDiff: values[14], points: values[15] }
          : values.length >= 8
            ? { played: values[0], won: values[1], drawn: values[2], lost: values[3], goalsFor: values[4], goalsAgainst: values[5], goalDiff: values[6], points: values[7] }
            : { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 };

      return { ...base, ...stats };
    })
    .filter((row) => row.slug);
}

function validateTable(table, label) {
  const problems = [];
  for (const row of table) {
    if (row.points !== row.won * 3 + row.drawn) {
      problems.push(`${label}: ${row.name} points ${row.points} != 3*${row.won}+${row.drawn}`);
    }
    if (row.played !== row.won + row.drawn + row.lost) {
      problems.push(
        `${label}: ${row.name} played ${row.played} != ${row.won}+${row.drawn}+${row.lost}`,
      );
    }
    if (row.goalsFor - row.goalsAgainst !== row.goalDiff) {
      problems.push(
        `${label}: ${row.name} goal difference ${row.goalDiff} != ${row.goalsFor}-${row.goalsAgainst}`,
      );
    }
  }
  return problems;
}

/* ------------------------------------------------------------------- main */

const teams = new Map();
const competitions = [];
const problems = [];

for (const competition of COMPETITIONS) {
  const calendarUrl = urlFor("calendari", competition.slug);
  const tableUrl = urlFor("classificacio", competition.slug);

  const calendarHtml = await fetchText(calendarUrl);
  const tableHtml = await fetchText(tableUrl);

  const fixtures = parseCalendar(calendarHtml);
  const table = parseTable(tableHtml);

  if (fixtures.length === 0) problems.push(`${competition.name}: no fixtures parsed`);
  if (table.length === 0) problems.push(`${competition.name}: no standings parsed`);
  problems.push(...validateTable(table, competition.name));

  for (const fixture of fixtures) {
    for (const side of ["home", "away"]) {
      const team = fixture[side];
      const crest = fixture.crests[side];
      const known = teams.get(team.slug) ?? { name: team.name, crest: null };
      teams.set(team.slug, { name: team.name || known.name, crest: known.crest ?? crest });
    }
    delete fixture.crests;
  }

  competitions.push({
    key: competition.key,
    name: competition.name,
    sources: { calendar: calendarUrl, table: tableUrl },
    table,
    fixtures,
  });
}

/* --------------------------------------------------------- crest download */

const badgesDir = path.join(ROOT, "public/assets/badges");
await mkdir(badgesDir, { recursive: true });

const crestFailures = [];
const crestsNotPublished = [];
for (const [slug, team] of teams) {
  // The calendar carries a crest for most teams; the rest publish it on their
  // team page, so fall back there before concluding it does not exist.
  if (!team.crest) {
    try {
      const teamHtml = await fetchText(`${BASE}/equip/futbol/senior/${slug}`);
      team.crest = (/\/images\/thumbs\/100x100\/\S+?\.webp/i.exec(teamHtml) ?? [])[0] ?? null;
    } catch (error) {
      crestFailures.push(`${slug}: team page unavailable (${error.message})`);
    }
  }
  if (!team.crest) {
    // Not an error: the club simply has no crest on the official source, so the
    // UI falls back to initials. Recorded so the gap is visible, not invented.
    team.crest = null;
    crestsNotPublished.push(team.name);
    continue;
  }
  const url = team.crest.startsWith("http") ? team.crest : `${BASE}${team.crest}`;
  try {
    const bytes = await fetchBinary(url);
    await writeFile(path.join(badgesDir, `${slug}.webp`), bytes);
    team.crest = `/assets/badges/${slug}.webp`;
  } catch (error) {
    crestFailures.push(`${slug}: ${error.message}`);
  }
}

/* -------------------------------------------------------------- write json */

const document = {
  season: SEASON,
  generatedAt: new Date().toISOString(),
  generator: "scripts/sync-competition.mjs",
  club: { slug: CLUB_SLUG, name: teams.get(CLUB_SLUG)?.name ?? "AC FRÍO" },
  teams: Object.fromEntries(
    [...teams].sort(([a], [b]) => a.localeCompare(b)).map(([slug, team]) => [slug, team]),
  ),
  competitions,
};

await writeFile(
  path.join(ROOT, "src/data/competition.json"),
  `${JSON.stringify(document, null, 2)}\n`,
  "utf8",
);

/* ------------------------------------------------------------------ report */

const club = (competition) =>
  competition.table.find((row) => row.slug === CLUB_SLUG) ?? null;

for (const competition of competitions) {
  const played = competition.fixtures.filter((f) => f.status === "played").length;
  console.log(
    `${competition.name}: ${competition.table.length} teams, ${competition.fixtures.length} fixtures (${played} played)`,
  );
  const own = club(competition);
  if (own) {
    console.log(
      `  ${own.name}: ${own.rank}º, ${own.points} pts (${own.won}-${own.drawn}-${own.lost}), ${own.goalsFor}-${own.goalsAgainst}`,
    );
  } else {
    problems.push(`${competition.name}: AC FRÍO is not in the table`);
  }
  const next = competition.fixtures.find(
    (f) => f.status === "scheduled" && (f.home.slug === CLUB_SLUG || f.away.slug === CLUB_SLUG),
  );
  if (next) {
    console.log(
      `  next: J${next.matchday} ${next.date} ${next.time} ${next.home.name} vs ${next.away.name} (${next.field})`,
    );
  } else {
    console.log("  next: no scheduled fixture for AC FRÍO");
  }
}

console.log(`crests: ${[...teams.values()].filter((t) => t.crest?.startsWith("/assets/")).length}/${teams.size} downloaded`);
if (crestsNotPublished.length) {
  console.log(`no crest published by the source (initials fallback): ${crestsNotPublished.join(", ")}`);
}

if (crestFailures.length) {
  console.warn("crest problems:");
  for (const failure of crestFailures) console.warn(`  - ${failure}`);
}
if (problems.length) {
  console.warn("data problems:");
  for (const problem of problems) console.warn(`  - ${problem}`);
  process.exitCode = 1;
}
