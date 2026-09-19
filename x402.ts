import {
  HTTPFacilitatorClient,
  x402ResourceServer,
  type RoutesConfig,
} from "@x402/core/server";
import type { Network } from "@x402/core/types";
import { ExactEvmScheme } from "@x402/evm/exact/server";

/** Base Sepolia. The public facilitator's only supported EVM testnet. */
export const NETWORK: Network = "eip155:84532";

/** Wallet that receives payments. */
export const PAY_TO = (process.env.RESOURCE_WALLET_ADDRESS ??
  "0x7822f606a8F2858235B2833782A15F2690F8Ed03") as `0x${string}`;

/**
 * The facilitator verifies payment payloads and settles them on-chain, so the
 * app never needs its own RPC or signing key. x402.org is the public
 * development/testnet facilitator; point FACILITATOR_URL elsewhere for mainnet.
 */
const facilitator = new HTTPFacilitatorClient({
  url: process.env.FACILITATOR_URL ?? "https://x402.org/facilitator",
});

export const server = new x402ResourceServer(facilitator).register(
  "eip155:*",
  new ExactEvmScheme(),
);

export const routes: RoutesConfig = {
  "/api/premium/weather": {
    accepts: [
      {
        scheme: "exact",
        payTo: PAY_TO,
        price: "$0.01", // USDC
        network: NETWORK,
      },
    ],
    description: "Paid Weather API",
    mimeType: "application/json",
  },
};
