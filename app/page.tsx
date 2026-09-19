"use client";

import { useState } from "react";
import { 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  ExternalLink, 
  Clock, 
  Shield, 
  Loader2,
  RotateCcw,
  Info,
  AlertCircle
} from "lucide-react";
import { x402Client, wrapFetchWithPayment, decodePaymentResponseHeader } from "@x402/fetch";
import type { SettleResponse } from "@x402/core/types";
import { registerExactEvmScheme } from "@x402/evm/exact/client";


import { privateKeyToAccount } from "viem/accounts";

const DEMO_PRIVATE_KEY = process.env.NEXT_PUBLIC_PRIVATE_KEY;

type DemoResponse = {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
  textContent?: string | null;
  transactionHash?: string | null;
  paymentInfo?: SettleResponse | null;
  error?: string;
  details?: unknown;
};

/** Narrows an unknown caught value to a readable message. */
function errorMessageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

type Wallet = {
  address?: `0x${string}`;
  fetchWithPayment?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  error?: string;
};

/**
 * Builds the paying fetch wrapper. NEXT_PUBLIC_* is inlined at build time, so
 * this is a constant and is computed once per module rather than per render.
 */
function createWallet(): Wallet {
  if (!DEMO_PRIVATE_KEY) {
    return { error: "NEXT_PUBLIC_PRIVATE_KEY is not set in environment variables" };
  }

  try {
    // Normalize private key to ensure it has 0x prefix
    const normalizedPrivateKey = DEMO_PRIVATE_KEY.startsWith("0x")
      ? DEMO_PRIVATE_KEY
      : `0x${DEMO_PRIVATE_KEY}`;

    const signer = privateKeyToAccount(normalizedPrivateKey as `0x${string}`);
    const x402client = new x402Client();
    registerExactEvmScheme(x402client, { signer });
    return {
      address: signer.address,
      fetchWithPayment: wrapFetchWithPayment(fetch, x402client),
    };
  } catch (err: unknown) {
    return { error: `Failed to initialize wallet: ${errorMessageOf(err)}` };
  }
}

