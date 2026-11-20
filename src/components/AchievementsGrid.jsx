/**
 * The achievements shelf: one grid, drawn from the catalogue in
 * src/data/achievements.js, used by the dashboard card and by both blocks of
 * `/logros`. There is no second list of entries anywhere — the scope that is
 * handed in decides what is drawn, and the evaluator decides what is lit.
 *
 * A tile is a plate and a name, nothing else: a rounded frame with the entry's
 * own icon centred, so the whole catalogue reads as one family instead of one
 * illustration per trophy. Three states, and only three:
 *
 *   unlocked — the brand accent on the plate and on the icon, the name in white.
 *              An entry only gets here because `evaluateAchievements` listed it.
 *   locked   — the plate and the icon recede into the card (no colour, low
 *              contrast), because an empty shape says "not yet" without drawing
 *              attention. The NAME stays readable: the reader has to know what he
 *              is missing.
 *   pending  — a locked entry the calendar makes undecidable (the two
 *              `seasonEnd` ones). Same recession, a dashed plate and one extra
 *              line, so nobody reads "Pichichi" as lost. It is derived
 *              from `progress.seasonComplete`, never from a guess: a pending
 *              trophy is a promise the season has not broken yet.
 *
 * The weight carries the state, not only the colour. Remix Icon draws the same
 * glyph as an outline (`*Line`) and as a solid (`*Fill`), so an earned entry is
 * the solid variant and a locked or pending one is the outline. Colour alone was
 * the only difference before, which is invisible to a colour-blind reader and
 * weak at a glance in a grid of 107; the silhouette now says it on its own, and
 * the red stays as the accent it was always meant to be.
 *
 * The glyphs come from Remix Icon through `react-icons` and not from Phosphor:
 * `react-icons` ships one module per glyph per variant, so an explicit import
 * list tree-shakes down to the two weights of the fifty-two glyphs the catalogue
 * names. A namespace import would ship the whole set, which is exactly the cost
 * this file was changed to stop paying.
 */
import {
  RiAddFill,
  RiAddLine,
  RiAlarmWarningFill,
  RiAlarmWarningLine,
  RiAlertFill,
  RiAlertLine,
  RiArrowGoBackFill,
  RiArrowGoBackLine,
  RiArrowRightDownFill,
  RiArrowRightDownLine,
  RiArrowRightUpFill,
  RiArrowRightUpLine,
  RiArrowUpDoubleFill,
  RiArrowUpDoubleLine,
  RiAwardFill,
  RiAwardLine,
  RiBoxingFill,
  RiBoxingLine,
  RiCalendarCheckFill,
  RiCalendarCheckLine,
  RiCalendarFill,
  RiCalendarLine,
  RiCheckboxFill,
  RiCheckboxLine,
  RiCrosshairFill,
  RiCrosshairLine,
  RiDiamondFill,
  RiDiamondLine,
  RiEmotionSadFill,
  RiEmotionSadLine,
  RiFireFill,
  RiFireLine,
  RiFlashlightFill,
  RiFlashlightLine,
  RiFootballFill,
  RiFootballLine,
  RiFootprintFill,
  RiFootprintLine,
  RiForbidFill,
  RiForbidLine,
  RiGroupFill,
  RiGroupLine,
  RiHomeFill,
  RiHomeLine,
  RiInfinityFill,
  RiInfinityLine,
  RiListOrdered,
  RiMedalFill,
  RiMedalLine,
  RiPercentFill,
  RiPercentLine,
  RiPlaneFill,
  RiPlaneLine,
  RiRectangleFill,
  RiRectangleLine,
  RiRepeatFill,
  RiRepeatLine,
  RiRocketFill,
  RiRocketLine,
  RiShakeHandsFill,
  RiShakeHandsLine,
  RiShieldCheckFill,
  RiShieldCheckLine,
  RiShieldCrossFill,
  RiShieldCrossLine,
  RiShieldFill,
  RiShieldFlashFill,
  RiShieldFlashLine,
  RiShieldLine,
  RiShieldStarFill,
  RiShieldStarLine,
  RiShuffleFill,
  RiShuffleLine,
  RiSnowflakeFill,
  RiSnowflakeLine,
  RiSparklingFill,
  RiSparklingLine,
  RiSpeedFill,
  RiSpeedLine,
  RiStackFill,
  RiStackLine,
  RiStarFill,
  RiStarLine,
  RiSwordFill,
  RiSwordLine,
  RiTargetFill,
  RiTargetLine,
  RiTeamFill,
  RiTeamLine,
  RiThumbDownFill,
  RiThumbDownLine,
  RiThumbUpFill,
  RiThumbUpLine,
  RiTrophyFill,
  RiTrophyLine,
  RiUserFollowFill,
  RiUserFollowLine,
  RiVerifiedBadgeFill,
  RiVerifiedBadgeLine,
  RiVipCrownFill,
  RiVipCrownLine,
} from "react-icons/ri";
import { CLUB_SLUG, evaluateAchievements } from "../data/achievements.js";
import { competitions } from "../data/competition.js";
import record from "../data/club-record.json";
import teamData from "../data/teamData.json";

