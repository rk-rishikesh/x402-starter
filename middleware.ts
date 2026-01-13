import { paymentProxy } from "@x402/next";

import { x402ResourceServer } from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import type { Network } from "@x402/core/types";

const payTo = "0x7822f606a8F2858235B2833782A15F2690F8Ed03";

const server = new x402ResourceServer()
    .register("eip155:84532" as Network, new ExactEvmScheme());

const routes = {
  "/api/premium/weather": {
      accepts: [
          {
              scheme: "exact" as const,
              payTo: payTo as `0x${string}`,
              price: "$0.01", // USDC
              network: "eip155:84532" as Network, // Base Sepolia
          },
      ],
      description: "Paid Weather API",
      mimeType: "application/json",
  },
};

// Create the payment proxy with the pre-configured server
export const middleware = paymentProxy(routes, server);
// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/premium/:path*"],
};
