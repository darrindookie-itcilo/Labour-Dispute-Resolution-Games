# Labour Dispute Resolution Games

Two team games adapted from the supplied Session 10 and Session 11 materials for ITCILO’s Social Dialogue Cluster and the Federation of Kenya Employers training, 22 October 2026.

## Open the games

Participant site: https://darrindookie-itcilo.github.io/Labour-Dispute-Resolution-Games/

Facilitator: open the site and select **Facilitator**. Use the facilitator credentials supplied for this training. Email and password are sent over HTTPS to the results service in Darrin Dookie’s ChatGPT Sites project at https://labour-dispute-games.darrin-dookie.chatgpt.site. The password is checked against a server-side hash; no password or password verifier is embedded in the published HTML.

## Run a live session

1. Sign in to Facilitator and create a session for the chosen game.
2. Share the eight-character session code or copy the participant link.
3. Each team joins on one device using a team alias. No participant account is required.
4. Project the standings, pause or resume all teams, or add 30 seconds.
5. Expand a team to see every choice and reason. Export the whole session as JSON or CSV.
6. **Save attempt & restart** preserves the previous attempt before restarting a team. Closing a session preserves all results.

The board refreshes every four seconds. Scores are calculated by the results service. Failed transmissions retain the pending move on the team device and retry with an idempotent request identifier. A stale browser tab cannot overwrite newer team progress.

## Practice and offline use

Open `index.html` directly to play without a network connection. Google Fonts is optional; system fonts are used offline. Practice progress saves in the current browser. Team names start at **Team 1** and can be edited. **Clear saved games** on the home page removes local practice progress and saved live-team connections after confirmation; server records, imported reports and facilitator sign-in remain intact. Resume shortcuts for names beginning with QA, Test or Deployment Check are hidden. Download each result before switching devices. The facilitator can import downloaded practice JSON files for comparison on the facilitator device; imported files are not automatically uploaded.

A live session and facilitator sign-in require internet access. The secure service is hosted at https://labour-dispute-games.darrin-dookie.chatgpt.site and accepts the GitHub Pages origin. GitHub Pages itself runs only the static front end.

## The Diagnostic

18 fictional cases, 13 principles, and two lifelines. Choose 8, 13 or 18 cases. The 13-case mode includes one case for every principle. A shared seed gives every team the same order. A correct answer earns 2 points, or 1 after a lifeline; an incorrect answer earns 0. The ambiguous dormant-case example accepts either speediness or accountability.

## Stop the Escalation

Three workplace disputes, five stages each and eleven interventions. Each card is usable once per dispute. Play a single dispute or a three-dispute campaign. Start at stage 1, 3 or 5 for a different challenge. Every card/stage combination has an explanation. A holding move adds 2 to the illustrative cost index. Both the running feedback and final report show a failed last-stage attempt at 200 plus holding costs.

The outcomes are teaching assumptions. A fair hearing, representation, consultation or mediation cannot guarantee agreement in a real dispute. Conciliation does not automatically stop legal limitation periods. Litigation and industrial action are legitimate routes where applicable. Check national law and collective agreements for real cases.

## Project source

The standalone GitHub Pages file has all CSS, data and game logic embedded. `source/` contains editable front-end source, the shared rules, the server API and the database schema for review. Runtime secrets and participant records are excluded.

The full hosted service checkout uses the Sites Vinext starter, a D1 database and PBKDF2 password verification. To rebuild the standalone file from that checkout:

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

The original working games were created with Claude. This edition retains their 18 cases, three scenarios, eleven cards and scoring structure, and adds shared team sessions, protected facilitation, saved progress, campaign play, reports and content corrections. All cases are fictional. These learning adaptations are not an official ILO compliance assessment or legal advice. Principle definitions are paraphrased.
