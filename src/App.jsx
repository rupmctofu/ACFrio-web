import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Squad from "./components/Squad.jsx";
import teamData from "./data/teamData.json";

function Footer() {
  const { club } = teamData;
  return (
    <footer className="border-t border-acf-line">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={club.logo} alt={club.name} className="h-10 w-auto" />
            <div>
              <p className="text-base font-extrabold leading-none tracking-tight text-white">
                AC <span className="text-acf-red">FRÍO</span>
              </p>
              <p className="mt-1.5 text-[8px] font-semibold uppercase tracking-[0.26em] text-acf-dim">
                {club.tagline}
              </p>
            </div>
          </div>

          <p className="text-center text-[11px] text-acf-grey">
            © 2026 {club.name}
            {club.founded ? ` · Fundado en ${club.founded}` : ""}
          </p>

          <p className="text-center text-[9px] font-semibold uppercase tracking-[0.22em] text-acf-dim">
            0°C ES TEMPERATURA AMBIENTE
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-acf-dark text-acf-snow">
      <Navbar />
      <main>
        <Hero />
        <Dashboard />
        <Squad />
      </main>
      <Footer />
    </div>
  );
}
