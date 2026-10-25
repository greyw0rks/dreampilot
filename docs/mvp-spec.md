# DreamPilot: Complete MVP Build Specification

dreamDEX Perps Builder Bounty · dreamDEX × Somnia · Somnia Tokyo testnet

**Deadline:** November 1, 2026, as supplied by the user. Exact cutoff time and timezone remain to be confirmed from the official bounty.

**Bounty:** https://dorahacks.io/navi?to=%2Fhackathon%2Fdreamdex-perps-bounty%2Fdetail

**State:** Integration spike in progress. Read-only SDK proof passed on Tokyo/Hideki chain 50383, discovering 21 perps markets and checking on-chain collateral and pool health. Repository and proof published at https://github.com/greyw0rks/dreampilot. Whitelist access, signing and testnet order execution remain unverified. Checklist: 2/29.

**Next action:** Build proof with the official Markets SDK/API first, then open a dreamDEX Discord ticket with the DoraHacks email and either a GitHub repository using the SDK/API or a transaction hash from code on Somnia Tokyo testnet. A verified testnet order remains the integration milestone. Confirm SDK methods, market data, order types and signing before implementing the adapter.

### Whitelist and testnet funds

The user supplied these requirements from the [bounty detail page](https://dorahacks.io/hackathon/dreamdex-perps-bounty/detail):

1. Build on dreamDEX before requesting whitelist access.
2. Provide a GitHub repository using the Markets SDK or API, or a transaction hash from code on Somnia Tokyo testnet.
3. Open a ticket in the [dreamDEX Discord](https://discord.gg/dreamdex), including the DoraHacks email and the proof.
4. Wait for explicit whitelist confirmation; an opened ticket is not confirmation.

For testnet funds, join the [Perps Arena](https://app.testnet.dreamdex.io/competition-hub) through [the testnet app](https://app.testnet.dreamdex.io) for weekly USDso and STT. Availability and credit rules must be checked in the app. Neither a funded account nor a ticket is recorded yet.

The official bot kit identifies its `hideki` perps network as the Tokyo testnet: chain ID **50383**. Its spot/testnet default is Shannon **50312**, which must not be silently used for the bounty's Tokyo perps execution. See `docs/integration-spike.md` for verified sources and evidence.

This document preserves the user's MVP specification, with pasted rendering artifacts removed. Requirements attributed to the bounty must be checked against the official rules.

## 1. Product definition

**DreamPilot — Automated perps trading, with rules you control.**

DreamPilot is a rule-based automated perpetuals trading terminal. Traders connect to dreamDEX, configure a strategy, define risk limits, activate it, and monitor its orders and positions. Deliver a working trading product with a polished interface and verifiable testnet execution.

| Decision | MVP choice |
|---|---|
| AI integration | None |
| Token | None |
| Execution environment | Somnia Tokyo testnet |
| Initial strategy | Moving-average crossover |
| Primary differentiator | Risk controls and transparent execution |

### Problem and target users

Using a perps exchange and running an automated strategy are different jobs. Traders must interpret market data, monitor signals, manage orders, track positions, and ensure automation stops after something goes wrong. DreamPilot brings these jobs into one interface.

Target users are traders automating simple rule-based strategies, perps users seeking clearer leverage and exposure controls, and developers testing trading strategies.

### Core product loop

1. Connect a wallet.
2. Select a supported perps market.
3. Configure a strategy.
4. Define position and loss limits.
5. Review and activate the strategy.
6. Let the worker evaluate signals and request trades.
7. Track orders, fills, positions and performance.
8. Stop the strategy whenever necessary.

Build one complete, reliable strategy before supporting multiple strategies. A single strategy with actual execution is more valuable than several templates that cannot reliably trade.

## 2. MVP scope

| Area | Priority | Required behavior |
|---|---|---|
| Wallet and markets | P0 | Connect a supported wallet, load account state, list supported markets and retrieve strategy market data. |
| Strategy builder | P0 | Configure a moving-average crossover, entry/exit rules, position sizing and explicit activation controls. |
| Deterministic risk engine | P0 | Enforce exposure, leverage and daily loss limits, stale-data checks and duplicate-order protection. |
| Execution and reconciliation | P0 | Submit through the official dreamDEX integration, reconcile order status and maintain an accurate local ledger. |
| Positions and performance | P0 | Show open positions, order status, fills, supported PnL and strategy decision history. |

### Deferred features

- AI or machine-learning signals.
- Multi-agent systems.
- Copy trading and social features.
- Token launches and governance.
- Complex backtesting and optimization.
- Multiple simultaneous strategies.
- Cross-exchange trading.
- Mainnet deployment before the bounty requires it.

Mainnet readiness matters for the bounty's second payment according to the supplied brief; verify the official payment conditions. Preserve the required testnet MVP before submission.

## 3. Technical architecture

Separate the web interface from the persistent strategy worker. Browsers close, connectivity fails and deployments restart; automated strategies need durable state and safe recovery.

```text
Next.js frontend: wallet, markets, builder, positions
    |
Node.js + TypeScript API: validation, auth, configuration, account queries
    |
Shared PostgreSQL database and job state
    |
Persistent worker: market polling, signals, risk checks, reconciliation
    |
dreamDEX adapter: official SDK/API, signing, orders, positions, exchange state
    |
Somnia Tokyo testnet: supported perps markets and exchange infrastructure
```

| Component | Proposed technology | Purpose |
|---|---|---|
| Frontend | Next.js + TypeScript | Application and routing |
| Styling | Tailwind CSS + shadcn/ui | Compact, consistent interface |
| Charts | TradingView Lightweight Charts | Prices and indicators |
| Wallet | Supported wallet connector | Account access and signing |
| Exchange | Official dreamDEX SDK/API | Data, orders and positions |
| API | Node.js + TypeScript | Configuration and account endpoints |
| Worker | Persistent Node.js process | Automated execution |
| Database | PostgreSQL + Prisma | Strategies, orders, decisions and recovery |
| Hosting | Vercel + persistent worker host | Frontend/API and long-running worker |

This is a proposed stack, not a claim that dreamDEX endpoints or wallet operations have been verified. Use a monorepo with separate frontend and worker deployables; avoid overengineering deployment.

```text
dreampilot/
├── apps/
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/
│   ├── dreamdex-adapter/
│   ├── strategy-engine/
│   ├── risk-engine/
│   ├── execution-engine/
│   ├── shared/
│   └── config/
├── prisma/
│   └── schema.prisma
├── docs/
│   ├── architecture.md
│   └── testing.md
├── .env.example
├── README.md
└── package.json
```

## 4. Strategy and execution design

### Moving-average crossover

- Calculate fast and slow moving averages from verified market data.
- Generate a long signal when the fast average crosses above the slow average.
- Generate a short signal when it crosses below, if supported by the market and order flow.
- Ignore repeated signals while an incompatible order or position is active.
- Evaluate configured exits using supported order capabilities.
- Use completed candles; avoid repeated trades from incomplete data.
- Offer configurable periods with sensible defaults; require fast period shorter than slow period.

### Order lifecycle

| Current state | Event | Next state |
|---|---|---|
| Proposed | Risk check fails | Rejected |
| Proposed | Risk check passes | Approved |
| Approved | Exchange accepts request | Submitted |
| Submitted | Partial execution | PartiallyFilled |
| Submitted | Full execution | Filled |
| Submitted | Cancellation confirmed | Cancelled |
| Submitted | Exchange rejects order | Rejected |
| Submitted | Timeout or uncertain response | Unknown |
| Unknown | Reconcile and confirm safe retry | Approved |
| Unknown | Exchange confirms execution | Filled |
| Unknown | Exchange confirms rejection | Rejected |
| PartiallyFilled | Remaining quantity filled | Filled |

The Unknown state is essential: a network timeout does not prove an order failed. Query authoritative exchange state before retrying, and use exchange-supported client order identifiers or idempotency controls if available. Reconciliation must reflect any other authoritative status the SDK actually exposes; transitions remain subject to verified exchange capabilities.

### Risk controls

1. **Maximum order size:** reject orders above the configured limit.
2. **Leverage cap:** enforce user and exchange constraints.
3. **Exposure cap:** include existing positions and pending orders.
4. **Daily loss limit:** pause new entries when the configured threshold is reached.
5. **Market-data freshness:** reject stale or invalid prices.
6. **Duplicate-order protection:** prevent repeated orders from the same signal.
7. **Emergency stop:** stop generating new entries and apply an explicit policy to outstanding orders.

Emergency stop cannot guarantee immediate liquidation or cancellation of every order; supported exchange operations and network state determine what is possible.

### Data model

| Model | Important fields |
|---|---|
| Strategy | ID, user, market, parameters, state, risk settings |
| StrategyRun | Strategy ID, start/stop timestamps, worker status |
| Signal | Strategy ID, candle/time, direction, reason |
| Order | Exchange ID, supported client ID, side, quantity, status |
| PositionSnapshot | Market, size, entry price, PnL, timestamp |
| RiskEvent | Rule, decision, reason, timestamp |
| ExecutionEvent | Order ID, exchange status, fills, transaction reference |

Use appropriate decimal precision for prices and quantities. Do not use ordinary JavaScript floating-point arithmetic where exact financial decimal handling is required.

## 5. Design system

Professional, restrained, precise and information-dense. Avoid oversized cards, pervasive gradients, excessive rounding and generic AI visuals.

| Token | Value |
|---|---|
| App background | #0B0D12 |
| Panel background | #141923 |
| Elevated panel | #1B2230 |
| Border | #293242 |
| Primary accent | #55E6A5 |
| Secondary accent | #7C8CFF |
| Primary text | #F4F5F7 |
| Muted text | #9AA4B2 |

- Inter for interface text, labels, headings and navigation.
- JetBrains Mono for prices, quantities, percentages, hashes and timestamps.
- Lucide for icons; shadcn/ui for controls, dialogs, dropdowns, tabs, tooltips and forms.
- Lightweight Charts for charts and indicator overlays.
- Four-point spacing scale, subtle 1px borders, consistent 8px panel radius.
- Green for positive states, red for negative or dangerous states, amber for warnings, neutral colors for inactive elements.

## 6. Page-by-page UI/UX

### Overview

Answer immediately: account state, running strategies, positions/orders, and blocked or risky conditions.

- Top bar: DreamPilot logo, network status, wallet.
- Summary strip: equity, available balance, unrealized PnL, active strategies.
- Main area: price chart and active strategy status.
- Bottom: open positions, recent orders and execution events.

Display actual account data. Show unavailable states for values the integration cannot provide; never fabricate numbers.

### Markets

- Supported markets only, supplied by the official interface.
- Official mark/reference price and funding information where available.
- Search, market selection and a clear action to open the trading view.

Do not hardcode availability or invent funding rates.

### Strategy builder

Use a guided configuration panel.

1. Select market.
2. Select strategy type.
3. Set fast and slow moving-average periods.
4. Configure size and leverage cap.
5. Configure supported exit and loss rules.
6. Review and activate.

Provide a readable activation summary and validate parameter combinations, including fast period shorter than slow period.

### Trading terminal

- Chart and indicators on the left.
- Orders and positions on the right.
- Positions and order history below.
- Strategy status visible without navigation.

A manual order form supports testing and the demo. The strategy engine remains responsible for automated trades.

### Strategy monitor

- Running, paused, stopped or error status.
- Last successful market-data update.
- Last evaluated signal and reason.
- Risk-check results, pending orders and actual fills.
- Recent worker errors.
- Start, pause and stop controls.

The execution log must explain why a strategy did not trade as clearly as why it traded.

### Responsive behavior and references

Prioritize desktop. On smaller screens, collapse navigation, stack chart/order panels and preserve critical strategy controls. Always show the active network and execution status.

User-supplied visual references: overview — antflow.live; markets — docs.tread.fi; builder — marcyourmind.github.io; terminal — risechain.com; monitor — hyperliquidbot.com. These are design references, not exchange integration documentation.

## 7. Build plan and timeline

| Date (2026) | Phase | Work | Deliverable |
|---|---|---|---|
| October 25 | Integration spike — critical path | Run the official Markets SDK/API; build repository or code-originated Tokyo transaction proof; request whitelist by Discord ticket with DoraHacks email and proof; confirm data, signing, submission and status retrieval; verify a testnet order. | Build proof, whitelist request and verified execution evidence; confirmation tracked separately. |
| October 26 | Exchange adapter | Wrap official SDK in typed interfaces; normalize data, orders and positions; handle failures, timeouts and exchange errors. | Reusable integration layer. |
| October 27 | Trading terminal | Wallet and markets; manual orders, positions and activity; accurate exchange state. | Working manual trading interface. |
| October 28–29 | Worker and risk engine | Crossover signals, persistence/history, risk checks, reconciliation, pause/stop/recovery. | One working automated strategy. |
| October 30 | Reliability and UI polish | Lifecycle/error tests, monitoring, responsive UI, end-to-end test and demo recording. | Stable, demonstrable MVP. |
| October 31 | Submission | README/setup, public repository/demo, 2–3 accurate X posts tagging @DreamDEXSomnia, authorized bounty submission. | Completed submission. |
| November 1 | Deadline buffer | Fix submission blockers; confirm exact cutoff from official rules. | Submission completed before cutoff. |

The schedule is aggressive. If the integration spike fails, cut optional chart polish and advanced strategy features first. Preserve working order flow, risk checks, monitoring and submission evidence.

## 8. Testing and evidence

| Test | Expected result |
|---|---|
| Connect wallet | Correct account and network shown. |
| Submit valid order | Exchange returns a verifiable result. |
| Invalid parameters | Rejected before submission. |
| Stale market data | No new strategy order. |
| Duplicate signal | No duplicate order. |
| Exchange timeout | Reconcile state before retry. |
| Risk limit exceeded | Block order and log reason. |
| Worker restart | Recover existing state safely. |
| Emergency stop | Stop new entries and apply outstanding-order policy. |
| Position update | UI reflects authoritative state. |

Collect testnet hashes or order IDs according to the actual exchange execution model, screenshots of submitted/filled orders, a short strategy activation/execution recording, a risk-rejection demonstration, a public GitHub repository with installation instructions, and 2–3 X post links in the README.

Do not claim a transaction hash for an operation represented only by an API order ID. Record the evidence the actual interface exposes. Publishing X posts and submitting the Build are future checklist actions; neither has occurred.

## 9. Complete MVP checklist

**Launch readiness: 2/29.**

### Access and setup

- [ ] Obtain bounty submission whitelist confirmation.
- [x] Configure Somnia Tokyo testnet and official SDK.
- [ ] Confirm supported markets and account requirements.
- [ ] Verify a real testnet order.

### Core exchange integration

- [ ] Wallet connection and account state.
- [ ] Market data retrieval.
- [ ] Order submission and status handling.
- [ ] Position retrieval and execution history.

### Strategy engine

- [ ] Moving-average crossover signals.
- [ ] Configurable parameters and entry/exit rules.
- [ ] Persistent strategy state.
- [ ] Background worker with restart recovery.

### Safety

- [ ] Maximum position and leverage limits.
- [ ] Daily loss limit.
- [ ] Stale-data rejection.
- [ ] Duplicate-order protection.
- [ ] Unknown-order reconciliation.
- [ ] Pause and emergency-stop behavior.

### Interface and testing

- [ ] Overview and markets pages.
- [ ] Strategy builder and review screen.
- [ ] Positions and execution monitor.
- [ ] Responsive layouts and error states.
- [ ] End-to-end testnet demo.

### Bounty submission

- [x] Public GitHub repository.
- [ ] Complete README and setup guide.
- [ ] Transaction or order evidence.
- [ ] Demo recording.
- [ ] 2–3 X posts tagging @DreamDEXSomnia.
- [ ] DoraHacks Build submitted before deadline.

## 10. Locked MVP decisions

- Product: DreamPilot, an automated perps trading terminal.
- Strategy: one moving-average crossover strategy.
- Execution: official dreamDEX SDK/API on Somnia Tokyo testnet.
- Risk: deterministic rules, separate from strategy signals.
- UI: dark, compact, professional trading terminal.
- Infrastructure: Next.js frontend, TypeScript API and persistent worker, PostgreSQL durable state.
- Success metric: valid signal → passed risk checks → real testnet order → verified result displayed.
- Stretch goal: demonstrate restart recovery and duplicate-order prevention.

The final adapter depends on verified SDK methods, order types, market data and wallet signing. Get the official bot kit running and prove one testnet order before building on assumed exchange behavior.
