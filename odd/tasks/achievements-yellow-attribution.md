# Hallazgo: la loseta «Primera amarilla» se enciende para cualquiera (no es una spec)

Traspaso desde la sesión del restyling de la asistencia. **No he tocado** `achievements.js`,
`AchievementsGrid.jsx` ni `PersonalAchievementsCard.jsx`: los posee la sesión que escribe los logros.

## Síntoma

El propietario, que va como «Rup» en la plantilla, dice: «yo no he recibido una tarjeta amarilla» y
«me sale que tengo una tarjeta».

## El dato está bien

`src/data/club-record.json → cards` solo tiene dos amarillas:

```json
[
  { "player": "Albert", "yellow": 1, "red": 0, "yellowAt": 2 },
  { "player": "Jonay",  "yellow": 1, "red": 0, "yellowAt": 3 }
]
```

`achievements.js` acredita las tarjetas por nombre normalizado (`normalise` de `src/lib/club-code.js`
quita acentos y mayúsculas), así que «Rup» queda con `player.yellow === 0`. No hay colisión: nada más
normaliza a `RUP`. Ninguna otra superficie puede colgar una tarjeta de un jugador sin fila en el
registro: `ScorersCard` pinta cada tarjeta desde su propio objeto (sin índice ni cruce por nombre),
`club-record.js` solo ordena, y `news-derived.js` imprime «Amarillas: Albert y Jonay».

## El fallo, en una línea

```js
playerEntry({
  id: "player-first-yellow",
  title: "Primera amarilla",
  description: "Un jugador ve su primera tarjeta amarilla.",
  icon: "RectangleVertical",
  test: (facts) => facts.players.some((player) => player.yellow >= 1),
})
```

Es una entrada de alcance *jugador* evaluada **en bloque** (`some`): se cumple porque Albert o Jonay
tienen tarjeta. Y se pinta en `PersonalAchievementsCard`, cuyo encabezado es `${player.name} · N de M`
con el nombre de quien mira. Resultado: la loseta encendida parece afirmar «Rup tiene una amarilla».

Le pasa lo mismo a las demás entradas de alcance jugador que puede cumplir cualquiera
(`player-three-mvps`, `player-first-vote`). El propio docstring del componente reconoce que la capa de
datos no tiene atribución por jugador.

## Arreglo recomendado

Los agregados por jugador ya llevan `yellow`, `mvps` y la clave de identidad, así que el dato soporta
resolver la entrada contra **quien mira**, no contra la plantilla:

1. en la evaluación, distinguir el hecho de equipo (`facts.players.some(...)`) del hecho del jugador
   (`facts.players.find(p => p.key === readerKey)`), o añadir a `playerEntry` un `testFor(player)`;
2. en el estante personal, encender una entrada de alcance jugador solo si la cumple ese jugador;
3. lo que sea de plantilla («hay partido sin tarjetas», «primera del equipo») se queda en la rejilla
   de equipo, que ya existe.

## Contexto de despliegue

Producción no está afectada: el bundle servido (`index-BNRG4ha0.js` en `https://acfrio.club`) no
contiene «Primera amarilla». El síntoma se vio en el servidor local.
