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
 * Everything except the last strip is printed on the card's own gradient — the
 * block paints no ground, no border and no negative margin of its own, so there
 * is no second surface between the crests above and the bar below (owner's
 * mockup). The people who said no get the one band that does paint a ground:
 * full bleed, across the foot of the card, in a very dark grey.
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

/*
 * The card's own padding, cancelled and put back.
 *
 * The "No van" strip is the only part of this block that is full bleed, and the
 * only way to be full bleed from inside a padded body is to reach outside that
 * padding. Both numbers are the hero body's `px-5 pb-6 sm:px-6` in
 * FixtureCardView, kept here in one constant so the offsets are not guessed in
 * two places — and they no longer move a surface, only an opaque band.
 */
const BLEED = "-mx-5 -mb-6 px-5 pb-5 pt-3.5 sm:-mx-6 sm:-mb-6 sm:px-6";

/**
 * The faces of who said yes.
 *
 * The split arrives as a prop because the bar and these faces are two views of
 * the same answers (S4): splitting them again here would let the number above
 * and the faces below drift apart. Whoever is not coming is no longer part of
 * this row — the mockup gives the absence list a band of its own at the foot of
 * the card, so the two lists are told apart by where they sit.
 */
function GoingFaces({ going, chosenId }) {
  if (going.length === 0) {
    return (
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-snow/60">
        {VOICE.states.attendanceEmpty}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {going.map((player) => (
        <FaceChip key={player.id} player={player} mine={player.id === chosenId} />
      ))}
    </div>
  );
}

/**
 * The last strip: the people who are not coming, on the only ground of this
 * block that paints one.
 *
 * The owner drew it full bleed across the card's foot in a very dark grey that
 * is deliberately not the pure black it used to be (`bg-black`, which he asked
 * to lift). `acf-panel` is that grey: a documented step above the gradient's
 * floor, so the band reads as its own surface instead of a black hole at the
 * bottom of a red card. Its ink is checked against that grey, not against a
 * guess: white names 16.6:1, the red "No van:" 3.6:1 (see the note in the
 * handoff — the brand red is the one ink this palette cannot lift to 4.5:1 on a
 * dark grey; it is 4.56:1 only on pure black).
 */
function MissingStrip({ missing, chosenId }) {
  return (
    <div className={`${BLEED} bg-acf-panel`}>
      <div className="flex flex-wrap items-center gap-1">
        <p className="mr-1 text-micro font-bold uppercase tracking-[0.16em] text-acf-red-soft">
          No van:
        </p>
        {missing.map((player) => (
          <FaceChip key={player.id} player={player} mine={player.id === chosenId} />
        ))}
      </div>
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
    /*
     * No backend is not zero confirmed, it is unknown confirmed: one line on the
     * card's own gradient, and deliberately no bar (S6, D3).
     */
    return (
      <div className="flex flex-col gap-1">
        <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-snow/70">
          Asistencia
        </p>
        <p className="text-row text-acf-snow/70">
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
    <>
      {/*
       * Everything above the last strip is printed straight onto the card's
       * gradient: no ground, no border, no negative margin, so there is nothing
       * here that could open the seam the stacked version used to show.
       */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-snow/70">
            Disponibilidad
          </p>
          <p className="font-display text-4xl font-medium leading-none tabular-nums text-white">
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
              availability.ready ? "text-acf-red" : "text-acf-snow/70"
            }`}
          >
            {stateLabel}
          </p>
        </div>

        <GoingFaces going={going} chosenId={player?.id ?? null} />

        {!player ? (
          <p className="text-row text-acf-snow/70">
            Elige quién eres arriba para apuntarte.
          </p>
        ) : null}

        {loadError ? (
          <p className="text-row text-acf-snow/70">
            No se pudo cargar la lista de asistencia.
            <span className="mt-1 block text-micro text-acf-snow/50">{loadError}</span>
          </p>
        ) : null}

        {/*
         * The answer itself. The mockup draws a card with no controls, but the
         * controls are the reason this block exists, so they sit under the
         * faces the mockup does draw and say nothing else: the two buttons while
         * there is no answer, «Cambiar planes» once there is (L16).
         */}
        {showButtons ? (
          <div className="grid grid-cols-[1.6fr_1fr] gap-2">
            {button("in", "Sí, voy", "primary")}
            {button("out", "No voy", "secondary")}
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-acf-snow/25 px-3 py-1 text-micro font-semibold uppercase tracking-[0.14em] text-acf-snow/80 transition-colors duration-200 hover:border-white/40 hover:text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
            >
              {VOICE.buttons.editAnswer}
            </button>
          </div>
        )}

        {saveError ? (
          <p className="text-row text-acf-red">
            No se pudo guardar tu respuesta. Vuelve a intentarlo.
            <span className="mt-1 block text-micro text-acf-snow/70">{saveError}</span>
          </p>
        ) : null}
      </div>

      {missing.length ? (
        <MissingStrip missing={missing} chosenId={player?.id ?? null} />
      ) : null}
    </>
  );
}
