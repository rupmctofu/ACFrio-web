#!/usr/bin/env node
/**
 * Sync AC FRÍO's real competition data from the official CEGARRAF source.
 *
 * Writes src/data/competition.json and downloads every team crest to
 * public/assets/badges/<slug>.webp.
 *
 * The per-club social profiles come from the same team page the crest fallback
 * already reads: the club publishes them in its own contact block, and the site
 * only repeats what is printed there.
 *
 * Run `npm run assets:ink` afterwards: it derives the one-ink masks the page
 * paints on a fixture that is still weeks away (scripts/build-crest-masks.mjs).
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

/**
 * A published link, reduced to the two profiles a club page shows.
 *
 * The federation labels this field "Pàgina Web" and prints whatever the club
 * handed it — a website, a profile, or nothing. Only Instagram and Facebook are
 * wanted, so every other destination is ignored instead of being guessed into
 * one of them. The path is kept as published (handle case included, trailing
 * slash included) and the query string is dropped: the source uses it for
 * tracking, not for the address. Returns null for anything that is not one of
 * the two profiles.
 */
function socialLink(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null; // not an address at all
  }

  const host = url.host.toLowerCase();
  const instagram = /(^|\.)instagram\.com$/.test(host);
  const facebook = /(^|\.)facebook\.com$/.test(host);
  if (!instagram && !facebook) return null;

  return { network: instagram ? "instagram" : "facebook", url: `https://${host}${url.pathname}` };
}

/**
 * The social profiles of a club, read from its own contact block on the team
 * page, each null when the club publishes none.
 *
 * Only the "Dades del Club" block is scanned. The page also carries the
 * federation's own header and footer links, and a profile printed there belongs
 * to the federation, not to the club whose page this is — attaching it to every
 * club would be an invented link with a real URL.
 */
function parseSocial(teamHtml) {
  const social = { instagram: null, facebook: null };

  const start = teamHtml.indexOf("Dades del Club");
  if (start === -1) return social; // markup changed: no link, never a guess
  const end = teamHtml.indexOf("Dades del Camp", start);
  const block = teamHtml.slice(start, end === -1 ? undefined : end);

  for (const match of block.matchAll(/href="?([^"\s>]+)/gi)) {
    const link = socialLink(match[1]);
    // First of each network wins: the field is published once, and a repeat is
    // the same profile printed again, not a second account.
    if (link && social[link.network] === null) social[link.network] = link.url;
  }

  return social;
}

/**
 * Split a row into cells: the opening tag's attributes and the cell body.
 *
 * The source opens every cell with `<td …>` and never closes it with `</td>`,
 * so a closing-tag regex finds nothing; splitting on the opening tag is the only
 * way to count cells. The header rows are written the same way, with `<th …>`.
 */
function cellsOf(rowHtml, tag = "td") {
  return rowHtml
    .split(new RegExp(`<${tag}[\\s>]`, "i"))
    .slice(1)
    .map((chunk) => {
      const open = chunk.indexOf(">");
      const attributes = open === -1 ? chunk : chunk.slice(0, open);
      const classMatch = /^class="?([^">]*)"?/i.exec(attributes.trim());
      return {
        cls: classMatch ? classMatch[1].trim() : "",
        attrs: attributes,
        html: open === -1 ? "" : chunk.slice(open + 1),
      };
    });
}

const classIs = (cell, name) => cell.cls === name || cell.cls.startsWith(`${name} `);
const classHas = (cell, name) => cell.cls.split(" ").includes(name);

/** "Gols de Diferència" -> "GOLSDEDIFERENCIA": header labels compare by letters only. */
const normaliseLabel = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/**
 * The stat columns the table is read for, named the way the source names them.
 *
 * A label on its own is not enough to find a column: "PJ" is printed three
 * times (total, home, away) and "GC" means "won at home" inside the Casa group
 * but "goals conceded" inside the Gols group. So a column is matched by the
 * group printed above it plus its label, then by its tooltip title ("Gols
 * Ficats", "Gols Contrari", "Punts Totals"), and only then by its label, taken
 * leftmost because the totals group is always rendered before the home/away
 * splits. `sanction` is optional: older markup has no "S" column at all.
 */
