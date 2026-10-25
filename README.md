# DreamPilot

Automated perps trading, with rules you control.

DreamPilot will connect traders to dreamDEX on Somnia Tokyo testnet, with one moving-average crossover strategy, deterministic risk checks and transparent execution. The current implementation is an integration spike: a real read-only Markets SDK probe. The terminal and automated execution are still to be built.

## Run the SDK proof

Requires Node.js 22+ and HTTP/WebSocket access to the official Tokyo endpoints. No wallet, signing key or testnet funds are required.

```bash
npm ci --ignore-scripts
npm run proof:markets
```

The script uses `@somnia-chain/markets-sdk` **0.32.1** and the SDK's `hidekiTestnet` definition (**50383**, Tokyo). It checks the live chain, lists perps markets, verifies a market's collateral against its on-chain MarginBank, and reads pool health. It records success or failure in `docs/evidence/markets-proof.json`; prices and quantities remain decimal strings or raw integers.

This is genuine SDK integration code. It submits zero transactions and demonstrates neither an order nor a fill. A GitHub repository containing this code can be offered for whitelist review under the user-supplied repository-proof route; the organizers decide whether the proof is sufficient.

## Whitelist and funds

Build proof first. Open a ticket in [dreamDEX Discord](https://discord.gg/dreamdex) with the DoraHacks email and either a GitHub repo using the Markets SDK/API or a transaction hash from code on Tokyo. Save explicit whitelist confirmation.

Join [Perps Arena](https://app.testnet.dreamdex.io/competition-hub) for weekly USDso and STT, subject to the app's eligibility and credit rules. For automated execution, the official bot kit supports a separately linked bot key and owner account; margin belongs in the Perps account and the bot key needs STT for gas.

## Project documents

- [MVP specification and 29-item checklist](docs/mvp-spec.md)
- [Integration sources and next steps](docs/integration-spike.md)

The whitelist ticket draft is kept locally and excluded from version control because it contains the submission email.

The supplied deadline is November 1, 2026; exact cutoff remains to be verified.

## Official references

- [Bounty](https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail)
- [Perps developer docs](https://app.testnet.dreamdex.io/docs/developers/perps-testnet)
- [dreamDEX bot kit](https://github.com/somnia-chain/dreamdex-bot-kit)

The generic REST staging endpoint targets Shannon (50312); it must not be mistaken for Tokyo perps (50383). Perps pool addresses and collateral come from live SDK discovery.
