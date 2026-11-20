/**
 * The league's internal rules, summarised for the squad.
 *
 * Source: the Consell Esportiu del Garraf's own document for the 2026-2027
 * Lliga Comarcal de Futbol 7, written in Catalan. This file is a Spanish
 * summary of nine of its articles — not every clause, only the ones a player is
 * going to trip over during the season.
 *
 * Every `article` below was read from the document itself, and every `text` is a
 * paraphrase of the clause it cites, so the two never drift apart in silence. If
 * a rule is not in that document it is not in this file; when the summary and
 * the original disagree, the original wins, and both surfaces that render this
 * data say so out loud.
 *
 * The order is the document's own order, which is why Art. 8 comes before
 * nothing and Art. 4.9 sits after Art. 4.8: the page reads like the PDF, and the
 * dashboard card rotates through the same list.
 */
export const OFFICIAL_PDF =
  "https://www.cegarraf.cat/wp-content/uploads/CEG-Reglament-Intern-Lliga-Futbol-7-2026-2027.pdf";

export const RULES = [
  {
    id: "copa",
    article: "Art. 1.12",
    title: "La Copa va en paralelo",
    text: "La Copa se juega a la vez que la Liga: una primera fase en forma de liguilla de grupos y después una fase final a eliminación directa.",
  },
  {
    id: "acta",
    article: "Art. 4.2",
    title: "Catorce en el acta",
    text: "Al acta entran como máximo 14 jugadores, y solo hasta el descanso: cada uno presenta su ficha al árbitro en persona. Si ya ha empezado la segunda parte, no entra nadie más.",
  },
  {
    id: "minuto",
    article: "Art. 4.3",
    title: "Un minuto y se cierra",
    text: "No hay tiempo de espera: pasado un minuto de la hora prevista se cierra el acta, el partido se da por perdido 5-0 y el equipo pierde un punto en la clasificación.",
  },
  {
    id: "cinco",
    article: "Art. 4.5",
    title: "Cinco para empezar",
    text: "Para poder iniciar el partido hacen falta un mínimo de 5 jugadores.",
  },
  {
    id: "ausencias",
    article: "Art. 4.8",
    title: "Tres ausencias y fuera",
    text: "No presentarse a tres partidos, de Liga o de Copa, supone la expulsión de todas las competiciones: sin jugar la temporada siguiente y sin recuperar el depósito.",
  },
  {
    id: "dorsal",
    article: "Art. 4.9",
    title: "El dorsal tiene que cuadrar",
    text: "La equipación va numerada y cada dorsal tiene que coincidir con el que figura en el acta; si no, el árbitro lo anota y el equipo se lleva un apercibimiento, y si reincide, un punto menos.",
  },
  {
    id: "carnet",
    article: "Art. 7.2",
    title: "Sin carnet no se juega",
    text: "Nadie participa sin haber tramitado el carnet de deportista: es el seguro de la competición y es obligatorio para todos los jugadores.",
  },
  {
    id: "club",
    article: "Art. 7.4",
    title: "No se cambia de club",
    text: "Un jugador no puede cambiar de equipo durante la temporada, ni en Liga ni en Copa.",
  },
  {
    // Art. 8.11 lists the minor offences; the cycle is item 5 of that list, and
    // Art. 9 develops it (the league cycle is served in a league match, and two
    // yellows in the same match do not count towards it). The article below is
    // the one that states the cycle itself, so it is the one cited.
    id: "amarillas",
    article: "Art. 8.11.5",
    title: "Cuatro amarillas, un partido",
    text: "Cuatro amarillas acumuladas son un partido de sanción, y el contador arranca de nuevo con un ciclo continuo de tres.",
  },
];
