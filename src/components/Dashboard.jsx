import Standings from "./Standings.jsx";
import { IdentityDoor } from "./WhoAreYou.jsx";
import NextMatchCard from "./cards/NextMatchCard.jsx";
import BreakingTicker from "./cards/BreakingTicker.jsx";
import ScorersCard from "./cards/ScorersCard.jsx";
import PersonalAchievementsCard from "./cards/PersonalAchievementsCard.jsx";
import LastMatchCard from "./cards/LastMatchCard.jsx";
import FixturesCard from "./cards/FixturesCard.jsx";
import CupCard from "./cards/CupCard.jsx";
import AttendanceCard from "./cards/AttendanceCard.jsx";
import GalleryCard from "./cards/GalleryCard.jsx";
import NewsCard from "./cards/NewsCard.jsx";
import BrandModule from "./cards/BrandModule.jsx";
import RulesCard from "./cards/RulesCard.jsx";

/**
 * Home grid: a full-width news band, then the centre column as the page's
 * protagonist — the next league match, the next cup match, the club's newsroom
 * and the photo gallery — while standings, the last match, scorers and the
 * personal achievements sit on the left, and calendar, attendance and the brand
 * module on the right. Every card reads only synced or club-reported data.
 *
 * The cup's table used to be a card of its own here (CopaStatsCard, right under
 * the two fixtures) and the owner took it out: `/copa` already draws that table,
 * so the dashboard was showing the same table twice. The component file stays in
 * the repo, unused, and nothing else in the centre column changed order on
 * desktop.
 *
 * The personal achievements card sits directly under Goleadores, as the owner
 * asked: the goals first, then what they have earned. It is the same component
 * `/logros` opens as its narrow left block, so the dashboard and the shelf are
 * one block in two places and not two drawings of one idea.
 *
 * The last match card (S9) replaced two cards with one: the MVP vote of the last
 * played match, the result itself and, under a hairline and in small type, the
 * three results the form card used to list alone. It sits directly above
 * Goleadores, as the owner asked — what happened, then who scores — and it is
 * the card `#mvp` still scrolls to. On a phone it takes the slot the vote had
 * (`max-lg:order-8`, right after the attendance card: who turned up, then who
 * was the best of them), and the hole the form card left at 10 closed behind it:
 * Noticias 11→10, Galería 12→11 and the brand module 13→12. Twelve cards now,
 * numbered 1 to 12 with no gap.
 *
 * The two fixture cards are one pair, not two unrelated modules (S6): the league
 * fixture on top and the cup fixture under it, same anatomy, and exactly one of
 * them is the active card — the one whose kickoff comes first owns the red hero
 * surface and the only attendance block (S10). When the next league match is more
 * than a week away the league card shrinks to its flat grey note and the cup card
 * takes the hero surface (S7, S8). The cup's 0/15 counter and team list live on
 * their own card below the pair (S9), which is now only on `/copa`: see above.
 *
 * The rules card closes the right column, above the brand module: it is a side
 * surface and not the centre, so it sits where nothing else is competing for
 * attention. On a phone it takes the fourth slot — right after the calendar —
 * the place it kept when the cup's stats card left the grid and everything from
 * the calendar on moved up one place, so the sequence has no gap. Nothing
 * changed on desktop; the columns there are the same three.
 *
 * The card hierarchy is otherwise unchanged: only the active fixture card owns
 * `.surface-hero` and the scorers card the accent surface (see `.surface-hero` /
 * `.surface-accent` in index.css); everything else stays on the base panel. The
 * club identity lives in the fixed header, so the grid starts with the fixture
 * itself, and it starts high: the blurred photograph is the page's ground, not a
 * band above it (owner, L28), so `pt-28` clears the fixed header and no more.
 */
export default function Dashboard() {
  return (
    <section id="partidos" className="relative pb-16 pt-28">
      <div className="wrap">
        {/* The club-code door, first thing in the grid: nobody has to scroll
            past three cards to say who they are. Once the device knows, it
            leaves, and the fixed header is the only place left that says who
            is looking — there is no chip beside the news any more. */}
        <IdentityDoor />

        {/*
         * The satirical feed, now the whole row. The identity chip used to share
         * this line and was dropped when identity moved into the fixed header
         * for good (owner), so the band reads across the page instead of around
         * a pill. Phones still drop the ticker — a headline moving sideways on a
         * 390px screen is unreadable, and the column order there is about the
         * fixture, not the news — so the margin belongs to the band itself.
         */}
        <div className="mb-6 hidden lg:block">
          <BreakingTicker />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* On phones the columns dissolve (display: contents) and every card
              gets its own order, so the owner's mobile sequence is: the two
              fixture cards, the calendar, the rules, scorers, the personal
              logros right after them, attendance, the last match with its vote,
              then the rest, gallery last. The numbers run 1 to 12 with no gap:
              merging the vote and the form card into one took out one slot, so
              everything after it moved up one place. On desktop the three
              columns return untouched. */}
          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-4">
            <Standings className="max-lg:order-9" />
            <LastMatchCard className="max-lg:order-8" />
            <ScorersCard className="max-lg:order-5" />
            <PersonalAchievementsCard className="max-h-[36rem] max-lg:order-6" />
          </div>

          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-5">
            <NextMatchCard className="max-lg:order-1" />
            {/* The centre column holds the two fixtures, the newsroom and the
                album: the content a visitor came to look at. */}
            <CupCard className="max-lg:order-2" />
            <NewsCard className="max-lg:order-10" />
            <GalleryCard className="max-lg:order-11" />
          </div>

          <div className="flex max-lg:contents flex-col gap-6 lg:col-span-3">
            <FixturesCard className="max-lg:order-3" />
            <AttendanceCard className="max-lg:order-7" />
            <RulesCard className="max-lg:order-4" />
            <BrandModule className="max-lg:order-12 mt-auto" />
          </div>
        </div>
      </div>
    </section>
  );
}
