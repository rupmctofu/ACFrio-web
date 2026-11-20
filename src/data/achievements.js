/**
 * Achievements: the club's catalogue, and the evaluator that decides it.
 *
 * The rule that shapes this whole file: an entry may only exist if it can be
 * corroborated with data the project actually holds. That data is
 * src/data/competition.json (every fixture, its score and status, both tables),
 * src/data/club-record.json (goals per player with the league/cup split, cards,
 * the called-up list per matchday), the per-match acta ledger
 * (src/data/match-ledger.json, read only through src/lib/match-ledger.js) and
 * the MVP votes in Supabase (src/lib/mvp.js). The signed match report (acta)
 * carries the team sheet with shirt numbers, the goals counted per player,
 * yellow and red cards, the final score, the referee and the pitch — and nothing
 * else: no minutes, no assists, and no record of how a goal was scored. So there
 * is no entry here about comebacks, penalties, free kicks, last-minute goals,
 * assists or the order of the goals inside one match: none of those could ever
 * be proven from the source, and an achievement nobody can prove is a lie with a
 * trophy on it.
 *
 * For a long time that also ruled out every "what happened in ONE match" entry:
 * the record kept season totals and a league/cup split, so a double, a hat-trick
 * or two cards in the same afternoon had nowhere to be read from. It was the
 * model that was missing, not the source — the acta has carried those facts all
 * along. They now live in the ledger, and the entries that need them are decided
 * only when a row exists for that competition and matchday: an absent row is an
 * acta nobody has transcribed yet, which is an unknown and never a zero.
 *
 * Everything below is a pure function of its input, read at read time. Nothing
 * is stored and nothing is incremented: the same input always gives the same
 * answer, and an entry can only be unlocked by evidence that is in the data. The
 * evaluator is defensive in one direction only — missing optional data (no
 * votes, no called-up list, no actas yet, an empty season) means LOCKED, never a
 * crash and never a free trophy.
 *
 * The module imports no data on purpose. The caller hands over the fixtures (the
 * shape src/data/competition.js already produces, with `competitionKey`), the
 * club record (src/data/club-record.json), the squad (src/data/teamData.json)
 * and, when there is a backend, the vote rows. That keeps the catalogue
 * evaluable in a test with no browser, no network and no Supabase.
 */
import { normalise } from "../lib/club-code.js";
import { clubLedger, matchCards, matchGoals, playerTotals, readLedger } from "../lib/match-ledger.js";

/**
 * The club whose achievements these are. It is the same slug
 * src/data/competition.json publishes as `club.slug`; it is written here as a
 * default and not as a result, so a caller that already knows the club can pass
 * its own and nothing below has to guess which side of a fixture is ours.
 */
export const CLUB_SLUG = "ac-frio";

/*
 * Thresholds.
 *
 * Every number below is a threshold, never a result: it says how much is enough,
 * and the data says whether it happened. They are the figures the owner's 100-achievement
 * catalogue names (three goals, five goals, ten called up, ten league goals, ten votes,
 * five and ten matches, five and ten goals, two wins, three unbeaten, three MVPs, and the
 * longer ladders behind them), which is why they are round numbers and not tuned ones.
 *
 * A threshold above what a single season can reach (100 goals, 20 votes, 20 matchdays) is
 * kept on purpose: it is the owner's ladder, and an entry that is simply hard is not the
 * same thing as an entry that cannot be proven.
 */

/* Team: results, goals, runs. */
const WIN_BY = 2;
const WIN_BY_THREE = 3;
const WIN_BY_FIVE = 5;
const THREE_GOALS_IN_A_MATCH = 3;
const FIVE_GOALS_IN_A_MATCH = 5;
const SEVEN_GOALS_IN_A_MATCH = 7;
const WINS_IN_A_ROW = 2;
const THREE_WINS_IN_A_ROW = 3;
const FIVE_WINS_IN_A_ROW = 5;
const TEN_WINS = 10;
const UNBEATEN_IN_A_ROW = 3;
const FIVE_UNBEATEN = 5;
const TEN_UNBEATEN = 10;
const THREE_HOME_WINS = 3;
const THREE_AWAY_WINS = 3;
const TEN_GOALS_FOR = 10;
const TWENTYFIVE_GOALS_FOR = 25;
const FIFTY_GOALS_FOR = 50;
const HUNDRED_GOALS_FOR = 100;
const TEN_LEAGUE_GOALS = 10;
const FIVE_SCORING_MATCHES_IN_A_ROW = 5;
const TEN_SCORING_MATCHES_IN_A_ROW = 10;
const FIVE_SCORERS_IN_A_COMPETITION = 5;

/* Team: defence, table, calendar. */
const THREE_CLEAN_SHEETS = 3;
const FIVE_CLEAN_SHEETS = 5;
const THREE_CLEAN_SHEETS_IN_A_ROW = 3;
const FIVE_WITHOUT_CONCEDING_THREE = 5;
const TEN_POINTS = 10;
const TWENTY_POINTS = 20;
const TOP_FIVE = 5;
const PODIUM = 3;
const FIVE_CUP_MATCHES = 5;
const TEN_CALLED_UP = 10;

/* Player: matches, goals, cards. */
const FIVE_MATCHES = 5;
const TEN_MATCHES = 10;
const FIFTEEN_MATCHES = 15;
const TWENTY_MATCHES = 20;
const FIVE_CONSECUTIVE_CALL_UPS = 5;
const TEN_CONSECUTIVE_CALL_UPS = 10;
const FIVE_GOALS = 5;
const TEN_GOALS = 10;
const FIFTEEN_GOALS = 15;
const TWENTY_GOALS = 20;
const TWENTYFIVE_GOALS = 25;
const FIVE_LEAGUE_GOALS = 5;
const THREE_CUP_GOALS = 3;
/* Player: what one match alone can prove. These read the acta ledger. */
const DOUBLE = 2;
const HAT_TRICK = 3;
const FOUR_GOALS_IN_A_MATCH = 4;
const THREE_MATCH_SCORING_RUN = 3;
const FIVE_MATCH_SCORING_RUN = 5;
const THREE_SCORING_RUNS = 3;
const TWO_CARDS_IN_A_MATCH = 2;
const THREE_YELLOWS_IN_A_ROW = 3;
const THREE_YELLOWS = 3;
const FIVE_YELLOWS = 5;
const TEN_YELLOWS = 10;
const TWO_REDS = 2;

/* Player: MVP votes. A vote received and a voting won are two different facts. */
const ONE_VOTE = 1;
const FIVE_VOTES = 5;
const TEN_VOTES = 10;
const TWENTY_VOTES = 20;
const FIVE_VOTERS = 5;
const TEN_VOTERS = 10;
const THREE_MVPS = 3;
const FIVE_MVPS = 5;
const TEN_MVPS = 10;
const TWO_MVPS_IN_A_ROW = 2;
const TEN_MVP_VOTES = 10;

const asArray = (value) => (Array.isArray(value) ? value : []);

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

const sum = (list, pick) => list.reduce((total, item) => total + (pick(item) || 0), 0);

const max = (list, pick) => list.reduce((best, item) => Math.max(best, pick(item) || 0), 0);

/**
 * One player's goals in one competition, off the record's league/cup split.
 *
 * The record publishes that split and only that split, so a competition the
 * split does not name has no per-player figure — and a missing figure is never a
 * goal. It is a module-level function and not a closure inside `seasonFacts`
 * because the per-player entries read the same split, and two copies of this
 * rule is how "Pichichi del equipo" and its own tile start to disagree.
 */
const competitionGoalsOf = (player, key) =>
  key === "league" ? player.leagueGoals : key === "cup" ? player.cupGoals : 0;

/** "2026-11-17" + "22:30", the way competition.js orders two fixtures. */
const kickoffOf = (match) => `${match.date ?? ""}T${match.time ?? "00:00"}`;

/**
 * One played fixture, read from the club's own side.
 *
 * A fixture counts as evidence only when the source says it was played AND
 * published a score for it: a scheduled match with a stray score is not proof
 * that anything happened, and a played match with no score is not a result. Null
 * means "this fixture proves nothing", which is the answer the caller must be
 * able to see instead of a zero.
 */
function readMatch(fixture, clubSlug) {
  if (!fixture || fixture.status !== "played") return null;
  const score = fixture.score;
  if (!score || !isNumber(score.home) || !isNumber(score.away)) return null;

  const atHome = fixture.home?.slug === clubSlug;
  const atAway = fixture.away?.slug === clubSlug;
  if (!atHome && !atAway) return null;

  const own = atHome ? score.home : score.away;
  const against = atHome ? score.away : score.home;
  const rival = atHome ? fixture.away : fixture.home;

  return {
    competitionKey: fixture.competitionKey ?? null,
    matchday: fixture.matchday ?? null,
    date: fixture.date ?? null,
    time: fixture.time ?? null,
    venue: atHome ? "home" : "away",
    own,
    against,
    margin: own - against,
    result: own > against ? "win" : own < against ? "loss" : "draw",
    rivalSlug: rival?.slug ?? null,
    rivalName: rival?.name ?? rival?.slug ?? null,
  };
}

