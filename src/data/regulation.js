/**
 * The whole of the Consell Esportiu del Garraf's internal regulation for the
 * 2026-2027 Liga Comarcal de Fútbol 7, in Spanish.
 *
 * Source: `CEG-Reglament-Intern-Lliga-Futbol-7-2026-2027.pdf`, the official
 * document, published in Catalan. This file is a transcription, not a summary:
 * the preamble and every one of the nine articles, clause by clause, in the
 * document's own order, with the document's own numbers. Nothing was merged,
 * split, reordered, dropped or added, and no figure was rounded — `100€`,
 * `310€`, `62€`, `3,00€`, `6€`, `44€`, `22:30`, the 14-hour deadline for
 * requesting an adjournment, the 15 minutes before kick-off that the team sheet
 * is due, `31/12/26`, `19 de abril de 2027` all read exactly as the PDF prints
 * them. An amount the original writes without a currency symbol is written here
 * without one too.
 *
 * Two things in the source are kept as they arrived rather than tidied:
 *
 * - P3 carries a full stop where a comma belongs ("… el formulario de
 *   preinscripción. con el correspondiente pago …"), and P8 arrives without its
 *   final full stop. Both are the PDF's, and a rule is exactly as true as it was
 *   before the translation touched it.
 * - Art. 4.14's clause is followed in the PDF by the next section's heading
 *   ("A LA FINALITZACIÓ DEL PARTIT. (Art. 5)"), which the extraction glued to the
 *   end of that clause. The heading belongs to the article, not to the clause, so
 *   it is the title of Art. 5 here and Art. 4.14 ends where its rule ends.
 *
 * The Catalan original is not versioned; the translation is what ships, and the
 * official PDF stays linked on `/reglamento`, which says out loud that the
 * original wins if the two ever disagree.
 */

/** The document's opening block, which belongs to no article. */
export const PREAMBLE = {
  title: "Disposiciones iniciales",
  items: [
    {
      ref: "P1",
      text: "El Consell Esportiu del Garraf organiza la 20ª edición de la Liga Comarcal de Fútbol-7. Los equipos estarán formados por jugadores mayores de 16 años, de los cuales, los que sean menores de 18 deberán presentar una autorización paterna/materna para poder participar en el campeonato.",
    },
    {
      ref: "P2",
      text: "El periodo de preinscripción, para equipos de nueva incorporación, será hasta el día 6 de septiembre de 2026.",
    },
    {
      ref: "P3",
      text: "La preinscripción tendrá validez en el momento en que se envíe, telemáticamente, el formulario de preinscripción. con el correspondiente pago de 100€ en concepto de depósito.",
    },
    {
      ref: "P4",
      text: "En el supuesto de que un equipo gane una de las plazas vacantes y renuncie a la misma, no se devolverá el depósito.",
    },
    {
      ref: "P5",
      text: "En caso de no acceder a una de las plazas disponibles se devolverá la totalidad del depósito el mismo día del sorteo.",
    },
    {
      ref: "P6",
      text: "Este depósito será devuelto cuando el equipo no renueve su inscripción y no tenga ninguna deuda económica con la organización.",
    },
    {
      ref: "P7",
      text: "El periodo de inscripción, para equipos participantes en la temporada anterior, será hasta el día 6 de septiembre de 2026.",
    },
    {
      ref: "P8",
      text: "La inscripción tendrá validez en el momento en que se envíe, telemáticamente, el formulario de inscripción con el correspondiente pago de 310€",
    },
    {
      ref: "P9",
      text: "Todos los jugadores que quieran participar en esta competición deberán tramitar personalmente el CARNET DE DEPORTISTA. La cuota del Carnet es de 62€ para la temporada 2026/2027. Las indicaciones para realizar este trámite se pueden consultar en nuestra web: https://www.cegarraf.cat/tramits/carnet-desportista/",
    },
    {
      ref: "P10",
      text: "En el momento en que se haya validado la inscripción del equipo os enviaremos, vía mail, un enlace web, con vuestro nombre de usuario y contraseña para poder inscribir a vuestros jugadores (únicamente los que dispongan del CARNET DE DEPORTISTA 26/27).",
    },
  ],
};

