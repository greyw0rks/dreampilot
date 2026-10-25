import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SomniaMarkets, SOMNIA_HIDEKI_TESTNET_ADDRESSES } from "@somnia-chain/markets-sdk";
import { hidekiTestnet } from "@somnia-chain/markets-sdk/chains";

// These endpoints and methods come from the official perps developer docs.
// There is no signer, wallet connection, or trading call in this proof.
const network = {
  chainId: 50383,
  rpcUrl: hidekiTestnet.rpcUrls.default.http[0],
  wsRpcUrl: hidekiTestnet.rpcUrls.default.webSocket[0],
  indexerUrl: "https://hideki-dev.smk.somnia.host/v1/graphql",
};
const evidencePath = fileURLToPath(new URL("../docs/evidence/markets-proof.json", import.meta.url));
const report = {
  startedAt: new Date().toISOString(),
  status: "running",
  sdk: { package: "@somnia-chain/markets-sdk", version: "0.32.1" },
  network,
  readOnly: true,
  transactionsSubmitted: 0,
  checks: {},
};

const exchange = new SomniaMarkets({
  chain: hidekiTestnet,
  wsRpcUrl: network.wsRpcUrl,
  indexerUrl: network.indexerUrl,
  addresses: SOMNIA_HIDEKI_TESTNET_ADDRESSES,
});

const deadline = setTimeout(() => {
  void finish("failed", new Error("SDK proof exceeded its 60-second deadline"));
}, 60_000);
let finishing = false;

async function finish(status, error) {
  if (finishing) return;
  finishing = true;
  clearTimeout(deadline);
  report.status = status;
  report.completedAt = new Date().toISOString();
  if (error) report.error = { name: error.name, message: error.message };
  try {
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, JSON.stringify(report, (_, value) => typeof value === "bigint" ? value.toString() : value, 2) + "\n");
    console.log(`Evidence saved to ${evidencePath}`);
    if (error) console.error(`${error.name}: ${error.message}`);
  } catch (saveError) {
    console.error(`Could not save evidence: ${saveError.message}`);
    status = "failed";
  }
  // Explicit exit bounds lingering SDK/WebSocket handles in a one-shot proof.
  await Promise.race([
    exchange.close().catch(() => {}),
    new Promise((resolve) => setTimeout(resolve, 2_000)),
  ]);
  process.exit(status === "passed" ? 0 : 1);
}

async function main() {
  console.log("DreamPilot · Tokyo/Hideki SDK proof · read-only");
  const rpc = exchange.client.getViemClient();
  const chainId = await rpc.getChainId();
  report.checks.chainId = chainId;
  if (chainId !== network.chainId) throw new Error(`Wrong chain: expected ${network.chainId}, got ${chainId}`);
  report.checks.blockNumber = await rpc.getBlockNumber();

  const markets = await exchange.client.listPerpMarkets();
  report.marketCount = markets.length;
  report.markets = markets;
  if (!markets.length) throw new Error("The official indexer returned no perps markets");

  // Read per-market addresses; the SDK's bundled collateral is for spot.
  const sample = markets[0];
  const system = await exchange.client.getPerpSystemConfig(sample.marginBank);
  report.checks.system = system;
  if (system.collateralToken.toLowerCase() !== sample.quoteToken.toLowerCase()) {
    throw new Error("Market collateral does not match the on-chain MarginBank");
  }
  if (!system.fullyWired) throw new Error("MarginBank reports incomplete system wiring");

  // The indexer's mark can lag. Store the pool's authoritative health reading;
  // priceable:false is a valid unavailable state, never a fabricated price.
  report.checks.sampleMarket = {
    poolAddress: sample.poolAddress,
    baseSymbol: sample.baseSymbol,
    health: await exchange.client.getPerpHealthSnapshot(sample.poolAddress),
  };
  console.log(`Verified chain ${chainId}; discovered ${markets.length} perps markets; checked collateral and pool health.`);
  console.log("This proves SDK reads. An order and fill still require a separate execution test.");
}

main().then(() => finish("passed"), (error) => finish("failed", error));
