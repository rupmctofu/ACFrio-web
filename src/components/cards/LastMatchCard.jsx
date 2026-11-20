import { useCallback, useEffect, useState } from "react";
import { Award } from "lucide-react";
import teamData from "../../data/teamData.json";
import {
  CLUB_SLUG,
  clubScore,
  fixtureDateLabel,
  lastFixture,
  matchdayLabel,
  opponentOf,
  recentResults,
  resultOf,
  teamFullName,
  teamName,
} from "../../data/competition.js";
import { season } from "../../data/club-record.js";
import { VOICE } from "../../data/copy.js";
import { useIdentity } from "../../lib/identity.js";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";
import {
  candidates,
  castVote,
  ensureMatchRow,
  fetchMyVote,
  fetchTally,
  isConfigured,
  matchKey,
  tally,
} from "../../lib/mvp.js";

/**
 * The last match, the MVP vote of that match, and the run that led to it — one
 * card, three weights (owner, S9: "lo de MVP creo que lo juntaría con último, en
 * vez de poner últimos tres partidos, pondría último partido lo pondría arriba de
 * coreadores ... y luego más abajo, en esa misma ficha pero más abajo con menos
 * protagonismo poner los últimos tres partidos").
 *
 * It replaces two cards that drew the same night twice: the form card said what
 * the last results were and the MVP card voted on the score of one of them, in
 * another column, as if they were unrelated facts. Now the order is the reading
 * order: what happened, who was the best of it, and then the three results in
 * small type, behind a hairline and not behind a second border.
 *
 * The vote is the vote the old card already ran — same module, same calls, same
 * four honest states, and the same rule that a vote with nowhere to be counted
 * is a lie: without a backend, without a played match or without a device bound
 * to a player, the voting block is simply absent. The match and the results
 * above and below it do not depend on any of that, so the card itself stays.
 *
 * The fixture is `lastFixture()`, the selector the rest of the site reads for
 * "the match that just happened", so a cup night and a league night are the same
 * card and the vote belongs to whichever was played last. The three results come
 * from `recentResults(3)`, the same list the form card drew, and they still open
 * with the match above: it is a window on the run, not a second ranking.
 *
 * The anchor id is `mvp` and not the title: `#mvp` was the public way into the
 * vote, and a card that moves is still the card that was linked to.
 */

/*
 * One tone per result, all inside the club's palette: the win earns the red,
 * the draw sits on charcoal, the loss stays outline. The quiet rows reuse the
 * same chip at a smaller size, so the module reads its outcome before its text.
 */
const RESULT_TONE = {
  win: {
    letter: "V",
    chip: "bg-acf-red text-white",
  },
  draw: {
    letter: "E",
    chip: "bg-white/10 text-white",
  },
  loss: {
    letter: "D",
    chip: "border border-acf-line text-acf-grey",
  },
};

/**
 * One reachable face. The portrait is the cutout from teamData.json, contained
 * and bottom-aligned like the attendee chips; when it has no photo, or the file
 * fails, the initial stands in, so a face is never a broken image.
 */
