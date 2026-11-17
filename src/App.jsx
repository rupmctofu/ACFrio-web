import Navbar from "./components/Navbar.jsx";
import BannerIdentity from "./components/BannerIdentity.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Squad from "./components/Squad.jsx";
import teamData from "./data/teamData.json";

function Footer() {
  const { club } = teamData;
  return (
    <footer className="border-t border-acf-line">
      <div className="wrap py-12">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={club.logo} alt={club.name} className="h-10 w-auto" />
            <div>
              <p className="text-lg font-extrabold leading-none tracking-tight text-white">
                AC <span className="text-acf-red">FRÍO</span>
              </p>
              <p className="mt-2 text-micro font-semibold uppercase tracking-[0.26em] text-acf-dim">
                {club.tagline}
              </p>
            </div>
          </div>

          <p className="text-center text-row text-acf-grey">
            © 2026 {club.name}
            {club.founded ? ` · Fundado en ${club.founded}` : ""}
          </p>

          <p className="text-center text-micro font-semibold uppercase tracking-[0.22em] text-acf-dim">
            0°C ES TEMPERATURA AMBIENTE
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="acf-ambience relative min-h-screen bg-acf-dark text-acf-snow">
      {/*
       * The identity banner owns the only photograph on the canvas now: the
       * page itself sits on the owner's flat blacks, with the ambience glows
       * breathing at the edges. Cards keep their opaque panels either way.
       */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <BannerIdentity />
          <Dashboard />
          <Squad />
        </main>
        <Footer />
      </div>
    </div>
  );
}