/** The longest run of consecutive matches that satisfy `holds`, in kickoff order. */
function longestRun(matches, holds) {
  let best = 0;
  let current = 0;
  for (const match of matches) {
    current = holds(match) ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

/** How many separate runs of `state === true` reach `minimum` in length. */
function countRuns(states, minimum) {
  let runs = 0;
  let current = 0;
  for (const state of states) {
    if (state === true) {
      current += 1;
      continue;
    }
    if (current >= minimum) runs += 1;
    current = 0;
  }
  return current >= minimum ? runs + 1 : runs;
}

/**
 * The longest run of consecutive `true` where a card lands on consecutive
 * matchdays of the SAME competition.
 *
 * "Jornadas diferentes consecutivas" is per competition: league matchday 3 and
 * cup matchday 1 are not consecutive jornadas because neither follows the other,
 * and a matchday that appears in two competitions is two different rounds. The
 * rule can only make the claim harder, never easier.
 */
function longestMatchdayRun(timeline, states) {
  let best = 0;
  let current = 0;
  for (let index = 0; index < timeline.length; index += 1) {
    if (states[index] !== true) {
      current = 0;
      continue;
    }
    const previous = timeline[index - 1];
    const follows =
      previous != null &&
      previous.competition === timeline[index].competition &&
      previous.matchday === timeline[index].matchday - 1;
    current = follows ? current + 1 : 1;
    best = Math.max(best, current);
  }
  return best;
}

/**
 * What the acta ledger proves about single matches, read against the fixtures the
 * calendar already played.
 *
 * Only played matches are read: a row for a match the source still lists as
 * scheduled is a report of something that has not happened, and it proves
 * nothing about the season.
 *
 * A played match with no usable row is UNKNOWN here, and unknown is written as
 * `null` in the per-player timelines, not as `false`. A `false` would mean "the
 * acta says he did not score" and would let a three-match run jump a gaping
 * hole; a `null` breaks the run, because the honest reading of "no acta yet" is
 * that the goals of that night are simply not known. A row with an empty goal
 * list is the opposite and is a fact: the acta was read, it counts nobody, so
 * that match is a `false` and it does break a run.
 */
function readLedgerFacts(ledger, played) {
  const goalReports = new Map();
  const cardReports = new Map();
  for (const match of played) {
    goalReports.set(match.key, matchGoals(ledger, match.competitionKey, match.matchday));
    cardReports.set(match.key, matchCards(ledger, match.competitionKey, match.matchday));
  }

  const names = new Map();
  for (const report of goalReports.values()) {
    for (const goal of report.goals) names.set(goal.key, goal.name);
  }
  for (const report of cardReports.values()) {
    for (const card of report.cards) names.set(card.key, card.name);
  }

  const timeline = played.map((match) => {
    const goals = goalReports.get(match.key);
    const cards = cardReports.get(match.key);
    return {
      competition: match.competitionKey,
      matchday: match.matchday,
      goalsKnown: goals.known,
      scorers: new Set(goals.goals.map((goal) => goal.key)),
      cardsKnown: cards.known,
      booked: new Set(cards.cards.map((card) => card.key)),
    };
  });

  /*
   * Every figure below is per player, keyed the same way the board keys a
   * player, so a single-match entry can be asked about ONE man instead of about
   * the best night anyone in the squad has had. The club-wide maxima the shelf
   * used to read are the maxima of this map, and nothing else: one source, so a
   * per-player answer and a squad-wide one cannot disagree.
   */
  const perPlayer = new Map();
  const slot = (key) => {
    if (!perPlayer.has(key)) {
      perPlayer.set(key, {
        goalsInAMatch: 0,
        cardsInAMatch: 0,
        scoringRun: 0,
        scoringRunsOfThree: 0,
        yellowRun: 0,
      });
    }
    return perPlayer.get(key);
  };

  for (const report of goalReports.values()) {
    for (const goal of report.goals) {
      const player = slot(goal.key);
      player.goalsInAMatch = Math.max(player.goalsInAMatch, goal.goals);
    }
  }

  for (const report of cardReports.values()) {
    const counts = new Map();
    for (const card of report.cards) counts.set(card.key, (counts.get(card.key) ?? 0) + 1);
    for (const [key, count] of counts) {
      const player = slot(key);
      player.cardsInAMatch = Math.max(player.cardsInAMatch, count);
    }
  }

  for (const key of names.keys()) {
    /* One slot per played match: true scored, false did not, null no acta. */
    const scoring = timeline.map((match) => (match.goalsKnown ? match.scorers.has(key) : null));
    const booked = timeline.map((match) => (match.cardsKnown ? match.booked.has(key) : null));
    const player = slot(key);
    player.scoringRun = longestRun(scoring, (state) => state === true);
    player.scoringRunsOfThree = countRuns(scoring, THREE_MATCH_SCORING_RUN);
    player.yellowRun = longestMatchdayRun(timeline, booked);
  }

  /*
   * The first goal of the season, in kickoff order. The earliest played match
   * that has an acta with goals names the player or players who scored first —
   * the acta does not order the goals inside a match, so a match with three
   * different scorers has three "first" scorers and says so. One played match
   * before that point with no acta makes the answer unknown, because the first
   * goal of the season may be sitting in that missing report.
   */
  let firstScorerKnown = timeline.length > 0;
  let firstScorers = [];
  for (const match of timeline) {
    if (!match.goalsKnown) {
      firstScorerKnown = false;
      firstScorers = [];
      break;
    }
    if (match.scorers.size > 0) {
      firstScorers = [...match.scorers].map((key) => names.get(key)).filter(Boolean);
      break;
    }
  }

  return {
    ledgerMatches: [...goalReports.values()].filter((report) => report.known).length,
    ledgerPlayed: played.length,
    bestGoalsInAMatch: max([...perPlayer.values()], (player) => player.goalsInAMatch),
    bestCardsInAMatch: max([...perPlayer.values()], (player) => player.cardsInAMatch),
    bestScoringRun: max([...perPlayer.values()], (player) => player.scoringRun),
    threeMatchScoringRuns: max([...perPlayer.values()], (player) => player.scoringRunsOfThree),
    yellowRun: max([...perPlayer.values()], (player) => player.yellowRun),
    firstScorerKnown,
    firstScorers,
    /* The acta's own per-player totals, over the played matches only. */
    ledgerPlayers: playerTotals(ledger, played.map((match) => match.key)).players,
    /* The same figures the maxima above are taken from, one row per player. */
    ledgerByPlayer: perPlayer,
    /* The name an acta gives a key, so a row can be created for him. */
    ledgerNames: names,
  };
}

/**
 * The cards the club reported, with the one timing fact the record carries:
 * `yellowAt`, the matchday a yellow was seen.
 *
 * The record says nothing about which competition a card belongs to, so a card
 * is treated as possibly belonging to any match of that matchday. That can only
 * make it harder to prove a card-free match, never easier: the direction of the
 * doubt is always towards locked.
 */
function readCards(record) {
  const known = Array.isArray(record?.cards);
  const rows = asArray(record?.cards).filter((card) => card && card.player);
  const yellow = sum(rows, (card) => card.yellow);
  const red = sum(rows, (card) => card.red);
  const matchdaysWithCard = rows
    .filter((card) => card.yellow > 0 && isNumber(card.yellowAt))
    .map((card) => card.yellowAt);

  /*
   * A red (or a yellow with no matchday) cannot be placed on the calendar, so no
   * match can be certified card-free while one exists. This is the honest
   * reading of the record, not a missing feature: the club reports the card, the
   * acta says when, and until both agree the proof is incomplete.
   *
   * A record with no `cards` list at all is not a record of zero cards, it is no
   * record: nothing is proven either way, so a card-free match cannot be claimed
   * and no first card can be claimed. An empty list IS a record — the club
   * reported the cards and there were none — so it proves card-free matches.
   */
  const unplaceable =
    !known || rows.some((card) => card.red > 0 || (card.yellow > 0 && !isNumber(card.yellowAt)));

  return {
    rows: rows.map((card) => ({
      name: card.player,
      key: normalise(card.player),
      yellow: card.yellow ?? 0,
      red: card.red ?? 0,
      yellowAt: isNumber(card.yellowAt) ? card.yellowAt : null,
    })),
    total: yellow + red,
    yellow,
    red,
    matchdaysWithCard,
    unplaceable,
  };
}

/**
 * The called-up lists that belong to a played match, one per fixture.
 *
 * A list for a matchday that was never played proves nothing about a debut or an
 * appearance, so it is dropped instead of counted. The same key twice is a
 * duplicate in the hand-kept record, not two matches.
 */
function readAttendance(record, played) {
  const byKey = new Map();
  for (const entry of asArray(record?.attendance)) {
    const key = `${entry?.competition}:${entry?.matchday}`;
    if (!played.some((match) => match.key === key)) continue;
    if (byKey.has(key)) continue;
    const names = asArray(entry.players)
      .map((name) => String(name ?? "").trim())
      .filter((name) => normalise(name) !== "");
    byKey.set(key, { key, names: [...new Set(names)] });
  }
  return [...byKey.values()];
}

/** The key a vote row names its match with, or "single" for a one-match fetch. */
function voteMatchKey(row) {
  const explicit = row?.match_key ?? row?.matchKey;
  if (explicit != null && String(explicit) !== "") return String(explicit);
  if (row?.match_id != null) return `match:${row.match_id}`;
  if (row?.competition != null && row?.matchday != null) return `${row.competition}:${row.matchday}`;
  /*
   * No match key at all: the caller fetched exactly one match (that is what
   * src/lib/mvp.js does with `fetchTally`), so its rows are one tally. Merging
   * several matches this way would invent a bigger MVP, which is why the caller
   * is expected to pass the key when it has one.
   */
  return "single";
}

/**
 * The votes, read twice: which match each ballot belongs to, and who won each
 * match. The winner is the most voted candidate, ties broken by name — the same
 * order `tally()` in src/lib/mvp.js and `scorers()` in src/data/club-record.js
 * already use.
 *
 * A vote for a slug the squad does not contain cannot be turned into a player:
 * it still proves an MVP was awarded to *someone*, but it is never credited to a
 * player, because naming one would be inventing a name.
 */
function readVotes(votes, squadBySlug) {
  const rows = asArray(votes).filter((row) => row && (row.candidate_slug ?? row.candidateSlug));

  const groups = new Map();
  const ballots = new Set();
  for (const row of rows) {
    const candidate = String(row.candidate_slug ?? row.candidateSlug);
    const matchKey = voteMatchKey(row);
    const tally = groups.get(matchKey) ?? new Map();
    tally.set(candidate, (tally.get(candidate) ?? 0) + 1);
    groups.set(matchKey, tally);

    const voter = row.voter_slug ?? row.voterSlug;
    if (voter != null && String(voter) !== "") ballots.add(`${matchKey}|${voter}`);
  }

  /*
   * The same ballots, counted per voter instead of in total. "Mi voto" is the
   * one entry that is about the person casting the vote rather than the person
   * receiving it, so a player row needs his own count, not the club's.
   */
  const cast = new Map();
  for (const ballot of ballots) {
    const voter = ballot.slice(ballot.lastIndexOf("|") + 1);
    cast.set(voter, (cast.get(voter) ?? 0) + 1);
  }

  /*
   * What each candidate received, and from whom. A ballot the table stores
   * without a voter still counts as a vote received, but it can never enlarge
   * the set of people who voted for him: no voter, no name to count. This is why
   * the two figures are kept apart instead of one being derived from the other.
   */
  const received = new Map();
  for (const row of rows) {
    const candidate = String(row.candidate_slug ?? row.candidateSlug);
    const entry = received.get(candidate) ?? { votes: 0, voters: new Set() };
    entry.votes += 1;
    const voter = row.voter_slug ?? row.voterSlug;
    if (voter != null && String(voter) !== "") entry.voters.add(String(voter));
    received.set(candidate, entry);
  }

  const awards = [];
  for (const [matchKey, tally] of groups) {
    const ranked = [...tally.entries()]
      .map(([slug, count]) => ({
        slug,
        votes: count,
        name: squadBySlug.get(slug) ?? null,
      }))
      .sort(
        (a, b) =>
          b.votes - a.votes || String(a.name ?? a.slug).localeCompare(String(b.name ?? b.slug)),
      );
    awards.push({ matchKey, candidate: ranked[0].slug, name: ranked[0].name, votes: ranked[0].votes });
  }
  awards.sort((a, b) => a.matchKey.localeCompare(b.matchKey));

  const bestMvpVotes = max(awards, (award) => award.votes);

  return { awards, ballots: ballots.size, bestMvpVotes, received, cast };
}

/**
 * The player board: one row per player the club's own record names, from the
 * four sources that name players (goals, cards, called-up lists, the match
 * reports) plus the MVP winners. Identity is the normalised name, the same key
 * src/lib/club-code.js uses, so "Rúp" and "Rup" are one player and not two.
 *
 * Every row is the FULL set of facts about that one man, which is what lets a
 * player-scope entry be decided about him instead of about the squad: `yellow`
 * is his cards and nobody else's, and the ledger columns are his best night,
 * not the best night of the team.
 */
function readPlayerBoard({
  record,
  played,
  mvpAwards,
  received,
  castVotes,
  squadBySlug,
  attendance,
  cards,
  ledgerFacts,
}) {
  const board = new Map();
  /* Distinct voters per player, kept here because a player row is not a Set. */
  const voters = new Map();

  const ensure = (name) => {
    const key = normalise(name);
    if (!key) return null;
    if (!board.has(key)) {
      board.set(key, {
        key,
        name: String(name).trim(),
        /* The squad's own id, when a squad list names him: the voter slug. */
        slug: null,
        matches: 0,
        goals: 0,
        leagueGoals: 0,
        cupGoals: 0,
        yellow: 0,
        red: 0,
        cards: 0,
        mvps: 0,
        mvpRun: 0,
        callUpRun: 0,
        votesReceived: 0,
        voters: 0,
        /* Ballots HE cast, not ballots he received: "Mi voto" is about him. */
        ballots: 0,
        /* What the match reports prove about him, one match at a time. */
        ledgerGoalsInAMatch: 0,
        ledgerCardsInAMatch: 0,
        scoringRun: 0,
        scoringRunsOfThree: 0,
        yellowRun: 0,
        topScorer: false,
        perfect: false,
      });
    }
    return board.get(key);
  };

  for (const scorer of asArray(record?.scorers)) {
    if (!scorer?.player) continue;
    const player = ensure(scorer.player);
    if (!player) continue;
    const goals = isNumber(scorer.goals)
      ? scorer.goals
      : (scorer.league ?? 0) + (scorer.cup ?? 0);
    player.goals += goals;
    /*
     * The record publishes the league/cup split next to the season total, which
     * is the only per-competition breakdown the club keeps. It is not a guess:
     * a player with league 0 and cup 3 is a cup scorer and not a league one, and
     * that is exactly what "Rey de copa" and "Multicompetición" ask for.
     */
    player.leagueGoals += scorer.league ?? 0;
    player.cupGoals += scorer.cup ?? 0;
  }

  for (const card of cards.rows) {
    const player = ensure(card.name);
    if (!player) continue;
    player.yellow += card.yellow;
    player.red += card.red;
    player.cards += card.yellow + card.red;
  }

  for (const list of attendance) {
    for (const name of list.names) {
      const player = ensure(name);
      if (player) player.matches += 1;
    }
  }

  for (const award of mvpAwards) {
    if (!award.name) continue;
    const player = ensure(award.name);
    if (player) player.mvps += 1;
  }

  /* Votes received, and the people who cast them, for the two vote ladders. */
  for (const [slug, tally] of received) {
    const name = squadBySlug.get(slug);
    if (!name) continue;
    const player = ensure(name);
    if (!player) continue;
    player.votesReceived += tally.votes;
    const keys = voters.get(player.key) ?? new Set();
    for (const voter of tally.voters) keys.add(voter);
    voters.set(player.key, keys);
  }
  for (const [key, set] of voters) {
    const player = board.get(key);
    if (player) player.voters = set.size;
  }

  /*
   * Ballots cast, credited to the man who cast them. The row names a voter slug
   * and the squad list turns that slug into a name; a ballot from a voter the
   * squad list does not name still proves a vote was emitted, but it cannot be
   * credited to a player without inventing one, so it is left out here.
   */
  for (const [slug, count] of castVotes) {
    const name = squadBySlug.get(slug);
    if (!name) continue;
    const player = ensure(name);
    if (player) player.ballots += count;
  }

  /*
   * The actas name players too. A man who scored on a night he was never called
   * up for (or whose acta arrived before the called-up list) is a real player of
   * this season, and his row is what makes his own double provable. The record's
   * season totals stay authoritative for goals and cards — the ledger is a
   * subset of them — so only the once-per-match columns are copied here.
   */
  for (const [key, figures] of ledgerFacts.ledgerByPlayer) {
    const player = ensure(ledgerFacts.ledgerNames.get(key) ?? key);
    if (!player) continue;
    player.ledgerGoalsInAMatch = figures.goalsInAMatch;
    player.ledgerCardsInAMatch = figures.cardsInAMatch;
    player.scoringRun = figures.scoringRun;
    player.scoringRunsOfThree = figures.scoringRunsOfThree;
    player.yellowRun = figures.yellowRun;
  }

  /* The squad's own id, so a reader (who holds an id, not a name) can be found. */
  for (const [slug, name] of squadBySlug) {
    const player = board.get(normalise(name));
    if (player) player.slug = slug;
  }

  /*
   * Consecutive MVP awards, in kickoff order. Only matches whose key resolves to
   * a fixture the calendar already played can be placed on the timeline, so a
   * vote row for a match the source has not played is left out instead of being
   * dropped into an invented slot. A winning award with no name (a vote for a
   * slug the squad does not know) breaks the run: it is still an award, and
   * pretending it did not happen would hand out "two in a row" to the wrong man.
   */
  const kickoffIndex = new Map(played.map((match, index) => [match.key, index]));
  const timeline = mvpAwards
    .map((award) => ({ ...award, index: kickoffIndex.get(award.matchKey) }))
    .filter((award) => award.index != null)
    .sort((a, b) => a.index - b.index);

  let run = 0;
  let previous = null;
  let previousIndex = null;
  for (const award of timeline) {
    /*
     * Consecutive means the next match on the calendar, not the next award: a
     * matchday nobody voted on is a gap, and two awards either side of it are not
     * "two in a row".
     */
    const adjacent = previousIndex != null && award.index === previousIndex + 1;
    run = award.candidate === previous && adjacent ? run + 1 : 1;
    previous = award.candidate;
    previousIndex = award.index;
    if (!award.name) continue;
    const player = ensure(award.name);
    if (player) player.mvpRun = Math.max(player.mvpRun, run);
  }

  const players = [...board.values()]
    .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name));

  const topGoals = max(players, (player) => player.goals);
  const leaders = players.filter((player) => player.goals === topGoals && topGoals > 0);
  for (const leader of leaders) leader.topScorer = true;

  /*
   * Perfect attendance can only be claimed when every played match actually has
   * a called-up list. One missing list makes every player's count incomplete,
   * so nobody is marked perfect — locked, not guessed.
   */
  const everyMatchHasList = played.length > 0 && attendance.length === played.length;
  if (everyMatchHasList) {
    for (const player of players) {
      player.perfect = player.matches === played.length;
    }

    /*
     * The longest chain of consecutive played matches whose list names him, in
     * kickoff order. It is only computed with a list for every played match: with
     * one missing, a run could jump the gap and credit a streak that is not there.
     */
    const listKeys = new Map(
      attendance.map((list) => [list.key, new Set(list.names.map((name) => normalise(name)))]),
    );
    for (const player of players) {
      let run = 0;
      let best = 0;
      for (const match of played) {
        run = listKeys.get(match.key)?.has(player.key) === true ? run + 1 : 0;
        best = Math.max(best, run);
      }
      player.callUpRun = best;
    }
  }

  return {
    players,
    topGoals,
    leaders: leaders.map((player) => player.name),
    perfect: everyMatchHasList ? players.filter((player) => player.perfect).map((p) => p.name) : [],
    everyMatchHasList,
  };
}