const STAT_COLUMNS = [
  { key: "played", groups: ["PARTITS"], labels: ["PJ"], titles: ["PARTITSJUGATS"], required: true },
  { key: "won", groups: ["PARTITS"], labels: ["PG", "G"], titles: ["PARTITSGUANYATS"], required: true },
  { key: "drawn", groups: ["PARTITS"], labels: ["PE", "E"], titles: ["PARTITSEMPATATS"], required: true },
  { key: "lost", groups: ["PARTITS"], labels: ["PP", "P"], titles: ["PARTITSPERDUTS"], required: true },
  { key: "goalsFor", groups: ["GOLS"], labels: ["GF"], titles: ["GOLSFICATS"], required: true },
  { key: "goalsAgainst", groups: ["GOLS"], labels: ["GC"], titles: ["GOLSCONTRARI"], required: true },
  { key: "goalDiff", groups: ["GOLS"], labels: ["DIF", "DG"], titles: ["GOLSDEDIFERENCIA"], required: true },
  { key: "sanction", groups: ["S"], labels: ["S"], titles: ["SANCIO"], required: false },
  { key: "points", groups: ["PUNTS"], labels: ["PTS"], titles: ["PUNTSTOTALS"], required: true },
];

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
 * Read the standings header into a map from stat to absolute cell index.
 *
 * The header is two rows: a group row that spans ("Partits" colspan=4, "Casa",
 * "Fora", "Gols", "Punts") and a label row ("PJ PG PE PP | PJ GC EC PC | PJ GF
 * EF PF | GF GC DIF S | Pts"). Both are parsed, so every column is identified
 * by what the page calls it, not by where it happens to sit. A header the script
 * cannot understand throws here: writing plausible-looking zeros is worse than a
 * failed sync.
 */
function parseStandingsHeader(tableHtml, label) {
  const headRows = [...tableHtml.matchAll(/<thead[^>]*>([\s\S]*?)<\/thead>/gi)].flatMap((head) =>
    head[1]
      .split(/<tr[\s>]/i)
      .slice(1)
      .map((row) => cellsOf(row, "th")),
  );

  const columnRow = headRows.reduce((widest, row) => (row.length > widest.length ? row : widest), []);
  if (columnRow.length === 0) throw new Error(`${label}: the standings table has no header row`);

  // The group row is the one that spans: colspan is what separates the sections.
  const groupRow = headRows.find(
    (row) => row !== columnRow && row.some((cell) => /colspan=/i.test(cell.attrs)),
  );
  const groups = groupRow
    ? groupRow.flatMap((cell) => {
        const span = Number(/colspan="?(\d+)/i.exec(cell.attrs)?.[1] ?? 1);
        return Array.from({ length: span }, () => normaliseLabel(text(cell.html)));
      })
    : [];

  if (groups.length && groups.length !== columnRow.length) {
    throw new Error(
      `${label}: the header groups cover ${groups.length} columns but the labels cover ${columnRow.length}`,
    );
  }

  const columns = columnRow.map((cell, index) => ({
    index,
    group: groups[index] ?? "",
    label: normaliseLabel(text(cell.html)),
    title: normaliseLabel(/title="?([^">]+)"?/i.exec(cell.html)?.[1] ?? ""),
  }));

  const indexOf = {};
  const missing = [];
  for (const stat of STAT_COLUMNS) {
    const byGroup = columns.filter(
      (column) => column.group && stat.groups.includes(column.group) && stat.labels.includes(column.label),
    );
    const byTitle = columns.filter((column) => column.title && stat.titles.includes(column.title));
    const byLabel = columns.filter((column) => stat.labels.includes(column.label));
    const found = byGroup.length === 1 ? byGroup : byTitle.length === 1 ? byTitle : byLabel;
    if (found.length) indexOf[stat.key] = found[0].index;
    else if (stat.required) missing.push(`${stat.key} (${stat.labels.join("/")})`);
  }

  if (missing.length) {
    throw new Error(
      `${label}: cannot read the standings header, no column for ${missing.join(", ")}; ` +
        `columns seen: ${columns.map((column) => `${column.group || "-"}:${column.label || "?"}`).join(" ")}`,
    );
  }

  return { indexOf, columnCount: columnRow.length };
}

/**
 * The standings table.
 *
 * The page carries one table, not two: "Resumida" and "Detallada" are a radio
 * that hides columns of the same rows in the browser (`.table-rank-cell2` for
 * Casa/Fora, `.table-rank-cell1` for Partits). The script reads the totals —
 * the Partits group plus Gols and Punts, which is what Resumida shows — because
 * a home/away split is not a season figure.
 *
 * Every value is read through the header map. The source inserted a sanction
 * column ("S") between DIF and Pts, which is exactly why reading by position
 * turned every points value into 0 and Kongitos' sanction of -1 into its points.
 */
function parseTable(html, label) {
  const table = /<table[^>]*\btable-rank\b[^>]*>([\s\S]*?)<\/table>/i.exec(html);
  if (!table) throw new Error(`${label}: no standings table (table-rank) on the page`);

  const { indexOf, columnCount } = parseStandingsHeader(table[1], label);

  const rows = [
    ...table[1].matchAll(/<tr class="?white"?[^>]*>([\s\S]*?)(?=<tr|<\/table|<\/tbody)/gi),
  ];

  return rows
    .map((row) => {
      const cells = cellsOf(row[1]);
      const rankCell = cells.find((cell) => classHas(cell, "rank"));
      const teamCell = cells.find((cell) => /link-team/i.test(cell.html));
      const teamMatch = /href=\/equip\/futbol\/senior\/([a-z0-9-]+)[^>]*>([^<]*)</i.exec(
        teamCell?.html ?? "",
      );
      if (!teamMatch) return null; // not a club row

      const base = {
        rank: rankCell ? Number(text(rankCell.html)) : null,
        slug: teamMatch[1],
        name: text(teamMatch[2]),
      };

      const valueAt = (key) => {
        const index = indexOf[key];
        if (index === undefined) return 0; // a column this markup does not print
        const cell = cells[index];
        if (!cell) {
          throw new Error(
            `${label}: ${base.name} has ${cells.length} cells but the header has ${columnCount}`,
          );
        }
        const raw = text(cell.html);
        if (raw === "") return 0; // no matchday played yet: empty means zero
        const number = Number(raw.replace(",", "."));
        if (!Number.isFinite(number)) {
          throw new Error(`${label}: ${base.name} ${key} cell "${raw}" is not a number`);
        }
        return number;
      };

      return {
        ...base,
        played: valueAt("played"),
        won: valueAt("won"),
        drawn: valueAt("drawn"),
        lost: valueAt("lost"),
        goalsFor: valueAt("goalsFor"),
        goalsAgainst: valueAt("goalsAgainst"),
        goalDiff: valueAt("goalDiff"),
        points: valueAt("points"),
        sanction: valueAt("sanction"),
      };
    })
    .filter((row) => row !== null);
}

function validateTable(table, label) {
  const problems = [];
  for (const row of table) {
    // The source prints its own sanction column ("S"), and Kongitos carry -1 in
    // it: that is the whole difference between won*3+drawn and the printed points.
    const expected = row.won * 3 + row.drawn + row.sanction;
    if (row.points !== expected) {
      problems.push(
        `${label}: ${row.name} points ${row.points} != 3*${row.won}+${row.drawn} (sanction ${row.sanction}) = ${expected}`,
      );
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
  const table = parseTable(tableHtml, competition.name);

  if (fixtures.length === 0) problems.push(`${competition.name}: no fixtures parsed`);
  if (table.length === 0) problems.push(`${competition.name}: no standings parsed`);
  problems.push(...validateTable(table, competition.name));

  for (const fixture of fixtures) {
    for (const side of ["home", "away"]) {
      const team = fixture[side];
      const crest = fixture.crests[side];
      const known = teams.get(team.slug) ?? { name: team.name, crest: null };
      teams.set(team.slug, {
        name: team.name || known.name,
        crest: known.crest ?? crest,
        // Filled from the team page below; null until then, and null in the
        // written document when the club publishes no profile.
        social: known.social ?? { instagram: null, facebook: null },
      });
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
const socialFailures = [];
for (const [slug, team] of teams) {
  /*
   * One request per club covers both things the page carries: the crest the
   * calendar may leave out and the contact block with the club's own profiles.
   * Every club needs the second, so the page is read for all of them instead of
   * only for the crest-less few; the crest fallback is unchanged.
   */
  let teamHtml = null;
  let teamPageError = null;
  try {
    teamHtml = await fetchText(`${BASE}/equip/futbol/senior/${slug}`);
  } catch (error) {
    teamPageError = error.message;
    if (!team.crest) crestFailures.push(`${slug}: team page unavailable (${error.message})`);
    // The document still says null, but an unreadable page is not a club that
    // publishes nothing, so the run names the clubs it could not read.
    socialFailures.push(`${slug}: team page unavailable (${error.message})`);
  }

  if (teamHtml !== null) {
    // The calendar carries a crest for most teams; the rest publish it on their
    // team page, so fall back there before concluding it does not exist.
    team.crest =
      team.crest ??
      (/\/images\/thumbs\/100x100\/\S+?\.webp/i.exec(teamHtml) ?? [])[0] ??
      null;
    team.social = parseSocial(teamHtml);
  }

  if (!team.crest) {
    // Not an error: the club simply has no crest on the official source, so the
    // UI falls back to initials. Recorded so the gap is visible, not invented.
    team.crest = null;
    if (!teamPageError) crestsNotPublished.push(team.name);
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

const socials = [...teams].filter(([, team]) => team.social.instagram || team.social.facebook);
console.log(
  `social links: ${socials.length}/${teams.size} clubs publish one` +
    (socials.length ? ` (${socials.map(([slug]) => slug).join(", ")})` : ""),
);

if (crestFailures.length) {
  console.warn("crest problems:");
  for (const failure of crestFailures) console.warn(`  - ${failure}`);
}
if (socialFailures.length) {
  console.warn("social problems:");
  for (const failure of socialFailures) console.warn(`  - ${failure}`);
}
if (problems.length) {
  console.warn("data problems:");
  for (const problem of problems) console.warn(`  - ${problem}`);
  process.exitCode = 1;
}
