/**
 * Headlines derived from verified data: the official tables, the club's own
 * record and the synced calendar. They recompute on every sync, so the ticker
 * tracks the season instead of repeating static copy. Each item is still a
 * joke in tone, but every figure in it is real; anything the data cannot back
 * is simply not generated.
 */
import {
  clubRow,
  clubSide,
  fixtureDateLabel,
  fixtureTimeLabel,
  league,
  lastFixture,
  nextFixture,
  opponentOf,
  recentResults,
  resultOf,
  teamName,
} from "./competition";
import { cards, perPlayerAttendance, recordedGoalsIn, scorers, totalRecordedGoals } from "./club-record";

const list = (names) =>
  names.length <= 1 ? names[0] : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;

const RESULT_WORD = { win: "victoria", draw: "empate", loss: "derrota" };
const RESULT_LINE = { win: "Victoria", draw: "Empate", loss: "Derrota" };

export function derivedNews() {
  const items = [];
  const own = clubRow(league);
  const leader = league.table[0];
  const next = nextFixture();

  if (own && leader) {
    items.push({
      tag: "Tabla",
      text: `El AC FRÍO es ${own.rank}º: ${own.points} punto${own.points === 1 ? "" : "s"}, ${own.won}-${own.drawn}-${own.lost} y ${own.goalsFor}-${own.goalsAgainst}.`,
    });
    items.push({
      tag: "Tabla",
      text: `"La tabla miente", dicen desde el ${own.rank}º puesto.`,
    });
    if (leader.slug !== own.slug) {
      items.push({
        tag: "Tabla",
        text: `${leader.name} manda con ${leader.points}. A ${Math.max(leader.points - own.points, 0)} del liderato.`,
      });
    }
  }

  const scorersList = scorers();
  const top = scorersList[0];
  if (top && own) {
    const rest = scorersList.slice(1).map((entry) => `${entry.player} (${entry.goals})`);
    items.push({
      tag: "Goles",
      text: `${top.player} manda en goles: ${top.goals}${rest.length ? `. Le siguen ${list(rest)}` : ""}.`,
    });
    items.push({
      tag: "Goles",
      /*
       * The record is cumulative for the season, so the number that has to sit
       * in front of the names is the record's own total, not the league table's
       * goalsFor: since the cup started those two count different things. The
       * team-total line above still quotes the league table, which is exactly
       * what it means to quote.
       */
      text: `${totalRecordedGoals()} goles con firma: ${list(scorersList.map((entry) => entry.player))}. ${recordedGoalsIn("league")} en liga y ${recordedGoalsIn("cup")} en copa.`,
    });
  }

  const cardList = cards();
  if (cardList.length) {
    items.push({
      tag: "Árbitros",
      text: `Amarillas: ${list(cardList.map((entry) => entry.player))}. El colegiado ya nos conoce.`,
    });
  }

  if (next) {
    const opponent = opponentOf(next);
    items.push({
      tag: "Calendario",
      text: `Próximo: ${teamName(opponent.slug)}, ${fixtureDateLabel(next)} a las ${fixtureTimeLabel(next)}.`,
    });
  }

  if (own) {
    const playedMatchdays = league.fixtures
      .filter((fixture) => fixture.status === "played" && clubSide(fixture) !== null)
      .map((fixture) => fixture.matchday);
    const scheduledMatchdays = league.fixtures
      .filter(
        (fixture) => fixture.status === "scheduled" && clubSide(fixture) !== null,
      )
      .map((fixture) => fixture.matchday);
    const restDays = [];
    if (playedMatchdays.length && scheduledMatchdays.length) {
      for (let day = Math.max(...playedMatchdays) + 1; day < Math.min(...scheduledMatchdays); day += 1) {
        restDays.push(day);
      }
    }
    if (restDays.length === 1) {
      items.push({
        tag: "Calendario",
        text: `La jornada ${restDays[0]} pasó sin nosotros. El cuerpo lo agradeció.`,
      });
    }

    const remaining = league.fixtures.filter(
      (fixture) => fixture.status === "scheduled" && clubSide(fixture) !== null,
    );
    if (remaining.length) {
      items.push({
        tag: "Calendario",
        text: `Quedan ${remaining.length} jornadas. La próxima, contra ${teamName(opponentOf(remaining[0]).slug)}.`,
      });
    }
  }

  /*
   * The last thing that happened to the squad, whichever competition it came
   * from: a cup match played in November is the latest result even though the
   * league table is further along. Everything printed here is the source's own
   * score and the source's own competition name; nothing is rounded, inferred
   * or dated by hand.
   */
  const recent = lastFixture();
  if (recent?.score) {
    items.push({
      tag: "Resultado",
      text: `${recent.competitionName}: ${teamName(recent.home.slug)} ${recent.score.home}-${recent.score.away} ${teamName(recent.away.slug)}. ${RESULT_LINE[resultOf(recent)]}, sin posibilidad de apelación.`,
    });

    /*
     * The form reads the club's last three played fixtures across competitions.
     * It used to walk the league matchdays one by one, which silently stopped
     * counting the moment a cup match sat between two league ones — the exact
     * shape of the season now that the cup has started.
     */
    const words = recentResults(3)
      .map((fixture) => RESULT_WORD[resultOf(fixture)])
      .filter(Boolean);
    if (words.length) {
      items.push({
        tag: "Forma",
        text: `Últimos ${words.length}: ${list(words)}. Mejor recordarlos al revés.`,
      });
    }
  }

  const attendance = perPlayerAttendance();
  if (attendance.length) {
    const perfect = attendance.filter((entry) => entry.count === attendance[0].count);
    items.push({
      tag: "Vestuario",
      text: `${perfect.length} han venido a todos: ${list(perfect.map((entry) => entry.name))}. El premio, seguir viniendo.`,
    });
    const less = attendance.filter((entry) => entry.pct <= 34);
    if (less.length) {
      items.push({
        tag: "Excusas",
        text: `A ${list(less.map((entry) => entry.name))} se les ha visto una vez. El comité de excusas trabaja.`,
      });
    }
  }

  return items;
}