const wallet = createWallet();

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<DemoResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [step, setStep] = useState<"initial" | "success">("initial");
  const [timing, setTiming] = useState<{ total: number } | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_QUICKSTART_RESOURCE_URL || 
    (typeof window !== 'undefined' ? `${window.location.origin}/api/premium/weather` : '/api/premium/weather');

  const walletAddress = wallet.address ?? null;
  const fetchWithPayment = wallet.fetchWithPayment ?? null;
  const error = wallet.error ?? requestError;

  const makeRequest = async () => {
    if (!fetchWithPayment) {
      setRequestError("Wallet not initialized");
      return;
    }

    setLoading(true);
    setResponse(null);
    setRequestError(null);
    setTiming(null);

    try {
      const startTime = performance.now();
      
      const result = await fetchWithPayment(API_URL, {
        method: "GET",
      });

      const endTime = performance.now();
      const totalTime = Math.round(endTime - startTime);

      if (!result.ok && result.status !== 402) {
        throw new Error(`Request failed with status ${result.status}: ${result.statusText}`);
      }

      // Check if response has content before parsing JSON
      const contentType = result.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      
      let data: unknown = null;
      let textContent: string | null = null;

      // Read response body once
      const responseText = await result.text().catch(() => "");
      
      if (isJson && responseText.trim()) {
        try {
          data = JSON.parse(responseText);
        } catch (jsonError) {
          console.error("Error parsing JSON:", jsonError);
          textContent = responseText;
        }
      } else if (responseText) {
        textContent = responseText;
      }

      // The facilitator reports settlement back in this header.
      let paymentInfo: SettleResponse | null = null;
      let transactionHash: string | null = null;
      const paymentResponse = result.headers.get("PAYMENT-RESPONSE");
      if (paymentResponse) {
        try {
          paymentInfo = decodePaymentResponseHeader(paymentResponse);
          transactionHash = paymentInfo.transaction || null;
        } catch (e) {
          console.error("Error decoding payment response:", e);
        }
      }
      
      setResponse({
        status: result.status,
        statusText: result.statusText,
        headers: Object.fromEntries(result.headers.entries()),
        body: data,
        textContent,
        transactionHash,
        paymentInfo,
      });

      setTiming({
        total: totalTime,
      });

      if (result.status === 200) {
        setStep("success");
      }
    } catch (err: unknown) {
      console.error('Request error:', err);
      const errorMessage = errorMessageOf(err);
      
      // Handle network errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        setRequestError(`Network error: Unable to connect to ${API_URL}. Please check if the server is running and accessible.`);
      } else {
        setRequestError(errorMessage);
      }
      
      setResponse({
        error: errorMessage,
        details: err instanceof Error ? (err.cause ?? err.stack) : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep("initial");
    setResponse(null);
    setRequestError(null);
    setTiming(null);
  };

  if (!DEMO_PRIVATE_KEY) {
    return (
      <div className="min-h-screen bg-white pt-24 pb-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">Configuration Error</h3>
                <p className="text-sm text-red-700">
                  NEXT_PUBLIC_PRIVATE_KEY is not set in environment variables.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 mb-3" style={{ fontFamily: 'Impact, "Arial Black", sans-serif' }}>
            x402 Payment Protocol Demo
          </h1>
          <p className="text-zinc-500 text-sm">
            HTTP 402 on Base Sepolia
          </p>
          {walletAddress && (
            <p className="text-xs text-zinc-400 mt-2 font-mono">
              Wallet: {walletAddress}
            </p>
          )}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Controls & Info */}
          <div className="space-y-6">
            {/* Action Card */}
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900">
                  {step === "initial" ? "Access Protected Weather API" : "Payment Successful"}
                </h2>
              </div>
              
              <div className="p-6">
                {step === "initial" ? (
                  <>
                    <p className="text-zinc-600 text-sm mb-4">
                      Click below to access the protected weather API. The @x402/fetch wrapper handles the 402 and payment automatically.
                    </p>
                    
                    <div className="bg-zinc-50 rounded-lg p-4 mb-6 border border-zinc-100">
                      <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-zinc-500">
                          Open DevTools Network tab to see 2 requests: first without payment (gets 402), then with payment (gets data)
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={makeRequest}
                      disabled={loading || !fetchWithPayment}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Request Weather API
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <CheckCircle className="w-5 h-5 text-zinc-900" />
                      <div>
                        <h3 className="font-semibold text-zinc-900">Payment Verified</h3>
                        <p className="text-sm text-zinc-500">The protected resource has been delivered.</p>
                      </div>
                    </div>

                    {response?.transactionHash && (
                      <div className="bg-zinc-50 rounded-lg p-4 mb-6 border border-zinc-100">
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                          Transaction Hash
                        </p>
                        <code className="block text-xs font-mono text-zinc-700 break-all mb-3">
                          {response.transactionHash}
                        </code>
                        <a
                          href={`https://base-sepolia.blockscout.com/tx/${response.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-900 hover:text-zinc-600 transition-colors"
                        >
                          View on Explorer
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    <button
                      onClick={reset}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Start Over
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Timing Card */}
            {timing && (
              <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
                <div className="p-6 border-b border-zinc-100">
                  <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-500" />
                    Response Time
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 text-sm">Total</span>
                    <span className="text-xl font-bold text-zinc-900">{timing.total}ms</span>
                  </div>
                </div>
              </div>
            )}

            {/* How It Works Card */}
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-zinc-500" />
                  How @x402/fetch Works
                </h2>
              </div>
              <div className="p-6">
                <ol className="space-y-3 text-sm">
                  {[
                    { title: 'Initial Request', desc: 'Tries to access resource (no payment)' },
                    { title: '402 Detection', desc: 'Server returns 402 with payment spec' },
                    { title: 'Extract Requirements', desc: 'Gets network, amount, recipient' },
                    { title: 'Build & Sign', desc: 'Signs a USDC transfer authorization (no gas needed)' },
                    { title: 'Retry with Payment', desc: 'Resends request with X-PAYMENT header' },
                    { title: 'Verify & Settle', desc: 'Facilitator verifies and settles' },
                  ].map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-semibold text-zinc-900 w-5">{i + 1}.</span>
                      <span>
                        <strong className="text-zinc-900 font-medium">{item.title}:</strong>{' '}
                        <span className="text-zinc-500">{item.desc}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <p className="text-xs text-zinc-400 mt-4 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                  Just call wrapFetchWithPayment(fetch, client) &mdash; that&apos;s it!
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Response */}
          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden sticky top-24">
              <div className="p-6 border-b border-zinc-100">
                <h2 className="text-lg font-semibold text-zinc-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-zinc-500" />
                  API Response
                </h2>
              </div>
              
              <div className="p-6">
                {error && (
                  <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-900 mb-1">Error</p>
                        <p className="text-xs text-red-700">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {response ? (
                  <div className="space-y-6">
                    {/* Status */}
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                        Status
                      </p>
                      <p className="text-xl font-bold text-zinc-900">
                        {response.status} {response.statusText || 'OK'}
                      </p>
                    </div>

                    {/* Response Headers */}
                    {response.headers && (
                      <div>
                        <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                          Response Headers
                        </p>
                        <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-x-auto font-mono max-h-40">
                          {JSON.stringify(response.headers, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Response Body */}
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide mb-2">
                        Response Body
                      </p>
                      <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-lg text-xs overflow-x-auto font-mono">
                        {JSON.stringify(response.body || response.error, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Shield className="w-12 h-12 text-zinc-200 mb-4" />
                    <p className="text-zinc-400">
                      No response yet. Make a request to see the response here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
