# WhatsApp

Aquí dejas las conversaciones del grupo que quieras convertir en noticias. **Nada de esta carpeta
se publica ni se sube a git**: está en `.gitignore` salvo este documento, y el proceso solo lee los
ficheros cuando tú lo lanzas.

## Cómo dejar el material

Dos formas, las dos sirven:

1. **Exportar el chat desde WhatsApp** (sin archivos multimedia) y guardar el `.txt` aquí, con la
   fecha: `2026-11-20.txt`. Trae todo el grupo, así que después recortas lo que no quieras.
2. **Pegar a mano** solo las líneas que te interesan en un `.txt` nuevo. Si eliges esta vía, respeta
   el formato de WhatsApp (`dd/mm/aa, hh:mm - Nombre: mensaje`) o simplemente escribe
   `Nombre: mensaje` en cada línea.

## La voz: un periodista en el vestuario

Lo que se publica **no es la frase del chat**. Es lo que escribiría un periodista que estuviera
escondido en el vestuario: cuenta lo que ha oído, en tercera persona, con nombre y apellido, y le
añade una salida seca de su cosecha. La gracia está en el contraste entre lo que se dijo y cómo se
cuenta.

De la frase:

> Todo saque de puerta a la cabeza del marti, no hay mas tacticas

Sale la noticia:

> El plan de salida del club, según Cristo: «todo saque de puerta a la cabeza del Martí». No hay
> más tácticas.

Tres reglas para esa conversión:

1. **Atribuir siempre.** El nombre va dentro del texto. Una noticia del vestuario sin autor es un
   rumor, y los rumores no son graciosos: son vagos.
2. **Una cita corta, el resto reportaje.** Se puede entrecomillar la parte que hace gracia; el
   resto se cuenta. Pegar el mensaje entero es pereza y se nota.
3. **La retranca va al final, y no inventa datos.** Se puede rematar con una línea seca del
   periodista («No especifica en qué sentido»); lo que no se puede es inventar un resultado, un
   fichaje o una cifra.

## Cómo sacar las candidatas

```bash
npm run whatsapp:digest
```

Imprime por pantalla una lista de frases candidatas, ya limpias y ordenadas, listas para pegar en
`src/data/news.json`. **No escribe ningún archivo**: lo que se publica lo decides tú copiando.

## Qué descarta el filtro

- Números de teléfono y enlaces.
- Líneas de sistema («Los mensajes y llamadas están cifrados…», cambios de grupo).
- «Multimedia omitido», stickers, audios.
- Mensajes demasiado cortos para ser un titular, y párrafos largos que no caben en la tarjeta.

Si algo se cae y no debería, dímelo: el filtro está en `scripts/whatsapp-digest.mjs` y es fácil
ajustarlo.
