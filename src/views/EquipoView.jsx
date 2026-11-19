import { Activity, ArrowLeft, CalendarDays, Swords } from "lucide-react";
import {
  CLUB_SLUG,
  competitionLabel,
  fixtureDateLabel,
  fixtureKickoffAt,
  fixtureTimeLabel,
  isTeamSlug,
  teamFixturesAgainst,
  teamForm,
  teamFullName,
  teamName,
  teamOpponent,
  teamSchedule,
  teamScore,
  teamSocial,
  teamStanding,
} from "../data/competition.js";
import Card from "../components/cards/Card.jsx";
import { Crest } from "../components/cards/Crest.jsx";
import { routeLink } from "../lib/router.js";

/**
 * `/equipo/<slug>` — the page of any of the eleven clubs (S5, S6, S7).
 *
 * This is the page that makes a rival visit the site: a player from Premier opens
 * it and reads his own club, not ours. So the club being read is the subject from
 * the first line to the last, and the club-red treatment stays where it belongs —
 * on AC FRÍO. The page shows only what the federation publishes (position, form,
 * fixtures) and never a squad or a player's numbers, because neither exists in the
 * source (S8).
 *
 * An address that names no club of this season is answered here instead of being
 * redirected: the slug came from a pasted link (S7), and a reader who mistypes one
 * deserves to be told the club is not in the season, with the way back to the
 * list. Redirecting would answer a broken link with our dashboard, which is not
 * the page the link named.
 */

/**
 * One result, as a chip: V, E or D.
 *
 * The three steps are the ones the dashboard's form card already uses, with one
 * change of material: the red belongs to AC FRÍO, so a rival's win is the
 * brightest neutral the palette has instead of the brand colour. On our own page
 * the win keeps the red, because there it is ours.
 */
const RESULT = {
  win: { letter: "V", word: "Victoria" },
  draw: { letter: "E", word: "Empate" },
  loss: { letter: "D", word: "Derrota" },
};

const CHIP = "inline-flex h-9 w-9 items-center justify-center rounded-full text-row font-extrabold";

function resultChip(result, ours) {
  if (result === "win") return ours ? "bg-acf-red text-white" : "bg-acf-snow text-acf-dark";
  if (result === "draw") return "bg-white/10 text-white";
  return "border border-acf-line text-acf-grey";
}

/**
 * One club of a fixture line, as a link to its own page.
 *
 * The home club is drawn right-aligned with its crest on the inside, so the two
 * badges flank whatever sits between them — the score, or the night — and the two
 * names take the outer ends of the line, the way every other fixture line on the
 * site is read. The club whose page this is is not a link to itself.
 */
function ClubSide({ slug, side, page }) {
  const layout = `flex min-w-0 items-center gap-2 ${
    side === "home" ? "flex-row-reverse justify-start" : "justify-start"
  }`;

  const content = (
    <>
      <Crest slug={slug} size="sm" />
      <span
        title={teamFullName(slug)}
        className={`min-w-0 truncate text-row font-bold uppercase tracking-[0.04em] ${
          slug === CLUB_SLUG ? "text-white" : "text-acf-snow/85"
        }`}
      >
        {teamName(slug)}
      </span>
    </>
  );

  if (slug === page) return <span className={layout}>{content}</span>;

  return (
    <a
      {...routeLink(`/equipo/${slug}`)}
      className={`${layout} rounded-tile transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red`}
    >
      {content}
    </a>
  );
}

/* The pitch, without the "Camp" the source prefixes to every annex. */
const fieldLabel = (fixture) => (fixture.field ?? "Campo por confirmar").replace("Camp ", "");

/**
 * One match: which competition and round it belongs to, both clubs with their
 * crests, and in the middle either the score or the night it is due.
 *
 * A pending fixture whose kickoff has already passed is still shown. The source
 * keeps a matchday `scheduled` until it is settled, so the fixture exists and its
 * date is real; what does not exist is a result. Dropping it — as the calendar
 * does, where the reason is a countdown that must never run backwards — would
 * hide a published match from the page that promises all of them. The line says
 * the result is missing instead of pretending the match is still ahead.
 */
