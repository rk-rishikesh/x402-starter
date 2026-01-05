import { paymentMiddleware, Network } from "x402-next";

// Configure the payment middleware
export const middleware = paymentMiddleware(
  "0x7822f606a8f2858235b2833782a15f2690f8ed03", // your receiving wallet address
  {
    // Route configurations for protected endpoints
    "/api/premium/weather": {
      price: "$0.01",
      network: "base-sepolia",
      config: {
        description: "Access to protected content",
      },
    },
  }
  // Facilitator config is optional - defaults to x402.org/facilitator for testnet
);

// Configure which paths the middleware should run on
export const config = {
  matcher: ["/api/premium/:path*"],
};
