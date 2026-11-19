import { useCallback, useEffect, useState } from "react";
import teamData from "../data/teamData.json";
import { CLUB_SLUG, fixtureKickoffIso } from "../data/competition.js";
import { season } from "../data/club-record.js";
import { useIdentity } from "../lib/identity.js";
import { VOICE } from "../data/copy.js";
import {
  ensureMatch,
  fetchAnswers,
  isConfigured,
  setAnswer,
} from "../lib/attendance.js";

/**
 * Sí, voy / No voy on the fixture that is actually next.
 *
 * It is rendered by the active fixture card and by nothing else: the card that
 * owns the hero surface passes its own fixture, so a player can only sign up for
 * the match being played next (S10), and a row written here always points at a
 * real fixture with a real kickoff.
 *
 * This list is informational — it answers "how many are we?" (owner, L6). It is
 * NOT the record: the referee's acta is. So a last-minute no-show who never
 * touched the site is corrected later by the acta, and this card never pretends
 * to be the truth about who played.
 *
 * Answering collapses the two buttons (owner, L16): once you have said
 * something, the card shows what you said plus a small "Editar" instead of
 * inviting you to answer again. "Editar" brings them back, and choosing again
 * collapses them again. The same collapse follows "No voy": the state a
 * player sees should not depend on which of the two he pressed.
 *
 * The faces of who is coming sit above the buttons (owner, L18): the answer a
 * player wants before pressing is "how many are we?". The affirmative is the
 * solid red primary and the refusal the quiet outline, so the card asks the
 * question the way a player answers it at the field.
 *
 * Three honest states:
 *   * no backend configured — one line saying so, never a fake empty list;
 *   * backend, nobody identified — the headcount, plus a nudge to the face strip;
 *   * backend, identified — the answer, the faces of who is coming, and a way
 *     to change or edit it.
 */

const SQUAD_BY_ID = new Map(teamData.squad.map((player) => [player.id, player]));

