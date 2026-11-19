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
import { availabilityOf } from "../lib/availability.js";

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
      <span className="text-micro font-semibold uppercase tracking-[0.12em] text-white">
        {player.name}
      </span>
    </span>
  );
}

/**
 * The faces of the answers, already split by whoever owns the answers.
 *
 * Both lists arrive as props because the availability bar and these rows are
 * two views of the same answers (S4): computing the split here as well would
 * let the number above and the faces below drift apart. The headcount sentence
 * that used to live here is gone too — the availability line says it once.
 */
function Tally({ going, missing, chosenId }) {
  if (going.length + missing.length === 0) {
    return (
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
        {VOICE.states.attendanceEmpty}
      </p>
    );
  }

  return (
    /*
     * Two lists, two labels: who goes sits under the bar that counts them, and
     * whoever does not go keeps the same face and the same white name, told
     * apart only by the red «No van:» heading (owner, S10-S12). Folding the
     * label into the row keeps the block from growing a third heading.
     */
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1">
        {going.map((player) => (
          <FaceChip key={player.id} player={player} mine={player.id === chosenId} />
        ))}
      </div>
      {missing.length ? (
        <div className="flex flex-wrap items-center gap-1">
          <p className="mr-1 text-micro font-bold uppercase tracking-[0.16em] text-acf-red">
            No van:
          </p>
          {missing.map((player) => (
            <FaceChip key={player.id} player={player} mine={player.id === chosenId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function MatchAttendance({ fixture, variant = "poster" }) {
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

  /*
   * The band is the card's footer, so it has to cancel the padding of whoever
   * renders it and put the same amount back as its own: the poster pads 20 px
   * (24 from sm up) and the shared hero card pads a flat 24. Guessing one of the
   * two leaves a seam of surface on the other, which is why the variant is a
   * parameter and not a constant.
   *
   * The hero container stacks its children with a 28 px gap, and the band is one
   * of them: without `-mt-7` that gap stays above the footer as a strip of card
   * surface, which is what showed between the fixture sentence and ASISTENCIA.
   */
  const BAND =
    variant === "hero"
      ? "-mx-6 -mb-6 -mt-7 px-6 pb-6 pt-5"
      : "-mx-5 -mb-5 px-5 pb-5 pt-4 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6";

  if (!isConfigured) {
    /*
     * No backend is not zero confirmed, it is unknown confirmed: the same plain
     * separator as the rest of the block, and deliberately no bar (S6, D3).
     */
    return (
      <div
        className={`${BAND} border-t border-acf-line-soft bg-black`}
      >
        <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-grey">
          Asistencia
        </p>
        <p className="mt-1 text-row text-acf-grey">
          Falta conectar el registro de asistencia. La lista aparecerá aquí.
        </p>
      </div>
    );
  }

  /*
   * Split once, here, and hand the two lists down: the bar, the faces and the
   * "no van" line all read the same answers, in the order they were stored.
   */
  const going = [];
  const missing = [];
  for (const [id, status] of Object.entries(answers)) {
    const squadPlayer = SQUAD_BY_ID.get(Number(id));
    if (!squadPlayer) continue;
    (status === "in" ? going : missing).push(squadPlayer);
  }
  const availability = availabilityOf(going.length, teamData.squad.length);
  /*
   * Spanish agrees with the number: with one player missing the line is «falta
   * 1», and the owner's wording («faltan X para jugar») is its plural form.
   */
  const stateLabel = availability.ready
    ? "Hay partido"
    : availability.missing === 1
      ? "Falta 1 para jugar"
      : `Faltan ${availability.missing} para jugar`;

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
        className={`rounded-tile border px-4 py-2.5 text-[0.9375rem] font-extrabold tracking-tight transition disabled:opacity-40 ${tone} ${
          mine && !active ? "opacity-60" : ""
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    /*
     * The block is the card's footer: the black band runs to the card's edges
     * and to its bottom corner, so the attendance reads as its own part of the
     * poster instead of a strip of the red surface (owner, S11).
     */
    <div className={`${BAND} flex flex-col gap-2.5 border-t border-acf-line-soft bg-black`}>
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

      {/*
       * The availability first: it is the answer to the question the label
       * asks, and it is the loudest thing in the block (S2, S6). Nothing wraps
       * it — a card inside the card was the thing to remove.
       */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
            Disponibilidad
          </p>
          <p className="font-display text-2xl leading-none tabular-nums text-white">
            {availability.percent}%
          </p>
        </div>
        <div
          aria-hidden="true"
          className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ${
              availability.ready ? "bg-acf-red" : "bg-acf-grey"
            }`}
            style={{ width: `${availability.percent}%` }}
          />
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[0.9375rem] font-extrabold uppercase leading-none tracking-[0.12em] text-acf-red">
            {availability.going} / {availability.total} jugadores confirmados
          </p>
          <p
            className={`ml-auto text-micro font-bold uppercase tracking-[0.16em] ${
              availability.ready ? "text-acf-red" : "text-acf-grey"
            }`}
          >
            {stateLabel}
          </p>
        </div>
      </div>

      <Tally going={going} missing={missing} chosenId={player?.id ?? null} />

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
      ) : null}

      {saveError ? (
        <p className="text-row text-acf-red">
          No se pudo guardar tu respuesta. Vuelve a intentarlo.
          <span className="mt-1 block text-micro text-acf-dim">{saveError}</span>
        </p>
      ) : null}
    </div>
  );
}