/**
 * The catalogue names its icon as a string, so the string has to become a
 * component somewhere. It is resolved here, with named imports and not
 * `import * as remix`, because a namespace import defeats tree-shaking and would
 * ship the whole icon set for the glyphs the catalogue actually uses.
 *
 * The KEY is the catalogue's name and never the library's: the catalogue keeps
 * storing `Trophy`, `Goal` or `RectangleVertical`, and the entries below say
 * which Remix glyph stands for it in each weight. Renaming a key would break
 * every entry that names it, so the two vocabularies are joined here and only
 * here.
 *
 * Every icon the catalogue names must be registered: a name missing from this
 * map renders a tile with no glyph at all, which is why the catalogue's icon
 * test and this map have to grow together.
 *
 * Where Remix has no glyph of that exact shape, the closest one is used and
 * marked `improvised:` below — the card keeps its meaning, but the drawing is a
 * stand-in, not the same symbol. Where Remix ships a glyph in one weight only,
 * both states use that weight and the entry says so.
 */
const PLATE_ICONS = {
  ArrowUpRight: { line: RiArrowRightUpLine, fill: RiArrowRightUpFill },
  Award: { line: RiAwardLine, fill: RiAwardFill },
  BadgeCheck: { line: RiVerifiedBadgeLine, fill: RiVerifiedBadgeFill },
  Ban: { line: RiForbidLine, fill: RiForbidFill },
  // improvised: Remix has no biceps or barbell; a boxing glove is the closest
  // strength drawing (the entry is a five-win streak).
  BicepsFlexed: { line: RiBoxingLine, fill: RiBoxingFill },
  CalendarCheck: { line: RiCalendarCheckLine, fill: RiCalendarCheckFill },
  CalendarDays: { line: RiCalendarLine, fill: RiCalendarFill },
  ChevronsUp: { line: RiArrowUpDoubleLine, fill: RiArrowUpDoubleFill },
  Crosshair: { line: RiCrosshairLine, fill: RiCrosshairFill },
  Crown: { line: RiVipCrownLine, fill: RiVipCrownFill },
  Flame: { line: RiFireLine, fill: RiFireFill },
  Footprints: { line: RiFootprintLine, fill: RiFootprintFill },
  Frown: { line: RiEmotionSadLine, fill: RiEmotionSadFill },
  Gauge: { line: RiSpeedLine, fill: RiSpeedFill },
  Gem: { line: RiDiamondLine, fill: RiDiamondFill },
  Goal: { line: RiFootballLine, fill: RiFootballFill },
  Handshake: { line: RiShakeHandsLine, fill: RiShakeHandsFill },
  Home: { line: RiHomeLine, fill: RiHomeFill },
  Infinity: { line: RiInfinityLine, fill: RiInfinityFill },
  Layers: { line: RiStackLine, fill: RiStackFill },
  // single weight: `RiListOrdered` has no Fill counterpart, so both states use it.
  ListOrdered: { line: RiListOrdered, fill: RiListOrdered },
  Medal: { line: RiMedalLine, fill: RiMedalFill },
  Percent: { line: RiPercentLine, fill: RiPercentFill },
  Plane: { line: RiPlaneLine, fill: RiPlaneFill },
  Plus: { line: RiAddLine, fill: RiAddFill },
  // improvised: Remix's only plain rectangle is horizontal, as Phosphor's was.
  RectangleVertical: { line: RiRectangleLine, fill: RiRectangleFill },
  Repeat: { line: RiRepeatLine, fill: RiRepeatFill },
  Rocket: { line: RiRocketLine, fill: RiRocketFill },
  RotateCcw: { line: RiArrowGoBackLine, fill: RiArrowGoBackFill },
  Shield: { line: RiShieldLine, fill: RiShieldFill },
  ShieldCheck: { line: RiShieldCheckLine, fill: RiShieldCheckFill },
  // improvised: Remix has no half shield; a starred shield keeps it a shield.
  ShieldHalf: { line: RiShieldStarLine, fill: RiShieldStarFill },
  ShieldOff: { line: RiShieldCrossLine, fill: RiShieldCrossFill },
  // improvised: Remix has no shield with a plus; a flashed shield stands in.
  ShieldPlus: { line: RiShieldFlashLine, fill: RiShieldFlashFill },
  Shuffle: { line: RiShuffleLine, fill: RiShuffleFill },
  // improvised: Remix has no siren; the warning alarm is the same noise.
  Siren: { line: RiAlarmWarningLine, fill: RiAlarmWarningFill },
  Snowflake: { line: RiSnowflakeLine, fill: RiSnowflakeFill },
  Sparkles: { line: RiSparklingLine, fill: RiSparklingFill },
  Star: { line: RiStarLine, fill: RiStarFill },
  Swords: { line: RiSwordLine, fill: RiSwordFill },
  Target: { line: RiTargetLine, fill: RiTargetFill },
  ThumbsDown: { line: RiThumbDownLine, fill: RiThumbDownFill },
  ThumbsUp: { line: RiThumbUpLine, fill: RiThumbUpFill },
  // improvised: Remix ships no trend arrows; the diagonal down arrow is the
  // closest stand-in and keeps the direction legible.
  TrendingDown: { line: RiArrowRightDownLine, fill: RiArrowRightDownFill },
  // improvised: the same diagonal, upwards. Remix has one up-right arrow, so
  // this and `ArrowUpRight` draw the same glyph.
  TrendingUp: { line: RiArrowRightUpLine, fill: RiArrowRightUpFill },
  TriangleAlert: { line: RiAlertLine, fill: RiAlertFill },
  Trophy: { line: RiTrophyLine, fill: RiTrophyFill },
  UserCheck: { line: RiUserFollowLine, fill: RiUserFollowFill },
  Users: { line: RiGroupLine, fill: RiGroupFill },
  UsersRound: { line: RiTeamLine, fill: RiTeamFill },
  // improvised: Remix has no ballot; a ticked box is Phosphor's CheckSquare,
  // which was already the glyph behind this name.
  Vote: { line: RiCheckboxLine, fill: RiCheckboxFill },
  Zap: { line: RiFlashlightLine, fill: RiFlashlightFill },
};