/**
 * The standings, as a map from competition key to its rows.
 *
 * The caller may hand them over as `[{ key, rows }]` (the shape
 * `competitions` in src/data/competition.js already has) or as `{ league: rows }`;
 * a shape that is neither is no table at all, and every entry that needs a rank
 * stays locked rather than reading a missing table as "first place".
 */
function readTables(tables) {
  const byKey = new Map();
  const add = (key, rows) => {
    if (key == null || !Array.isArray(rows)) return;
    byKey.set(String(key), rows.filter((row) => row && row.slug));
  };

  if (Array.isArray(tables)) {
    for (const table of tables) add(table?.key ?? table?.competitionKey, table?.rows ?? table?.table);
  } else if (tables && typeof tables === "object") {
    for (const [key, rows] of Object.entries(tables)) add(key, rows);
  }

  return byKey;
}

/**
 * Every fact the catalogue reads, derived once.
 *
 * The catalogue entries never touch raw JSON: they read this object, which is
 * why the same threshold cannot be counted two different ways in two places. It
 * is exported because a screen that draws a progress bar needs the same figures
 * the entries are decided on, and re-deriving them next to the card is how the
 * bar and the trophy start disagreeing.
 */
export function seasonFacts(input = {}) {
  const clubSlug = input.clubSlug ?? CLUB_SLUG;

  const clubFixtures = asArray(input.fixtures).filter(
    (fixture) => fixture?.home?.slug === clubSlug || fixture?.away?.slug === clubSlug,
  );

  const played = [];
  let unplayed = 0;
  for (const fixture of clubFixtures) {
    const match = readMatch(fixture, clubSlug);
    if (match) {
      played.push({ ...match, key: `${match.competitionKey}:${match.matchday}` });
    } else {
      unplayed += 1;
    }
  }
  played.sort((a, b) => kickoffOf(a).localeCompare(kickoffOf(b)));

  /*
   * The per-match ledger, read against the played fixtures. `undefined` means "the
   * caller said nothing", and the club's transcribed actas are the answer; an
   * explicit null, [] or {} is a caller saying "no actas" — which is what a test
   * uses to ask what a season looks like before any match report exists.
   */
  const ledger = input.ledger === undefined ? clubLedger : readLedger(input.ledger);
  const ledgerFacts = readLedgerFacts(ledger, played);

  const wins = played.filter((match) => match.result === "win");
  const draws = played.filter((match) => match.result === "draw");
  const losses = played.filter((match) => match.result === "loss");

  /*
   * Rivals, with the order of the results against each one. The order is what
   * makes "La revancha" provable: losing first and winning later is the whole
   * claim, and a set of results without a sequence cannot tell the two apart.
   */
  const rivals = new Map();
  for (const match of played) {
    const key = match.rivalSlug ?? match.rivalName ?? "rival";
    const rival = rivals.get(key) ?? {
      slug: match.rivalSlug,
      name: match.rivalName,
      played: 0,
      wins: 0,
      results: [],
    };
    rival.played += 1;
    if (match.result === "win") rival.wins += 1;
    rival.results.push(match.result);
    rivals.set(key, rival);
  }

  for (const rival of rivals.values()) {
    const firstWin = rival.results.indexOf("win");
    const firstLoss = rival.results.indexOf("loss");
    /* A loss before a win against the same club: the revenge is the later win. */
    rival.revenge = firstWin !== -1 && firstLoss !== -1 && firstLoss < firstWin;
  }

  const cards = readCards(input.record);
  const attendance = readAttendance(input.record, played);
  const voterSlug = input.voterSlug != null ? String(input.voterSlug) : null;

  const squad = asArray(input.squad);
  const squadBySlug = new Map(
    squad.filter((player) => player?.id != null).map((player) => [String(player.id), player.name]),
  );
  const votes = readVotes(input.votes, squadBySlug);

  /*
   * The season is over only when every fixture the source published for the club
   * has been played and has a score. `unplayed` counts the ones that prove
   * nothing, so a schedule with a single pending match keeps both season-end
   * entries locked — which is exactly what the owner asked for: the perfect
   * attendance is a trophy for the end of the season, not for matchday three.
   */
  const seasonComplete = played.length > 0 && unplayed === 0;

  /*
   * Per-competition figures. The season figures above answer "how is the season
   * going"; these answer "how did this competition go", which is what the entries
   * that talk about finishing a competition ask. `complete` is the same standard
   * the season uses, applied to one competition: every fixture the source
   * published in it has been played and carries a score.
   */
  const tables = readTables(input.tables);
  const totals = new Map();
  for (const fixture of clubFixtures) {
    const key = String(fixture.competitionKey ?? "unknown");
    const entry = totals.get(key) ?? { key, fixtures: 0 };
    entry.fixtures += 1;
    totals.set(key, entry);
  }

  const competitions = [...totals.values()].map((entry) => {
    const matches = played.filter(
      (match) => String(match.competitionKey ?? "unknown") === entry.key,
    );
    const rows = tables.get(entry.key) ?? [];
    const own = rows.find((row) => row.slug === clubSlug) ?? null;
    const leader =
      [...rows].filter((row) => isNumber(row.rank)).sort((a, b) => a.rank - b.rank)[0] ?? null;
    const competitionWins = matches.filter((match) => match.result === "win").length;
    const competitionDraws = matches.filter((match) => match.result === "draw").length;

    return {
      key: entry.key,
      complete: matches.length > 0 && matches.length === entry.fixtures,
      played: matches.length,
      goalsFor: sum(matches, (match) => match.own),
      goalsAgainst: sum(matches, (match) => match.against),
      wins: competitionWins,
      draws: competitionDraws,
      losses: matches.length - competitionWins - competitionDraws,
      cleanSheets: matches.filter((match) => match.against === 0).length,
      /*
       * Points come from our own results and not from the table's `points`: a
       * draw is one point, a win is three, and a sanction column cannot turn a
       * draw into a win on the shelf.
       */
      points: competitionWins * 3 + competitionDraws,
      rank: isNumber(own?.rank) ? own.rank : null,
      /*
       * "Best attack/defence of the table" is a comparison with every row, and a
       * row is only comparable when it carries the number. No table, no own row
       * or a row with the figure missing means nothing is proven — never that we
       * are first.
       */
      bestAttack:
        Boolean(own) &&
        isNumber(own.goalsFor) &&
        rows.every(
          (row) => row.slug === clubSlug || (isNumber(row.goalsFor) && row.goalsFor < own.goalsFor),
        ),
      bestDefence:
        Boolean(own) &&
        isNumber(own.goalsAgainst) &&
        rows.every(
          (row) =>
            row.slug === clubSlug ||
            (isNumber(row.goalsAgainst) && row.goalsAgainst > own.goalsAgainst),
        ),
      /* The current leader, unless that leader is us: a club cannot beat itself. */
      leaderSlug: leader && leader.slug !== clubSlug ? leader.slug : null,
    };
  });

  const board = readPlayerBoard({
    record: input.record,
    played,
    mvpAwards: votes.awards,
    received: votes.received,
    castVotes: votes.cast,
    squadBySlug,
    attendance,
    cards,
    ledgerFacts,
  });

  const cardFreeMatches = cards.unplaceable
    ? []
    : played.filter(
        (match) => isNumber(match.matchday) && !cards.matchdaysWithCard.includes(match.matchday),
      );

  const bestCalledUp = max(attendance, (list) => list.names.length);

  /*
   * A squad name and a called-up name are the same person only when they are the
   * same normalised string, the key src/lib/club-code.js already uses. A club
   * that keeps a nickname the squad list does not have stays "not called up"
   * rather than being counted by eye.
   */
  const calledUpNames = new Set(
    attendance.flatMap((list) => list.names.map((name) => normalise(name))),
  );
  const allSquadCalledUp =
    squad.length > 0 &&
    squad.every((player) => player?.name != null && calledUpNames.has(normalise(player.name)));

  const finishedCompetitions = competitions.filter((competition) => competition.complete);

  const mostCards = (() => {
    const best = max(board.players, (player) => player.cards);
    return best > 0 && board.players.some((player) => player.cards === best);
  })();

  const mvpInLoss = votes.awards.some(
    (award) =>
      award.name != null &&
      played.some((match) => match.key === award.matchKey && match.result === "loss"),
  );

  return {
    clubSlug,
    played,
    playedMatches: played.length,
    unplayed,
    seasonComplete,

    goalsFor: sum(played, (match) => match.own),
    goalsAgainst: sum(played, (match) => match.against),
    wins: wins.length,
    draws: draws.length,
    losses: losses.length,
    cleanSheets: played.filter((match) => match.against === 0).length,
    bestScoring: max(played, (match) => match.own),
    bestMargin: max(wins, (match) => match.margin),
    winStreak: longestRun(played, (match) => match.result === "win"),
    unbeatenRun: longestRun(played, (match) => match.result !== "loss"),
    cleanSheetRun: longestRun(played, (match) => match.against === 0),
    /* Longest run of matches in which we conceded fewer than three goals. */
    noThrashRun: longestRun(played, (match) => match.against < THREE_GOALS_IN_A_MATCH),
    scoringRun: longestRun(played, (match) => match.own > 0),
    homeWins: wins.filter((match) => match.venue === "home").length,
    awayWins: wins.filter((match) => match.venue === "away").length,
    cupWins: wins.filter((match) => match.competitionKey === "cup").length,
    cupPlayed: played.filter((match) => match.competitionKey === "cup").length,
    leagueGoals: sum(
      played.filter((match) => match.competitionKey === "league"),
      (match) => match.own,
    ),

    rivals: [...rivals.values()]
      .map(({ slug, name, played: met, wins: won }) => ({ slug, name, played: met, wins: won }))
      .sort((a, b) => String(a.slug ?? a.name).localeCompare(String(b.slug ?? b.name))),
    beatenRivals: [...rivals.values()]
      .filter((rival) => rival.wins > 0)
      .map(({ slug, name, played: met, wins: won }) => ({ slug, name, played: met, wins: won })),
    revengeWon: [...rivals.values()].some((rival) => rival.revenge === true),

    /*
     * A competition is only "finished" for the entries that compare final
     * numbers when every one of its own fixtures has been played — a different
     * question from whether the whole season is over, and the reason a cup
     * table can be crowned in November while the league cannot.
     */
    competitions,
    finishedCompetitions,
    leaguePoints: competitions.find((competition) => competition.key === "league")?.points ?? 0,
    beatLeagueLeader: competitions.some(
      (competition) =>
        competition.leaderSlug != null &&
        played.some(
          (match) => match.result === "win" && match.rivalSlug === competition.leaderSlug,
        ),
    ),
    /*
     * "Top scorer of a competition" needs that competition to be over: with a
     * match still to play the record's split per competition is still moving.
     *
     * The next three figures (this one, `mostCards` and `mvpInLoss`) are
     * SQUAD-WIDE summaries: they say whether somebody in the squad holds the
     * fact, not who. The player-scope entries no longer read them — each one is
     * decided against a single player row — and they stay here because they are
     * facts about the season that a team screen can print, not because a trophy
     * is decided on them.
     */
    competitionTopScorer: finishedCompetitions.some((competition) => {
      const best = max(board.players, (player) => competitionGoalsOf(player, competition.key));
      return (
        best > 0 &&
        board.players.some((player) => competitionGoalsOf(player, competition.key) === best)
      );
    }),
    fiveScorersInACompetition: competitions.some(
      (competition) =>
        board.players.filter((player) => competitionGoalsOf(player, competition.key) > 0).length >=
        FIVE_SCORERS_IN_A_COMPETITION,
    ),

    cards: cards.total,
    yellowCards: cards.yellow,
    redCards: cards.red,
    cardFreeMatches,
    mostCards,

    attendance,
    bestCalledUp,
    squadSize: squad.length,
    /* A full squad is only provable against a squad list; with none, locked. */
    fullSquad: squad.length > 0 && bestCalledUp >= squad.length,
    allSquadCalledUp,

    mvpAwards: votes.awards,
    ballots: votes.ballots,
    bestMvpVotes: votes.bestMvpVotes,
    mvpInLoss,
    /* The reader, and how many ballots carry his name. Null slug: no identity. */
    voterSlug,
    voterBallots: voterSlug ? countBallots(input.votes, voterSlug) : 0,

    players: board.players,
    topGoals: board.topGoals,
    topScorer: board.leaders[0] ?? null,
    topScorers: board.leaders,
    perfectAttendance: board.perfect,
    everyMatchHasList: board.everyMatchHasList,

    /*
     * What the actas prove about single matches. Every figure here is derived
     * from rows that exist, so a season with no ledger reads as zero matches on
     * the ledger and every single-match entry stays locked — locked, not
     * disproven, which is why the entries also ask `firstScorerKnown` instead of
     * trusting an empty list.
     */
    ledgerMatches: ledgerFacts.ledgerMatches,
    ledgerPlayed: ledgerFacts.ledgerPlayed,
    bestGoalsInAMatch: ledgerFacts.bestGoalsInAMatch,
    bestCardsInAMatch: ledgerFacts.bestCardsInAMatch,
    bestScoringRun: ledgerFacts.bestScoringRun,
    threeMatchScoringRuns: ledgerFacts.threeMatchScoringRuns,
    yellowRun: ledgerFacts.yellowRun,
    firstScorerKnown: ledgerFacts.firstScorerKnown,
    firstScorers: ledgerFacts.firstScorers,
    ledgerPlayers: ledgerFacts.ledgerPlayers,
  };
}

