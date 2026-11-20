/**
 * The league's internal rules, in the squad's own voice.
 *
 * Source: the Consell Esportiu del Garraf's own document for the 2026-2027
 * Lliga Comarcal de Futbol 7, written in Catalan. This file is a Spanish
 * summary of nine of its articles — not every clause, only the ones a player is
 * going to trip over during the season.
 *
 * Every `article` below was read from the document itself, and every `text`
 * keeps that clause's facts — the numbers, the matchdays, what is allowed and
 * what is not — while saying them the way a team-mate would say them: short, in
 * the second person, and with the consequence in the same breath ("hacer esto
 * tiene esta consecuencia"). The voice is the only thing that moved; a rule is
 * exactly as true as it was before the rewrite. If a rule is not in that
 * document it is not in this file, and when the summary and the original
 * disagree the original wins — `/reglamento` says that out loud.
 *
 * The order is the document's own order, which is why Art. 8 comes before
 * nothing and Art. 4.9 sits after Art. 4.8: the page reads like the PDF, and the
 * dashboard card steps through the same list, one rule at a time.
 */
export const OFFICIAL_PDF =
  "https://www.cegarraf.cat/wp-content/uploads/CEG-Reglament-Intern-Lliga-Futbol-7-2026-2027.pdf";

export const RULES = [
  {
    id: "copa",
    article: "Art. 1.12",
    title: "La Copa va en paralelo",
    text: "La Copa va a la vez que la Liga: primero una liguilla de grupos y después eliminatorias directas. Dos competiciones a la vez.",
  },
  {
    id: "acta",
    article: "Art. 4.2",
    title: "Catorce en el acta",
    text: "En el acta entran catorce como mucho, y cada uno le enseña su ficha al árbitro en persona. Todo eso, hasta el descanso: si ya ha empezado la segunda parte, no entra nadie. Llegas tarde y te quedas mirando.",
  },
  {
    id: "minuto",
    article: "Art. 4.3",
    title: "Un minuto y se cierra",
    text: "No hay margen de espera. Pasado un minuto de la hora prevista, el acta se cierra: partido perdido 5-0 y un punto menos en la clasificación. Llega a la hora.",
  },
  {
    id: "cinco",
    article: "Art. 4.5",
    title: "Cinco para empezar",
    text: "Para que empiece el partido hacen falta cinco jugadores, ni uno menos. Con cuatro no hay partido.",
  },
  {
    id: "ausencias",
    article: "Art. 4.8",
    title: "Tres ausencias y fuera",
    text: "Tres plantones, de Liga o de Copa, y fuera de todas las competiciones: no juegas la temporada siguiente y no recuperas el depósito.",
  },
  {
    id: "dorsal",
    article: "Art. 4.9",
    title: "El dorsal tiene que cuadrar",
    text: "Camiseta numerada y el dorsal tiene que ser el que pone en el acta. Si no cuadra, el árbitro lo apunta y el equipo se lleva un apercibimiento; si vuelve a pasar, un punto menos.",
  },
  {
    id: "carnet",
    article: "Art. 7.2",
    title: "Sin carnet no se juega",
    text: "Sin carnet de deportista no juega nadie. No es un trámite del club: es el seguro de la competición y es obligatorio para todos.",
  },
  {
    id: "club",
    article: "Art. 7.4",
    title: "No se cambia de club",
    text: "Nadie cambia de equipo a mitad de temporada. Ni en Liga ni en Copa: donde empiezas, acabas.",
  },
  {
    // Art. 8.11 lists the minor offences; the cycle is item 5 of that list, and
    // Art. 9 develops it (the league cycle is served in a league match, and two
    // yellows in the same match do not count towards it). The article below is
    // the one that states the cycle itself, so it is the one cited.
    id: "amarillas",
    article: "Art. 8.11.5",
    title: "Cuatro amarillas, un partido",
    text: "Cuatro amarillas y te pierdes un partido. Después el contador vuelve a arrancar, con un ciclo continuo de tres.",
  },
];
