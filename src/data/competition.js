/**
 * Selectors over the synced competition data (src/data/competition.json).
 *
 * The JSON is produced by `node scripts/sync-competition.mjs` from the official
 * CEGARRAF pages. Nothing here invents a value: when the source does not
 * publish something (a crest, a played match), the selector returns null and the
 * caller decides how to show the gap.
 *
 * The coming-fixture selectors all read an explicit `now`, because the page draws
 * two fixture cards (league and cup) and exactly one of them is the active one:
 * both have to be decided from the same instant, or the hero surface and the
 * attendance block could land on different cards. `fixtureCardStates` is that
 * single decision, and a fixture only counts while its kickoff is still ahead.
 * The calendar gets its own selector (`calendarFixtures`) for the same reason:
 * it also reads one instant, but it keeps the played matches instead of
 * dropping them, so a finished day can be marked and its score shown.
 */
import competition from "./competition.json";

export const CLUB_SLUG = competition.club.slug;
export const club = competition.club;
export const generatedAt = competition.generatedAt;

export const competitions = competition.competitions;
export const findCompetition = (key) => competitions.find((item) => item.key === key) ?? null;
export const league = findCompetition("league");
export const cup = findCompetition("cup");

/**
 * Short display labels for official names that eat the width of a card.
 * Keyed by the source slug, so `competition.json` keeps the published name
 * byte for byte and only the label a card prints gets shorter. An entry is
 * added only when the owner has given the short form: nothing is generated
 * here, and nothing is shortened that was not asked for.
 *
 * History: "BAR DANSAIRES & NIU PROJECTES" -> "Dans Aires" (owner, S13).
 */
const SHORT_NAMES = {
  "bar-dansaires-niu-projectes": "Dansaires",
};

/**
 * The names the club actually uses, where the federation publishes a trade name
 * instead. The source lists the rival as "L'AUTENTICO BY FRANCESCO - PINTURES E.
 * BORRAS", which is a sponsor sheet rather than a team, and the owner wants the
 * club's own short form on the page (owner, L35). This is a display layer over
 * the synced data: `scripts/sync-competition.mjs` rewrites `competition.json` on
 * every run, so an override here survives and one in the JSON would not.
 */
const CLUB_NAMES = {
  francesco: "L'Autentico",
};

/** The name the club calls a club: its own override, else the source's. */
export const teamFullName = (slug) =>
  CLUB_NAMES[slug] ?? competition.teams[slug]?.name ?? slug;

/** The label a card prints: the short alias when one exists, else the full name. */
export const teamName = (slug) => SHORT_NAMES[slug] ?? teamFullName(slug);

export const teamCrest = (slug) => competition.teams[slug]?.crest ?? null;

/**
 * The social profiles a club publishes on its federation team page.
 *
 * Always the same two keys, each `null` when the club publishes none, so the
 * view never reaches into the JSON shape and never has to tell a missing field
 * from a missing profile. Nothing is derived here: the sync writes what the
 * source prints, and a club with no contact block keeps two nulls.
 */
export function teamSocial(slug) {
  const social = competition.teams[slug]?.social;
  return { instagram: social?.instagram ?? null, facebook: social?.facebook ?? null };
}

const INITIAL_STOPWORDS = new Set(["FC", "CF", "CD", "UD", "SC", "C.F.", "F.C."]);

/**
 * Initials for a club the source publishes no crest for. Real letters from the
 * real (official) name, never a drawn placeholder badge: the badge stays tied
 * to the data rather than to a display alias.
 */
