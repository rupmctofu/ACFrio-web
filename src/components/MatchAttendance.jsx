import { useCallback, useEffect, useState } from "react";
import teamData from "../data/teamData.json";
import { CLUB_SLUG } from "../data/competition.js";
import { useIdentity } from "../lib/identity.js";
import {
  ensureMatch,
  fetchAnswers,
  isConfigured,
  setAnswer,
} from "../lib/attendance.js";

/**
 * Asistiré / No asistiré on the next match.
 *
 * This list is informational — it answers "how many are we?" (owner, L6). It is
 * NOT the record: the referee's acta is. So a last-minute no-show who never
 * touched the site is corrected later by the acta, and this card never pretends
 * to be the truth about who played.
 *
 * Three honest states:
 *   * no backend configured — one line saying so, never a fake empty list;
 *   * backend, nobody identified — the headcount, plus a nudge to the face strip;
 *   * backend, identified — the two buttons and the live list.
 */

const SQUAD_BY_ID = new Map(teamData.squad.map((player) => [player.id, player]));

function Tally({ answers, chosenId }) {
  const going = [];
  const missing = [];
  for (const [id, status] of Object.entries(answers)) {
    const player = SQUAD_BY_ID.get(Number(id));
    if (!player) continue;
    (status === "in" ? going : missing).push(player);
  }
  const answered = going.length + missing.length;

  if (answered === 0) {
    return (
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
        Nadie se ha apuntado todavía
      </p>
    );
  }

  const names = (list, tone) => (
    <div className="flex flex-wrap gap-1.5">
      {list.map((player) => (
        <span
          key={player.id}
          className={`rounded-full border px-2.5 py-1 text-micro font-semibold uppercase tracking-[0.12em] ${
            player.id === chosenId
              ? "border-acf-red/60 text-white"
              : "border-acf-line text-acf-snow/70"
          } ${tone}`}
        >
          {player.name}
        </span>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
        {going.length} de {teamData.squad.length} apuntados
      </p>
      {going.length ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-micro font-semibold uppercase tracking-[0.18em] text-white">
            Van
          </p>
          {names(going)}
        </div>
      ) : null}
      {missing.length ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-micro font-semibold uppercase tracking-[0.18em] text-acf-dim">
            No van
          </p>
          {names(missing, "opacity-60")}
        </div>
      ) : null}
    </div>
  );
}

export default function MatchAttendance({ fixture }) {
  const { player } = useIdentity();
  const [matchId, setMatchId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!isConfigured || !fixture) return;
    try {
      const id = await ensureMatch({
        competition: fixture.competitionKey,
        matchday: fixture.matchday,
        kickoff: fixture.date
          ? `${fixture.date}T${fixture.time ?? "00:00"}:00`
          : null,
        rival: fixture.home?.slug === CLUB_SLUG ? fixture.away?.name : fixture.home?.name,
      });
      setMatchId(id);
      setAnswers(await fetchAnswers(id));
      setError(null);
    } catch (cause) {
      setError(cause.message);
    }
  }, [fixture]);

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
      setError(null);
    } catch (cause) {
      setAnswers((current) => {
        const next = { ...current };
        if (previous) next[player.id] = previous;
        else delete next[player.id];
        return next;
      });
      setError(cause.message);
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

  const button = (status, label) => {
    const active = mine === status;
    return (
      <button
        type="button"
        onClick={() => declare(status)}
        disabled={!player || busy || !matchId}
        aria-pressed={active}
        className={`rounded-tile border px-4 py-3 text-[15px] font-extrabold tracking-tight transition disabled:opacity-40 ${
          active
            ? "border-acf-red bg-acf-red text-acf-dark"
            : "border-acf-line bg-white/[0.05] text-white hover:border-white/25"
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
        {mine ? (
          <span className="text-micro font-semibold uppercase tracking-[0.14em] text-acf-grey">
            {mine === "in" ? "Apuntado" : "No vas"}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {button("in", "Asistiré")}
        {button("out", "No asistiré")}
      </div>

      {!player ? (
        <p className="text-row text-acf-grey">
          Elige quién eres arriba para apuntarte.
        </p>
      ) : null}

      {error ? (
        <p className="text-row text-acf-red">
          No se pudo guardar: {error}
        </p>
      ) : null}

      <Tally answers={answers} chosenId={player?.id ?? null} />
    </div>
  );
}
