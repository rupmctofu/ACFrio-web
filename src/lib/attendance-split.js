/**
 * Who is coming, and who said they are not.
 *
 * The card draws the faces of the first list and, under them, the names of the
 * second. It used to draw only the faces, and the owner asked for the other half
 * back as one quiet line («ahora no aparecen los que han votado que no
 * asisten»); a headcount answers "how many", but a squad reads its own names.
 *
 * The split lives here and not in the component so it can be fed without a
 * browser: the answers arrive keyed by player id, and an answer from someone the
 * squad no longer holds is dropped instead of drawn as a stranger. The order is
 * the squad's own id order — the keys are integers, so that is the order they are
 * read in — and the rows never reorder themselves under the reader.
 */
export function splitAnswers(answers, squadById) {
  const going = [];
  const out = [];

  for (const [id, status] of Object.entries(answers ?? {})) {
    const player = squadById.get(Number(id));
    if (!player) continue;
    if (status === "in") going.push(player);
    else if (status === "out") out.push(player);
  }

  return { going, out };
}