/** One face as it appears in the attendee row: photo first, name after. */
function FaceChip({ player, mine = false }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border py-0.5 pl-0.5 pr-2.5 ${
        mine ? "border-acf-red/60 bg-acf-red/10" : "border-acf-line bg-white/[0.03]"
      }`}
    >
      <span className="flex h-7 w-7 items-end justify-center overflow-hidden rounded-full border border-acf-line bg-acf-panel-light">
        <img
          src={player.photo}
          alt=""
          loading="lazy"
          className="max-h-[92%] w-auto object-contain"
          onError={(event) => {
            // Same silhouette as the squad cards, so a missing portrait is a
            // shape instead of a broken image.
            event.currentTarget.src =
              "data:image/svg+xml," +
              encodeURIComponent(
                `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='200'><circle cx='80' cy='70' r='42' fill='#1c1c1f'/><rect y='120' width='160' height='80' fill='#e61c24'/></svg>`,
              );
          }}
        />
      </span>
      <span className="text-micro font-semibold uppercase tracking-[0.12em] text-acf-snow/85">
        {player.name}
      </span>
    </span>
  );
}

function Tally({ answers, chosenId }) {
  const going = [];
  const missing = [];
  for (const [id, status] of Object.entries(answers)) {
    const player = SQUAD_BY_ID.get(Number(id));
    if (!player) continue;
    (status === "in" ? going : missing).push(player);
  }

  if (going.length + missing.length === 0) {
    return (
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
        {VOICE.states.attendanceEmpty}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
        {going.length} de {teamData.squad.length} apuntados
      </p>

      {going.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-micro font-semibold uppercase tracking-[0.18em] text-white">
            Van
          </p>
          {/* Faces, because a face is how the squad recognises itself. */}
          <div className="flex flex-wrap gap-1.5">
            {going.map((player) => (
              <FaceChip key={player.id} player={player} mine={player.id === chosenId} />
            ))}
          </div>
        </div>
      ) : null}

      {missing.length ? (
        <p className="text-micro font-semibold uppercase leading-relaxed tracking-[0.12em] text-acf-dim">
          No van: {missing.map((player) => player.name).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

export default function MatchAttendance({ fixture }) {
  const { player } = useIdentity();
  const [matchId, setMatchId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured || !fixture) return;
    try {
      const id = await ensureMatch({
        season,
        competition: fixture.competitionKey,
        matchday: fixture.matchday,
        kickoff: fixtureKickoffIso(fixture),
        rival: fixture.home?.slug === CLUB_SLUG ? fixture.away?.name : fixture.home?.name,
      });
      setMatchId(id);
      setAnswers(await fetchAnswers(id));
      setLoadError(null);
    } catch (cause) {
      // Loading and saving fail for different reasons, so they say so
      // differently: a failed load is not a failed answer.
      setLoadError(cause.message);
    }
  }, [fixture]);

  useEffect(() => {
    load();
  }, [load]);

  // Changing user (or a re-ask after the squad changed) must not leave the
  // previous player's answer collapsed into a panel the new player cannot edit.
  useEffect(() => {
    setEditing(false);
  }, [player?.id]);

  const declare = async (status) => {
    if (!matchId || !player || busy) return;
    const previous = answers[player.id];
    // Optimistic: the press must feel instant on a phone at the field.
    setAnswers((current) => ({ ...current, [player.id]: status }));
    setBusy(true);
    // The buttons have done their job: answer first, then collapse.
    setEditing(false);
    try {
      await setAnswer({ matchId, playerId: player.id, status });
      setSaveError(null);
    } catch (cause) {
      setAnswers((current) => {
        const next = { ...current };
        if (previous) next[player.id] = previous;
        else delete next[player.id];
        return next;
      });
      setSaveError(cause.message);
    } finally {
      setBusy(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="rounded-tile border border-acf-line bg-white/[0.03] px-4 py-3">
        <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
          Asistencia
        </p>
        <p className="mt-1.5 text-row text-acf-grey">
          Falta conectar el registro de asistencia. La lista aparecerá aquí.
        </p>
      </div>
    );
  }

  const mine = player ? answers[player.id] : undefined;
  const showButtons = editing || !mine;

  const button = (status, label, variant) => {
    const active = mine === status;
    /*
     * The affirmative is the only solid red on the card; the refusal keeps the
     * outline. While editing, the answer you already gave stays at full weight
     * and the other one steps back, so you can see what you are changing from.
     */
    const tone =
      variant === "primary"
        ? "border-acf-red bg-acf-red text-white hover:bg-acf-red-dark"
        : "border-acf-line bg-white/[0.05] text-white hover:border-white/25";
    return (
      <button
        type="button"
        onClick={() => declare(status)}
        disabled={!player || busy || !matchId}
        aria-pressed={active}
        className={`rounded-tile border px-4 py-3 text-[0.9375rem] font-extrabold tracking-tight transition disabled:opacity-40 ${tone} ${
          mine && !active ? "opacity-60" : ""
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 border-t border-acf-line-soft pt-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
          ¿Vas al partido?
        </p>
        {mine && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full border border-acf-line px-3 py-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-snow/70 transition-colors duration-200 hover:border-white/25 hover:text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
          >
            {VOICE.buttons.editAnswer}
          </button>
        ) : null}
      </div>

      {/* The headcount first: it is the answer to the question the label asks. */}
      <Tally answers={answers} chosenId={player?.id ?? null} />

      {!player ? (
        <p className="text-row text-acf-grey">
          Elige quién eres arriba para apuntarte.
        </p>
      ) : null}

      {loadError ? (
        <p className="text-row text-acf-grey">
          No se pudo cargar la lista de asistencia.
          <span className="mt-1 block text-micro text-acf-dim">{loadError}</span>
        </p>
      ) : null}

      {showButtons ? (
        <div className="grid grid-cols-[1.6fr_1fr] gap-2">
          {button("in", "Sí, voy", "primary")}
          {button("out", "No voy", "secondary")}
        </div>
      ) : (
        <div>
          <p className="text-row font-semibold text-white">
            {mine === "in" ? "Sí, voy." : "No voy."}
          </p>
          {mine === "in" ? (
            <p className="mt-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-grey">
              {VOICE.states.attendanceGoing}
            </p>
          ) : null}
        </div>
      )}

      {saveError ? (
        <p className="text-row text-acf-red">
          No se pudo guardar tu respuesta. Vuelve a intentarlo.
          <span className="mt-1 block text-micro text-acf-dim">{saveError}</span>
        </p>
      ) : null}
    </div>
  );
}
