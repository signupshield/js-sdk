import { SignupShieldError, SignupShieldRateLimitError, SignupShieldTimeoutError } from './errors.js'
import type { BatchParams, BatchResult, ScoreParams, ScoreResult, SignupShieldOptions } from './types.js'

const DEFAULT_BASE_URL = 'https://api.signupshield.dev'
const DEFAULT_TIMEOUT = 5_000
const DEFAULT_MAX_RETRIES = 3

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export class SignupShield {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeout: number
  private readonly maxRetries: number

  constructor(options: SignupShieldOptions) {
    if (!options.apiKey) throw new Error('signupshield: apiKey is required')
    this.apiKey = options.apiKey
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, '')
    this.timeout = options.timeout ?? DEFAULT_TIMEOUT
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  }

  /** Score a single email + optional IP pair. */
  async score(params: ScoreParams): Promise<ScoreResult> {
    return this.post<ScoreResult>('/v1/score', params)
  }

  /** Score up to 100 email + IP pairs in one request. */
  async batch(params: BatchParams): Promise<BatchResult> {
    return this.post<BatchResult>('/v1/batch', params)
  }

  private async post<T>(path: string, body: unknown, attempt = 0): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeout)

    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new SignupShieldTimeoutError(this.timeout)
      }
      throw err
    } finally {
      clearTimeout(timer)
    }

    if (res.status === 429 && attempt < this.maxRetries) {
      const parsed = Number(res.headers.get('Retry-After') ?? 1)
      const retryAfter = Number.isFinite(parsed) && parsed > 0 ? parsed : 1
      const errBody = await res.json().catch(() => ({}))
      if (attempt === this.maxRetries - 1) {
        throw new SignupShieldRateLimitError(errBody, retryAfter)
      }
      await sleep(retryAfter * 1_000)
      return this.post(path, body, attempt + 1)
    }

    if (res.status >= 500 && attempt < this.maxRetries) {
      await sleep(2 ** attempt * 200)
      return this.post(path, body, attempt + 1)
    }

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new SignupShieldError(res.status, json)
    }

    return res.json() as Promise<T>
  }
}
