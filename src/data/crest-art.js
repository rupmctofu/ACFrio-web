/**
 * Vector artwork for the rivals' crests, supplied by the club.
 *
 * Two sets live in `public/assets/badges/svg`: `-color` and `-negro`. Only the
 * one-ink set is wired here, and the reason is weight. Measured on this set, the
 * seven ink files total 208 KB raw / **82 KB gzipped**; the colour files total
 * 962 KB raw, and Bayer's alone is 570 KB (208 KB gzipped) for a mark that is
 * drawn at 32px in the table and 128px in the poster. The 80px webp it replaces
 * is 2.2 KB. So colour stays on the webp, which is adequate at those sizes, and
 * the vector is used where it was genuinely soft: the one-ink copy.
 *
 * The ink files are silhouettes — some carry `fill: #050505`, others no fill at
 * all — and they are used as masks over `currentColor`, so the same file paints
 * grey on a quiet card, white on a hero, or any other tone the design asks for.
 */
const INK = {
  "el-templo": "templo-negro.svg",
  "autoescola-giner": "giner-negro.svg",
  "bayer-leverkolocon": "bayer-negro.svg",
  "bonsi-fc": "bonsi-negro.svg",
  "bar-dansaires-niu-projectes": "dansaires-negro.svg",
  "francesco": "autentico-negro.svg",
  "kongitos-fc": "kongitos-negro.svg",
  "premier-team-f-c": "premiere-negro.svg",
  "rayo-bellakeo": "rallo-negro.svg",
  tecnocasa: "tecnocasa-negro.svg",
};

/**
 * The full-colour vectors the club has supplied. Where one exists it replaces
 * the 80px webp: the bitmap is soft once a crest is drawn at 128px, and the club
 * asked for no raster crests at all.
 *
 * Bayer and Bonsi are the heavy pair (73 KB and 44 KB gzipped against 2-3 KB for
 * a webp) and they are in despite that, because the club re-exported exactly for
 * this: Bayer came down from 208 KB gzipped to 73. Giner has no colour artwork
 * at all, so it is declared null and drawn from its one-ink file instead — see
 * WHITE below.
 */
const COLOUR = {
  // The club's own shield: the supplied vector is white, so the brand red is
  // applied to it here rather than asking for a second file.
  "ac-frio": "ac-frio-color.svg",
  "el-templo": "templo-color.svg",
  "autoescola-giner": null,
  "bayer-leverkolocon": "bayer-color.svg",
  "bonsi-fc": "bonsi-color.svg",
  "bar-dansaires-niu-projectes": "dansaires-color.svg",
  "francesco": "autentico-color.svg",
  "kongitos-fc": "kongitos-color.svg",
  "premier-team-f-c": "premiere-color.svg",
  "rayo-bellakeo": "rallo-color.svg",
  tecnocasa: "tecnocasa-color.svg",
};

/** The one-ink vector for a crest, or null when the club sent no artwork. */
export const crestInkArt = (slug) => {
  const file = INK[slug];
  return file ? `/assets/badges/svg/${file}` : null;
};

/** The full-colour vector for a crest, or null when there is none. */
export const crestColourArt = (slug) => {
  const file = COLOUR[slug];
  return file ? `/assets/badges/svg/${file}` : null;
};

/**
 * Clubs with no colour artwork, drawn from their one-ink file instead and
 * painted white. Giner only ever sent a single-ink shield, and the 80px webp it
 * used to fall back to carries a white box baked into the file, which on a dark
 * card reads as a sticker. The same silhouette the quiet cards use, tinted white,
 * is the honest version of a crest that only exists in one ink (owner, L3).
 */
const WHITE = {
  "autoescola-giner": "giner-negro.svg",
};

/** The one-ink file to paint white, or null when the club has real colour art. */
export const crestWhiteArt = (slug) => {
  const file = WHITE[slug];
  return file ? `/assets/badges/svg/${file}` : null;
};
