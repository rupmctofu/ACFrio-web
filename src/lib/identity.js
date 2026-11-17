/**
 * Who the device belongs to.
 *
 * The club decided identity is declarative and passwordless (spec S1): you tap
 * your face and the site remembers it. So this lives in localStorage, not in
 * Supabase — it is a convenience for the person holding the phone, not a
 * credential, and it must survive a reload and a closed tab.
 *
 * An unknown or outdated id resolves to `null` instead of a broken greeting, so
 * removing a player from teamData.json just asks that device again.
 */
import { useCallback, useEffect, useState } from "react";
import teamData from "../data/teamData.json";

const STORAGE_KEY = "acfrio.player";
const CHANGE_EVENT = "acfrio:identity";

function read() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return teamData.squad.some((player) => player.id === id) ? id : null;
  } catch {
    // Private mode or blocked storage: the site works, it just forgets you.
    return null;
  }
}

function write(id) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  } catch {
    /* Storage refused; the React state below still updates for this visit. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function erase() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Nothing to do: the state below is what the page shows. */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * The chosen player (or `null`) plus the two movements that change it. Every
 * mounted copy stays in sync: choosing from the header updates the match card.
 */
export function useIdentity() {
  const [playerId, setPlayerId] = useState(read);

  useEffect(() => {
    const sync = () => setPlayerId(read());
    window.addEventListener(CHANGE_EVENT, sync);
    // Another tab choosing a different player also counts.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const choose = useCallback((id) => write(id), []);
  const forget = useCallback(() => erase(), []);

  const player = teamData.squad.find((item) => item.id === playerId) ?? null;
  return { player, choose, forget };
}