const teamEntry = (entry) => ({ scope: "team", ...entry });

/**
 * A player-scope entry, decided about ONE player.
 *
 * The catalogue used to write these as `facts.players.some((player) => ...)`,
 * which answers "does anyone in the squad hold this?". That is the right
 * question for a club wall and the wrong one for the personal shelf, which
 * prints the tile under the reader's own name: the owner read "1.ª amarilla"
 * while the club record named Albert and Jonay and nobody else (S13).
 *
 * So the rule of a player entry is written once, against one player row, and
 * `playerEntry` derives the two readings from it:
 *
 *   testFor(player, facts)  the reading the personal shelf uses: does THIS man
 *                           hold it? Every rule is his own figures, so a trophy
 *                           cannot be inherited from a team-mate.
 *   test(facts)             the squad-wide reading: does ANY player hold it?
 *                           Exactly the old `some(...)` answer, kept because a
 *                           caller with no identity (a shared screen, a future
 *                           club wall) can honestly only ask that question, and
 *                           `evaluateAchievements().player` says so by name.
 *
 * An entry may override `test` when the squad-wide reading is not the `some`
 * of its own rule — "Mi voto" is about who cast the ballot, so the identity the
 * caller passes decides it (see that entry). The override is the exception and
 * it is written in the entry, never hidden here.
 */
function playerEntry(entry) {
  const holdsFor = (player, facts) => {
    try {
      return entry.testFor(player, facts) === true;
    } catch {
      /* A predicate that throws has not been proven: locked, like `safeTest`. */
      return false;
    }
  };

  return {
    scope: "player",
    ...entry,
    testFor: holdsFor,
    test: entry.test ?? ((facts) => facts.players.some((player) => holdsFor(player, facts))),
  };
}

/**
 * The catalogue.
 *
 * Each entry carries a stable id (never renamed: it is the key a future shelf
 * stores), the scope it belongs to, the club's plain Spanish in the title, one
 * line in the description saying what unlocks it, a lucide-react icon name that
 * exists in the installed version, and the predicate that decides it. The
 * predicate reads `seasonFacts()` and nothing else.
 */
