import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import MatchCenter from "./components/MatchCenter.jsx";
import Squad from "./components/Squad.jsx";
import Armor from "./components/Armor.jsx";
import Vestuario from "./components/Vestuario.jsx";
import Standings from "./components/Standings.jsx";
import teamData from "./data/teamData.json";

function Footer() {
  const { club } = teamData;
  return (
    <footer className="border-t border-acf-line bg-acf-panel/40 texture-grain">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src={club.logo} alt={club.name} className="h-12 w-auto" />
            <div>
              <p className="font-display text-2xl tracking-wider">
                AC<span className="text-red-gradient"> FRÍO</span>
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-acf-grey">
                {club.tagline}
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-acf-grey">
            © 2026 {club.name} · {club.founded ? `Fundado en ${club.founded}` : ""} · Pachanga Arena
          </p>

          <p className="font-display text-base sm:text-lg text-acf-grey tracking-wider sm:tracking-widest text-center">
            0°C ES TEMPERATURA AMBIENTE
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-acf-dark text-white">
      <Navbar />
      <main>
        <Hero />
        <MatchCenter />
        <Squad />
        <Armor />
        <Standings />
        <Vestuario />
      </main>
      <Footer />
    </div>
  );
}