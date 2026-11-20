import { fixtureCardState } from "../../data/competition";
import { FixtureCardView, useFixtureClock } from "./NextMatchCard.jsx";

/**
 * The cup fixture card, middle of the centre column.
 *
 * It used to be "La Copa": a competition module that, with no matchday played
 * yet, spent the whole card explaining why it had no table. The owner asked for
 * the next cup match instead (S6), with the same anatomy as the league card
 * above it — crests, rival, date, time, field and days remaining — so the column
 * reads as the two competitions the club plays in.
 *
 * Exactly one of the two carries the red hero surface and the headcount
 * (`fixtureCardStates` decides which), and it keeps the `copa` anchor the navbar
 * points at. The cup's progress — the table, the teams and the rounds played —
 * is not here: it belongs to `/copa`, which draws it in full. The card that used
 * to repeat it on the dashboard (`CopaStatsCard`, S9) was taken out and its file
 * deleted, so there is nothing next door to point at any more.
 */
export default function CupCard({ className = "" }) {
  const now = useFixtureClock();

  return (
    <FixtureCardView
      id="copa"
      title="Próximo partido de Copa"
      competitionKey="cup"
      state={fixtureCardState("cup", now)}
      now={now}
      className={className}
    />
  );
}
