import type { SignupShieldErrorBody } from "./types.js"

export class SignupShieldError extends Error {
  readonly status: number
  readonly code: string | undefined
  readonly body: unknown

  constructor(status: number, body: unknown) {
    const parsed = body as SignupShieldErrorBody
    const msg = parsed?.error?.message ?? `SignupShield API error (HTTP ${status})`
    super(msg)
    this.name = "SignupShieldError"
    this.status = status
    this.code = parsed?.error?.code
    this.body = body
  }
}

export class SignupShieldTimeoutError extends Error {
  constructor(ms: number) {
    super(`SignupShield request timed out after ${ms}ms`)
    this.name = "SignupShieldTimeoutError"
  }
}

export class SignupShieldRateLimitError extends SignupShieldError {
  readonly retryAfter: number

  constructor(body: unknown, retryAfter: number) {
    super(429, body)
    this.name = "SignupShieldRateLimitError"
    this.retryAfter = retryAfter
  }
}