function Face({ player, size = "h-10 w-10" }) {
  const [broken, setBroken] = useState(false);

  if (player.photo && !broken) {
    return (
      <span
        className={`flex ${size} items-end justify-center overflow-hidden rounded-full border border-acf-line bg-acf-panel-light`}
      >
        <img
          src={player.photo}
          alt=""
          loading="lazy"
          className="max-h-[92%] w-auto object-contain"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex ${size} shrink-0 items-center justify-center rounded-full border border-acf-line bg-acf-panel-light text-[0.6875rem] font-bold text-acf-grey`}
    >
      {player.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/**
 * The played match the card is about, at full weight: the rival, the outcome and
 * the score with the two crests in crest order. Rival on the left, ours on the
 * right, equal outer columns so the score stays centred.
 */
function MatchRow({ fixture }) {
  const opponent = opponentOf(fixture);
  const score = clubScore(fixture);
  const outcome = resultOf(fixture);
  const tone = RESULT_TONE[outcome] ?? RESULT_TONE.draw;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span
          title={teamFullName(opponent.slug)}
          className="min-w-0 truncate text-row font-bold uppercase tracking-[0.06em] text-white"
        >
          {teamName(opponent.slug)}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.625rem] font-extrabold ${tone.chip}`}
          >
            {tone.letter}
          </span>
          <span className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
            {fixtureDateLabel(fixture)}
          </span>
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex justify-start">
          <Crest slug={opponent.slug} size="sm" to={`/equipo/${opponent.slug}`} />
        </div>
        <span
          className={`whitespace-nowrap font-display text-4xl font-medium leading-none tabular-nums ${
            outcome === "win" ? "text-acf-red" : "text-white"
          }`}
        >
          {score?.rival ?? "–"}
          <span className="mx-1 text-acf-dim">–</span>
          {score?.own ?? "–"}
        </span>
        <div className="flex justify-end">
          {/* The club's own crest opens the club's page too: this card lives on
              the dashboard, and the profile is elsewhere. */}
          <Crest slug={CLUB_SLUG} size="sm" to={`/equipo/${CLUB_SLUG}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * One of the three results under the hairline: the same information the form
 * card carried — opponent, outcome, score, date — at a size that reads after the
 * match above it and not against it. No crests: the list is a run, not a row of
 * fixtures, and three more badges would put the weight back where it was.
 *
 * It renders its own `li`, because a list is the only place it belongs.
 */
function QuietResultRow({ fixture }) {
  const opponent = opponentOf(fixture);
  const score = clubScore(fixture);
  const tone = RESULT_TONE[resultOf(fixture)] ?? RESULT_TONE.draw;

  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[0.5625rem] font-extrabold ${tone.chip}`}
      >
        {tone.letter}
      </span>
      <span
        title={teamFullName(opponent.slug)}
        className="min-w-0 flex-1 truncate text-micro font-semibold uppercase tracking-[0.1em] text-acf-snow/60"
      >
        {teamName(opponent.slug)}
      </span>
      <span className="shrink-0 text-micro font-semibold uppercase tracking-[0.14em] text-acf-dim">
        {fixtureDateLabel(fixture)}
      </span>
      <span className="flex w-12 shrink-0 items-baseline justify-end gap-0.5 font-display text-row font-medium tabular-nums">
        {score ? (
          <>
            <span className="text-acf-snow/45">{score.rival}</span>
            <span className="text-acf-dim">–</span>
            <span className="text-acf-red">{score.own}</span>
          </>
        ) : (
          <span className="text-acf-dim">–</span>
        )}
      </span>
    </li>
  );
}