export function teamInitials(slug) {
  const name = teamFullName(slug);
  const letters = name
    .replace(/[^A-Za-zÀ-ÿ0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !INITIAL_STOPWORDS.has(word.toUpperCase()))
    .map((word) => word[0].toUpperCase())
    .join("")
    .slice(0, 3);
  return letters || name.slice(0, 2).toUpperCase();
}

/** Which side of the fixture the club plays, or null when it is not involved. */
export function clubSide(fixture) {
  if (fixture.home.slug === CLUB_SLUG) return "home";
  if (fixture.away.slug === CLUB_SLUG) return "away";
  return null;
}

export const opponentOf = (fixture) =>
  clubSide(fixture) === "home" ? fixture.away : fixture.home;

const kickoff = (fixture) => `${fixture.date}T${fixture.time ?? "00:00"}`;

const withCompetition = (competition, fixture) => ({
  ...fixture,
  competitionKey: competition.key,
  competitionName: competition.name,
  competitionSource: competition.sources.calendar,
});

const clubFixturesOf = (competition) =>
  competition.fixtures.filter((fixture) => clubSide(fixture) !== null);

const byKickoffAsc = (a, b) => kickoff(a).localeCompare(kickoff(b));
const byKickoffDesc = (a, b) => kickoff(b).localeCompare(kickoff(a));

const DAY_MS = 86400000;

/**
 * A fixture stops being "next" the moment it kicks off, whatever status the
 * source still publishes for it (S5). The synced calendar keeps a matchday
 * `scheduled` until the next sync, so status alone left a played fixture on the
 * poster counting down to 00:00:00:00 forever.
 */
const stillAhead = (fixture, now) => {
  const at = fixtureKickoffAt(fixture);
  return at !== null && at > now;
};

const nextOf = (fixtures, now) =>
  fixtures
    .filter((fixture) => fixture.status === "scheduled" && stillAhead(fixture, now))
    .sort(byKickoffAsc)[0] ?? null;

/** Every club fixture of the given status, across every competition. */
function clubFixturesWithStatus(status) {
  const collected = [];
  for (const item of competitions) {
    for (const fixture of clubFixturesOf(item)) {
      if (fixture.status === status) collected.push(withCompetition(item, fixture));
    }
  }
  return collected;
}

/**
 * The next fixture of the club across every competition, by kickoff, never a
 * match whose kickoff already passed.
 */
export function nextFixture(now = Date.now()) {
  return nextOf(clubFixturesWithStatus("scheduled"), now);
}

/**
 * Every match of one round, ours included.
 *
 * The league is seven teams, so a matchday is three matches, all at 22:30 on the
 * same night: it is short enough to sit under the chosen day in the calendar and
 * read as a round instead of only as our own result.
 */
export function matchdayFixtures(competitionKey, matchday) {
  const competition = findCompetition(competitionKey);
  if (!competition || matchday == null) return [];
  return competition.fixtures
    .filter((fixture) => fixture.matchday === matchday)
    .map((fixture) => withCompetition(competition, fixture))
    .sort(byKickoffAsc);
}

/**
 * parameter instead of a module read so both fixture cards can be evaluated at
 * the same instant and agree on which of them is the active one (S10).
 */
export function nextFixtureOf(competitionKey, now = Date.now()) {
  const item = findCompetition(competitionKey);
  if (!item) return null;
  const next = nextOf(clubFixturesOf(item).map((f) => withCompetition(item, f)), now);
  return next;
}

/** The most recent played fixture of the club across every competition. */
export function lastFixture() {
  return clubFixturesWithStatus("played").sort(byKickoffDesc)[0] ?? null;
}

/** The following fixtures of the club, soonest first. */
export function nextFixtures(limit = 6, now = Date.now()) {
  const all = clubFixturesWithStatus("scheduled")
    .filter((fixture) => stillAhead(fixture, now))
    .sort(byKickoffAsc);
  return limit == null ? all : all.slice(0, limit);
}

/**
 * The season as the calendar draws it: what the club has already played plus
 * what is still ahead, soonest first.
 *
 * The calendar cannot use `nextFixtures` (S2): that one drops every kickoff
 * that has passed on purpose, because a countdown must never point at a match
 * that is over. A calendar reads the other way round. A day with a result has
 * to stay on the month grid to be marked as done and to show its score, and a
 * season that only ever lists the future is not the season anyone remembers.
 * Past kickoffs are still dropped from the `scheduled` half: a match the source
 * never marked played is not upcoming either.
 */
export function calendarFixtures(now = Date.now()) {
  return clubFixturesWithStatus("played")
    .concat(clubFixturesWithStatus("scheduled").filter((fixture) => stillAhead(fixture, now)))
    .sort(byKickoffAsc);
}

/** The last played fixtures of the club, most recent first, for the form card. */
export function recentResults(limit = 3) {
  const all = clubFixturesWithStatus("played").sort(byKickoffDesc);
  return limit == null ? all : all.slice(0, limit);
}

/**
 * How far ahead the league card looks before it stops being this week's match
 * (S7). A week is the unit the squad lives in: past it, "próximo partido" is no
 * longer a promise about Sunday.
 */
export const LEAGUE_WEEK_DAYS = 7;

/**
 * The state of the two fixture cards in the centre column at one instant.
 *
 * The point of returning both together is the single active card (S10): the one
 * whose kickoff comes first owns the red hero surface and the only attendance
 * block, and both cards can only agree on that if they are decided in one place
 * from the same `now`.
 *
 * The league card can be out of the running (S7): when its next match is more
 * than `LEAGUE_WEEK_DAYS` away it is not this week's fixture, so it steps back to
 * the flat grey treatment and the cup card takes the hero surface (S8) even
 * though it is further away.
 */
export function fixtureCardStates(now = Date.now()) {
  const leagueFixture = nextFixtureOf("league", now);
  const cupFixture = nextFixtureOf("cup", now);
  const leagueAt = fixtureKickoffAt(leagueFixture);
  const cupAt = fixtureKickoffAt(cupFixture);

  const leagueResting = leagueAt !== null && leagueAt - now > LEAGUE_WEEK_DAYS * DAY_MS;

  /*
   * Active means the sooner kickoff, full stop. The seven-day window is a
   * presentation flag on the league card, never a reason to hand the hero
   * surface to a match that is further away: with a league fixture eight days
   * out and a cup fixture twenty-eight days out, the league is the one to act
   * on, and sign-ups must follow it.
   */
  const contenders = [];
  if (leagueAt !== null) contenders.push({ key: "league", at: leagueAt });
  if (cupAt !== null) contenders.push({ key: "cup", at: cupAt });
  contenders.sort((a, b) => a.at - b.at);

  const activeKey = contenders[0]?.key ?? null;

  return {
    now,
    activeKey,
    league: {
      fixture: leagueFixture,
      active: activeKey === "league",
      resting: leagueResting,
      days: daysUntilFixture(leagueFixture, now),
    },
    cup: {
      fixture: cupFixture,
      active: activeKey === "cup",
      resting: false,
      days: daysUntilFixture(cupFixture, now),
    },
  };
}

/** One card's state, for a component that only draws one of the two. */
export const fixtureCardState = (competitionKey, now = Date.now()) =>
  fixtureCardStates(now)[competitionKey];

/**
 * A competition table plus the honest count of what the source has published.
 * `hasResults` is false until a matchday is played, because a table of zeros is
 * the source's initial order, not a ranking worth presenting as one.
 */
export function tableSummary(competition) {
  if (!competition) {
    return { competition: null, rows: [], playedMatches: 0, matchCount: 0, hasResults: false };
  }
  const playedMatches = competition.fixtures.filter(
    (fixture) => fixture.status === "played"
  ).length;
  return {
    competition,
    rows: competition.table,
    playedMatches,
    matchCount: competition.fixtures.length,
    hasResults: playedMatches > 0,
  };
}

export const leagueTable = () => tableSummary(league);
export const cupTable = () => tableSummary(cup);

/** "Local" or "Visitante" from the club's point of view, or null. */
export function homeAwayLabel(fixture) {
  const side = clubSide(fixture);
  if (side === "home") return "Local";
  if (side === "away") return "Visitante";
  return null;
}

/** The row of the club in a competition table. */
export const clubRow = (competition) =>
  competition.table.find((row) => row.slug === CLUB_SLUG) ?? null;

/** The team directly above the club in the table: the realistic next target. */
export function nextTargetRow(competition) {
  const own = clubRow(competition);
  if (!own || own.rank === null || own.rank <= 1) return null;
  return competition.table.find((row) => row.rank === own.rank - 1) ?? null;
}

const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

/** "jue, 26 nov" — the format the site already used, now fed by real dates. */
export function fixtureDateLabel(fixture) {
  if (!fixture.date) return "Fecha por confirmar";
  const date = new Date(`${fixture.date}T${fixture.time ?? "00:00"}:00`);
  return Number.isNaN(date.getTime()) ? fixture.date : dateFormatter.format(date);
}

export const fixtureTimeLabel = (fixture) => fixture.time ?? "—";

export const fixtureKickoffIso = (fixture) =>
  fixture?.date ? `${fixture.date}T${fixture.time ?? "00:00"}:00` : null;

/** The kickoff as a timestamp in milliseconds, or null when it cannot be read. */
export function fixtureKickoffAt(fixture) {
  const iso = fixtureKickoffIso(fixture);
  if (!iso) return null;
  const at = new Date(iso).getTime();
  return Number.isNaN(at) ? null : at;
}

/** Whole days between `now` and the kickoff, floored; null without a date. */
export function daysUntilFixture(fixture, now = Date.now()) {
  const at = fixtureKickoffAt(fixture);
  if (at === null) return null;
  return Math.max(0, Math.floor((at - now) / DAY_MS));
}

export const matchdayLabel = (fixture) =>
  `Jornada ${fixture.matchday} · ${fixture.competitionName}`;

export const scoreLabel = (fixture) =>
  fixture.score ? `${fixture.score.home} - ${fixture.score.away}` : null;

/** The club's own goals and the rival's in a played fixture, or null. */
export function clubScore(fixture) {
  if (!fixture?.score) return null;
  const side = clubSide(fixture);
  if (!side) return null;
  return { own: fixture.score[side], rival: fixture.score[side === "home" ? "away" : "home"] };
}

/** True when the club won, drew or lost the given played fixture. */
export function resultOf(fixture) {
  const score = clubScore(fixture);
  if (!score) return null;
  if (score.own > score.rival) return "win";
  if (score.own < score.rival) return "loss";
  return "draw";
}

/*
 * A club's page (S6, S7): any of the eleven, not only ours.
 *
 * Everything below is the club-level version of a selector that already existed
 * for AC FRÍO. The club is a parameter instead of the module constant, so a
 * rival's page reads the same published data through the same rules, and nothing
 * here depends on which club is being asked about. A squad or a player's
 * statistics are not here because the federation publishes neither (S8).
 */

/** The slug of a club the season publishes, or false for a typo in the address. */
export const isTeamSlug = (slug) => Boolean(slug) && Boolean(competition.teams[slug]);

/*
 * Short labels for the two competitions, over the key and not the published name:
 * `competition.json` keeps "3ª Divisió Grup B" byte for byte, and a fixture row
 * on a phone cannot print it. Only the key is mapped, so no name is invented.
 */
const COMPETITION_LABELS = { league: "Liga", cup: "Copa" };

export const competitionLabel = (key) =>
  COMPETITION_LABELS[key] ?? findCompetition(key)?.name ?? key;

/** A club's row in a competition table, or null when it does not play it. */
export const teamRow = (competition, slug) =>
  competition?.table.find((row) => row.slug === slug) ?? null;

/**
 * Where a club sits, and in which competition.
 *
 * Four of the eleven clubs only play the cup, so they have no league row at all.
 * Their position is the cup's, which is the one the source publishes; nothing is
 * invented to fill a league gap that does not exist.
 *
 * `hasResults` is read from the table's own figures, not from the calendar: the
 * cup already has one settled fixture while every row still reads zero played,
 * because the source has not recalculated its table. What makes a position earned
 * is the table having played matches in it, and this is the flag the page uses to
 * say whether the rank it prints was won or is the source's initial order.
 */
const standingOf = (competition, row) => ({
  competition,
  row,
  hasResults: competition.table.some((entry) => entry.played > 0),
});

export function teamStanding(slug) {
  const leagueRow = teamRow(league, slug);
  if (leagueRow) return standingOf(league, leagueRow);

  const cupRow = teamRow(cup, slug);
  if (cupRow) return standingOf(cup, cupRow);

  return null;
}

/** Every fixture of every competition that involves the club, by kickoff. */
export function teamFixtures(slug) {
  if (!isTeamSlug(slug)) return [];
  const collected = [];
  for (const item of competitions) {
    for (const fixture of item.fixtures) {
      if (fixture.home.slug === slug || fixture.away.slug === slug) {
        collected.push(withCompetition(item, fixture));
      }
    }
  }
  return collected.sort(byKickoffAsc);
}

/** The other club of a fixture, from the given club's point of view, or null. */
export function teamOpponent(slug, fixture) {
  if (fixture?.home.slug === slug) return fixture.away;
  if (fixture?.away.slug === slug) return fixture.home;
  return null;
}

/**
 * Win, draw or loss for any club, from that club's own side of the score.
 *
 * This is the whole reason a rival's page is worth opening: `resultOf` answers
 * the question for AC FRÍO only, and "won" has to mean the club whose page is
 * being read, not the club that owns the site. Null when the source published no
 * score — an unplayed fixture has no result, not a draw.
 */
export function teamScore(slug, fixture) {
  const score = fixture?.score;
  if (!score) return null;
  if (fixture.home.slug === slug) return { own: score.home, rival: score.away };
  if (fixture.away.slug === slug) return { own: score.away, rival: score.home };
  return null;
}

export function teamResult(slug, fixture) {
  const goals = teamScore(slug, fixture);
  if (!goals) return null;
  if (goals.own > goals.rival) return "win";
  if (goals.own < goals.rival) return "loss";
  return "draw";
}

/**
 * The club's form: its most recent played fixtures, newest first, with the result
 * of each already read from its own point of view.
 */
export function teamForm(slug, limit = 5) {
  const played = teamFixtures(slug)
    .filter((fixture) => fixture.status === "played" && fixture.score)
    .sort(byKickoffDesc);
  const recent = limit == null ? played : played.slice(0, limit);
  return recent.map((fixture) => ({ fixture, result: teamResult(slug, fixture) }));
}

/**
 * The club's season, split the way its page reads it: what has a result and what
 * has none yet.
 *
 * This does not use `stillAhead` on purpose, unlike `calendarFixtures`. A
 * countdown must never point at a match that already kicked off, so the calendar
 * drops those; a club's page is the inventory of the published season, and a
 * fixture the source still lists with a date cannot vanish from it. A scheduled
 * fixture whose night has passed is shown as pending, and the view says the
 * source has published no result for it — which is exactly what the data says.
 */
export function teamSchedule(slug) {
  const all = teamFixtures(slug);
  return {
    played: all.filter((fixture) => fixture.status === "played").sort(byKickoffDesc),
    pending: all.filter((fixture) => fixture.status !== "played").sort(byKickoffAsc),
  };
}

/**
 * The fixtures between a club and ours, played or pending: the crossing that makes
 * one page a link between two clubs. Empty for our own page, which has no crossing
 * with itself.
 */
export function teamFixturesAgainst(slug, rival = CLUB_SLUG) {
  if (!isTeamSlug(slug) || slug === rival) return [];
  return teamFixtures(slug).filter(
    (fixture) =>
      (fixture.home.slug === slug && fixture.away.slug === rival) ||
      (fixture.away.slug === slug && fixture.home.slug === rival)
  );
}