/**
 * The season the evaluator reads, assembled once at import.
 *
 * The fixtures come from `competitions` and NOT from `calendarFixtures()`: the
 * calendar drops a scheduled fixture whose kickoff has passed, and to the
 * evaluator a dropped fixture is not pending any more — which would hand out
 * the two end-of-season entries halfway through the season. Every club fixture
 * the source published goes in, played or not, with the `competitionKey` its
 * parent competition carries.
 *
 * No votes are passed. The MVP rows live in Supabase behind a per-match read
 * (`src/lib/mvp.js` exposes `fetchTally(matchId)` and nothing that reads a whole
 * season), so the voting entries come out LOCKED rather than counted from an
 * incomplete tally: the shelf may stay dark, it may not lie.
 *
 * The standings ARE passed. They are static data the bundle already carries, and
 * they are what the two "table" entries and "Ganar al líder" read; the entries
 * that need a final position still wait for their competition to be over.
 */
const FIXTURES = competitions.flatMap((competition) =>
  competition.fixtures
    .filter((fixture) => fixture.home?.slug === CLUB_SLUG || fixture.away?.slug === CLUB_SLUG)
    .map((fixture) => ({ ...fixture, competitionKey: competition.key })),
);

const TABLES = competitions.map((competition) => ({
  key: competition.key,
  rows: competition.table,
}));

