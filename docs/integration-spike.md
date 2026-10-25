# Integration spike

## Verified sources

Sources read on October 25, 2026:

- Official [perps developer docs](https://app.testnet.dreamdex.io/docs/developers/perps-testnet): SDK 0.32.1, connection example, perps discovery, sizing and submission methods.
- Official [bot-kit repository](https://github.com/somnia-chain/dreamdex-bot-kit), commit `25798660bbe4674a6f83a960b202852896e2fed4`: `packages/perp-core/src/config.ts` explicitly calls `hideki` the Tokyo testnet; `docs/perps.md` explains bot linking and perps margin.
- SDK 0.32.1 `src/chains/definitions/hidekiTestnet.ts`: chain 50383 is the low-latency Tokyo network. V2 uses `hideki2` endpoints; v1 has the same chain ID, so keep the verified endpoints.
- Official [support docs](https://app.testnet.dreamdex.io/docs/support/get-help): Discord tickets use https://discord.gg/dreamdex.
- Official testnet app links [Perps Arena](https://app.testnet.dreamdex.io/competition-hub).

| Setting | Verified value |
|---|---|
| SDK | @somnia-chain/markets-sdk 0.32.1 |
| Network | Tokyo / Hideki testnet V2 |
| Chain ID | 50383 |
| HTTP RPC | https://api.hideki2.infra.testnet.somnia.network |
| WebSocket RPC | wss://api.hideki2.infra.testnet.somnia.network/ws |
| GraphQL indexer | https://hideki-dev.smk.somnia.host/v1/graphql |
| Gas token | STT |

The current docs and SDK agree on this network. Generic spot REST docs use Shannon staging on 50312; those endpoints are not a substitute for Tokyo perps.

## Confirmed SDK interfaces

- `SomniaMarkets`, `SOMNIA_HIDEKI_TESTNET_ADDRESSES`, `hidekiTestnet`.
- `client.getViemClient()` for chain reads.
- `client.listPerpMarkets()` for live discovery.
- `client.getPerpSystemConfig(marginBank)` for on-chain configuration.
- `client.getPerpHealthSnapshot(pool)` for a current, priceability-aware reading.
- Documented later execution path: `client.getMaxPerpOrderSize(...)` and `trader.placePerpOrder(...)`.

Read market decimals, tick size, lot size, minimum quantity, pool and MarginBank from the market row. Confirm perps collateral through `getPerpSystemConfig`; the SDK's general collateral address is a different spot token. Indexer mark prices can lag; use pool health for execution pricing and preserve unavailable states.

Only the first five interfaces are exercised by this project's read-only proof. Sizing, order submission, bot permissions, fills, cancellations and timeout reconciliation require subsequent live verification.

## Live proof result

`npm run proof:markets` passed on October 25, 2026 with SDK 0.32.1: chain **50383**, **21** discovered perps markets, matching on-chain MarginBank collateral and a pool health reading. The full result is saved in [markets-proof.json](evidence/markets-proof.json). Financial values are preserved as raw integers or decimal strings. No transaction was signed or submitted.

The first sandbox run failed DNS resolution; the approved run with network access passed. Dependencies installed with zero reported vulnerabilities and the script passed Node's syntax check.

**Configure Somnia Tokyo testnet and official SDK** and **Public GitHub repository** are checked in the MVP checklist. Account requirements, candle availability, order execution and exchange reconciliation still need verification. The project and SDK evidence are published at https://github.com/greyw0rks/dreampilot. The ticket is ready locally and remains unsent.

## Whitelist sequence

1. Run and save a real SDK/API proof.
2. Make the implementation available in a GitHub repository, or collect a Tokyo transaction hash from project code.
3. Prepare a Discord ticket with the DoraHacks email and that proof.
4. Open the ticket and save explicit whitelist confirmation.
5. Obtain test funds through Perps Arena, link a dedicated bot key if trading an app account, and verify margin/gas state.
6. Place a bounded testnet order and reconcile its actual outcome before building automation.

The repository-proof route avoids making whitelist eligibility depend on an already funded signer. A successful read-only probe does not complete the checklist's real-order item.
