import { useState } from "react";
import { User } from "lucide-react";
import teamData from "../data/teamData.json";
import { useIdentity } from "../lib/identity.js";
import { resolvePlayer } from "../lib/club-code.js";
import { routeLink } from "../lib/router.js";

/**
 * Who this device is: one answer, in the fixed header.
 *
 * The owner's instruction was that identity used to be asked twice — a pill in
 * the top bar and a panel in the content — and that it must live in only one
 * place. It now lives here, in `NavbarIdentity`, which both says who is looking
 * and changes it.
 *
 *   * `NavbarIdentity` — the bound pill (face, greeting, `Cambiar`) or the way
 *     to the door when nobody has said yet;
 *   * `IdentityDoor` — the club-code entrance at the top of the dashboard,
 *     which is the only thing the package offers once the squad faces are gone.
 *
 * Both read the same identity store and render nothing when they do not apply,
 * so the page order stays the same whoever is looking.
 */

/**
 * The club-code door, still the first thing in the dashboard grid.
 *
 * The strip of squad faces is gone on purpose: with the header owning identity,
 * a second row of faces was the same question asked twice, and the owner
 * replaced it with a code the club hands to each player. So the panel now tells
 * the reader where the code comes from instead of leaving the form to explain
 * itself, and `resolvePlayer` is the only way through.
 *
 * The code is a deliberate sign-in, not a secret: `src/lib/club-code.js` spells
 * out what it is and what a real one would need. That is why the copy promises
 * no privacy and the error stays concrete.
 */
export function IdentityDoor() {
  const { player, choose } = useIdentity();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  if (player) return null;

  const submit = (event) => {
    event.preventDefault();
    const match = resolvePlayer(code, teamData.squad);
    if (!match) {
      setError("Ese código no es de nadie. Si no lo tienes, pídelo en el grupo.");
      return;
    }
    setError("");
    setCode("");
    choose(match.id);
  };

  return (
    <div className="mb-6 rounded-card border border-acf-line bg-acf-panel px-4 py-5 sm:px-5">
      {/* The soft red carries small text on the dark panel: the pure brand red
          falls to 4:1 at 11px, and the label has to be read, not just seen. */}
      <p className="font-display text-2xl font-medium uppercase leading-none tracking-[0.1em] text-acf-red-soft sm:text-3xl">
        ¿Quién eres?
      </p>
      {/* No hint of the shape of the code, here or in the field: the club hands
          each one out, and printing the pattern on the page gives it away
          (owner, L3). */}
      <p className="mt-3 max-w-xl text-row text-acf-snow/80">
        Escríbelo una vez y este dispositivo se acuerda de ti para apuntarte al
        próximo partido.
      </p>

      <form onSubmit={submit} className="mt-5">
        <label
          htmlFor="club-code"
          className="text-micro font-semibold uppercase tracking-[0.24em] text-acf-grey"
        >
          Tu código de jugador
        </label>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <input
            id="club-code"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              if (error) setError("");
            }}
            autoComplete="off"
            spellCheck="false"
            aria-describedby={error ? "club-code-error" : undefined}
            className="h-14 min-w-0 flex-1 rounded-tile border border-acf-line bg-acf-dark px-4 text-lg font-semibold uppercase tracking-[0.14em] text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
          />
          <button
            type="submit"
            className="h-14 shrink-0 rounded-full bg-acf-red px-7 text-row font-bold uppercase tracking-[0.16em] text-white transition-colors duration-200 hover:bg-acf-red-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red"
          >
            Entrar
          </button>
        </div>
        {error ? (
          <p id="club-code-error" role="alert" className="mt-2 text-row text-acf-red-soft">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

/**
 * The identity in the fixed header (S1), and now the only identity on screen.
 *
 * Bound, it is the face, the greeting and a real `Cambiar` button that forgets
 * the device; unbound, it is a link to the door on Inicio. The old pill was a
 * link and left the changing to the dashboard chip; the chip is gone, so the
 * change action has to be here, where the fact it changes is.
 *
 * On a phone the greeting is read but not drawn: at 390px the logo, this pill
 * and the menu button share one row, and the face plus `Cambiar` are what has
 * to be visible there. The greeting stays in the DOM through `sr-only`, so the
 * answer to "who is this device" survives the narrower layout instead of
 * becoming a face without a name.
 */
export function NavbarIdentity() {
  const { player, forget } = useIdentity();

  const shell =
    "flex items-center gap-2.5 rounded-full border border-acf-line bg-acf-panel/80 py-1 pl-1 pr-1 transition-colors hover:border-white/25 hover:bg-acf-panel focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acf-red sm:pr-1.5";

  if (!player) {
    return (
      <a
        {...routeLink("/")}
        aria-label="Ir al inicio para decir quién eres"
        title="¿Quién eres?"
        className={`${shell} text-row font-bold leading-none tracking-tight text-acf-snow/70 hover:text-white`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-acf-panel-light text-acf-grey">
          <User className="h-4 w-4" aria-hidden="true" />
        </span>
        {/* The label is drawn at every width: the owner's whole point is that
            the bar says who you are, and a person glyph alone says it to a
            screen reader only. It wraps no further than its own words, so the
            row shrinks the logo instead of overflowing. */}
        <span className="whitespace-nowrap pr-2">¿Quién eres?</span>
      </a>
    );
  }

  return (
    <div className={shell}>
      <span className="flex h-8 w-8 shrink-0 items-end justify-center overflow-hidden rounded-full border border-acf-line bg-acf-panel-light">
        <img src={player.photo} alt="" className="max-h-[92%] w-auto object-contain" />
      </span>
      <span className="sr-only text-row font-bold leading-none tracking-tight text-white sm:not-sr-only sm:block sm:max-w-[9rem] sm:truncate">
        Hola, {player.name}
      </span>
      {/* A real button, not a link: it forgets the device in place instead of
          navigating anywhere, and its label says both what it does and who it
          is about, because the greeting is not drawn on a phone. */}
      <button
        type="button"
        onClick={forget}
        aria-label={`Cambiar de jugador. Este dispositivo está vinculado a ${player.name}.`}
        className="h-8 shrink-0 whitespace-nowrap rounded-full border border-acf-line px-2.5 text-micro font-semibold uppercase tracking-[0.12em] text-acf-snow/70 transition-colors duration-200 hover:border-white/25 hover:text-white focus-visible:border-acf-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-acf-red"
      >
        Cambiar
      </button>
    </div>
  );
}