const SEASON = {
  clubSlug: CLUB_SLUG,
  fixtures: FIXTURES,
  tables: TABLES,
  record,
  squad: teamData.squad,
};

/**
 * Both scopes, decided once for the whole app. The evaluator is a pure function
 * of static data, so the dashboard card and the two blocks of `/logros` cannot
 * disagree about a single trophy.
 */
export const seasonAchievements = evaluateAchievements(SEASON);

/*
 * The plate is a recess, not a box (S7). No border and no fill of its own beyond
 * one step darker than the card, plus two inset shadows: a dark one across the
 * top and a hair of light along the bottom edge, which is how a groove takes the
 * light. One size up from the old plate, because the frame that used to give the
 * icon its weight is gone.
 */
const PLATE_BASE =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-acf-dark/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.7),inset_0_-1px_0_rgba(255,255,255,0.06)] transition-colors duration-200";

/* What changes between the three states is the ink, never the recess: the shelf
   has to read as one carved surface, and a coloured box per state would rebuild
   the plates the owner asked to remove. */
const PLATE_UNLOCKED = "text-acf-red-soft";
const PLATE_PENDING = "text-acf-grey/60";
const PLATE_LOCKED = "text-acf-dim";

/** One entry: a plate with its icon, the name under it, and its state spoken. */
export function AchievementTile({ entry, unlocked = false, pending = false }) {
  const weights = PLATE_ICONS[entry.icon] ?? null;
  /*
   * The weight is the state: the solid `fill` variant once the evaluator earned
   * the entry, the `line` outline while it has not. `pending` is not earned, so
   * it keeps the outline and gets the dashed plate instead. Choosing the glyph
   * from `unlocked` — and not from a class or an `opacity` — is what makes the
   * difference readable at a glance and to a colour-blind reader.
   */
  const Glyph = weights ? (unlocked ? weights.fill : weights.line) : null;
  const plate = unlocked ? PLATE_UNLOCKED : pending ? PLATE_PENDING : PLATE_LOCKED;

  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <span aria-hidden="true" className={`${PLATE_BASE} ${plate}`}>
        {Glyph ? <Glyph className="h-6 w-6" /> : null}
      </span>
      <span
        className={`text-micro font-semibold leading-snug ${
          unlocked ? "text-white" : "text-acf-grey"
        }`}
      >
        {entry.title}
      </span>
      {pending ? (
        <span className="text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-acf-dim">
          Al final
        </span>
      ) : null}
      {/*
       * The state is a colour on screen, which is not a state for a screen
       * reader. The rule that decides the entry and the state it is in are both
       * spoken here, once, so the visual recession never hides information.
       */}
      <span className="sr-only">
        {entry.description}{" "}
        {unlocked ? "Conseguido." : pending ? "Se entrega al final de la temporada." : "Pendiente."}
      </span>
    </li>
  );
}

/**
 * A scope's entries as a grid.
 *
 * `columns` is a prop and not a breakpoint set inside: the personal block is
 * 20% of the page on `/logros`, a whole column in the dashboard and the full
 * width of a phone, and a single class here cannot be right in all three. The
 * tile itself never changes size, so every plate stays the same plate.
 */
export default function AchievementsGrid({
  entries,
  scope,
  columns = "grid-cols-3",
  label,
  className = "",
}) {
  const unlocked = new Set(scope?.unlocked ?? []);
  const seasonUnfinished = scope?.progress?.seasonComplete === false;

  return (
    <ul aria-label={label} className={`grid gap-x-2 gap-y-4 ${columns} ${className}`}>
      {entries.map((entry) => {
        const earned = unlocked.has(entry.id);
        return (
          <AchievementTile
            key={entry.id}
            entry={entry}
            unlocked={earned}
            pending={!earned && entry.seasonEnd === true && seasonUnfinished}
          />
        );
      })}
    </ul>
  );
}
