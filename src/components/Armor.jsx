import { Shield, Droplets, Wind, Layers } from "lucide-react";
import teamData from "../data/teamData.json";

const detailCards = [
  {
    icon: Shield,
    title: "Escudo ACF",
    text: "Sobrio, helado y competitivo. Diseño afilado con el copo como insignia de la sangre fría.",
  },
  {
    icon: Droplets,
    title: "Tejido transpirable",
    text: "Microfibra de secado ultra-rápido. El sudor no se acumula: se congela y cae.",
  },
  {
    icon: Wind,
    title: "Corte atlético",
    text: "Patrón ceñido que corta el viento. Diseñado para la velocidad del contraataque.",
  },
  {
    icon: Layers,
    title: "Franjas garantizadas",
    text: "Negro y rojo en cada costura. La equipación que ya da miedo antes de saltar al campo.",
  },
];

export default function Armor() {
  const { club } = teamData;

  return (
    <section id="armadura" className="relative py-24 overflow-hidden texture-grain">
      <div
        className="absolute -right-40 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(230,28,36,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <p className="text-acf-red font-display text-3xl tracking-widest">LA ARMADURA</p>
          <h2 className="font-display text-4xl sm:text-6xl tracking-wide uppercase">
            Primera Equipación <span className="text-red-gradient">25·26</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* ===== Render de la equipación ===== */}
          <div className="relative">
            <div className="absolute inset-0 -rotate-3 bg-acf-red/10 border border-acf-red/20 clip-edge scale-95" />
            <div className="relative bg-acf-panel border border-acf-line shadow-acf clip-edge overflow-hidden">
              <div className="relative aspect-[3/4] flex flex-col items-center justify-center p-8">
                {/* Franjas de la camiseta */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: "repeating-linear-gradient(90deg, #0d0d0d 0px, #0d0d0d 60px, #e61c24 60px, #e61c24 120px)",
                  }}
                />
                <div className="relative flex flex-col items-center gap-6">
                  {/* Escudo */}
                  <div className="h-16 w-16 rounded-xl bg-acf-red flex items-center justify-center shadow-red mx-auto">
                    <Shield className="h-9 w-9 text-white" />
                  </div>

                  {/* Mockup silueta de camiseta */}
                  <div className="relative">
                    <div
                      className="h-72 w-60 clip-edge border border-white/20 shadow-acf"
                      style={{
                        background:
                          "repeating-linear-gradient(90deg, #141414 0px, #141414 45px, #d61a22 45px, #d61a22 90px)",
                      }}
                    >
                      <div className="absolute inset-x-0 top-4 flex justify-center">
                        <svg viewBox="0 0 80 30" className="h-7 w-16 text-white/90 fill-current">
                          <path d="M0 10 L8 0 L20 8 L30 0 L50 0 L60 8 L72 0 L80 10 L70 20 L60 12 L55 30 L25 30 L20 12 L10 20 Z" />
                        </svg>
                      </div>
                      <div className="absolute left-1/2 -translate-x-1/2 top-1/4 font-display text-6xl text-white/20 tracking-widest">
                        ACF
                      </div>
                      <div className="absolute inset-x-0 bottom-5 text-center font-display text-lg text-white/80 tracking-[0.3em]">
                        EST. 2026
                      </div>
                    </div>
                  </div>

                  {/* Pantalón y medias */}
                  <div className="flex gap-8 items-end">
                    <div className="h-20 w-20 bg-acf-dark border border-white/10 rounded-sm" />
                    <div className="h-14 w-14 bg-acf-red border border-white/20" />
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-acf-grey max-w-md mx-auto">
              {club.name} · {club.tagline}
            </p>
          </div>

          {/* ===== Macro-detalles ===== */}
          <div className="grid sm:grid-cols-2 gap-5">
            {detailCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="group bg-acf-panel border border-acf-line hover:border-acf-red/50 p-6 clip-edge-tl transition-all hover:-translate-y-1 hover:shadow-acf"
                >
                  <Icon className="h-8 w-8 text-acf-red mb-4 group-hover:shadow-red rounded-sm" />
                  <h3 className="font-display text-2xl tracking-wide text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-acf-grey leading-relaxed">{card.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}