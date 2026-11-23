import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import teamData from "../data/teamData.json";
import { CLUB_SLUG, fixtureKickoffIso } from "../data/competition.js";
import { season } from "../data/club-record.js";
import { useIdentity } from "../lib/identity.js";
import { VOICE } from "../data/copy.js";
import { splitAnswers } from "../lib/attendance-split.js";
import {
  ensureMatch,
  fetchAnswers,
  isConfigured,
  matchLoadKey,
  setAnswer,
} from "../lib/attendance.js";
import { availabilityOf } from "../lib/availability.js";
import { beginWork } from "../lib/app-ready.js";

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
 * Answering yes takes the two buttons away (owner, S3, S4): your own pill then
 * carries an X, and that X is the whole of the way back — it withdraws the
 * answer instead of opening a panel with two more buttons in it. Saying no
 * keeps the buttons on screen, because "no" is not a decision the card should
 * lock you out of: press the X, then press "Sí, voy" again if you change your
 * mind.
 *
 * The faces of who is coming sit above the buttons (owner, L18): the answer a
 * player wants before pressing is "how many are we?". The affirmative is the
 * solid red primary and the refusal the quiet outline, so the card asks the
 * question the way a player answers it at the field. Nobody who said no is
 * listed anywhere: the band that used to carry them across the foot of the card
 * is gone (S2), so the answer is a headcount and a row of faces, not two lists.
 *
 * The block paints no ground, no border and no negative margin of its own: it
 * sits straight on the card's own surface, so there is no second sheet between
 * the crests above it and no band under it.
 *
 * Three honest states:
 *   * no backend configured — one line saying so, never a fake empty list;
 *   * backend, nobody identified — the headcount, plus a nudge to the face strip;
 *   * backend, identified — the answer, the faces of who is coming, and the X
 *     on your own face when you are one of them.
 */

const SQUAD_BY_ID = new Map(teamData.squad.map((player) => [player.id, player]));

/**
 * One face as it appears in the attendee row: photo, then name, then — on your
 * own pill only — the X that withdraws your answer.
 */
function FaceChip({ player, mine = false, onWithdraw = null }) {
  return (
    <span
      className={`flex items-center gap-2 rounded-full border py-0.5 pl-0.5 ${
        mine
          ? "border-acf-red/60 bg-acf-red/10 pr-1"
          : "border-acf-line bg-white/[0.03] pr-2.5"
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
      {mine && onWithdraw ? (
        <button
          type="button"
          onClick={onWithdraw}
          aria-label={`${VOICE.buttons.withdraw}: ${player.name}`}
          title={`${VOICE.buttons.withdraw}: ${player.name}`}
          className="-ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-acf-red/40 bg-acf-dark/40 text-acf-snow/70 transition-colors duration-200 hover:border-acf-red hover:bg-acf-red hover:text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
        >
          <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

/**
 * The faces of who said yes.
 *
 * The split arrives as a prop because the bar and these faces are two views of
 * the same answers (S4): splitting them again here would let the number above
 * and the faces below drift apart. Whoever is not coming is simply not in this
 * row — and only the reader's own pill is interactive (S3).
 */
function GoingFaces({ going, chosenId, onWithdraw }) {
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
        <FaceChip
          key={player.id}
          player={player}
          mine={player.id === chosenId}
          onWithdraw={player.id === chosenId ? onWithdraw : null}
        />
      ))}
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

  const firstRead = useRef(false);
  const loadKey = matchLoadKey(fixture);

  const load = useCallback(async () => {
    if (!isConfigured || !fixture) return;
    /*
     * The boot curtain waits for this read — the FIRST one, and only it.
     *
     * `load` is keyed on the identity of the request (`matchLoadKey`), not on the
     * fixture object: that object is a fresh copy on every call that builds it,
     * so keying on it would run this effect once a second. The closure still
     * reads `fixture`, and that is sound because the key covers every field the
     * request sends — an equal key means an equal request.
     *
     * The guard is the second line of defence. A refetch after the curtain is up
     * has nothing to declare to it; one that runs while it is down must not hand
     * it a signal that is busy half the time, or the curtain would lift on a lull
     * instead of on the answer. The first read is what the reader waits for.
     */
    const answered = firstRead.current ? () => {} : beginWork();
    firstRead.current = true;
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
    } finally {
      // The curtain is about the wait, not about the outcome: a failure has
      // answered too, and the card says so in its own words.
      answered();
    }
  }, [loadKey]);

  useEffect(() => {
    load();
  }, [load]);

  const declare = async (status) => {
    if (!matchId || !player || busy) return;
    const previous = answers[player.id];
    // Optimistic: the press must feel instant on a phone at the field.
    setAnswers((current) => ({ ...current, [player.id]: status }));
    setBusy(true);
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
   * Split once, here, and hand the row down: the bar and the faces read the
   * same answers. The people who said yes are the first row of faces; the people
   * who said no are the second, with the same chips and a red label (S13), which
   * this card had lost when it was rebuilt. The headcount above still counts
   * confirmations only.
   */
  const { going, out } = splitAnswers(answers, SQUAD_BY_ID);
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
  /*
   * The buttons are on screen unless you already said you are coming. Saying no
   * leaves them there on purpose: the X is not the only way back, and a card
   * that hides its own question after a "no" would be a card you cannot change
   * your mind on.
   */
  const showButtons = mine !== "in";
  const withdraw = () => declare("out");

  const button = (status, label, variant) => {
    const active = mine === status;
    /*
     * The affirmative is the only solid red on the card; the refusal keeps the
     * outline. When you have already said no, that no stays at full weight and
     * the other one steps back, so you can see what you are changing from.
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
       * One column, printed straight onto the card's own surface: no ground, no
       * border, no negative margin, so nothing here can open a seam against the
       * photograph above it.
       */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-micro font-semibold uppercase tracking-[0.22em] text-acf-snow/70">
            Disponibilidad
          </p>
          <p className="font-display text-2xl font-medium leading-none tabular-nums text-white sm:text-3xl">
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

        <GoingFaces
          going={going}
          chosenId={player?.id ?? null}
          onWithdraw={withdraw}
        />

        {/*
         * Who said they are not coming (S13): the same chip as the row above —
         * circular portrait and a white name — under a red «NO VAN:». The reader's
         * own chip keeps the X, so a no can be taken back from where it was said
         * without hunting for the buttons.
         */}
        {out.length ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-micro font-bold uppercase tracking-[0.16em] text-acf-red">
              No van:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {out.map((absent) => (
                <FaceChip
                  key={absent.id}
                  player={absent}
                  mine={player?.id === absent.id}
                  onWithdraw={withdraw}
                />
              ))}
            </div>
          </div>
        ) : null}

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
         * The answer itself: the two buttons while you have not said yes, and
         * nothing once you have — your pill carries the X that takes it back
         * (S3, S4).
         */}
        {showButtons ? (
          <div className="grid grid-cols-[1.6fr_1fr] gap-2">
            {button("in", "Sí, voy", "primary")}
            {button("out", "No voy", "secondary")}
          </div>
        ) : null}

        {saveError ? (
          <p className="text-row text-acf-red">
            No se pudo guardar tu respuesta. Vuelve a intentarlo.
            <span className="mt-1 block text-micro text-acf-snow/70">{saveError}</span>
          </p>
        ) : null}
      </div>
    </>
  );
}
