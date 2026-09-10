import { useMemo, useState } from "react";
import { Trophy, Snowflake, MessageSquareQuote, Users, Info } from "lucide-react";
import teamData from "../data/teamData.json";

export default function Vestuario() {
  const { squad, fanZone } = teamData;
  const [voted, setVoted] = useState(false);

  const mvp = useMemo(
    () => squad.find((p) => p.id === fanZone.mvpLastMatch.playerId),
    [squad, fanZone]
  );
  const ice = useMemo(
    () => squad.find((p) => p.id === fanZone.iceOfTheWeek.playerId),
    [squad, fanZone]
  );

  const mvpCandidates = useMemo(
    () => squad.filter((p) => p.stats.coldMeter >= 85).slice(0, 5),
    [squad]
  );

  return (
    <section id="vestuario" className="relative py-24 texture-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <p className="text-acf-red font-display text-3xl tracking-widest">EL VESTUARIO</p>
          <h2 className="font-display text-4xl sm:text-5xl tracking-wide uppercase">
            MVP, Congelados y Rajadas
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* ===== MVP ÚLTIMO PARTIDO ===== */}
          <article className="relative overflow-hidden bg-gradient-to-br from-acf-panel-light to-acf-panel border border-acf-red/40 shadow-red clip-edge-tl">
            <div className="absolute -top-6 -right-6 opacity-10">
              <Trophy className="h-40 w-40 text-acf-red" />
            </div>
            <div className="p-7 relative">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="h-5 w-5 text-acf-red" />
                <h3 className="font-display text-2xl tracking-widest">MVP DE LA JORNADA</h3>
              </div>

              {mvp && (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={mvp.photo}
                      alt={mvp.name}
                      className="h-20 w-20 object-cover rounded-xl border-2 border-acf-red shadow-red"
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml," +
                          encodeURIComponent(
                            `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23161616'/><circle cx='40' cy='32' r='16' fill='%23e61c24'/><rect y='58' width='80' height='22' fill='%23e61c24'/></svg>`
                          );
                      }}
                    />
                    <span className="absolute -bottom-1.5 -right-1.5 bg-acf-red text-white font-display text-lg h-7 w-7 flex items-center justify-center rounded-sm">
                      {mvp.number}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{mvp.name}</h4>
                    <p className="text-sm text-acf-snow/60 italic">{mvp.nickname}</p>
                    <p className="mt-1.5 inline-flex items-center gap-1 bg-acf-red/15 text-acf-red text-xs font-bold px-2 py-0.5 rounded-sm">
                      <Users className="h-3 w-3" /> {fanZone.mvpLastMatch.votes} votos
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-5 text-sm text-acf-grey leading-relaxed border-t border-acf-line pt-4">
                {fanZone.mvpLastMatch.reason}
              </p>
            </div>
          </article>

          {/* ===== PREMIO CONGELADO ===== */}
          <article className="relative overflow-hidden bg-acf-panel border border-acf-line clip-edge-tl">
            <div className="p-7">
              <div className="flex items-center gap-2 mb-6">
                <Snowflake className="h-5 w-5 text-sky-400" />
                <h3 className="font-display text-2xl tracking-widest">PREMIO CONGELADO</h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <img
                    src={ice.photo}
                    alt={ice.name}
                    className="h-20 w-20 object-cover rounded-xl border border-sky-400/50 grayscale"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml," +
                        encodeURIComponent(
                          `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'><rect width='80' height='80' fill='%23161616'/><circle cx='40' cy='32' r='16' fill='%2345aaf2'/><rect y='58' width='80' height='22' fill='%2345aaf2'/></svg>`
                        );
                    }}
                  />
                  <span className="absolute -bottom-1.5 -right-1.5 bg-sky-500 text-white font-display text-lg h-7 w-7 flex items-center justify-center rounded-sm">
                    {ice.number}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-white">{ice.name}</h4>
                  <p className="text-sm text-acf-snow/60 italic">{ice.nickname}</p>
                  <p className="mt-1.5 inline-flex items-center gap-1 bg-sky-400/15 text-sky-300 text-xs font-bold px-2 py-0.5 rounded-sm">
                    <Snowflake className="h-3 w-3" /> La chapa de la semana
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-acf-grey leading-relaxed border-t border-acf-line pt-4">
                {fanZone.iceOfTheWeek.reason}
              </p>
            </div>
          </article>

          {/* ===== VOTACIÓN + RAJADA ===== */}
          <article className="flex flex-col gap-6">
            {/* Votación */}
            <div className="bg-acf-panel border border-acf-line clip-edge-tl p-6 flex-1">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-acf-red shrink-0" />
                  <h3 className="font-display text-xl sm:text-2xl tracking-widest">VOTA AL MVP</h3>
                </div>
                <span className="hidden sm:flex items-center gap-1.5 text-acf-grey text-xs shrink-0">
                  <Info className="h-3.5 w-3.5" /> Grupito del equipo
                </span>
              </div>

              <ul className="space-y-2 mb-5">
                {mvpCandidates.map((p, i) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setVoted(true)}
                      disabled={voted}
                      className="w-full flex items-center gap-3 px-3 py-2.5 bg-acf-dark/50 border border-acf-line hover:border-acf-red/60 hover:bg-acf-dark transition-all text-left disabled:opacity-60 disabled:cursor-default group"
                    >
                      <span className="font-display text-xl text-acf-grey w-6 text-center group-hover:text-acf-red">
                        {i + 1}
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-white">{p.name}</span>
                        <span className="block text-xs text-acf-grey">{p.nickname}</span>
                      </span>
                      <span className="text-[10px] font-bold text-acf-snow/40 uppercase tracking-wider">
                        #{p.number}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {voted && (
                <p className="text-center text-acf-red text-sm font-bold animate-pulse">
                  ¡Voto enviado al vestuario!
                </p>
              )}
            </div>

            {/* Rajada */}
            <div className="relative bg-gradient-to-r from-acf-red to-acf-red-dark p-6 clip-edge-tl overflow-hidden">
              <MessageSquareQuote className="absolute -right-4 -bottom-6 h-28 w-28 text-white/10" />
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/60 mb-2">
                La rajada de la semana
              </div>
              <p className="font-display text-xl sm:text-2xl leading-tight text-white">
                «{fanZone.weeklyQuote}»
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}