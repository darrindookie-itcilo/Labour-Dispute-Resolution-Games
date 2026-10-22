# Labour Dispute Resolution Games

Two team games adapted from the supplied Session 10 and Session 11 materials for ITCILO’s Social Dialogue Cluster and the Federation of Kenya Employers training, 22 October 2026.

## Open the games

Participant site: https://darrindookie-itcilo.github.io/Labour-Dispute-Resolution-Games/

## Use it in the room

1. Give each team one device and open either game.
2. Team name starts at **Team 1**; edit it if needed.
3. Keep **workshop-2026** and the same settings on every device for comparable case order and scores.
4. Teams discuss their choices, record a reason if useful, and compare scores out loud.
5. At the end, select **Download our result** to keep the JSON report.

Progress saves in the current browser. **Clear saved games** on the home page removes local practice progress and legacy team connections after confirmation; imported reports are kept. Resume shortcuts for names beginning with QA, Test or Deployment Check are hidden.

## Facilitator review

Open **Facilitator review**. Import the teams’ downloaded JSON reports to compare scores, choices, reasons and takeaways on your device. Reports played on this device appear automatically. Export the collection as JSON or CSV, print it, or use Projector view. There is no sign-in and no upload to a results service.

## Offline use

Extract the download ZIP and open `index.html` directly. Both games work without internet; optional Google Fonts fall back to system fonts. Save or download results before switching browser or device.

The published participant app is practice-only. The online session join form, facilitator login and claims of automatic board submission have been removed because the separate results-service connection could not be verified consistently. Opening an old session link leads to practice mode with an explanation. The application makes no results-service requests.

Earlier server source and protected records are retained for continuity; the current games do not depend on that service. No participant records, credentials or runtime secrets are included in this repository or ZIP.

## The Diagnostic

18 fictional cases, 13 principles, and two lifelines. Choose 8, 13 or 18 cases. The 13-case mode includes one case for every principle. A shared seed gives every team the same order. A correct answer earns 2 points, or 1 after a lifeline; an incorrect answer earns 0. The ambiguous dormant-case example accepts either speediness or accountability.

## Stop the Escalation

Three workplace disputes, five stages each and eleven interventions. Each card is usable once per dispute. Play a single dispute or a three-dispute campaign. Start at stage 1, 3 or 5 for a different challenge. Every card/stage combination has an explanation. A holding move adds 2 to the illustrative cost index. Both the running feedback and final report show a failed last-stage attempt at 200 plus holding costs.

The outcomes are teaching assumptions. A fair hearing, representation, consultation or mediation cannot guarantee agreement in a real dispute. Conciliation does not automatically stop legal limitation periods. Litigation and industrial action are legitimate routes where applicable. Check national law and collective agreements for real cases.

## Project source

The standalone GitHub Pages file has all CSS, data and game logic embedded. `source/` contains editable front-end source, the shared rules, the server API and the database schema for review. Runtime secrets and participant records are excluded.

The hosted checkout retains the Sites Vinext starter and earlier server implementation. Only the standalone client is used for the current activity. To rebuild the standalone file from that checkout:

```sh
node scripts/build-games.mjs /absolute/output/index.html
```

The GitHub Pages repository serves `index.html` from `main` at the root, with `.nojekyll`. No npm build is required for Pages. Update `index.html` after changing source files.

## Sources and attribution

- ILO, *Access to labour justice: A diagnostic tool for self-assessing the effectiveness of labour dispute prevention and resolution* (2023): https://www.ilo.org/publications/access-labour-justice-diagnostic-tool-self-assessing-effectiveness-labour
- Co-operation at the Level of the Undertaking Recommendation, 1952 (No. 94).
- Examination of Grievances Recommendation, 1967 (No. 130).
- Collective Bargaining Convention, 1981 (No. 154).
- Voluntary Conciliation and Arbitration Recommendation, 1951 (No. 92).
- Integrated conflict management material in the supplied Session 11 deck and trainer script.

The original working games were created with Claude. This edition retains their 18 cases, three scenarios, eleven cards and scoring structure, and adds saved progress, campaign play, local facilitator review, reports and content corrections. All cases are fictional. These learning adaptations are not an official ILO compliance assessment or legal advice. Principle definitions are paraphrased.