const TEAM = [
  teamEntry({
    id: "team-first-match",
    title: "1er partido",
    description: "El club juega su primer partido de la temporada.",
    icon: "CalendarDays",
    test: (facts) => facts.playedMatches >= 1,
  }),
  teamEntry({
    id: "team-first-goal",
    title: "1er gol",
    description: "El equipo marca su primer gol de la temporada.",
    icon: "Goal",
    test: (facts) => facts.goalsFor >= 1,
  }),
  teamEntry({
    id: "team-first-draw",
    title: "1er empate",
    description: "El equipo empata un partido.",
    icon: "Handshake",
    test: (facts) => facts.draws >= 1,
  }),
  teamEntry({
    id: "team-first-win",
    title: "1.ª victoria",
    description: "El equipo gana su primer partido de la temporada.",
    icon: "Trophy",
    test: (facts) => facts.wins >= 1,
  }),
  teamEntry({
    id: "team-clean-sheet",
    title: "0 en contra",
    description: "El equipo acaba un partido sin encajar ningún gol.",
    icon: "ShieldCheck",
    test: (facts) => facts.cleanSheets >= 1,
  }),
  teamEntry({
    id: "team-three-goals",
    title: "3 goles",
    description: "El equipo marca tres o más goles en un mismo partido.",
    icon: "Target",
    test: (facts) => facts.bestScoring >= THREE_GOALS_IN_A_MATCH,
  }),
  teamEntry({
    id: "team-five-goals",
    title: "5 goles",
    description: "El equipo marca cinco o más goles en un mismo partido.",
    icon: "Flame",
    test: (facts) => facts.bestScoring >= FIVE_GOALS_IN_A_MATCH,
  }),
  teamEntry({
    id: "team-win-by-two",
    title: "Ganar por 2",
    description: "El equipo gana un partido por dos goles o más de diferencia.",
    icon: "TrendingUp",
    test: (facts) => facts.bestMargin >= WIN_BY,
  }),
  teamEntry({
    id: "team-two-wins-in-a-row",
    title: "2 seguidas",
    description: "El equipo gana dos partidos consecutivos.",
    icon: "Repeat",
    test: (facts) => facts.winStreak >= WINS_IN_A_ROW,
  }),
  teamEntry({
    id: "team-three-unbeaten",
    title: "3 sin perder",
    description: "El equipo encadena tres partidos sin perder.",
    icon: "Shield",
    test: (facts) => facts.unbeatenRun >= UNBEATEN_IN_A_ROW,
  }),
  teamEntry({
    id: "team-win-away",
    title: "Ganar fuera",
    description: "El equipo gana un partido como visitante.",
    icon: "Plane",
    test: (facts) => facts.awayWins >= 1,
  }),
  teamEntry({
    id: "team-win-home",
    title: "Ganar en casa",
    description: "El equipo gana un partido como local.",
    icon: "Home",
    test: (facts) => facts.homeWins >= 1,
  }),
  teamEntry({
    id: "team-first-cup-win",
    title: "1.ª en copa",
    description: "El equipo gana un partido de copa.",
    icon: "Medal",
    test: (facts) => facts.cupWins >= 1,
  }),
  teamEntry({
    id: "team-ten-league-goals",
    title: "10 en liga",
    description: "El equipo llega a diez goles marcados en partidos de liga.",
    icon: "Layers",
    test: (facts) => facts.leagueGoals >= TEN_LEAGUE_GOALS,
  }),
  teamEntry({
    id: "team-beat-a-rival",
    title: "Rival batido",
    description: "El equipo gana a un club contra el que ya se había enfrentado.",
    icon: "Swords",
    /*
     * Only rivals the calendar already holds a played match against can be
     * named: the title cannot carry a club's name because the set of rivals is
     * data, so the rivals that count are listed in `facts.beatenRivals` and the
     * screen is expected to name them. A club the source has not put in front of
     * us yet is not a rival we can claim to have beaten.
     */
    test: (facts) => facts.beatenRivals.length >= 1,
  }),
  teamEntry({
    id: "team-ten-called-up",
    title: "10 convocados",
    description: "Diez jugadores convocados en un mismo partido.",
    icon: "Users",
    test: (facts) => facts.bestCalledUp >= TEN_CALLED_UP,
  }),
  teamEntry({
    id: "team-full-squad",
    title: "Todos convocados",
    description: "Toda la plantilla convocada en un mismo partido.",
    icon: "UserCheck",
    test: (facts) => facts.fullSquad,
  }),
  teamEntry({
    id: "team-no-cards",
    title: "0 tarjetas",
    description: "El equipo acaba un partido sin ninguna tarjeta.",
    icon: "Ban",
    test: (facts) => facts.cardFreeMatches.length >= 1,
  }),
  teamEntry({
    id: "team-first-card",
    title: "1.ª tarjeta",
    description: "El club recibe su primera tarjeta.",
    icon: "RectangleVertical",
    test: (facts) => facts.cards >= 1,
  }),
  teamEntry({
    id: "team-first-mvp",
    title: "1er MVP",
    description: "Se entrega el primer MVP de un partido.",
    icon: "Star",
    test: (facts) => facts.mvpAwards.length >= 1,
  }),
  teamEntry({
    id: "team-ten-mvp-votes",
    title: "10 votos MVP",
    description: "Un MVP recibe diez votos o más en un mismo partido.",
    icon: "Vote",
    test: (facts) => facts.bestMvpVotes >= TEN_MVP_VOTES,
  }),

  /*
   * The owner's catalogue, 100 entries, of which these are the team ones that the
   * project's own data can prove. Each comment says which fact proves it, because
   * a threshold is a promise and the fact is the evidence.
   */
  teamEntry({
    id: "team-first-loss",
    title: "1.ª derrota",
    description: "El equipo pierde su primer partido de la temporada.",
    icon: "Frown",
    /* Proved by a played fixture with our goals below theirs. */
    test: (facts) => facts.losses >= 1,
  }),
  teamEntry({
    id: "team-win-by-three",
    title: "Ganar por 3",
    description: "El equipo gana un partido por tres goles o más de diferencia.",
    icon: "Zap",
    /* Proved by the biggest winning margin in the results. */
    test: (facts) => facts.bestMargin >= WIN_BY_THREE,
  }),
  teamEntry({
    id: "team-win-by-five",
    title: "Ganar por 5",
    description: "El equipo gana un partido por cinco goles o más de diferencia.",
    icon: "Rocket",
    test: (facts) => facts.bestMargin >= WIN_BY_FIVE,
  }),
  teamEntry({
    id: "team-all-called-up",
    title: "Todos han ido",
    description:
      "Toda la plantilla ha sido convocada al menos una vez. Se compara nombre a nombre con la plantilla: un apodo que la plantilla no tiene no cuenta.",
    icon: "UsersRound",
    /*
     * Proved by the union of the called-up lists matching the squad list name by
     * name; a squad name that never appears is a player who has not been called
     * up, and stays locked rather than being counted by eye.
     */
    test: (facts) => facts.allSquadCalledUp,
  }),
  teamEntry({
    id: "team-three-wins-in-a-row",
    title: "Racha de 3",
    description: "El equipo gana tres partidos consecutivos.",
    icon: "ChevronsUp",
    /* Proved by the longest run of wins in kickoff order, both competitions included. */
    test: (facts) => facts.winStreak >= THREE_WINS_IN_A_ROW,
  }),
  teamEntry({
    id: "team-five-wins-in-a-row",
    title: "Racha de 5",
    description: "El equipo gana cinco partidos consecutivos.",
    icon: "BicepsFlexed",
    test: (facts) => facts.winStreak >= FIVE_WINS_IN_A_ROW,
  }),
  teamEntry({
    id: "team-ten-wins",
    title: "10 victorias",
    description: "El equipo acumula diez victorias en la temporada.",
    icon: "Award",
    test: (facts) => facts.wins >= TEN_WINS,
  }),
  teamEntry({
    id: "team-five-unbeaten",
    title: "5 sin perder",
    description: "El equipo encadena cinco partidos sin perder.",
    icon: "ShieldHalf",
    test: (facts) => facts.unbeatenRun >= FIVE_UNBEATEN,
  }),
  teamEntry({
    id: "team-ten-unbeaten",
    title: "10 sin perder",
    description: "El equipo encadena diez partidos sin perder.",
    icon: "ShieldPlus",
    test: (facts) => facts.unbeatenRun >= TEN_UNBEATEN,
  }),
  teamEntry({
    id: "team-three-home-wins",
    title: "3 en casa",
    description: "El equipo gana tres partidos como local.",
    icon: "Home",
    test: (facts) => facts.homeWins >= THREE_HOME_WINS,
  }),
  teamEntry({
    id: "team-three-away-wins",
    title: "3 fuera",
    description: "El equipo gana tres partidos como visitante.",
    icon: "Plane",
    test: (facts) => facts.awayWins >= THREE_AWAY_WINS,
  }),
  teamEntry({
    id: "team-revenge",
    title: "La revancha",
    description:
      "El equipo gana a un rival al que antes había perdido, con los resultados ordenados por fecha.",
    icon: "RotateCcw",
    /*
     * Proved by the order of the results against one rival: a loss and then a win
     * against the same club. Two results without their order cannot prove it, and
     * that is why the rival keeps its sequence.
     */
    test: (facts) => facts.revengeWon,
  }),
  teamEntry({
    id: "team-ten-goals-for",
    title: "10 a favor",
    description: "El equipo llega a diez goles a favor en la temporada.",
    icon: "ArrowUpRight",
    /* Season total, both competitions; the league-only count is its own entry. */
    test: (facts) => facts.goalsFor >= TEN_GOALS_FOR,
  }),
  teamEntry({
    id: "team-twentyfive-goals-for",
    title: "25 a favor",
    description: "El equipo llega a veinticinco goles a favor en la temporada.",
    icon: "Gauge",
    test: (facts) => facts.goalsFor >= TWENTYFIVE_GOALS_FOR,
  }),
  teamEntry({
    id: "team-fifty-goals-for",
    title: "50 a favor",
    description: "El equipo llega a cincuenta goles a favor en la temporada.",
    icon: "Snowflake",
    test: (facts) => facts.goalsFor >= FIFTY_GOALS_FOR,
  }),
  teamEntry({
    id: "team-hundred-goals-for",
    title: "100 a favor",
    description: "El equipo llega a cien goles a favor en la temporada.",
    icon: "Infinity",
    test: (facts) => facts.goalsFor >= HUNDRED_GOALS_FOR,
  }),
  teamEntry({
    id: "team-seven-goals",
    title: "7 goles",
    description: "El equipo marca siete o más goles en un mismo partido.",
    icon: "Sparkles",
    /* Proved by the highest score in the results; still a per-match figure. */
    test: (facts) => facts.bestScoring >= SEVEN_GOALS_IN_A_MATCH,
  }),
  teamEntry({
    id: "team-scoring-run-five",
    title: "Marcar en 5",
    description: "El equipo marca en cinco partidos consecutivos.",
    icon: "Flame",
    /* Proved by the results: a run of fixtures with at least one goal for. */
    test: (facts) => facts.scoringRun >= FIVE_SCORING_MATCHES_IN_A_ROW,
  }),
  teamEntry({
    id: "team-scoring-run-ten",
    title: "Marcar en 10",
    description: "El equipo marca en diez partidos consecutivos.",
    icon: "Flame",
    test: (facts) => facts.scoringRun >= TEN_SCORING_MATCHES_IN_A_ROW,
  }),
  teamEntry({
    id: "team-five-scorers",
    title: "5 goleadores",
    description:
      "Cinco jugadores diferentes marcan en una misma competición, según el reparto liga/copa del registro del club.",
    icon: "Users",
    /*
     * Proved by the record's league/cup split: it names how many different players
     * scored in that competition. A competition the record does not split stays
     * locked instead of being assumed.
     */
    test: (facts) => facts.fiveScorersInACompetition,
  }),
  teamEntry({
    id: "team-three-clean-sheets",
    title: "3 a cero",
    description: "El equipo acaba tres partidos sin encajar ningún gol.",
    icon: "ShieldCheck",
    test: (facts) => facts.cleanSheets >= THREE_CLEAN_SHEETS,
  }),
  teamEntry({
    id: "team-five-clean-sheets",
    title: "5 a cero",
    description: "El equipo acaba cinco partidos sin encajar ningún gol.",
    icon: "Shield",
    test: (facts) => facts.cleanSheets >= FIVE_CLEAN_SHEETS,
  }),
  teamEntry({
    id: "team-clean-sheet-run",
    title: "3 ceros seguidos",
    description: "El equipo encadena tres partidos sin encajar ningún gol.",
    icon: "ShieldHalf",
    /* Proved by the order of the results: three clean sheets in a row. */
    test: (facts) => facts.cleanSheetRun >= THREE_CLEAN_SHEETS_IN_A_ROW,
  }),
  teamEntry({
    id: "team-five-without-thrash",
    title: "5 sin goleada",
    description: "El equipo encadena cinco partidos sin recibir tres o más goles.",
    icon: "ShieldOff",
    test: (facts) => facts.noThrashRun >= FIVE_WITHOUT_CONCEDING_THREE,
  }),
  teamEntry({
    id: "team-fewer-conceded",
    title: "Menos en contra",
    description:
      "Al acabar una competición, el equipo ha encajado menos goles de los partidos que ha jugado.",
    icon: "TrendingDown",
    /*
     * Proved only when that competition is over: goals against and matches played
     * both come from the results, and `complete` is the gate that stops the claim
     * being made halfway through.
     */
    test: (facts) =>
      facts.finishedCompetitions.some(
        (competition) => competition.goalsAgainst < competition.played,
      ),
  }),
  teamEntry({
    id: "team-positive-ten",
    title: "+10 diferencia",
    description:
      "Al acabar una competición, el equipo termina con una diferencia de goles de +10 o mejor.",
    icon: "Plus",
    test: (facts) =>
      facts.finishedCompetitions.some(
        (competition) => competition.goalsFor - competition.goalsAgainst >= 10,
      ),
  }),
  teamEntry({
    id: "team-positive-twenty",
    title: "+20 diferencia",
    description:
      "Al acabar una competición, el equipo termina con una diferencia de goles de +20 o mejor.",
    icon: "Gem",
    test: (facts) =>
      facts.finishedCompetitions.some(
        (competition) => competition.goalsFor - competition.goalsAgainst >= 20,
      ),
  }),
  teamEntry({
    id: "team-perfect-match",
    title: "Partido redondo",
    description:
      "El equipo gana un partido marcando tres goles o más y sin encajar ninguno.",
    icon: "Target",
    /* Proved by one result in the calendar: our goals and theirs in the same fixture. */
    test: (facts) =>
      facts.played.some(
        (match) =>
          match.result === "win" &&
          match.own >= THREE_GOALS_IN_A_MATCH &&
          match.against === 0,
      ),
  }),
  teamEntry({
    id: "team-best-defence",
    title: "Mejor defensa",
    description:
      "Al acabar una competición, el equipo ha encajado menos goles que cualquier otro de la tabla.",
    icon: "BadgeCheck",
    /*
     * Proved by the published table of a finished competition: our own row is
     * compared with every other row. Without a table, or with the season still
     * running, nothing is claimed.
     */
    test: (facts) =>
      facts.finishedCompetitions.some((competition) => competition.bestDefence),
  }),
  teamEntry({
    id: "team-best-attack",
    title: "Mejor ataque",
    description:
      "Al acabar una competición, el equipo ha marcado más goles que cualquier otro de la tabla.",
    icon: "Crosshair",
    test: (facts) =>
      facts.finishedCompetitions.some((competition) => competition.bestAttack),
  }),
  teamEntry({
    id: "team-ten-points",
    title: "10 puntos",
    description: "El equipo llega a diez puntos en la liga.",
    icon: "Layers",
    /* Three points a win, one a draw, counted from our own league results. */
    test: (facts) => facts.leaguePoints >= TEN_POINTS,
  }),
  teamEntry({
    id: "team-twenty-points",
    title: "20 puntos",
    description: "El equipo llega a veinte puntos en la liga.",
    icon: "ListOrdered",
    test: (facts) => facts.leaguePoints >= TWENTY_POINTS,
  }),
  teamEntry({
    id: "team-top-five",
    title: "Entre los 5",
    description:
      "La liga termina y el equipo queda entre los cinco primeros de la clasificación.",
    icon: "TrendingUp",
    /*
     * Proved by the league table once the league is over: a live table is a
     * position, not a final one, and a trophy for a position in November would be
     * a promise. `rank` only counts when the competition is complete.
     */
    test: (facts) =>
      facts.finishedCompetitions.some(
        (competition) =>
          competition.key === "league" && competition.rank != null && competition.rank <= TOP_FIVE,
      ),
  }),
  teamEntry({
    id: "team-podium",
    title: "Entre los 3",
    description: "La liga termina y el equipo queda entre los tres primeros.",
    icon: "Medal",
    test: (facts) =>
      facts.finishedCompetitions.some(
        (competition) =>
          competition.key === "league" && competition.rank != null && competition.rank <= PODIUM,
      ),
  }),
  teamEntry({
    id: "team-champions",
    title: "Campeón de liga",
    description: "La liga termina y el equipo acaba primero de la clasificación.",
    icon: "Crown",
    test: (facts) =>
      facts.finishedCompetitions.some(
        (competition) => competition.key === "league" && competition.rank === 1,
      ),
  }),
  teamEntry({
    id: "team-five-cup-matches",
    title: "5 de copa",
    description: "El equipo disputa al menos cinco partidos de copa.",
    icon: "CalendarCheck",
    /* Proved by counting played cup fixtures; a scheduled one is not played. */
    test: (facts) => facts.cupPlayed >= FIVE_CUP_MATCHES,
  }),
  teamEntry({
    id: "team-beat-leader",
    title: "Ganar al líder",
    description:
      "El equipo gana a quien ocupa la primera posición de una clasificación consultada, salvo que sea él mismo.",
    icon: "Swords",
    /*
     * Proved by the live table plus a played win against that club. The leader's
     * slug comes from the table, and the win from the results, so the claim never
     * depends on the order of two lists being the same list.
     */
    test: (facts) => facts.beatLeagueLeader,
  }),
];