/** The nine articles, art. 1 to art. 9, sixty-one clauses in all. */
export const REGULATION = [
  {
    n: 1,
    title: "La competición",
    items: [
      {
        ref: "1.1",
        text: "La competición está formada por 3 divisiones (Primera, Segunda y Tercera) que disputarán las respectivas categorías en formato liga regular durante toda la temporada.",
      },
      {
        ref: "1.2",
        text: "Los días de competición serán, inicialmente, los lunes, martes, miércoles y jueves a las 22:30 horas. Los calendarios estarán colgados en la web del Consell Esportiu del Garraf (www.cegarraf.cat).",
      },
      {
        ref: "1.3",
        text: "La Primera división jugará preferentemente los lunes, la Segunda los martes y la Tercera los miércoles y jueves. Las jornadas de recuperación se programarán en función de la disponibilidad de las instalaciones y podrían no coincidir con los días habituales de cada categoría.",
      },
      {
        ref: "1.4",
        text: "Estas divisiones quedarán fijas para las siguientes temporadas.",
      },
      {
        ref: "1.5",
        text: "1ª División (Liga regular): los dos últimos equipos clasificados pierden la categoría y descienden a Segunda División.",
      },
      {
        ref: "1.6",
        text: "2ª División (Liga regular): los dos primeros clasificados ascienden a Primera División, mientras que los dos últimos descienden a Tercera División.",
      },
      {
        ref: "1.7",
        text: "3ª División (Liga regular + Play-off): los dos primeros clasificados ascenderán a Segunda División, los equipos clasificados entre los puestos tercero y octavo mantienen la categoría, mientras que el resto de equipos descienden a la nueva Cuarta División.",
      },
      {
        ref: "1.8",
        text: "Bajas en 1ª División: en caso de desaparición de algún equipo, su plaza se cubre con equipos de Segunda División clasificados justo después de los de puestos de ascenso.",
      },
      {
        ref: "1.9",
        text: "Bajas en 2ª División: las vacantes por desaparición de equipos se cubren con equipos de Tercera División clasificados a continuación de los puestos de ascenso.",
      },
      {
        ref: "1.10",
        text: "Bajas en 3ª División: las plazas de los equipos que desaparezcan se cubren con equipos de la nueva categoría.",
      },
      {
        ref: "1.11",
        text: "Para mantener la plaza, en caso de cambiar el responsable del equipo, será obligatorio que continúen en el equipo un mínimo de 5 jugadores de la temporada anterior.",
      },
      {
        ref: "1.12",
        text: "La competición de Copa se jugará en paralelo a la Liga, con una 1ª fase en formato liguilla de grupos y una fase final eliminatoria.",
      },
      {
        ref: "1.13",
        text: "Si un equipo se retira o es expulsado, implicará sacar de la clasificación los resultados que haya conseguido con el resto de equipos y no se le hará la devolución del depósito. Si este hecho se produce durante la segunda vuelta solo se sacarán los resultados de esta.",
      },
      {
        ref: "1.14",
        text: "No podrá participar ningún jugador que no tenga la ficha reglamentaria, entregada por el CEG. En caso de pérdida de una ficha, para hacer una nueva se debe pagar el importe de 3,00€.",
      },
      {
        ref: "1.15",
        text: "No se puede jugar con equipos diferentes durante la misma temporada.",
      },
    ],
  },
  {
    n: 2,
    title: "Partidos aplazados",
    items: [
      {
        ref: "2.1",
        text: "Para aplazar un partido, el equipo solicitante, de acuerdo con el equipo contrario, deberá rellenar el formulario correspondiente* antes de las 14 horas del mismo día del partido. El aplazamiento tendrá un gasto económico de 6€ que se hará efectivo en el momento de enviar el formulario. https://www.cegarraf.cat/esport-popular/sollicitud-dajornament-futbol-7-lleure/",
      },
      {
        ref: "2.1 bis",
        text: "Este trámite solo lo podrá realizar la persona que disponga de ficha de delegado/a o entrenador/a y cada equipo podrá solicitar un máximo de 2 aplazamientos por temporada.",
      },
      {
        ref: "2.2",
        text: "Podrán jugar el partido aplazado todos aquellos deportistas que tuvieran la ficha en la fecha inicial del partido.",
      },
      {
        ref: "2.3",
        text: "Si en el momento del partido hubiera algún jugador sancionado cumpliría la sanción durante este partido.",
      },
      {
        ref: "2.4",
        text: "La fecha y la hora del partido aplazado las fijará el Consell Esportiu del Garraf, dependiendo de la disponibilidad de las instalaciones.",
      },
    ],
  },
  {
    n: 3,
    title: "Reglamento",
    items: [
      {
        ref: "3.1",
        text: "Se utilizará el reglamento oficial de la FCF para fútbol 7 con modificaciones respecto a las sanciones.",
      },
      {
        ref: "3.2",
        text: "Esta competición queda reservada a deportistas no federados en fútbol 11.",
      },
      {
        ref: "3.3",
        text: "El equipo que no cumpla esta norma y disponga en su equipo de algún jugador federado, perderá todos los partidos con alineación de este jugador y será sancionado con 1 punto por partido, en la clasificación general. Un jugador tendrá la consideración de federado a partir de la fecha en que conste inscrito en un acta de cualquier competición de Fútbol 11 organizada por la FCF. Si el jugador federado obtiene la baja federativa antes del 31/12/26 podría formar parte de cualquier equipo y jugar a partir del inicio de la segunda vuelta. La organización solo comprobará si un jugador tiene la consideración de federado cuando el equipo contrario presente una reclamación en un plazo no superior a los siete días posteriores a la disputa del encuentro.",
      },
    ],
  },
  {
    n: 4,
    title: "Al inicio del partido",
    items: [
      {
        ref: "4.1",
        text: "El responsable de cada equipo deberá presentar las fichas de los jugadores presentes, al árbitro del partido, 15 minutos antes del inicio del mismo.",
      },
      {
        ref: "4.2",
        text: "Se podrán incluir un máximo de 14 jugadores en el acta hasta el descanso, siempre y cuando presenten personalmente su ficha al árbitro. Una vez comenzada la segunda parte, ya no se podrá añadir ningún jugador más.",
      },
      {
        ref: "4.3",
        text: "No habrá tiempo de espera, una vez haya pasado un minuto sobre la hora prevista para el inicio del partido se cerrará el acta dando el partido por perdido (5-0) a aquel equipo que no hubiera presentado las fichas mínimas para poder jugar o cuyos jugadores no estén sobre el terreno de juego en disposición de poder comenzar el partido. Este será sancionado con la pérdida de un punto en la clasificación general.",
      },
      {
        ref: "4.4",
        text: "El hecho de no presentarse a un partido supondrá para el equipo abonar la totalidad del gasto de arbitraje (44€). La cantidad se deberá abonar obligatoriamente antes de la disputa del siguiente partido.",
      },
      {
        ref: "4.5",
        text: "Hará falta un mínimo de 5 jugadores para poder iniciar el partido.",
      },
      {
        ref: "4.6",
        text: "El hecho de no presentarse, presentarse con menos de 5 jugadores al inicio del partido o alinear a un jugador sin ficha, conlleva la pérdida del partido por el resultado de 5 a 0 y un punto de sanción en la clasificación general. No presentarse a uno de los tres últimos partidos de liga o al último de la 1ª fase de Copa, también conllevará la pérdida del depósito.",
      },
      {
        ref: "4.7",
        text: "En caso de que un equipo, sea por el motivo que sea, quede con menos de 5 jugadores en el terreno de juego, el partido se dará por finalizado con el resultado mínimo de 5-0 en contra del equipo infractor. En caso de que en el momento de la finalización del partido, el resultado fuera superior a 5 goles a favor del equipo ganador, el resultado será el que consta en el acta del partido. Todos los goles realizados por el equipo infractor quedarán anulados. Y en caso de que un equipo se retire del partido el resultado será de 5-0 contra el equipo infractor pero en caso de que en el momento de la finalización del partido, el resultado fuera superior a 5 goles a favor del equipo ganador, el resultado será el que consta en el acta del partido. Todos los goles realizados por el equipo infractor quedarán anulados. La retirada del punto de sanción queda pendiente del comité de competición.",
      },
      {
        ref: "4.8",
        text: "No presentarse en tres partidos (Liga o Copa) supone la expulsión de todas las competiciones. Todos los equipos excluidos, por un motivo u otro, no podrán participar en la siguiente temporada y no tendrán derecho al retorno del depósito.",
      },
      {
        ref: "4.9",
        text: "Cada equipo llevará, obligatoriamente, una equipación numerada, que deberá coincidir con la reflejada en el acta. En caso contrario el árbitro anotará la incidencia y el equipo infractor será amonestado. En caso de reincidencia será sancionado con un punto en la clasificación.",
      },
      {
        ref: "4.10",
        text: "El equipo que actúa como visitante según el calendario es el encargado de cambiar de equipación en caso de coincidir.",
      },
      {
        ref: "4.11",
        text: "Cada uno de los equipos deberá presentar, como mínimo, un balón de fútbol-7 (talla 4), en condiciones óptimas para poder jugar, en caso contrario el árbitro anotará la incidencia y el equipo infractor será amonestado. En caso de reincidencia será sancionado con un punto en la clasificación.",
      },
      {
        ref: "4.12",
        text: "La Organización no se hace responsable de los posibles daños físicos, así como de las posibles pérdidas de material durante la competición.",
      },
      {
        ref: "4.13",
        text: "Cada equipo se hará responsable de los posibles daños que se puedan ocasionar en las instalaciones.",
      },
      {
        ref: "4.14",
        text: "Queda totalmente prohibido llevar relojes, gafas sin cinta elástica, así como cualquier objeto que pudiera ser peligroso para el resto de jugadores.",
      },
    ],
  },
  {
    n: 5,
    title: "Al final del partido",
    items: [
      {
        ref: "5.1",
        text: "El delegado o entrenador pasará a recoger las fichas de su equipo una vez finalizado el encuentro.",
      },
    ],
  },
  {
    n: 6,
    title: "Sustituciones",
    items: [
      {
        ref: "6.1",
        text: "No hay límite de sustituciones, se podrán hacer todas aquellas que sean necesarias.",
      },
      {
        ref: "6.2",
        text: "No hace falta avisar al árbitro, la única condición es realizarlas por la línea de medio campo, saliendo primero el jugador sustituido del terreno de juego.",
      },
      {
        ref: "6.3",
        text: "Procedimiento de la sustitución. Podrá realizarse una sustitución, esté o no el balón en juego. • Para reemplazar a un jugador, se deben cumplir los requisitos siguientes: el jugador debe retirarse del terreno de juego por la línea de medio campo, por la banda donde se encuentre el banquillo de su equipo, salvo en casos de lesión, en los cuales abandonará el campo por el punto más próximo, siempre que el partido esté interrumpido. • El sustituto no podrá acceder al terreno de juego hasta que el jugador sustituido no haya efectuado la salida. • El sustituto accederá al terreno de juego a través de la línea de medio campo, por la banda donde esté situado el banquillo de su equipo. Cualquier sustitución que no respete este procedimiento y conceda una ventaja al equipo infractor, tanto en defensa como en ataque, será penalizada con una amonestación (tarjeta amarilla) al jugador sustituto y un lanzamiento indirecto en favor del equipo adversario.",
      },
    ],
  },
  {
    n: 7,
    title: "Fichas",
    items: [
      {
        ref: "7.1",
        text: "La Organización pondrá a disposición de los equipos fichas personales. En caso de duda el árbitro podrá pedir cualquier documento oficial acreditativo para comprobar la identidad del jugador.",
      },
      {
        ref: "7.2",
        text: "Es obligatorio que todos los deportistas hayan tramitado el carnet de deportista (seguro) para participar en esta competición.",
      },
      {
        ref: "7.3",
        text: "Es obligatorio que cada equipo tenga un delegado que deberá tramitar la correspondiente ficha.",
      },
      {
        ref: "7.4",
        text: "Los jugadores no podrán cambiar de equipo durante la temporada (Liga y Copa).",
      },
      {
        ref: "7.5",
        text: "Los equipos podrán tramitar a lo largo de la temporada un máximo de 20 fichas de jugador, con fecha límite: 19 de abril de 2027.",
      },
      {
        ref: "7.6",
        text: "El árbitro recibirá y revisará personalmente las fichas de los jugadores presentes al inicio del partido y de aquellos que se incorporen antes del inicio de la segunda parte del mismo.",
      },
    ],
  },
  {
    n: 8,
    title: "Comité de competición",
    items: [
      {
        ref: "8.1",
        text: "El régimen disciplinario regulado en estas normas se entiende sin perjuicio de la responsabilidad civil o penal en que puedan incurrir las personas físicas y jurídicas afectadas.",
      },
      {
        ref: "8.2",
        text: "Las sanciones principales y accesorias que puedan imponerse reglamentariamente son las siguientes: a) A los jugadores, delegados y entrenadores: 1.- Inhabilitación a perpetuidad o temporal. 2.- Suspensión temporal. 3.- Apercibimiento. b) A los equipos: 1.- Expulsión del campeonato. 2.- Descuento de puntos en la clasificación. 3.- Pérdida del partido, eliminatoria o descalificación de la competición. 4.- Apercibimiento.",
      },
      {
        ref: "8.3",
        text: "El jugador que sea amonestado dos veces, durante el transcurso de una temporada, por faltas graves, será excluido de la competición por el resto de la misma (Liga y Copa).",
      },
      {
        ref: "8.3.1",
        text: "El equipo que acumule cuatro (4) sanciones por faltas graves y/o muy graves de sus jugadores, será excluido de la competición por el resto de la misma (Liga y Copa).",
      },
      {
        ref: "8.3.2",
        text: "El equipo que acumule tres impagos de la cuota de arbitraje será excluido de la competición (Liga y Copa) para el resto de la temporada.",
      },
      {
        ref: "8.4",
        text: "La suspensión podrá ser por un determinado número de partidos o bien por un periodo de tiempo.",
      },
      {
        ref: "8.5",
        text: "Al término de cada temporada, el jugador, entrenador o delegado suspendido podrá cambiar de club, pero los partidos o jornadas del periodo de tiempo de suspensión o inhabilitación que tenga pendientes, deberán cumplirse.",
      },
      {
        ref: "8.6",
        text: "En caso de la expulsión de tres jugadores de un mismo equipo, el partido en juego finalizará automáticamente, siendo el Comité de Competición el que deberá dictaminar el resultado final del partido.",
      },
      {
        ref: "8.7",
        text: "Son circunstancias atenuantes: 1.- Carencia de antecedentes en el historial deportivo. 2.- Haber procedido el culpable, por arrepentimiento espontáneo, a reparar o disminuir los efectos de la falta. 3.- Prestar colaboración o auxilio al esclarecimiento de los hechos que hayan dado lugar a una infracción.",
      },
      {
        ref: "8.8",
        text: "Son circunstancias agravantes: 1.- Cuando el autor de una falta ha sido sancionado en el curso de una misma temporada por otro hecho que tenga señalada una sanción igual o mayor, o por más de uno, si es inferior. 2.- Premeditación manifiesta. 3.- Abusar de la superioridad o emplear medios que debiliten la defensa. 4.- Cometer la infracción como espectador, teniendo licencia como jugador, entrenador o delegado. 5.- No dar colaboración o auxilio al esclarecimiento de los hechos que hayan dado lugar a una infracción.",
      },
      {
        ref: "8.9",
        text: "Serán causa muy grave, sancionadas con suspensión a perpetuidad: 1.- La agresión por parte de un jugador, técnico o delegado a los componentes del equipo arbitral, jugadores, al personal de las instalaciones o al público, originando con su acción lesión grave. 2.- El jugador que al rechazar la agresión de otro jugador actuara de forma análoga, originando con su acción lesión grave. 3.- La falta de veracidad en los datos reflejados en las licencias. 4.- El jugador que suscribiera ficha por 2 o más equipos. 5.- La realización de actos que provoquen la suspensión definitiva del partido o imposibiliten su comienzo. 6.- El quebrantamiento de sanción impuesta por falta grave.",
      },
      {
        ref: "8.10",
        text: "Las faltas graves serán sancionadas con suspensión de 4 a 12 partidos: 1.- Agredir a cualquier miembro del equipo arbitral, jugadores o público cuando no se derive ningún tipo de daño físico o lesión. De 10 a 12 partidos. 2.- El jugador que al rechazar la agresión de otro jugador actuara de forma análoga, cuando no se derive ningún tipo de daño físico o lesión. De 8 a 10 partidos. 3.- Dirigirse violentamente a cualquier miembro del equipo arbitral, jugadores o público. De 4 a 6 partidos. 4.- El que amenazara a un componente del equipo arbitral, jugadores o público, por causarle daño o tratara de intimidarlo. De 4 a 6 partidos. 5.- Alinearse en un partido mediante la ficha de otra persona. 4 partidos. (Sanción que se aplicará también al delegado del equipo).",
      },
      {
        ref: "8.11",
        text: "Las faltas leves serán sancionadas con suspensión temporal de 1 a 3 partidos: 1.- El que insultara a los componentes del equipo arbitral, delegados, entrenador, jugadores o público. 3 partidos. 2.- El que ofendiera a las personas mencionadas en el apartado 1, con expresiones o gestos de menosprecio. 2 partidos. 3.- La conducta antideportiva que pueda alterar la buena marcha de un partido o el normal desarrollo del juego. De 1 a 3 partidos. 4.- Protestar reiteradamente las decisiones arbitrales o intentar coaccionar al árbitro en la redacción del acta. 2 partidos. 5.- Por acumulación de 4 tarjetas amarillas, iniciándose un nuevo ciclo continuo de tres. 1 partido. 6.- 2 tarjetas amarillas en un mismo partido supondrá la expulsión del terreno de juego, y será sancionado con suspensión de un partido. 7.- Tarjeta roja directa, la expulsión directa del terreno de juego, y será sancionado con suspensión de un partido, salvo que el hecho fuera constitutivo de infracción de mayor gravedad. En el supuesto de que la tarjeta roja sea fruto del hecho de emplear juego peligroso, causante de daño que merme las facultades del jugador contrario y requiera asistencia médica, la sanción será de 2 a 4 partidos. 8.- Alinear a un jugador sin que este disponga de su correspondiente ficha conllevará la sanción de un partido tanto para el jugador como para el delegado del equipo. 9.- Cualquier jugador, entrenador o delegado que, una vez finalizado el partido y tanto en el interior como en el exterior de la instalación (incluidos los accesos y alrededores), intente o realice cualquier acción de intimidación, amenaza, insulto o agresión hacia el árbitro, será sancionado con el doble de partidos que marca el reglamento, hecho que podrá conllevar la exclusión definitiva de la competición de la persona implicada, de todo su equipo, o de ambos, sin perjuicio de las medidas legales que se puedan derivar.",
      },
    ],
  },
  {
    n: 9,
    title: "Sanciones",
    items: [
      {
        ref: "9",
        text: "Las sanciones, excepto aquellas que vienen dadas por acumulación de tarjetas amarillas, se cumplen en cualquier competición (Liga, Copa y Supercopa) según vengan programadas en el calendario. En la Liga, un ciclo de cuatro tarjetas amarillas comporta la suspensión por un partido, que se cumple siempre en un partido también de Liga, iniciándose a continuación un nuevo ciclo de tres tarjetas que comportará una nueva sanción. Si un jugador ve dos tarjetas amarillas en un mismo partido, y la consiguiente expulsión, estas amonestaciones no cuentan para el ciclo. En cambio, si un jugador ve primero una tarjeta amarilla y después una roja directa, la tarjeta amarilla sí que computa. El ciclo en la Copa es, también, de cuatro tarjetas amarillas y la sanción se cumple en esta misma competición. Las amonestaciones recibidas por los jugadores en la fase de grupos se 'limpian' al finalizar la fase de grupos; ahora bien, un futbolista que vea la cuarta tarjeta amarilla en la última jornada de la fase de grupos no podrá jugar el partido de octavos. 1.- Una sanción pendiente de la temporada anterior empieza a contar a partir del primer partido oficial de la nueva temporada en que el jugador esté legalmente habilitado para ser alineado (con la licencia y el carnet de deportista en regla). 2.- Las suspensiones se aplicarán obligatoriamente en los partidos concretos determinados por el calendario original aprobado, vinculándose directamente al enfrentamiento nominal contra el rival que corresponda. 3.- El jugador deberá cumplir el castigo en el partido indicado sea cual sea la fecha real de celebración de este. Si el partido se aplaza o se suspende, la sanción quedará retenida y se ejecutará el día que se dispute realmente aquel enfrentamiento específico. • El aplazamiento de un partido no trasladará la sanción a la siguiente jornada real del campeonato. El jugador podrá disputar las jornadas posteriores con total normalidad, siempre que no tenga ninguna otra sanción acumulada. La responsabilidad disciplinaria se extingue por la prescripción de la sanción. Si el jugador permanece totalmente inactivo (sin licencia tramitada), los plazos de prescripción son: • Infracciones Leves (hasta 3 partidos de suspensión): prescriben al cabo de 1 mes de competición oficial. La parada o vacaciones de verano entre temporadas no computa de cara a la prescripción si el jugador tramita la licencia para la nueva temporada; en este caso, la sanción se arrastrará obligatoriamente a las primeras jornadas. • Infracciones Graves (de 4 a 12 partidos de suspensión): prescriben al cabo de 1 año. • Infracciones Muy Graves (Sanciones superiores a 12 partidos): comportan la suspensión de la licencia por un periodo de 13 a 24 partidos, las cuales, al tratarse de sanciones muy graves de carácter temporal, prescriben a los 3 años. En los casos de máxima gravedad, comportan la expulsión a perpetuidad de la competición; estas últimas sanciones, por su naturaleza permanente, no prescriben nunca. • El tiempo de prescripción se inicia el día siguiente al día en que la resolución del órgano disciplinario adquiere firmeza. • Si un jugador recibe más de una sanción en un mismo partido (por ejemplo, 12 partidos + 2 partidos), los plazos de prescripción corren en paralelo para cada infracción de forma individual según su gravedad, y nunca sobre la suma total. Por lo tanto, como ninguna de las dos sanciones por separado supera los 12 partidos (no hay perpetuidad), toda la sanción acumulada quedará extinguida una vez transcurrido 1 año natural entero de inactividad. OBLIGACIONES Y DEBERES DE LOS DELEGADOS. Los delegados de los equipos son los responsables de asegurar que en los banquillos solo haya los jugadores que hayan presentado su ficha reglamentaria. En este sentido, no se autoriza la presencia de acompañantes ni de menores en los banquillos ni en el interior del terreno de juego. Asimismo, los jugadores sancionados tampoco podrán ocupar el banquillo mientras dure su sanción. Por último, los delegados también deben garantizar que cualquier jugador expulsado abandone el campo de manera inmediata y se retire a los vestuarios, sin posibilidad de quedarse en el banquillo. Durante el descanso, el delegado de cada equipo tiene derecho a revisar las fichas del conjunto contrario y a hacer constar en el acta arbitral, si procede, su disconformidad. Si un delegado no hace uso de este derecho, el Comité correspondiente no aceptará ninguna reclamación posterior sobre este asunto, excepto en los casos que afecten directamente a la condición de federado de un jugador rival. Hay que tener en cuenta que el delegado o delegada es la persona de máxima responsabilidad fuera del terreno de juego —tanto en las actuaciones previas como en las posteriores al partido—, así como de garantizar el buen comportamiento de jugadores y acompañantes. Cualquier actitud violenta o incívica, así como la desobediencia reiterada de las normas técnicas y de uso de la instalación, podrá suponer la exclusión del equipo de la competición. En caso de que el delegado no esté presente en el partido, la responsabilidad de hacer cumplir toda esta normativa recaerá, por este orden, en el entrenador o en el capitán del equipo. Los delegados están obligados a informarse de las decisiones y acuerdos del Comité de Competición ante cualquier incidencia. Los acuerdos del Comité serán publicados el viernes de cada semana. El Consell Esportiu del Garraf no se hace responsable de que los delegados de equipo se miren o no la información colgada en la página web, cosa que puede hacer incurrir en alineación indebida o cualquier otra incidencia. Por último, se intentará notificar vía e-mail no siendo un eximente la posible no notificación y por tanto el incumplimiento de la posible sanción por el desconocimiento de la misma. DISPOSICIONES FINALES: • Cualquier tipo de recurso se deberá hacer por escrito dirigido al Consell Esportiu durante las 48 horas siguientes a la recepción del acta del partido. • Cualquier incidencia no recogida en este reglamento la resolverá el Comité de Competición. • La participación en este campeonato supone la aceptación de todas estas normas. Para cualquier aclaración dirigirse al Consell Esportiu del Garraf. (cegarraf@cegarraf.cat, o al teléfono: 938933102)",
      },
    ],
  },
];
