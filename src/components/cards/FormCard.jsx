import { Activity } from "lucide-react";
import {
  CLUB_SLUG,
  clubScore,
  fixtureDateLabel,
  opponentOf,
  recentResults,
  resultOf,
  teamFullName,
  teamName,
} from "../../data/competition";
import Card from "./Card.jsx";
import { Crest } from "./Crest.jsx";

const RESULT_TONE = {
  win: { letter: "V", className: "bg-acf-red text-white" },
  draw: { letter: "E", className: "bg-white/10 text-white" },
  loss: { letter: "D", className: "border border-acf-line text-acf-grey" },
};

/** The club's last three played results: real scores, one chip each. */
export default function FormCard({ className = "" }) {
  const results = recentResults(3);

  return (
    <Card
      title="Forma"
      hint={results.length ? `Últimos ${results.length} partidos jugados` : "Sin partidos jugados"}
      icon={Activity}
      className={className}
    >
      {results.length ? (
        <ul className="flex flex-col gap-2 px-5 pb-5 pt-1">
          {results.map((fixture) => {
            const opponent = opponentOf(fixture);
            const score = clubScore(fixture);
            const tone = RESULT_TONE[resultOf(fixture)] ?? RESULT_TONE.draw;

            return (
              <li
                key={`${fixture.competitionKey}-${fixture.matchday}`}
                className="rounded-tile bg-acf-panel-light/70 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    title={teamFullName(opponent.slug)}
                    className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.06em] text-acf-snow/80"
                  >
                    {teamName(opponent.slug)}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-extrabold ${tone.className}`}
                    >
                      {tone.letter}
                    </span>
                    <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-acf-dim">
                      {fixtureDateLabel(fixture)}
                    </span>
                  </span>
                </div>

                {/* Rival on the left, ours on the right, so the score reads in crest order.
                    Equal outer columns keep the score centred. */}
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="flex justify-start">
                    <Crest slug={opponent.slug} size="sm" />
                  </div>
                  <span className="whitespace-nowrap font-display text-xl leading-none tabular-nums text-white">
                    {score.rival}
                    <span className="mx-1 text-acf-dim">–</span>
                    {score.own}
                  </span>
                  <div className="flex justify-end">
                    <Crest slug={CLUB_SLUG} size="sm" />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="px-5 py-4 text-sm text-acf-grey">
          La fuente oficial todavía no publica ningún partido jugado.
        </p>
      )}
    </Card>
  );
}