function FixtureRow({ fixture, page }) {
  const played = fixture.status === "played" && fixture.score;
  const kickoff = fixtureKickoffAt(fixture);
  const unSettled = !played && kickoff !== null && kickoff < Date.now();
  /* The red row marks our club inside a list, which is how a visitor finds us.
     On our own page it would tint every row and so mark nothing. */
  const marksUs =
    page !== CLUB_SLUG && (fixture.home.slug === CLUB_SLUG || fixture.away.slug === CLUB_SLUG);

  return (
    <li className={`px-4 py-3.5 sm:px-6 ${marksUs ? "bg-acf-red/[0.08]" : ""}`}>
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
        {competitionLabel(fixture.competitionKey)} · Jornada {fixture.matchday}
      </p>

      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-x-3">
        <ClubSide slug={fixture.home.slug} side="home" page={page} />

        {played ? (
          <span className="whitespace-nowrap font-display text-xl font-medium leading-none tabular-nums text-white">
            <span className="sr-only">Resultado: </span>
            {fixture.score.home}
            <span className="mx-1 text-acf-dim">–</span>
            {fixture.score.away}
          </span>
        ) : (
          <span className="whitespace-nowrap text-center text-micro font-semibold uppercase tracking-[0.1em] text-acf-snow/70">
            {fixtureDateLabel(fixture)}
            <span className="mt-0.5 block text-acf-dim">{fixtureTimeLabel(fixture)}</span>
          </span>
        )}

        <ClubSide slug={fixture.away.slug} side="away" page={page} />
      </div>

      {played ? null : (
        <p className="mt-2 text-center text-micro font-semibold uppercase tracking-[0.12em] text-acf-dim">
          <span className="sr-only">Campo: </span>
          {fieldLabel(fixture)}
          {unSettled ? " · sin resultado publicado" : ""}
        </p>
      )}
    </li>
  );
}

