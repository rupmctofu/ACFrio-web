import { Activity } from "lucide-react";
import {
  clubScore,
  fixtureDateLabel,
  opponentOf,
  recentResults,
  resultOf,
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
                className="flex items-center gap-2.5 rounded-tile bg-acf-panel-light/70 px-3 py-2.5"
              >
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${tone.className}`}
                >
                  {tone.letter}
                </span>
                <Crest slug={opponent.slug} size="sm" />
                <span className="min-w-0 flex-1">
                  <span
                    title={teamName(opponent.slug)}
                    className="block truncate text-[10px] font-bold uppercase tracking-[0.06em] text-acf-snow/80"
                  >
                    {teamName(opponent.slug)}
                  </span>
                  <span className="mt-0.5 block text-[8px] font-semibold uppercase tracking-[0.18em] text-acf-dim">
                    {fixtureDateLabel(fixture)}
                  </span>
                </span>
                <span className="whitespace-nowrap font-display text-xl leading-none tabular-nums text-white">
                  {score.own}
                  <span className="mx-1 text-acf-dim">–</span>
                  {score.rival}
                </span>
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
