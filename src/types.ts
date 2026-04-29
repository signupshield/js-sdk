export interface SignupShieldOptions {
  /** Your API key — starts with ss_live_ or ss_test_ */
  apiKey: string
  /** Override the base URL (useful for proxies or tests). Default: https://api.signupshield.dev */
  baseUrl?: string
  /** Request timeout in milliseconds. Default: 5000 */
  timeout?: number
  /** Maximum number of retries on 429 / 5xx. Default: 3 */
  maxRetries?: number
}

export interface ScoreParams {
  /** Email address to evaluate */
  email: string
  /** IPv4 or IPv6 address of the signup request (optional but improves accuracy) */
  ip?: string
}

export interface ScoreResult {
  /** 0–100 risk score. Higher = riskier. */
  score: number
  /** Overall risk classification */
  risk: "low" | "medium" | "high"
  /** Email domain is a known disposable/throwaway service */
  disposable: boolean
  /** Email is from a free consumer provider (Gmail, Yahoo…) */
  free_provider: boolean
  /** Domain has valid MX records and can receive mail */
  mx_valid: boolean
  /** IP reputation classification */
  ip_reputation: "residential" | "datacenter" | "proxy" | "tor"
}

export interface BatchParams {
  /** Up to 100 items per request */
  items: ScoreParams[]
}

export interface BatchResult {
  /** Results in the same order as the input items */
  results: ScoreResult[]
}

export interface SignupShieldErrorBody {
  error?: {
    code: string
    message: string
  }
}
