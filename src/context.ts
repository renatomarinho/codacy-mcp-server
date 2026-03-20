/**
 * CodacyContext — tRPC-style context + lightweight API client.
 * Every f.query() / f.mutation() / f.action() handler receives this via ctx.
 */

import { CODACY_API_BASE } from './utils/constants.js';

// ─── Context Interface ───────────────────────────────────────────────────────

export interface CodacyContext {
  apiToken: string | undefined;
  client: CodacyApiClient;
}

// ─── API Client ──────────────────────────────────────────────────────────────

export class CodacyApiClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(token: string, baseUrl: string = CODACY_API_BASE) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  // ── Core HTTP ─────────────────────────────────────────────────────────────

  async get<T = unknown>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T = unknown>(path: string, body?: unknown, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, {
      method: 'POST',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T = unknown>(path: string, body?: unknown): Promise<T> {
    const url = this.buildUrl(path);
    return this.request<T>(url, {
      method: 'PATCH',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // ── Internals ─────────────────────────────────────────────────────────────

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): URL {
    const url = new URL(`${this.baseUrl}/${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url;
  }

  private async request<T>(url: URL, init: RequestInit): Promise<T> {
    const mergedHeaders: Record<string, string> = {
      'Accept': 'application/json',
      'api-token': this.token,
      'X-Codacy-Origin': 'mcp-server',
    };

    if (init.headers) {
      const extra = init.headers as Record<string, string>;
      for (const [key, value] of Object.entries(extra)) {
        mergedHeaders[key] = value;
      }
    }

    const response = await fetch(url.toString(), {
      ...init,
      headers: mergedHeaders,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => '');
      throw new CodacyApiError(
        `Codacy API ${init.method} ${url.pathname} failed: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    // Some endpoints return 204 No Content
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json() as Promise<T>;
  }
}

// ─── Error Class ─────────────────────────────────────────────────────────────

export class CodacyApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = 'CodacyApiError';
  }
}

// ─── Context Factory ─────────────────────────────────────────────────────────

export function createCodacyContext(): CodacyContext {
  const apiToken = process.env.CODACY_ACCOUNT_TOKEN;
  const client = new CodacyApiClient(apiToken ?? '');

  return { apiToken, client };
}
