# x402 Starter

A [Next.js](https://nextjs.org) demo of the [x402](https://docs.x402.org) payment
protocol: an API route that answers `HTTP 402 Payment Required`, and a page that
pays for it automatically and shows the settled transaction.

Payments settle in **USDC on Base Sepolia** (`eip155:84532`).

## How it works

1. `proxy.ts` puts `/api/premium/*` behind a payment proxy.
2. An unpaid request gets a `402` plus a `payment-required` header describing the
   price, asset, network and recipient.
3. The client signs an EIP-3009 `transferWithAuthorization` and retries with an
   `X-PAYMENT` header.
4. The [facilitator](https://docs.x402.org/core-concepts/facilitator) verifies and
   settles it on-chain, and the route finally runs.

| File | Role |
| --- | --- |
| [x402.ts](x402.ts) | Network, price, recipient and facilitator config |
| [proxy.ts](proxy.ts) | Applies the payment proxy to `/api/premium/*` |
| [app/api/premium/weather/route.ts](app/api/premium/weather/route.ts) | The paid resource |
| [app/page.tsx](app/page.tsx) | Buyer UI |

## Getting started

```bash
npm install
cp .env.example .env.local   # then add a test private key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Request Weather API**.

To pay for a request, the wallet needs Base Sepolia USDC from the
[Circle faucet](https://faucet.circle.com). It needs no ETH: the facilitator
submits the transaction, so the payer only signs.

> [!WARNING]
> `NEXT_PUBLIC_PRIVATE_KEY` signs in the browser, so it is bundled into the
> client and visible to anyone who loads the page. This is fine for a local
> demo with a throwaway key. Before deploying anywhere public, move signing to
> the server and read the key from a non-`NEXT_PUBLIC_` variable.

## Configuration

Edit [x402.ts](x402.ts) to change the price, the receiving wallet or the network.
Set `RESOURCE_WALLET_ADDRESS` so payments reach a wallet you control.

Ethereum Sepolia (`eip155:11155111`) is **not** supported — the public
facilitator's only EVM testnet is Base Sepolia. Check what a facilitator
supports at
[x402.org/facilitator/supported](https://x402.org/facilitator/supported).

For mainnet, switch `NETWORK` to `eip155:8453` (Base) and point `FACILITATOR_URL`
at a production facilitator.

## Learn more

- [x402 docs](https://docs.x402.org) — [buyers](https://docs.x402.org/getting-started/quickstart-for-buyers) · [sellers](https://docs.x402.org/getting-started/quickstart-for-sellers) · [facilitator](https://docs.x402.org/core-concepts/facilitator)
- [Next.js docs](https://nextjs.org/docs)