const PLAYER = [
  playerEntry({
    id: "player-debut",
    title: "Debut",
    description: "Un jugador aparece convocado en un partido ya jugado.",
    icon: "Footprints",
    testFor: (player) => player.matches >= 1,
  }),
  playerEntry({
    id: "player-five-matches",
    title: "5 partidos",
    description: "Un jugador llega a cinco partidos jugados.",
    icon: "CalendarCheck",
    testFor: (player) => player.matches >= FIVE_MATCHES,
  }),
  playerEntry({
    id: "player-ten-matches",
    title: "10 partidos",
    description: "Un jugador llega a diez partidos jugados.",
    icon: "CalendarDays",
    testFor: (player) => player.matches >= TEN_MATCHES,
  }),
  playerEntry({
    id: "player-first-goal",
    title: "1er gol",
    description: "Un jugador marca su primer gol de la temporada.",
    icon: "Goal",
    testFor: (player) => player.goals >= 1,
  }),
  playerEntry({
    id: "player-five-goals",
    title: "5 goles",
    description: "Un jugador llega a cinco goles en la temporada.",
    icon: "Target",
    testFor: (player) => player.goals >= FIVE_GOALS,
  }),
  playerEntry({
    id: "player-ten-goals",
    title: "10 goles",
    description: "Un jugador llega a diez goles en la temporada.",
    icon: "Flame",
    testFor: (player) => player.goals >= TEN_GOALS,
  }),
  playerEntry({
    id: "player-first-mvp",
    title: "1er MVP",
    description: "Un jugador gana el MVP de un partido.",
    icon: "Star",
    testFor: (player) => player.mvps >= 1,
  }),
  playerEntry({
    id: "player-three-mvps",
    title: "3 MVP",
    description: "Un jugador gana el MVP de tres partidos.",
    icon: "Crown",
    testFor: (player) => player.mvps >= THREE_MVPS,
  }),
  playerEntry({
    id: "player-first-yellow",
    title: "1.ª amarilla",
    description: "Un jugador ve su primera tarjeta amarilla.",
    icon: "RectangleVertical",
    testFor: (player) => player.yellow >= 1,
  }),
  playerEntry({
    id: "player-first-vote",
    title: "Mi voto",
    description:
      "Has votado una vez al MVP de un partido. Es el voto que emites tú, no el que recibes.",
    icon: "ThumbsUp",
    /*
     * The vote is an action, and the evidence is the row it leaves: a ballot is
     * a vote row that names its voter. Holding a club code does not count —
     * holding a code is a state, not a feat, and the debut already covers the
     * onboarding case. With no backend and no rows, nothing was emitted, so the
     * entry stays locked.
     *
     * The actor is the reader, so this is the one entry whose two readings are
     * not the same fold: `testFor` asks whether THIS player cast a ballot (the
     * row's voter slug resolved through the squad list), and the squad-wide
     * reading keeps the identity the caller passed — when the caller says who is
     * looking (`voterSlug`), the row must be that voter's own, and without an
     * identity the fact can only be read as "somebody cast a ballot".
     */
    testFor: (player) => player.ballots >= 1,
    test: (facts) =>
      facts.voterSlug
        ? facts.voterBallots >= 1
        : facts.players.some((player) => player.ballots >= 1),
  }),
  playerEntry({
    id: "player-top-scorer",
    title: "Pichichi",
    seasonEnd: true,
    description:
      "El jugador con más goles de la temporada. Solo se entrega al final: con partidos por jugar la clasificación todavía puede cambiar.",
    icon: "Trophy",
    /*
     * Decidable only at the end of the season, and it says so here instead of
     * unlocking early: the goals of a player who is one behind today are not
     * final, so a "top scorer" handed out in November would be a promise, not a
     * record. See `seasonComplete` in seasonFacts: it is false while any fixture
     * the source published for the club is still unplayed.
     */
    testFor: (player, facts) => facts.seasonComplete && player.topScorer,
  }),
  playerEntry({
    id: "player-perfect-attendance",
    title: "Asistencia plena",
    seasonEnd: true,
    description:
      "Has ido convocado a todos los partidos jugados de la temporada, sin faltar a ninguno y con la lista de cada partido registrada. Solo se entrega al final, cuando no queda ninguno por jugar.",
    icon: "Percent",
    /*
     * The owner was explicit: «El de asistencia perfecta, solo se podría dar al
     * final de la liga». It therefore needs the season to be complete AND a
     * called-up list for every played match — one missing list means nobody's
     * count is complete, so nobody is "perfect". Both conditions are stated in
     * the description the screen prints, not only in this comment.
     */
    testFor: (player, facts) => facts.seasonComplete && player.perfect,
  }),

  /*
   * The owner's catalogue, 100 entries, of which these are the individual ones
   * the project's own data can prove. Every comment names the fact that proves it.
   */
  playerEntry({
    id: "player-fifteen-goals",
    title: "15 goles",
    description: "Un jugador llega a quince goles en la temporada.",
    icon: "Target",
    /* Proved by the season goal total the club reports per player. */
    testFor: (player) => player.goals >= FIFTEEN_GOALS,
  }),
  playerEntry({
    id: "player-twenty-goals",
    title: "20 goles",
    description: "Un jugador llega a veinte goles en la temporada.",
    icon: "Flame",
    testFor: (player) => player.goals >= TWENTY_GOALS,
  }),
  playerEntry({
    id: "player-twentyfive-goals",
    title: "25 goles",
    description: "Un jugador llega a veinticinco goles en la temporada.",
    icon: "Crown",
    testFor: (player) => player.goals >= TWENTYFIVE_GOALS,
  }),
  playerEntry({
    id: "player-fifteen-matches",
    title: "15 partidos",
    description: "Un jugador llega a quince partidos convocado.",
    icon: "CalendarDays",
    testFor: (player) => player.matches >= FIFTEEN_MATCHES,
  }),
  playerEntry({
    id: "player-twenty-matches",
    title: "20 partidos",
    description: "Un jugador llega a veinte partidos convocado.",
    icon: "CalendarCheck",
    testFor: (player) => player.matches >= TWENTY_MATCHES,
  }),
  playerEntry({
    id: "player-five-consecutive-call-ups",
    title: "5 seguidos",
    description:
      "Un jugador aparece en la lista de convocados de cinco partidos jugados consecutivos.",
    icon: "Repeat",
    /*
     * Proved only when every played match has a called-up list: a missing list is
     * an unknown, not an absence, so the run is not computed at all and the entry
     * stays locked. When the lists are complete, the run comes from kickoff order.
     */
    testFor: (player, facts) =>
      facts.everyMatchHasList && player.callUpRun >= FIVE_CONSECUTIVE_CALL_UPS,
  }),
  playerEntry({
    id: "player-ten-consecutive-call-ups",
    title: "10 seguidos",
    description:
      "Un jugador aparece en la lista de convocados de diez partidos jugados consecutivos.",
    icon: "Repeat",
    testFor: (player, facts) =>
      facts.everyMatchHasList && player.callUpRun >= TEN_CONSECUTIVE_CALL_UPS,
  }),
  playerEntry({
    id: "player-first-vote-received",
    title: "1er voto",
    description:
      "Un jugador recibe su primer voto de MVP. Recibir un voto no es ganar la votación: eso es «1er MVP».",
    icon: "Vote",
    /* Proved by a ballot row that names him, not by the award he may or may not win. */
    testFor: (player) => player.votesReceived >= ONE_VOTE,
  }),
  playerEntry({
    id: "player-five-votes-received",
    title: "5 votos",
    description: "Un jugador acumula cinco votos de MVP.",
    icon: "Vote",
    testFor: (player) => player.votesReceived >= FIVE_VOTES,
  }),
  playerEntry({
    id: "player-ten-votes-received",
    title: "10 votos",
    description: "Un jugador acumula diez votos de MVP.",
    icon: "Vote",
    testFor: (player) => player.votesReceived >= TEN_VOTES,
  }),
  playerEntry({
    id: "player-twenty-votes-received",
    title: "20 votos",
    description: "Un jugador acumula veinte votos de MVP.",
    icon: "Vote",
    testFor: (player) => player.votesReceived >= TWENTY_VOTES,
  }),
  playerEntry({
    id: "player-five-mvps",
    title: "5 MVP",
    description: "Un jugador gana el MVP de cinco partidos.",
    icon: "Star",
    testFor: (player) => player.mvps >= FIVE_MVPS,
  }),
  playerEntry({
    id: "player-ten-mvps",
    title: "10 MVP",
    description: "Un jugador gana el MVP de diez partidos.",
    icon: "Crown",
    testFor: (player) => player.mvps >= TEN_MVPS,
  }),
  playerEntry({
    id: "player-consecutive-mvps",
    title: "2 MVP seguidos",
    description: "Un jugador gana el MVP de dos partidos consecutivos.",
    icon: "Repeat",
    /*
     * Proved by the MVP awards placed in kickoff order. Only awards whose match
     * key resolves to a played fixture can be placed; a vote for a match the
     * source has not played is not invented into a slot.
     */
    testFor: (player) => player.mvpRun >= TWO_MVPS_IN_A_ROW,
  }),
  playerEntry({
    id: "player-five-voters",
    title: "5 votantes",
    description:
      "Cinco compañeros distintos te han votado como MVP. Cuentan los votantes, no los votos: cinco votos de la misma persona son una.",
    icon: "Users",
    /* Proved by distinct voter slugs on his ballots, not by the number of votes. */
    testFor: (player) => player.voters >= FIVE_VOTERS,
  }),
  playerEntry({
    id: "player-ten-voters",
    title: "10 votantes",
    description:
      "Diez compañeros distintos te han votado como MVP. Cuentan los votantes, no los votos: diez votos de la misma persona son uno.",
    icon: "UsersRound",
    testFor: (player) => player.voters >= TEN_VOTERS,
  }),
  playerEntry({
    id: "player-three-yellows",
    title: "3 amarillas",
    description: "Un jugador acumula tres tarjetas amarillas.",
    icon: "RectangleVertical",
    /* Proved by the card totals the club reports per player. */
    testFor: (player) => player.yellow >= THREE_YELLOWS,
  }),
  playerEntry({
    id: "player-five-yellows",
    title: "5 amarillas",
    description: "Un jugador acumula cinco tarjetas amarillas.",
    icon: "RectangleVertical",
    testFor: (player) => player.yellow >= FIVE_YELLOWS,
  }),
  playerEntry({
    id: "player-ten-yellows",
    title: "10 amarillas",
    description: "Un jugador acumula diez tarjetas amarillas.",
    icon: "RectangleVertical",
    testFor: (player) => player.yellow >= TEN_YELLOWS,
  }),
  playerEntry({
    id: "player-first-red",
    title: "1.ª roja",
    description: "Un jugador ve su primera tarjeta roja.",
    icon: "Ban",
    testFor: (player) => player.red >= 1,
  }),
  playerEntry({
    id: "player-yellow-and-red",
    title: "Amarilla y roja",
    description: "Un jugador acumula al menos una amarilla y una roja en la misma temporada.",
    icon: "TriangleAlert",
    /*
     * Proved by the record's totals for one player: the club reports the season,
     * and both colours in it. It says nothing about which match each came in, so
     * no entry is claimed about the same afternoon.
     */
    testFor: (player) => player.yellow >= 1 && player.red >= 1,
  }),
  playerEntry({
    id: "player-two-reds",
    title: "2 rojas",
    description: "Un jugador acumula dos tarjetas rojas.",
    icon: "Ban",
    testFor: (player) => player.red >= TWO_REDS,
  }),
  playerEntry({
    id: "player-most-cards",
    title: "Más tarjetas",
    description:
      "Al acabar la temporada, un jugador es el que más tarjetas suma del equipo (amarillas y rojas juntas).",
    icon: "Siren",
    /*
     * Proved by the card totals once the season is over; a tie leaves the entry
     * unlocked for every player on the top figure, because the claim is "as many
     * as the most", not "more than the rest". The figure he is compared with is
     * the squad's, because "the most" is a comparison, not a fact about him.
     */
    testFor: (player, facts) =>
      facts.seasonComplete &&
      player.cards > 0 &&
      player.cards === max(facts.players, (other) => other.cards),
  }),
  playerEntry({
    id: "player-five-league-goals",
    title: "5 en liga",
    description: "Un jugador marca cinco goles en la liga.",
    icon: "Layers",
    /* Proved by the league column of the scorer record, not the season total. */
    testFor: (player) => player.leagueGoals >= FIVE_LEAGUE_GOALS,
  }),
  playerEntry({
    id: "player-three-cup-goals",
    title: "3 en copa",
    description: "Un jugador marca tres goles en la copa.",
    icon: "Medal",
    testFor: (player) => player.cupGoals >= THREE_CUP_GOALS,
  }),
  playerEntry({
    id: "player-goal-in-both",
    title: "Liga y copa",
    description: "Un jugador marca al menos un gol en la liga y otro en la copa.",
    icon: "Shuffle",
    testFor: (player) => player.leagueGoals >= 1 && player.cupGoals >= 1,
  }),
  playerEntry({
    id: "player-competition-top-scorer",
    title: "Pichichi del equipo",
    description:
      "Al acabar una competición, un jugador es el máximo goleador del equipo en ella, según el reparto liga/copa del registro.",
    icon: "Crosshair",
    /*
     * Proved by the league/cup split of a finished competition, not the season
     * total. "The team's top scorer in it" is a comparison, so the entry compares
     * him against the squad's own split for that competition — and still needs his
     * own figure to be a goal, so a competition nobody scored in crowns nobody.
     */
    testFor: (player, facts) =>
      facts.finishedCompetitions.some((competition) => {
        const goals = competitionGoalsOf(player, competition.key);
        const best = max(facts.players, (other) => competitionGoalsOf(other, competition.key));
        return goals > 0 && goals === best;
      }),
  }),
  playerEntry({
    id: "player-mvp-in-loss",
    title: "MVP en derrota",
    description:
      "Un jugador es elegido MVP de un partido que el equipo pierde, con los votos y el resultado del mismo encuentro.",
    icon: "ThumbsDown",
    /*
     * Proved by joining the award to the result of its own match: the vote rows say
     * who won it, the calendar says the club lost it. A vote for a player the squad
     * does not know is not credited to anyone, so it cannot unlock this. The award
     * is matched to him by the name it carries, so a team-mate's MVP in a defeat is
     * not his trophy.
     */
    testFor: (player, facts) =>
      facts.mvpAwards.some(
        (award) =>
          award.name != null &&
          normalise(award.name) === player.key &&
          facts.played.some(
            (match) => match.key === award.matchKey && match.result === "loss",
          ),
      ),
  }),

  /*
   * The nine entries of the owner's catalogue that needed a single match and had
   * nowhere to read it from. They read the acta ledger (src/data/match-ledger.json
   * through src/lib/match-ledger.js) and nothing else: the record's season totals
   * cannot answer any of them, and the calendar's score cannot say who scored or
   * who was booked.
   *
   * Each one is locked while the match it talks about has no row. That is the
   * whole point: today only the cup match of 17 November has an acta transcribed,
   * so the double is provable and the scoring runs, the cards and the first goal
   * of the season wait for the league reports to arrive.
   */
  playerEntry({
    id: "player-two-goals-in-a-match",
    title: "Doblete",
    description: "Un jugador marca dos goles en un mismo partido, según el acta.",
    icon: "Goal",
    /* Proved by one ledger row: the acta counts the goals per player in that match. */
    testFor: (player) => player.ledgerGoalsInAMatch >= DOUBLE,
  }),
  playerEntry({
    id: "player-three-goals-in-a-match",
    title: "Hat-trick",
    description: "Un jugador marca tres goles en un mismo partido, según el acta.",
    icon: "Sparkles",
    testFor: (player) => player.ledgerGoalsInAMatch >= HAT_TRICK,
  }),
  playerEntry({
    id: "player-four-goals-in-a-match",
    title: "Noche inspirada",
    description: "Un jugador marca cuatro goles en un mismo partido, según el acta.",
    icon: "Flame",
    testFor: (player) => player.ledgerGoalsInAMatch >= FOUR_GOALS_IN_A_MATCH,
  }),
  playerEntry({
    id: "player-scoring-run-three",
    title: "Siempre aparece",
    description:
      "Un jugador marca en tres partidos consecutivos. Un partido sin acta corta la racha en vez de saltarla.",
    icon: "Repeat",
    /*
     * Proved by three consecutive played matches whose actas all count a goal for
     * him. A played match with no acta is an unknown, so the run stops there: the
     * goals of the missing report could be the ones that break it.
     */
    testFor: (player) => player.scoringRun >= THREE_MATCH_SCORING_RUN,
  }),
  playerEntry({
    id: "player-scoring-run-five",
    title: "No perdona",
    description: "Un jugador marca en cinco partidos consecutivos, con acta en todos ellos.",
    icon: "ChevronsUp",
    testFor: (player) => player.scoringRun >= FIVE_MATCH_SCORING_RUN,
  }),
  playerEntry({
    id: "player-three-scoring-runs",
    title: "El hombre de las rachas",
    description:
      "Un jugador firma tres rachas de tres partidos seguidos marcando a lo largo de la temporada.",
    icon: "Zap",
    /*
     * Three separate runs, not one long one: `countRuns` counts the maximal runs
     * of three or more consecutive scoring matches. A played match with no acta
     * ends a run where it stands, because the goals of that night are unknown and
     * cannot be counted into it.
     */
    testFor: (player) => player.scoringRunsOfThree >= THREE_SCORING_RUNS,
  }),
  playerEntry({
    id: "player-first-scorer-of-the-season",
    title: "El primero de todos",
    description:
      "El primer jugador de la plantilla en marcar un gol en la temporada, con el acta del primer partido que lo prueba.",
    icon: "Award",
    /*
     * Proved by the earliest played match whose acta counts a goal — provided no
     * earlier played match is missing its acta, because the first goal of the
     * season could be sitting in that gap. The acta does not order the goals
     * inside one match, so two scorers in that first match are both "the first".
     */
    testFor: (player, facts) =>
      facts.firstScorerKnown &&
      facts.firstScorers.some((name) => normalise(name) === player.key),
  }),
  playerEntry({
    id: "player-two-cards-in-a-match",
    title: "No aprendo",
    description: "Un jugador ve dos tarjetas en un mismo partido, tal y como las registra el acta.",
    icon: "TriangleAlert",
    /* Two card lines for the same player in one row: the acta saw both that night. */
    testFor: (player) => player.ledgerCardsInAMatch >= TWO_CARDS_IN_A_MATCH,
  }),
  playerEntry({
    id: "player-yellows-in-a-row",
    title: "Bajo vigilancia",
    description:
      "Un jugador ve amarilla en tres jornadas consecutivas de la misma competición, según las actas.",
    icon: "RectangleVertical",
    /*
     * Proved by three yellows on consecutive matchdays of one competition. A
     * competition change is not a following jornada, and a matchday with no acta
     * breaks the chain instead of being assumed card-free.
     */
    testFor: (player) => player.yellowRun >= THREE_YELLOWS_IN_A_ROW,
  }),
];

