/**
 * The achievements shelf: one grid, drawn from the catalogue in
 * src/data/achievements.js, used by the dashboard card and by both blocks of
 * `/logros`. There is no second list of entries anywhere — the scope that is
 * handed in decides what is drawn, and the evaluator decides what is lit.
 *
 * A tile is a plate and a name: a rounded frame with the entry's own icon
 * centred, so the whole catalogue reads as one family instead of one
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
 * A tile is also a control. The owner read titles like «Mi voto» or «10
 * votantes» and could not tell what they meant (S8), so every tile opens a
 * small dialog with the entry's own rule in it. Nothing about the drawing
 * changes: the plate, the title and the state stay where they were, and the
 * button is the layout the tile already had.
 *
 * The glyphs come from Remix Icon through `react-icons` and not from Phosphor:
 * `react-icons` ships one module per glyph per variant, so an explicit import
 * list tree-shakes down to the two weights of the fifty-two glyphs the catalogue
 * names. A namespace import would ship the whole set, which is exactly the cost
 * this file was changed to stop paying.
 */
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

/*
 * The state, said in the two places it is read: on the pill of the dialog, and in
 * one `sr-only` line on the tile, so a screen reader knows it without opening
 * anything. The sentence that explains the entry is only ever in the dialog.
 */
const STATE_LABEL = {
  unlocked: "Conseguido",
  locked: "Pendiente",
  pending: "Al final de temporada",
};

const STATE_SPOKEN = {
  unlocked: "Conseguido.",
  locked: "Pendiente.",
  pending: "Se entrega al final de la temporada.",
};

const STATE_TONE = {
  unlocked: "border-acf-red/40 bg-acf-red/10 text-acf-red-soft",
  locked: "border-acf-line text-acf-grey",
  pending: "border-dashed border-acf-line text-acf-dim",
};

/*
 * How far a finger may travel and still be a tap (S8).
 *
 * A tile lives inside the personal shelf, which is a horizontal snap track, and
 * the track slides under a swipe that starts on a tile. The two gestures have to
 * be told apart, so a press is a tap only while it stays inside this many pixels
 * of where it went down: past that it is a swipe, the slide belongs to the
 * track, and the tile keeps quiet instead of opening a dialog on the way past.
 */
const TAP_SLOP = 8;

/**
 * The explanation a tile opens (S8, S20).
 *
 * It is a small card next to the tile, not a screen-wide dialog: the owner asked
 * for something that comes out of the pointer, and a full-page ground over a
 * four-word explanation is a locked door in front of a note.
 *
 * Two ways in, because there are two ways to point at things:
 *
 *   With a mouse the card opens on hover and closes when the pointer leaves both
 *   the tile and the card, with a short grace period so travelling from one to
 *   the other does not blink it. It is `role="tooltip"`, it holds no controls
 *   and it never takes focus: a tooltip you have to tab into is a dialog wearing
 *   the wrong name.
 *
 *   With a finger or a keyboard it opens on tap or focus. Then it is a
 *   `role="dialog"` with a label, it takes focus with `preventScroll` so the
 *   shelf cannot slide under it, and it hands that focus back to the tile.
 *
 * It comes down the same way on both, and that list is the whole contract:
 * Escape, a press that is neither the tile nor the card, a second press on the
 * tile itself, and the pointer leaving. One set of exits and not one per device,
 * because the device that opens a card is not always the device that dismisses
 * it — a hybrid laptop opens on hover and dismisses with a finger.
 *
 * Either way it is portalled to `document.body` and positioned `fixed` from the
 * tile's own rect, so no scrolling ancestor can move it, and it flips above the
 * tile when there is no room underneath. `left` is clamped to the viewport, so a
 * tile at the edge of a phone still gets a card you can read.
 */
