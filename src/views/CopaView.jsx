import { BarChart3, CalendarDays, Trophy } from "lucide-react";
import {
  CLUB_SLUG,
  cup,
  cupTable,
  fixtureDateLabel,
  fixtureTimeLabel,
  matchdayFixtures,
  teamFullName,
  teamName,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import { routeLink } from "../lib/router.js";

/**
 * The Copa tab of `/competicion` (S14): the cup, as the federation publishes it —
 * one group, five matchdays, and a knockout phase that has been announced and
 * not yet drawn.
 *
 * The board of the fase final opens the tab. It is the one thing here that
 * cannot be drawn from the data (see `KnockoutBoard` for what it does and does
 * not say), and it is also the only card that needs the whole width of the page
 * to be read as a bracket: the clubs sit at the two edges and the empty slots
 * converge towards the centre, so a half-width column would break the drawing.
 * The group follows it — the table, then the rounds — in the order it is played.
 *
 * The page heading and the tab strip belong to `CompeticionView`; this file
 * draws its cards and nothing else, so the section has one title and not three.
 */

/* The rounds the source publishes, in order: a round exists because the calendar
   has fixtures in it, never because a round name was written here. */
const ROUNDS = [...new Set(cup.fixtures.map((fixture) => fixture.matchday))].sort(
  (a, b) => a - b,
);

/* A round is played when every one of its fixtures is. The cup carries a table
   with one settled matchday and fourteen matches still ahead, and the count of
   rounds is the honest way to say how far into the group it is. */
const PLAYED_ROUNDS = ROUNDS.filter((round) =>
  matchdayFixtures("cup", round).every((fixture) => fixture.status === "played"),
);

const HEAD_CELL = "py-2.5 text-micro font-semibold uppercase tracking-[0.12em] text-acf-dim";
const FIGURE_CELL = "px-1 py-3 text-center text-figure tabular-nums text-acf-snow/60";

/* One collator for the club names, so the board is ordered the same way on every
   render and an accent does not move a club up or down. */
const collator = new Intl.Collator("es");

/**
 * The liguilla table, with the same anatomy the league table has in the Liga
 * tab: the club's row tinted, its rank carrying a red bar against the left edge
 * and its points in red, so the two competitions read as the same table.
 *
 * Only the figures the cup publishes are drawn — played and points — because
 * this table answers "how is the group going", and the goals are on the
 * federation's page, one click away through the corner mark.
 */
function GroupTable({ id, rows }) {
  return (
    <div
      className="@container overflow-x-auto"
      tabIndex={0}
      role="region"
      aria-labelledby={`${id}-title`}
    >
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-acf-panel">
          <tr className="border-b border-acf-line">
            <th className={`${HEAD_CELL} w-8 pl-4 pr-1 text-center`}>#</th>
            <th className={`${HEAD_CELL} text-left`}>Equipo</th>
            <th className={`${HEAD_CELL} px-1 text-center`}>PJ</th>
            <th className={`${HEAD_CELL} w-14 pl-2 pr-4 text-right`}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const ours = row.slug === CLUB_SLUG;
            return (
              <tr
                key={row.slug}
                className={`border-t border-acf-line-soft transition-colors ${
                  ours ? "bg-acf-red/[0.16]" : "hover:bg-white/[0.03]"
                }`}
              >
                <td
                  className={`w-8 py-3 pl-4 pr-1 text-center font-display text-lg leading-none tabular-nums ${
                    ours
                      ? "text-acf-red shadow-[inset_3px_0_0_var(--color-acf-red)]"
                      : "text-acf-snow/40"
                  }`}
                >
                  {row.rank ?? "—"}
                </td>
                {/* `w-full max-w-0` keeps the name column out of its max-content
                    width, so the table fits the card instead of scrolling on
                    its own on a phone. */}
                <td className="w-full max-w-0 py-3 pr-1">
                  <span className="flex items-center gap-2">
                    <Crest slug={row.slug} size="sm" to={`/equipo/${row.slug}`} />
                    <span
                      title={teamFullName(row.slug)}
                      className={`truncate text-row font-bold uppercase leading-none tracking-[0.04em] ${
                        ours ? "text-white" : "text-acf-snow/80"
                      }`}
                    >
                      {teamName(row.slug)}
                    </span>
                    <span className="sr-only">{teamFullName(row.slug)}</span>
                  </span>
                </td>
                <td className={FIGURE_CELL}>{row.played}</td>
                <td
                  className={`w-14 py-2.5 pl-2 pr-4 text-right font-display text-2xl font-medium leading-none tabular-nums ${
                    ours ? "text-acf-red" : "text-white"
                  }`}
                >
                  <span
                    title={
                      row.sanction
                        ? `${Math.abs(row.sanction)} ${Math.abs(row.sanction) === 1 ? "punto" : "puntos"} menos por sanción`
                        : undefined
                    }
                  >
                    {row.points}
                    {row.sanction ? (
                      <span className="align-super text-[0.625rem] font-semibold text-acf-grey">*</span>
                    ) : null}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One club of a cup fixture, as the way into its page (S7).
 *
 * Home is drawn right-aligned with its crest on the inside, so the two badges
 * flank whatever sits between them — the score, or the night — and the names
 * take the outer ends of the line, the way every fixture line on the site is
 * read. The crest stays inside the link here, so it is passed without `to`.
 */
function ClubLink({ slug, side }) {
  return (
    <a
      {...routeLink(`/equipo/${slug}`)}
      title={teamFullName(slug)}
      className={`flex min-w-0 items-center gap-2 rounded-tile py-1 text-acf-snow/85 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red ${
        side === "home" ? "flex-row-reverse justify-start text-right" : "justify-start"
      }`}
    >
      <Crest slug={slug} size="sm" />
      <span className="min-w-0 truncate text-row font-bold uppercase tracking-[0.04em]">
        {teamName(slug)}
      </span>
    </a>
  );
}

/**
 * One cup match: the two clubs and, between them, the result when it is settled
 * or the night when it is not.
 *
 * The night is drawn match by match instead of once per round, because a cup
 * round does not always play on one date: the fourth matchday spreads its three
 * matches over three days, and a single date on the round heading would be a
 * fact the calendar does not support.
 */
function MatchLine({ fixture }) {
  const result = fixture.status === "played" && fixture.score ? fixture.score : null;
  const ours = fixture.home.slug === CLUB_SLUG || fixture.away.slug === CLUB_SLUG;

  return (
    <li
      className={`grid grid-cols-[1fr_auto_1fr] items-center gap-x-3 px-4 py-3 sm:px-6 ${
        ours ? "bg-acf-red/[0.08]" : ""
      }`}
    >
      <ClubLink slug={fixture.home.slug} side="home" />

      {result ? (
        <span className="whitespace-nowrap font-display text-xl font-medium leading-none tabular-nums text-white">
          <span className="sr-only">Resultado: </span>
          {result.home}
          <span className="mx-1 text-acf-dim">–</span>
          {result.away}
        </span>
      ) : (
        <span className="whitespace-nowrap text-center text-micro font-semibold uppercase leading-tight tracking-[0.1em] text-acf-snow/70">
          {fixtureDateLabel(fixture)}
          <span className="mt-0.5 block text-acf-dim">{fixtureTimeLabel(fixture)}</span>
        </span>
      )}

      <ClubLink slug={fixture.away.slug} side="away" />
    </li>
  );
}

/** One matchday of the group: its fixtures, with the round number as its label. */
function RoundBlock({ round }) {
  const matches = matchdayFixtures("cup", round);

  return (
    <section className="border-t border-acf-line-soft" aria-labelledby={`copa-jornada-${round}`}>
      <h3
        id={`copa-jornada-${round}`}
        className="px-4 pb-1 pt-4 text-micro font-semibold uppercase tracking-[0.2em] text-acf-dim sm:px-6"
      >
        Jornada {round}
      </h3>
      <ul className="divide-y divide-acf-line-soft">
        {matches.map((fixture) => (
          <MatchLine key={`${fixture.home.slug}-${fixture.away.slug}`} fixture={fixture} />
        ))}
      </ul>
    </section>
  );
}

/**
 * The geometry of the drawing, written once because the connector lines are
 * placed against it: the vertical bar of each side runs from the centre of the
 * first slot to the centre of the last, which is `inset-y-6` only while every
 * slot box is `h-12` tall and the two of them are `gap-3` apart.
 *
 * The boxes are narrow on a phone (`w-20`, the label wraps onto two lines) and
 * wider from `sm` up, so the whole bracket is 288px wide at its narrowest: it
 * fits the 326px the card leaves at 390 without pushing the page sideways.
 */
const SLOT_BOX =
  "flex h-12 w-20 shrink-0 items-center justify-center rounded-tile border border-dashed border-acf-line px-2 text-center text-micro font-semibold uppercase leading-tight tracking-[0.14em] sm:w-28";
const SLOT_ARM = "h-px w-3 shrink-0 bg-acf-line";
const SLOT_BAR = "absolute inset-y-6 w-px bg-acf-line";

/**
 * One box of the board that has no club in it yet.
 *
 * The label is the whole content: there is no club, no score and no opponent to
 * print, and inventing any of them is the thing this whole card refuses to do.
 * `centre` is the middle box only — it says `Ganador`, which is what the one
 * place in the middle of an elimination produces, and is not a round name.
 */
function DrawSlot({ label, centre = false }) {
  return (
    <span className={`${SLOT_BOX} ${centre ? "text-acf-snow/70" : "text-acf-grey"}`}>
      {label}
    </span>
  );
}

/**
 * The empty shape of the fase final, drawn without claiming a single match.
 *
 * Why the connectors are here and the pairings are not: the federation has
 * published no draw, so a line from a club into a slot would be a claim that
 * this club plays that match, and a line between two slots would be a claim
 * about who meets whom. So the lines start where the facts stop — they join the
 * *slot columns* to each other and to the centre box, which says only what a
 * knockout always says: two empty places on each side, one finish in the middle.
 * No line leaves the club columns.
 *
 * The drawing is one flex row of five columns: two slots, a stub, the centre
 * slot, a stub, two slots. Each side is a small column whose two slots reach
 * their inner edge with a hairline, and a bar joins those two arms at the edge
 * of the column; the stub then carries that join into the centre. Mirrored, the
 * two sides meet on the one box in the middle.
 */
function DrawBracket() {
  return (
    <div
      role="img"
      aria-label="Cuadro de la fase final: dos plazas por sortear a cada lado que acaban en un solo ganador en el centro."
      className="flex w-full items-center justify-center lg:w-auto lg:flex-1"
    >
      {/* Left side: two slots whose arms meet a bar, and the bar reaches the centre. */}
      <div className="relative flex flex-col gap-3">
        {[0, 1].map((index) => (
          <div key={index} className="flex items-center">
            <DrawSlot label="Por sortear" />
            <span aria-hidden="true" className={SLOT_ARM} />
          </div>
        ))}
        <span aria-hidden="true" className={`${SLOT_BAR} right-0`} />
      </div>
      <span aria-hidden="true" className={SLOT_ARM} />
      <DrawSlot label="Ganador" centre />
      <span aria-hidden="true" className={SLOT_ARM} />
      {/* Right side, mirrored: the bar sits on the inner edge of the column. */}
      <div className="relative flex flex-col gap-3">
        {[0, 1].map((index) => (
          <div key={index} className="flex items-center">
            <span aria-hidden="true" className={SLOT_ARM} />
            <DrawSlot label="Por sortear" />
          </div>
        ))}
        <span aria-hidden="true" className={`${SLOT_BAR} left-0`} />
      </div>
    </div>
  );
}

/**
 * The clubs at one edge of the board: the pool that will enter the fase final,
 * never a pairing and never a seeding.
 *
 * They keep the order the card has always used — alphabetical, not the table's —
 * and their slot carries no label now: "Por sortear" belongs to the empty boxes
 * in the middle, where the draw will write. A club here is only a club that is
 * in the cup.
 */
function ClubPool({ clubs }) {
  return (
    <ul
      aria-label="Clubes de la copa"
      className="flex w-full flex-col gap-1.5 lg:w-56 lg:shrink-0"
    >
      {clubs.map((row) => {
        const ours = row.slug === CLUB_SLUG;
        return (
          <li
            key={row.slug}
            className={`flex min-h-12 items-center gap-3 rounded-tile border border-dashed px-3 py-2 ${
              ours ? "border-acf-red/40 bg-acf-red/[0.08]" : "border-acf-line"
            }`}
          >
            {/* The slot is not a link: it names no match and opens nothing.
                Only the crest is one, as on every other club mark that does not
                already sit inside an anchor. */}
            <Crest slug={row.slug} size="sm" ink to={`/equipo/${row.slug}`} />
            {/* Two lines at most, instead of one truncated line: the pool
                columns are narrow enough that the longest names ("TECNOCASA -
                DELTA MONTAJES") would otherwise lose their second half. */}
            <span
              title={teamFullName(row.slug)}
              className={`line-clamp-2 min-w-0 flex-1 text-row font-bold uppercase leading-tight tracking-[0.04em] ${
                ours ? "text-white" : "text-acf-snow/70"
              }`}
            >
              {teamName(row.slug)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The board of the fase final, drawn as a bracket: the six clubs of the cup at
 * the two edges, three per side, and the empty shape they will fill between them.
 *
 * It gives the shape without inventing the facts. The regulation says only "fase
 * final eliminatoria": it does not say how many clubs qualify, it names no
 * rounds and the federation has published no draw. So there is no round name here
 * (no "cuartos", no "semifinal", no "final"), no pairing and no seeded order —
 * the six clubs are the pool that enters, listed alphabetically, and the boxes in
 * the middle read "Por sortear" because that is exactly what they are.
 *
 * The shape is the honest part and the reason the board is worth drawing: six
 * entrants produce two empty places on each side that meet in one in the middle,
 * and the connectors join those places, not the clubs. Two slots per side is not
 * a claim either — it is how six entrants split into a bracket once the draw
 * exists, and the copy under the board says the draw does not exist yet.
 */
function KnockoutBoard({ rows }) {
  const clubs = [...rows].sort((a, b) => collator.compare(teamFullName(a.slug), teamFullName(b.slug)));

  return (
    <>
      {/* One row from `lg`, one column below it: on a phone the drawing cannot
          run sideways without breaking, so the three clubs of each edge become
          the group above and the group below, and the bracket sits between them. */}
      <div className="flex flex-col items-stretch gap-4 px-4 pb-4 pt-1 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-3">
        <ClubPool clubs={clubs.slice(0, 3)} />
        <DrawBracket />
        <ClubPool clubs={clubs.slice(3)} />
      </div>
      {/* The one line the board owes the reader: why it is empty, and what will
          fill it. No badge and no "próximamente": the sentence is more exact,
          because it names who is missing and what has to happen. */}
      <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase leading-relaxed tracking-[0.16em] text-acf-dim sm:px-6">
        La federación no ha publicado el sorteo de la fase final. Cuando lo haga, esta
        pizarra se rellena sola.
      </p>
    </>
  );
}

export default function CopaTab() {
  const cupData = cupTable();

  return (
    /* The board takes the whole width from 1024: the bracket is a horizontal
       drawing, and half a page is not enough to read it. The group keeps the two
       columns underneath, table beside rounds. */
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card
        id="copa-fase-final"
        title="Fase final"
        hint="Sorteo sin publicar"
        icon={Trophy}
        href={cup.sources.calendar}
        linkLabel="Abrir el calendario oficial de la Copa en CEGARRAF"
        className="surface-deep lg:col-span-2"
        bodyClassName="flex flex-col"
      >
        <KnockoutBoard rows={cupData.rows} />
      </Card>

      <Card
        id="copa-liguilla"
        title="Liguilla"
        hint={`${cupData.rows.length} clubes · ${ROUNDS.length} jornadas`}
        icon={BarChart3}
        href={cup.sources.table}
        linkLabel="Abrir la clasificación oficial de la Copa en CEGARRAF"
        className="surface-deep"
        bodyClassName="flex flex-col"
      >
        <GroupTable id="copa-liguilla" rows={cupData.rows} />
        <p className="mt-auto border-t border-acf-line-soft px-4 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim sm:px-6">
          {PLAYED_ROUNDS.length} de {ROUNDS.length} jornadas jugadas. La tabla la lleva la
          federación.
        </p>
      </Card>

      <Card
        id="copa-jornadas"
        title="Jornadas"
        hint={`${ROUNDS.length} jornadas · ${cup.fixtures.length} partidos`}
        icon={CalendarDays}
        href={cup.sources.calendar}
        linkLabel="Abrir el calendario oficial de la Copa en CEGARRAF"
        bodyClassName="flex flex-col"
      >
        {ROUNDS.map((round) => (
          <RoundBlock key={round} round={round} />
        ))}
      </Card>
    </div>
  );
}