export const achievements = [...TEAM, ...PLAYER];
export const teamAchievements = TEAM;
export const playerAchievements = PLAYER;

/** The entry with this id, or null. Used by a future detail view, not by the evaluator. */
export const achievementById = (id) => achievements.find((entry) => entry.id === id) ?? null;

/**
 * The evaluator.
 *
 * Input:
 *   fixtures  the club's whole season in the shape src/data/competition.js
 *             produces (`competitionKey`, `matchday`, `home`, `away`, `score`,
 *             `status`). Played and pending both matter: the pending half is
 *             what keeps the two season-end entries locked.
 *   record    src/data/club-record.json as it is ({ scorers, cards, attendance }).
 *   squad     src/data/teamData.json's squad — the denominator of "convocatoria
 *             completa" and the only way a vote slug becomes a name.
 *   votes     optional MVP vote rows: { match_key? | match_id? | competition? +
 *             matchday?, candidate_slug, voter_slug? }. Absent, null or empty
 *             means no MVP was ever awarded: locked, never a crash.
 *   tables    optional standings, as [{ key, rows }] or { league: rows }. The
 *             rows are the published table of that competition; without them
 *             every entry that names a position or compares against the rest of
 *             the table is locked.
 *   voterSlug optional: the reader's own slug, to decide "Primer voto" about
 *             that reader instead of about the table in general.
 *   ledger    optional per-match actas: src/data/match-ledger.json as it is
 *             ({ matches: [...] }) or the bare array of rows. Leaving it out
 *             means "the club's transcribed actas" (src/lib/match-ledger.js);
 *             passing null or [] means "no match report exists", which locks
 *             every entry that needs a single match instead of reading the
 *             absence as zero goals and zero cards.
 *
 * Output, per scope, the unlocked ids (and the locked ones, so a screen does not
 * have to diff) plus the progress figures behind them. Pure: no state, no clock,
 * no I/O, and the input is never mutated.
 *
 * The player scope is returned TWICE on purpose, because the two questions are
 * different and the shelf picked the wrong one for months (S13):
 *
 *   player.unlocked          the squad-wide reading: does ANY player hold it?
 *                            Honest, and it says nothing about the reader. It is
 *                            labelled `attribution: "squad"` so no screen can
 *                            mistake it for "yours", and it is the only answer a
 *                            caller with no identity can ask.
 *   player.byPlayer          one scope per player, decided against that player's
 *                            own figures, which is what the personal shelf draws.
 */