function AchievementDescription({
  entry,
  state,
  labelId,
  onClose,
  triggerRef,
  panelRef,
  interactive = false,
  onPointerEnter,
  onPointerLeave,
}) {
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    const tile = triggerRef.current;
    const card = panelRef.current;
    if (!tile || !card) return;
    const rect = tile.getBoundingClientRect();
    const gap = 8;
    const width = card.offsetWidth;
    const height = card.offsetHeight;
    const left = Math.min(
      Math.max(gap, rect.left + rect.width / 2 - width / 2),
      Math.max(gap, window.innerWidth - width - gap),
    );
    const below = rect.bottom + gap;
    const top =
      below + height > window.innerHeight - gap
        ? Math.max(gap, rect.top - height - gap)
        : below;
    setPos({ left, top });
  }, [triggerRef, panelRef]);

  useEffect(() => {
    if (interactive) panelRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    /* A card with no ground behind it needs its own way out, and the same one on
       every device: a press that is neither on the card nor on the tile closes
       it. A press on the tile is the tile's own business — it toggles — so it is
       left alone here. */
    const onPointerDown = (event) => {
      const card = panelRef.current;
      const tile = triggerRef.current;
      if (card?.contains(event.target) || tile?.contains(event.target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [interactive, onClose, triggerRef, panelRef]);

  return createPortal(
    <div
      ref={panelRef}
      role={interactive ? "dialog" : "tooltip"}
      aria-labelledby={labelId}
      tabIndex={interactive ? -1 : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: 0 }}
      className="surface-deep fixed z-50 w-[17rem] max-w-[calc(100vw-1rem)] rounded-card border border-acf-line p-3.5 text-left shadow-acf focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
    >
      <p id={labelId} className="text-row font-semibold leading-tight text-white">
        {entry.title}
      </p>
      <p
        className={`mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] ${STATE_TONE[state]}`}
      >
        {STATE_LABEL[state]}
      </p>
      <p className="mt-2 text-micro leading-relaxed text-acf-grey">{entry.description}</p>
      {interactive ? (
        <button
          type="button"
          onClick={() => onClose()}
          className="mt-3 rounded-full border border-acf-line px-3 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-acf-snow/80 transition-colors duration-200 hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
        >
          Cerrar
        </button>
      ) : null}
    </div>,
    document.body,
  );
}

/**
 * One entry: a plate with its icon and the name under it, as a control that
 * opens its own rule.
 *
 * The drawing did not change when the tile became a button: the same gap, the
 * same centred column, the same plate. The button is `w-full` so the title wraps
 * exactly where it wrapped before, and the state keeps its `sr-only` line so a
 * screen reader still knows it without opening anything — but the description
 * is NOT printed here any more. It lives in the dialog, once: the same sentence
 * twice is one time too many.
 */
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
  const state = unlocked ? "unlocked" : pending ? "pending" : "locked";

  const [open, setOpen] = useState(false);
  /* Asked once per mount: whether this device points with a mouse. A phone does
     not, and a hybrid that does gets the tooltip when the pointer is a mouse. */
  const [hoverable] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches,
  );
  const trigger = useRef(null);
  const panel = useRef(null);
  const press = useRef(null);
  const closeTimer = useRef(null);
  const labelId = useId();
  /* Set while the focus is being handed back to this tile. Without it the tile
     reads its own return trip as the reader arriving and reopens the card that
     was just closed, which is how Escape and «Cerrar» stopped working. */
  const returningFocus = useRef(false);

  /* Leaving a tile for the card is a short trip across a gap of 8 px, and a card
     that blinks out mid-journey cannot be read. The delay is the journey. */
  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);
  const laterClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 140);
  }, [cancelClose]);
  useEffect(() => cancelClose, [cancelClose]);

  /*
   * The focus goes back to the tile that opened the card, but only when it was
   * inside the card: a mouse never gives it there, so a mouse dismissal leaves
   * the focus where the reader put it.
   */
  const returnFocus = useCallback(() => {
    const tile = trigger.current;
    const card = panel.current;
    if (!tile || !card || !card.contains(document.activeElement)) return;
    returningFocus.current = true;
    tile.focus({ preventScroll: true });
  }, []);

  /*
   * One door out, whatever the device pressed it. Escape, a press on the ground
   * and the «Cerrar» pill all land here, so no path can leave the card standing
   * because its own event never came.
   */
  const close = useCallback(() => {
    cancelClose();
    returnFocus();
    setOpen(false);
  }, [cancelClose, returnFocus]);

  /*
   * The card takes the focus when it opens on a finger or from the keyboard, and
   * the tile is blurred by exactly that. A blur like that is the card opening,
   * not the reader leaving — closing on it made the two chase each other, one
   * close per refocus, for as long as the card stayed mounted.
   */
  const closeOnBlur = useCallback(
    (event) => {
      if (panel.current?.contains(event.relatedTarget)) return;
      close();
    },
    [close],
  );

  /*
   * Pointer bookkeeping only decides whether a click was a tap or a swipe. The
   * click itself stays the way a button is opened — a native `<button>` already
   * fires it for Enter and for Space — so the keyboard needs no handler of its
   * own, and the reported gesture never reaches the track: a swipe is answered
   * by moving the slider, which is the browser's own pan. A native pan does not
   * end in a click, and when a browser does deliver one, the travel noted below
   * has already marked it as a swipe and it is discarded instead of opening a
   * dialog over the page that is sliding.
   */
  const noteTravel = (event, cancelled = false) => {
    const started = press.current;
    if (!started || started.id !== event.pointerId) return;
    const travelled =
      Math.abs(event.clientX - started.x) > TAP_SLOP ||
      Math.abs(event.clientY - started.y) > TAP_SLOP;
    /* A cancel is the browser taking the gesture to pan the track: not a tap,
       wherever it happened to go. */
    if (cancelled || travelled) started.moved = true;
  };

  const onPointerDown = (event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    /* `open` is noted here, at the press, and not read back at the click: the
       focus this press leaves behind can open the card on the way to the click,
       and a toggle against that state would open and close on one gesture. */
    press.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      wasOpen: open,
    };
  };

  const openDescription = (event) => {
    const started = press.current;
    press.current = null;
    if (started?.moved) {
      /* A swipe that ended on a tile is the slider's gesture, not a request to
         read the entry. */
      event.preventDefault();
      return;
    }
    /* The tile is one control with one meaning on every device: it toggles. A
       mouse has the card open from the hover already, so its first press closes
       it; a finger has no hover to lean on, so the tap is what opens it. A click
       with no press behind it is Enter or Space on a tile that the focus had
       already opened, and it stays open. */
    returningFocus.current = false;
    cancelClose();
    setOpen(started ? !started.wasOpen : true);
  };

  /*
   * Focus opens the card, which is how a keyboard reaches it. One focus event is
   * not the reader arriving: the trip back from a card that was just closed.
   */
  const onFocus = () => {
    if (returningFocus.current) {
      returningFocus.current = false;
      return;
    }
    setOpen(true);
  };

  return (
    <li className="flex flex-col items-center">
      <button
        ref={trigger}
        type="button"
        onClick={openDescription}
        onPointerDown={onPointerDown}
        onPointerMove={(event) => noteTravel(event)}
        onPointerUp={(event) => noteTravel(event)}
        onPointerCancel={(event) => noteTravel(event, true)}
        onPointerEnter={hoverable ? () => { cancelClose(); setOpen(true); } : undefined}
        onPointerLeave={hoverable ? laterClose : undefined}
        onFocus={onFocus}
        onBlur={closeOnBlur}
        aria-haspopup={hoverable ? undefined : "dialog"}
        aria-expanded={hoverable ? undefined : open}
        className="group flex w-full cursor-pointer flex-col items-center gap-2 rounded-tile text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
      >
        <span aria-hidden="true" className={`${PLATE_BASE} ${plate}`}>
          {Glyph ? <Glyph className="h-6 w-6" /> : null}
        </span>
        <span
          className={`text-micro font-semibold leading-snug transition-colors duration-200 group-hover:text-white ${
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
        {/* The state, spoken on the tile itself. Visual today as colour and as
            one word; the sentence that explains the entry is in the dialog. */}
        <span className="sr-only">{STATE_SPOKEN[state]}</span>
      </button>
      {open ? (
        <AchievementDescription
          entry={entry}
          state={state}
          labelId={labelId}
          onClose={close}
          triggerRef={trigger}
          panelRef={panel}
          interactive={!hoverable}
          onPointerEnter={hoverable ? cancelClose : undefined}
          onPointerLeave={hoverable ? laterClose : undefined}
        />
      ) : null}
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
