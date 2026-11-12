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
  draw: { letter: "E", className: "bg-acf-grey text-acf-dark" },
  loss: { letter: "D", className: "border border-acf-line bg-acf-dark text-acf-grey" },
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
        <ul className="flex flex-col gap-2 p-4">
          {results.map((fixture) => {
            const opponent = opponentOf(fixture);
            const score = clubScore(fixture);
            const tone = RESULT_TONE[resultOf(fixture)] ?? RESULT_TONE.draw;

            return (
              <li
                key={`${fixture.competitionKey}-${fixture.matchday}`}
                className="flex items-center gap-2 border border-acf-line bg-acf-dark/60 px-2.5 py-2 clip-edge"
              >
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center text-[10px] font-bold ${tone.className}`}
                >
                  {tone.letter}
                </span>
                <Crest slug={opponent.slug} size="sm" />
                <span className="min-w-0 flex-1">
                  <span
                    title={teamName(opponent.slug)}
                    className="block truncate text-[10px] font-bold uppercase text-acf-snow/80"
                  >
                    {teamName(opponent.slug)}
                  </span>
                  <span className="block text-[9px] uppercase tracking-[0.15em] text-acf-grey">
                    {fixtureDateLabel(fixture)}
                  </span>
                </span>
                <span className="whitespace-nowrap font-display text-lg leading-none tabular-nums text-white">
                  {score.own}
                  <span className="mx-0.5 text-acf-grey">–</span>
                  {score.rival}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="p-5 text-sm text-acf-grey">
          La fuente oficial todavía no publica ningún partido jugado.
        </p>
      )}
    </Card>
  );
}