export default function LastMatchCard({ className = "" }) {
  const { player } = useIdentity();
  const fixture = lastFixture();

  // The key names the round, not the fixture object: it is what tells the card
  // that last night's match has been replaced by a newer one.
  const key = matchKey(fixture);

  /*
   * The three results before the match drawn above. `recentResults(3)` includes
   * that match, and printing the same rival twice on one card reads as a
   * mistake rather than as history.
   */
  const results = recentResults(4)
    .filter((item) => matchKey(item) !== key)
    .slice(0, 3);

  const [matchId, setMatchId] = useState(null);
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [choosing, setChoosing] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured || !fixture || !player) return;
    try {
      const id = await ensureMatchRow({ fixture, season, clubSlug: CLUB_SLUG });
      setMatchId(id);
      const [rows, mine] = await Promise.all([fetchTally(id), fetchMyVote(id, player.id)]);
      setVotes(rows);
      setMyVote(mine);
      setLoadError(null);
    } catch (cause) {
      // A failed read is not a failed vote, so the two errors are kept apart.
      setLoadError(cause.message);
    }
    // `key` and the player are everything the request depends on: the fixture
    // object itself is rebuilt on every render.
  }, [key, player?.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Changing player must not leave the previous one's vote on screen as if it
  // were yours, and must not leave a stale choice pending.
  useEffect(() => {
    setChoosing(false);
  }, [player?.id]);

  const vote = async (candidateId) => {
    if (!matchId || !player || busy) return;
    const previous = myVote;
    // Optimistic: the press has to feel instant, and a vote is trivial to undo.
    setMyVote(String(candidateId));
    setBusy(true);
    setChoosing(false);
    try {
      await castVote({ matchId, voterId: player.id, candidateId });
      setVotes(await fetchTally(matchId));
      setSaveError(null);
    } catch (cause) {
      setMyVote(previous);
      setSaveError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  // The vote only exists where it can be counted (see the header); the match and
  // the run do not depend on the backend, so the card renders without them.
  const voting = Boolean(isConfigured && fixture && player);
  const options = voting ? candidates(teamData.squad, player.id) : [];
  const rows = voting ? tally(votes, teamData.squad) : [];
  const mine = voting && myVote ? teamData.squad.find((item) => String(item.id) === myVote) : null;
  const casting = !myVote || choosing;
  const widest = rows[0]?.votes ?? 0;

  return (
    <Card
      id="mvp"
      title="Último partido"
      hint={fixture ? matchdayLabel(fixture) : VOICE.sections.form}
      icon={Award}
      className={className}
      bodyClassName="flex flex-col"
    >
      <div className="flex flex-col px-6 pb-6 pt-1">
        {/* What happened. */}
        {fixture ? (
          <MatchRow fixture={fixture} />
        ) : (
          <div>
            <p className="text-row text-acf-grey">
              La fuente oficial todavía no publica ningún partido jugado.
            </p>
            <p className="mt-1.5 text-row font-semibold text-acf-snow/80">
              {VOICE.states.noResults}
            </p>
          </div>
        )}

        {/* Who was the best of it. */}
        {voting ? (
          <div className="mt-5 flex flex-col gap-4">
            {loadError ? (
              <p className="text-row text-acf-grey">
                No se pudo cargar la votación.
                <span className="mt-1 block text-micro text-acf-dim">{loadError}</span>
              </p>
            ) : null}

            {casting ? (
              <>
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-snow/70">
                      ¿Quién fue el MVP?
                    </p>
                    {/* Changing your mind about changing your mind: the tally is
                        one press away and does not need a vote to come back. */}
                    {myVote ? (
                      <button
                        type="button"
                        onClick={() => setChoosing(false)}
                        className="shrink-0 rounded-full border border-acf-line px-3 py-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-snow/70 transition-colors duration-200 hover:border-white/25 hover:text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-1.5 text-row leading-relaxed text-acf-grey">
                    Vota a cualquier jugador de la plantilla. Un voto por partido, y
                    puedes cambiarlo cuando quieras.
                  </p>
                </div>

                {/* The squad as reachable faces: the whole roster, minus the
                    reader. Every option is a real button, so a face can be chosen
                    with a keyboard and read by a screen reader instead of only
                    tapped. Two columns and not three: the card is a narrow column
                    on desktop, and a third column there truncates the names to
                    initials. */}
                <ul className="grid grid-cols-2 gap-2">
                  {options.map((option) => {
                    const chosen = myVote === String(option.id);
                    return (
                      <li key={option.id}>
                        <button
                          type="button"
                          onClick={() => vote(option.id)}
                          disabled={busy || !matchId}
                          aria-pressed={chosen}
                          aria-label={`Votar a ${option.name}`}
                          className={`flex w-full items-center gap-2 rounded-tile border py-1.5 pl-1.5 pr-2 text-left transition disabled:opacity-40 ${
                            chosen
                              ? "border-acf-red/60 bg-acf-red/10"
                              : "border-acf-line bg-white/[0.03] hover:border-white/25"
                          }`}
                        >
                          <Face player={option} size="h-9 w-9" />
                          <span className="min-w-0 truncate text-micro font-semibold uppercase tracking-[0.1em] text-acf-snow/85">
                            {option.name}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 text-row font-semibold text-white">
                    Tu MVP: {mine?.name ?? "—"}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setChoosing(true)}
                    className="shrink-0 rounded-full border border-acf-line px-3 py-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-snow/70 transition-colors duration-200 hover:border-white/25 hover:text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
                  >
                    Cambiar voto
                  </button>
                </div>

                {/* The tally only after voting: the count is what the squad says,
                    and it should not be read before saying anything. */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
                      La votación
                    </p>
                    <p className="text-micro font-semibold uppercase tracking-[0.14em] text-acf-grey">
                      {votes.length} {votes.length === 1 ? "voto" : "votos"}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2.5">
                    {rows.map((row, index) => (
                      <li key={row.id} className="flex items-center gap-2.5">
                        <Face player={row} size="h-7 w-7" />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="min-w-0 truncate text-micro font-semibold uppercase tracking-[0.1em] text-acf-snow/85">
                              {row.name}
                            </span>
                            <span className="shrink-0 text-figure font-semibold tabular-nums text-acf-red-soft">
                              {row.votes}
                            </span>
                          </div>
                          <div
                            aria-hidden="true"
                            className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]"
                          >
                            <div
                              className={`h-full rounded-full ${
                                index === 0 ? "bg-acf-red" : "bg-acf-red/70"
                              }`}
                              style={{ width: `${widest ? (row.votes / widest) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {saveError ? (
              <p className="text-row text-acf-red">
                No se pudo guardar tu voto. Vuelve a intentarlo.
                <span className="mt-1 block text-micro text-acf-dim">{saveError}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        {/* The run that led to it, quieter and behind a hairline: same card, no
            second border. */}
        {results.length ? (
          <div className="mt-5 flex flex-col gap-2.5 border-t border-acf-line-soft pt-4">
            <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
              Los {results.length} anteriores
            </p>
            <ul className="flex flex-col gap-2">
              {results.map((result) => (
                <QuietResultRow
                  key={`${result.competitionKey}-${result.matchday}`}
                  fixture={result}
                />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
