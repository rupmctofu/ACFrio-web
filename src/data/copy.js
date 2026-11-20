/**
 * The club's voice, in one place.
 *
 * The restyling made the panel look like AC FRÍO; this file makes it talk like
 * the dressing room: dry, futbolero, a bit cheeky, never corporate (owner,
 * copy-voice S1). Every line here is safe to rewrite — the data layer feeds
 * names, results and fixtures elsewhere, and nothing in this file is data.
 *
 * Rules of the house, so the voice stays coherent as it grows:
 *   - facts stay plain; the joke goes in hints, empty states and side notes;
 *   - one quip per surface, never two side by side;
 *   - a quip may be dropped anywhere without breaking information.
 */

export const VOICE = {
  /** The recurring brand lines (S5): few, and always the same ones. */
  brand: {
    headline: "Más que un equipo",
    echo: "Menos que profesionales",
  },

  /** Section subtitles (S3): they ride under the data a card already states. */
  sections: {
    standings: "Los números no mienten. Nosotros a veces sí.",
    scorers: "Los que sí saben dónde está la portería.",
    form: "Resultados sin posibilidad de apelación.",
    nextMatch: "El fútbol nos debe una.",
    calendar: "Apunta la fecha. Las excusas no valen.",
    attendance: "Fichar es fácil. Venir ya es otra cosa.",
    gallery: "Pruebas gráficas de que estuvimos allí.",
    news: "El vestuario, tal cual.",
  },

  /** Empty and side states (S4). `fact` is information, `quip` is the voice. */
  states: {
    attendanceEmpty: "De momento, mucha intención y poca confirmación.",
    attendanceGoing: "Una preocupación menos para el delegado.",
    attendanceNone: "Hoy descansamos del tema. Con razón.",
    noScorers: "Aquí falta información. Y posiblemente algún gol.",
    noFixtures: "Sin partido no hay excusas. ¿Qué hacemos ahora?",
    noResults: "Todavía no hay números. Las leyendas tardan en escribirse.",
  },

  /**
   * The X on your own pill (S3, S4). It replaces the old "Cambiar planes"
   * button: withdrawing is an answer, not a settings panel.
   */
  buttons: {
    withdraw: "Quitarme",
  },
};