export function evaluateAchievements(input = {}) {
  const scopeFacts = seasonFacts(input);

  const decide = (entries) => {
    const unlocked = [];
    const locked = [];
    for (const entry of entries) {
      const holds = safeTest(entry, scopeFacts);
      (holds ? unlocked : locked).push(entry.id);
    }
    return { unlocked, locked };
  };

  const team = decide(TEAM);
  const player = decide(PLAYER);

  return {
    facts: scopeFacts,
    team: {
      ...team,
      progress: {
        playedMatches: scopeFacts.playedMatches,
        goalsFor: scopeFacts.goalsFor,
        goalsAgainst: scopeFacts.goalsAgainst,
        wins: scopeFacts.wins,
        draws: scopeFacts.draws,
        losses: scopeFacts.losses,
        cleanSheets: scopeFacts.cleanSheets,
        bestScoring: scopeFacts.bestScoring,
        bestMargin: scopeFacts.bestMargin,
        winStreak: scopeFacts.winStreak,
        unbeatenRun: scopeFacts.unbeatenRun,
        homeWins: scopeFacts.homeWins,
        awayWins: scopeFacts.awayWins,
        cupWins: scopeFacts.cupWins,
        leagueGoals: scopeFacts.leagueGoals,
        rivals: scopeFacts.rivals,
        bestCalledUp: scopeFacts.bestCalledUp,
        squadSize: scopeFacts.squadSize,
        fullSquad: scopeFacts.fullSquad,
        cards: scopeFacts.cards,
        cardFreeMatches: scopeFacts.cardFreeMatches.map((match) => ({
          competitionKey: match.competitionKey,
          matchday: match.matchday,
        })),
        mvpAwards: scopeFacts.mvpAwards,
        ballots: scopeFacts.ballots,
        bestMvpVotes: scopeFacts.bestMvpVotes,
        seasonComplete: scopeFacts.seasonComplete,
      },
    },
    player: {
      ...player,
      /*
       * Which question `unlocked` above answered. A squad-wide list drawn under
       * one player's name is exactly the bug this field exists to make
       * impossible to write by accident.
       */
      attribution: "squad",
      byPlayer: decidePlayerScopes(scopeFacts),
      progress: {
        playedMatches: scopeFacts.playedMatches,
        everyMatchHasList: scopeFacts.everyMatchHasList,
        seasonComplete: scopeFacts.seasonComplete,
        topGoals: scopeFacts.topGoals,
        /* What the two season-end entries would say today, for the pending state. */
        pending: {
          topScorer: scopeFacts.topScorers,
          perfectAttendance: scopeFacts.perfectAttendance,
        },
        ballots: scopeFacts.ballots,
        voterBallots: scopeFacts.voterBallots,
        players: scopeFacts.players,
      },
    },
  };
}

/**
 * One scope per player, decided against that player's own figures.
 *
 * Keyed by the normalised name, the identity the evaluator has always used, and
 * carrying the squad slug when a squad list names the man so a caller holding
 * only an id can find him. A player with no row (no call-up, no card, no goal,
 * no vote, no acta) is not in the map: `playerScopeFor` turns that absence into
 * an all-locked scope, because a man whom no report names has not proven a
 * thing — and definitely has not inherited a team-mate's trophy.
 *
 * It is rebuilt per evaluation rather than cached at module load: the evaluator
 * is a pure function of its input, so a cache keyed on nothing would be a lie as
 * soon as a caller passes a different season, and the cost is 49 predicates per
 * player over a squad of fifteen.
 */
function decidePlayerScopes(facts) {
  const scopes = new Map();
  for (const player of facts.players) {
    const unlocked = [];
    const locked = [];
    for (const entry of PLAYER) {
      (safeTestFor(entry, player, facts) ? unlocked : locked).push(entry.id);
    }
    scopes.set(player.key, {
      key: player.key,
      slug: player.slug ?? null,
      name: player.name,
      unlocked,
      locked,
      progress: {
        playedMatches: facts.playedMatches,
        seasonComplete: facts.seasonComplete,
        everyMatchHasList: facts.everyMatchHasList,
        matches: player.matches,
        goals: player.goals,
        leagueGoals: player.leagueGoals,
        cupGoals: player.cupGoals,
        mvps: player.mvps,
        yellow: player.yellow,
        red: player.red,
        cards: player.cards,
        votesReceived: player.votesReceived,
        voters: player.voters,
        ballots: player.ballots,
      },
    });
  }
  return scopes;
}

/**
 * The scope of ONE reader, out of the evaluated personal scope.
 *
 * This is the function the personal shelf reads, and the only one it should: it
 * answers "what has THIS player unlocked" and never "what has the squad
 * unlocked", which is the difference between a trophy and a misunderstanding.
 * `identity` is what the app knows about the device — `{ id, name }` from
 * teamData.json — so the lookup works whether the caller has the squad id or only
 * the name.
 *
 * A reader the evaluator has no row for gets an all-locked scope rather than
 * `null`: the shelf must be able to say "nothing yet" about a real player who
 * has not appeared in a report, and must never fall back to the squad-wide
 * reading to fill the gap.
 */
export function playerScopeFor(playerScope, identity = {}) {
  const byPlayer = playerScope?.byPlayer;
  if (!(byPlayer instanceof Map)) return null;

  const slug = identity?.id != null ? String(identity.id) : null;
  const key = identity?.name ? normalise(identity.name) : null;
  if (!key) return null;

  const found = byPlayer.get(key);
  if (found) return found;

  return {
    key,
    slug,
    name: String(identity.name).trim(),
    unlocked: [],
    locked: PLAYER.map((entry) => entry.id),
    progress: {
      playedMatches: playerScope?.progress?.playedMatches ?? 0,
      seasonComplete: playerScope?.progress?.seasonComplete ?? null,
      everyMatchHasList: playerScope?.progress?.everyMatchHasList === true,
      matches: 0,
      goals: 0,
      leagueGoals: 0,
      cupGoals: 0,
      mvps: 0,
      yellow: 0,
      red: 0,
      cards: 0,
      votesReceived: 0,
      voters: 0,
      ballots: 0,
    },
  };
}

/**
 * A ballot of one voter on one match: the same key `readVotes` groups by, plus
 * the voter. Counting distinct pairs is what stops a rewritten vote (the upsert
 * in src/lib/mvp.js updates a row) from counting twice.
 */
function countBallots(votes, voterSlug) {
  const pairs = new Set();
  for (const row of asArray(votes)) {
    const voter = row?.voter_slug ?? row?.voterSlug;
    if (voter == null || String(voter) !== voterSlug) continue;
    if (!(row.candidate_slug ?? row.candidateSlug)) continue;
    pairs.add(`${voteMatchKey(row)}|${voterSlug}`);
  }
  return pairs.size;
}

/**
 * A predicate that throws is a bug in the catalogue, not a reason to hide the
 * whole shelf: the entry is reported locked, because an achievement that could
 * not be decided has not been proven.
 */
function safeTest(entry, facts) {
  try {
    return entry.test(facts) === true;
  } catch {
    return false;
  }
}

/** The same rule, asked about one player. Locked when the predicate throws. */
function safeTestFor(entry, player, facts) {
  try {
    return entry.testFor(player, facts) === true;
  } catch {
    return false;
  }
}