/** A titled block of fixtures inside the season card, with its honest empty line. */
function FixtureGroup({ id, title, fixtures, page, empty }) {
  return (
    <section className="border-t border-acf-line-soft" aria-labelledby={id}>
      <h3
        id={id}
        className="px-4 pb-1 pt-4 text-micro font-semibold uppercase tracking-[0.2em] text-acf-dim sm:px-6"
      >
        {title}
      </h3>
      {fixtures.length ? (
        <ul className="divide-y divide-acf-line-soft">
          {fixtures.map((fixture) => (
            <FixtureRow
              key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.home.slug}`}
              fixture={fixture}
              page={page}
            />
          ))}
        </ul>
      ) : (
        <p className="px-4 pb-4 pt-1 text-row leading-relaxed text-acf-grey sm:px-6">{empty}</p>
      )}
    </section>
  );
}

/** The way back to the list, at the top of the page and after an unknown club. */
function BackToTeams() {
  return (
    <a
      {...routeLink("/equipos")}
      className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-[0.22em] text-acf-grey transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
      Volver a Equipos
    </a>
  );
}

/**
 * One social profile the club publishes, as a quiet line next to its position.
 *
 * The club is already the page's h1 and its crest is above, so the link only has
 * to name the network. It borrows the back-link's micro-label recipe on purpose:
 * it is a caption to the head, not a second call to action. The destination is a
 * profile on another site, so it opens in a new tab and drops the referrer.
 */
function SocialLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-grey transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
    >
      {label}
      <span className="sr-only"> (se abre en una pestaña nueva)</span>
    </a>
  );
}

/**
 * An address that names no club of this season.
 *
 * Nothing is rendered about a club that does not exist — no crest, no empty
 * figures — only the sentence and the way back to the eleven that do.
 */
function UnknownTeam() {
  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <BackToTeams />
        <div className="mt-8 max-w-2xl rounded-card border border-acf-line bg-acf-panel px-6 py-8 shadow-acf">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            No conocemos ese club
          </h1>
          <p className="mt-3 text-row leading-relaxed text-acf-snow/70">
            No hay ningún club con esa dirección en esta temporada. Los que juegan
            están en Equipos, cada uno con su ficha.
          </p>
          <a
            {...routeLink("/equipos")}
            className="mt-6 inline-flex rounded-full border border-acf-line px-4 py-2 text-row font-bold tracking-tight text-acf-snow transition-colors hover:border-white/25 hover:bg-white/[0.06] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
          >
            Ver los equipos
          </a>
        </div>
      </div>
    </section>
  );
}

export default function EquipoView({ slug }) {
  if (!isTeamSlug(slug)) return <UnknownTeam />;

  const ours = slug === CLUB_SLUG;
  const name = teamName(slug);
  const official = teamFullName(slug);
  const standing = teamStanding(slug);
  const social = teamSocial(slug);
  const form = teamForm(slug, 5);
  const { played, pending } = teamSchedule(slug);
  const crossings = teamFixturesAgainst(slug);

  return (
    <section className="relative pb-16 pt-28">
      <div className="wrap">
        <BackToTeams />

        {/* The club's own head: its crest at the size the poster gives ours, its
            name as the page's only h1, and where the source places it. */}
        <header className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-end">
          <Crest slug={slug} size="xl" />
          <div className="min-w-0">
            <p className="text-micro font-semibold uppercase tracking-[0.3em] text-acf-red-soft">
              Ficha de equipo
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              {name}
            </h1>
            {/* The short form is the club's own; the official name stays readable
                when the source publishes a different one. */}
            {official === name ? null : (
              <p className="mt-2 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
                {official}
              </p>
            )}

            {standing ? (
              <>
                <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span
                    className={`font-display text-3xl font-medium leading-none tabular-nums ${
                      ours ? "text-acf-red" : "text-white"
                    }`}
                  >
                    {standing.row.rank === null ? (
                      "—"
                    ) : (
                      /* The ordinal rides raised and smaller: at display size a
                         `º` next to a figure reads as a zero, and "2º" became
                         "20" at a glance. */
                      <>
                        {standing.row.rank}
                        <span className="ml-0.5 align-super text-base font-semibold">º</span>
                      </>
                    )}
                  </span>
                  <span className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-grey">
                    {standing.competition.name}
                  </span>
                </p>
                {standing.hasResults ? null : (
                  /* A table of zeros is the source's initial order, not a ranking
                     won on the pitch: four clubs only play the cup, and their
                     position has to be shown for what it is. */
                  <p className="mt-2 max-w-md text-micro font-semibold uppercase leading-relaxed tracking-[0.12em] text-acf-dim">
                    La fuente todavía no ha puntuado esta competición: la posición es el
                    orden en que la publica.
                  </p>
                )}
              </>
            ) : null}

            {/* The club's own profiles, as the federation prints them. When it
                prints none there is no row at all: no empty line, and no
                "próximamente" promising a link the source does not have. */}
            {social.instagram || social.facebook ? (
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                {social.instagram ? <SocialLink href={social.instagram} label="Instagram" /> : null}
                {social.facebook ? <SocialLink href={social.facebook} label="Facebook" /> : null}
              </p>
            ) : null}
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Form: the last five played matches, read from this club's side. */}
          <Card
            id="equipo-forma"
            title="Forma"
            hint={form.length ? `Últimos ${form.length} partidos jugados` : "Sin partidos jugados"}
            icon={Activity}
            className="surface-deep"
            bodyClassName="flex flex-col"
          >
            {form.length ? (
              /* The legend sits at the foot of the card, so a club with three
                 played matches and one with five read the same height beside the
                 crossings card. */
              <div className="flex flex-1 flex-col px-4 pb-4 sm:px-6">
                <ul className="flex flex-wrap gap-1.5">
                  {form.map(({ fixture, result }) => {
                    const opponent = teamOpponent(slug, fixture);
                    const goals = teamScore(slug, fixture);
                    const tone = RESULT[result] ?? RESULT.draw;
                    const readout = `${tone.word} ${goals.own} a ${goals.rival} contra ${teamFullName(opponent.slug)}`;

                    return (
                      <li key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.home.slug}`}>
                        <span
                          title={readout}
                          className={`${CHIP} ${resultChip(result, ours)}`}
                        >
                          <span aria-hidden="true">{tone.letter}</span>
                          <span className="sr-only">{readout}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-auto pt-4 text-micro font-semibold uppercase leading-relaxed tracking-[0.16em] text-acf-dim">
                  V victoria · E empate · D derrota · De lo más reciente a lo más antiguo
                </p>
              </div>
            ) : (
              <p className="px-6 pb-6 pt-1 text-row leading-relaxed text-acf-grey">
                Este club todavía no ha jugado ningún partido. Cuando la federación
                publique el acta, la forma aparecerá aquí.
              </p>
            )}
          </Card>

          {/* The crossing with us: the reason a rival's page is worth opening. */}
          <Card
            id="equipo-contra"
            title="Contra nosotros"
            hint={
              ours
                ? "Esta ficha es la nuestra"
                : crossings.length
                  ? `${crossings.length} ${crossings.length === 1 ? "partido" : "partidos"}`
                  : "Sin cruce publicado"
            }
            icon={Swords}
            className="surface-deep"
            bodyClassName="flex flex-col"
          >
            {ours ? (
              <p className="px-6 pb-6 pt-1 text-row leading-relaxed text-acf-grey">
                Estás en la ficha del AC FRÍO. Todos los partidos de esta página son los
                nuestros, así que aquí no hay cruce que buscar: los tienes arriba.
              </p>
            ) : crossings.length ? (
              <ul className="divide-y divide-acf-line-soft border-t border-acf-line-soft">
                {crossings.map((fixture) => (
                  <FixtureRow
                    key={`${fixture.competitionKey}-${fixture.matchday}-${fixture.home.slug}`}
                    fixture={fixture}
                    page={slug}
                  />
                ))}
              </ul>
            ) : (
              <p className="px-6 pb-6 pt-1 text-row leading-relaxed text-acf-grey">
                El calendario publicado no cruza a este club con el AC FRÍO esta
                temporada.
              </p>
            )}
          </Card>
        </div>

        {/* The whole published season of the club, in both competitions. */}
        <Card
          id="equipo-partidos"
          title="Partidos"
          hint={`${played.length} jugados · ${pending.length} pendientes`}
          icon={CalendarDays}
          className="mt-6"
          bodyClassName="flex flex-col"
        >
          <FixtureGroup
            id="equipo-partidos-jugados"
            title="Jugados"
            fixtures={played}
            page={slug}
            empty="Todavía no ha jugado ningún partido de los que la federación ha publicado."
          />
          <FixtureGroup
            id="equipo-partidos-pendientes"
            title="Pendientes"
            fixtures={pending}
            page={slug}
            empty="El calendario publicado no le da más partidos."
          />
        </Card>
      </div>
    </section>
  );
}
