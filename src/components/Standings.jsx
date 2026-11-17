import { BarChart3 } from "lucide-react";
import {
  CLUB_SLUG,
  leagueTable,
  teamFullName,
  teamName,
} from "../data/competition";
import Card from "./cards/Card.jsx";
import { VOICE } from "../data/copy.js";
import { Crest } from "./cards/Crest.jsx";

/* Micro-label of the header row: the smallest size that still reads at ~300px. */
const HEAD_CELL =
  "py-2.5 text-micro font-semibold uppercase tracking-[0.12em] text-acf-dim";
/* Same gutter shift as the figures, so header and body columns stay identical. */
const HEAD_GUTTER = "px-0.5 @min-[21rem]:px-1";
/* One figure of the row: one size up from before, tabular so columns align.
   In the narrow card (below the goal-difference threshold) the gutter between
   figures tightens, which is what the team names need to stay readable. */
const FIGURE =
  "px-0.5 py-3 text-center text-figure tabular-nums text-acf-snow/60 @min-[21rem]:px-1";
/*
 * Goal difference is derivable from the goals column (GF:GC), so it is the one
 * column that is dropped first. The card sits in a 4/12 column on desktop and
 * full width everywhere else, so the decision is made from the card's own
 * width, not the viewport's: below 21rem there is no room for it.
 */
const GOAL_DIFF_CELL = "hidden @min-[21rem]:table-cell";

function Row({ row }) {
  const isAcf = row.slug === CLUB_SLUG;
  const fullName = teamFullName(row.slug);

  return (
    <tr
      className={`border-t border-acf-line-soft transition-colors ${
        isAcf ? "bg-acf-red/[0.16]" : "hover:bg-white/[0.03]"
      }`}
    >
      {/*
       * The club's own row carries a red bar against the left edge so it is
       * found before anything is read. An inset shadow on the first cell draws
       * it above the collapsed table borders, which a border on the row cannot.
       */}
      <td
        className={`w-7 py-3 pl-3 pr-1 text-center font-display text-lg leading-none tabular-nums ${
          isAcf
            ? "text-acf-red shadow-[inset_3px_0_0_var(--color-acf-red)]"
            : "text-acf-snow/40"
        }`}
      >
        {row.rank ?? "—"}
      </td>
      {/* `w-full max-w-0` keeps the name column from claiming its max-content
          width: the table then fits the card instead of scrolling sideways. */}
      <td className="w-full max-w-0 py-3 pr-1">
        <span className="flex items-center gap-2">
          <Crest slug={row.slug} size="sm" />
          <span
            title={fullName}
            className={`truncate text-row font-bold uppercase leading-none tracking-[0.04em] ${
              isAcf ? "text-white" : "text-acf-snow/80"
            }`}
          >
            {teamName(row.slug)}
          </span>
          {/* The short label is a display alias: the official name stays readable. */}
          <span className="sr-only">{fullName}</span>
        </span>
      </td>
      <td className={FIGURE}>{row.played}</td>
      <td className={FIGURE}>{row.won}</td>
      <td className={FIGURE}>{row.drawn}</td>
      <td className={FIGURE}>{row.lost}</td>
      <td className={`${FIGURE} whitespace-nowrap`}>
        {row.goalsFor}:{row.goalsAgainst}
      </td>
      <td className={`${FIGURE} ${GOAL_DIFF_CELL}`}>
        {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
      </td>
      {/* The points are the column the table is read for: Oswald and a size no
          other figure on the row reaches. The club's own points stay red. */}
      <td
        className={`w-14 py-2.5 pl-2 pr-3 text-right font-display text-[30px] font-medium leading-none tabular-nums ${
          isAcf ? "text-acf-red" : "text-white"
        }`}
      >
        {row.points}
      </td>
    </tr>
  );
}

/** The real 3ª Divisió Grup B table, as a card in the home grid. */
export default function Standings({ className = "" }) {
  const { competition, rows, hasResults } = leagueTable();

  return (
    <Card
      id="clasificacion"
      title="Clasificación"
      hint={competition?.name ? `${competition.name} · ${VOICE.sections.standings}` : VOICE.sections.standings}
      icon={BarChart3}
      className={className}
      bodyClassName="flex flex-col"
    >
      <div className="@container overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-acf-line">
              <th className={`${HEAD_CELL} w-7 pl-3 pr-1 text-center`}>#</th>
              <th className={`${HEAD_CELL} text-left`}>Equipo</th>
              <th className={`${HEAD_CELL} ${HEAD_GUTTER} text-center`}>PJ</th>
              <th className={`${HEAD_CELL} ${HEAD_GUTTER} text-center`}>G</th>
              <th className={`${HEAD_CELL} ${HEAD_GUTTER} text-center`}>E</th>
              <th className={`${HEAD_CELL} ${HEAD_GUTTER} text-center`}>P</th>
              <th className={`${HEAD_CELL} ${HEAD_GUTTER} text-center`}>GF:GC</th>
              <th className={`${HEAD_CELL} ${HEAD_GUTTER} text-center ${GOAL_DIFF_CELL}`}>DG</th>
              <th className={`${HEAD_CELL} w-14 pl-2 pr-3 text-right`}>Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <Row key={row.slug} row={row} />
            ))}
          </tbody>
        </table>
      </div>

      {/* The points rule is what the reader already knows: only the missing-results
          notice carries information, so the footnote appears only in that case. */}
      {hasResults ? null : (
        <p className="mt-auto border-t border-acf-line-soft px-6 py-3.5 text-micro font-semibold uppercase tracking-[0.16em] text-acf-dim">
          La fuente oficial todavía no ha publicado resultados.
        </p>
      )}
    </Card>
  );
}
