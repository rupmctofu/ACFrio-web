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
  resultOf,
  teamName,
} from "./competition";
import { cards, perPlayerAttendance, scorers } from "./club-record";

const longDate = (iso) =>
  new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date(`${iso}T12:00:00`),
  );

const list = (names) =>
  names.length <= 1 ? names[0] : `${names.slice(0, -1).join(", ")} y ${names.at(-1)}`;

const RESULT_WORD = { win: "victoria", draw: "empate", loss: "derrota" };

export function derivedNews() {
  const items = [];
  const own = clubRow(league);
  const leader = league.table[0];
  const next = nextFixture();

  if (own && leader) {
    items.push({
      tag: "Tabla",
      text: `El AC FRÍO es ${own.rank}º con ${own.points} punto${own.points === 1 ? "" : "s"} (${own.won}-${own.drawn}-${own.lost}, ${own.goalsFor}-${own.goalsAgainst}).`,
    });
    items.push({
      tag: "Tabla",
      text: `"La tabla miente", declaran desde el ${own.rank}º puesto con ${own.points} punto${own.points === 1 ? "" : "s"}.`,
    });
    if (leader.slug !== own.slug) {
      items.push({
        tag: "Tabla",
        text: `${leader.name} manda con ${leader.points} puntos. A ${Math.max(leader.points - own.points, 0)} del liderato, y el café es gratis.`,
      });
    }
  }

  const scorersList = scorers();
  const top = scorersList[0];
  if (top && own) {
    const rest = scorersList.slice(1).map((entry) => `${entry.player} (${entry.goals})`);
    items.push({
      tag: "Goles",
      text: `${top.player} lidera la puntería con ${top.goals} gol${top.goals === 1 ? "" : "es"}${rest.length ? `; le siguen ${list(rest)}` : ""}.`,
    });
    items.push({
      tag: "Goles",
      text: `Los ${own.goalsFor} goles del equipo llevan firma: ${list(scorersList.map((entry) => entry.player))}.`,
    });
  }

  const cardList = cards();
  if (cardList.length) {
    items.push({
      tag: "Árbitros",
      text: `Amarillas del frío: ${list(cardList.map((entry) => `${entry.player} (jornada ${entry.yellowAt})`))}. El colegiado ya sabe cómo protestamos.`,
    });
  }

  if (next) {
    const opponent = opponentOf(next);
    items.push({
      tag: "Calendario",
      text: `Próxima parada: ${next.competitionName} contra ${teamName(opponent.slug)}, ${fixtureDateLabel(next)} a las ${fixtureTimeLabel(next)} en ${next.field ?? "camp por confirmar"}.`,
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
        text: `La jornada ${restDays[0]} pasó sin nosotros: descanso programado, y el cuerpo lo agradeció.`,
      });
    }

    const remaining = league.fixtures.filter(
      (fixture) => fixture.status === "scheduled" && clubSide(fixture) !== null,
    );
    if (remaining.length) {
      items.push({
        tag: "Calendario",
        text: `Quedan ${remaining.length} jornadas de liga. La primera, contra ${teamName(opponentOf(remaining[0]).slug)} el ${longDate(remaining[0].date)}.`,
      });
    }
  }

  const recent = lastFixture();
  if (recent) {
    const words = [];
    let cursor = recent;
    while (cursor && words.length < 3) {
      const word = RESULT_WORD[resultOf(cursor)];
      if (!word) break;
      words.push(word);
      const index = league.fixtures.findIndex(
        (fixture) =>
          fixture.matchday === cursor.matchday - 1 && clubSide(fixture) !== null,
      );
      cursor = index >= 0 ? league.fixtures[index] : null;
    }
    items.push({
      tag: "Forma",
      text: `Últimos ${words.length} partidos: ${list(words)}. El vestuario prefiere recordarlo al revés.`,
    });
  }

  const attendance = perPlayerAttendance();
  if (attendance.length) {
    const perfect = attendance.filter((entry) => entry.count === attendance[0].count);
    items.push({
      tag: "Vestuario",
      text: `${perfect.length} jugadores han venido a todos los partidos: ${list(perfect.map((entry) => entry.name))}. El premio: seguir viniendo.`,
    });
    const less = attendance.filter((entry) => entry.pct <= 34);
    if (less.length) {
      items.push({
        tag: "Excusas",
        text: `A ${list(less.map((entry) => entry.name))} solo se les ha visto una vez. El comité de excusas ya está trabajando.`,
      });
    }
  }

  return items;
}
