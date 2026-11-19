import { useCallback, useEffect, useState } from "react";
import { Award } from "lucide-react";
import teamData from "../../data/teamData.json";
import { CLUB_SLUG, lastFixture, matchdayLabel } from "../../data/competition.js";
import { season } from "../../data/club-record.js";
import { useIdentity } from "../../lib/identity.js";
import Card from "./Card.jsx";
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
 * Vote the MVP of the last match we played.
 *
 * The owner asked for it plainly: after each match the reader picks an MVP, and
 * he can pick anyone in the squad — not only the players on the attendance list,
 * because that list is kept by hand and a gap in it would lock a player out of a
 * vote he played in. The one face missing from the list is his own: nobody votes
 * for himself.
 *
 * Four honest states, and the card only exists in two of them:
 *   * no backend configured — the card renders NOTHING. A vote with nowhere to
 *     be counted is a lie, and the acceptance rule the attendance surfaces
 *     follow is the same one here;
 *   * no played match — nothing, because there is no match to name;
 *   * nobody bound to the device — nothing, because there is no one to vote as
 *     (and no self to exclude from the list);
 *   * bound, with a played match — the squad minus the reader, then the tally.
 *
 * The fixture is the last played one across competitions (`lastFixture()`), so a
 * cup night and a league night are the same card, and `lastFixture()` is the
 * selector the rest of the site already reads for "the match that just
 * happened". The match is not chosen here: the card asks the data layer for the
 * row of that fixture, and `src/lib/mvp.js` derives its key.
 *
 * Voting is one click, and changing your mind is one more: the vote is stored
 * per voter and match, so the second choice replaces the first instead of adding
 * to it. Before voting the card shows no tally at all — the count is what the
 * squad says, not what it is told to say.
 */

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

export default function MvpCard({ className = "" }) {
  const { player } = useIdentity();
  const fixture = lastFixture();

  // The key names the round, not the fixture object: it is what tells the card
  // that last night's match has been replaced by a newer one.
  const key = matchKey(fixture);

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

  // Silent on purpose, in all three cases (see the header).
  if (!isConfigured || !fixture || !player) return null;

  const options = candidates(teamData.squad, player.id);
  const rows = tally(votes, teamData.squad);
  const mine = myVote ? teamData.squad.find((item) => String(item.id) === myVote) : null;
  const casting = !myVote || choosing;
  const widest = rows[0]?.votes ?? 0;

  return (
    <Card
      id="mvp"
      title="MVP"
      hint={matchdayLabel(fixture)}
      icon={Award}
      className={className}
      bodyClassName="flex flex-col"
    >
      <div className="flex flex-col gap-4 px-6 pb-6 pt-1">
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
                {/* Changing your mind about changing your mind: the tally is one
                    press away and does not need a vote to come back. */}
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

            {/* The squad as reachable faces: the whole roster, minus the reader.
                Every option is a real button, so a face can be chosen with a
                keyboard and read by a screen reader instead of only tapped.
                Two columns and not three: on desktop this card is the narrow
                column, and a third column there truncates the names to initials. */}
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
    </Card>
  );
}
