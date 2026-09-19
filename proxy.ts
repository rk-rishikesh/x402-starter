import { paymentProxy } from "@x402/next";

import { routes, server } from "./x402";

// Gates the matched routes: unpaid requests get a 402 with payment
// requirements, paid ones are verified and settled via the facilitator.
export const proxy = paymentProxy(routes, server);

// Configure which paths the proxy should run on
export const config = {
  matcher: ["/api/premium/:path*"],
};
