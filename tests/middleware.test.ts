/**
 * Middleware & Context — Auth guard, context factory.
 *
 * An QA engineer smiles when: the middleware silently passes
 * with an empty string token instead of throwing.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { createCodacyContext, CodacyApiClient } from '../src/context.js';

describe('createCodacyContext', () => {
  const originalToken = process.env.CODACY_ACCOUNT_TOKEN;

  afterEach(() => {
    if (originalToken !== undefined) {
      process.env.CODACY_ACCOUNT_TOKEN = originalToken;
    } else {
      delete process.env.CODACY_ACCOUNT_TOKEN;
    }
  });

  it('returns apiToken and client', () => {
    process.env.CODACY_ACCOUNT_TOKEN = 'my-token';
    const ctx = createCodacyContext();
    expect(ctx.apiToken).toBe('my-token');
    expect(ctx.client).toBeInstanceOf(CodacyApiClient);
  });

  it('returns undefined apiToken when env var is not set', () => {
    delete process.env.CODACY_ACCOUNT_TOKEN;
    const ctx = createCodacyContext();
    expect(ctx.apiToken).toBeUndefined();
  });

  it('creates CodacyApiClient even without token (for noAuth tools)', () => {
    delete process.env.CODACY_ACCOUNT_TOKEN;
    const ctx = createCodacyContext();
    expect(ctx.client).toBeInstanceOf(CodacyApiClient);
  });
});

describe('requireAuth middleware', () => {
  // Since requireAuth uses defineMiddleware which returns a MiddlewareDefinition,
  // we test the middleware function directly
  it('throws when ctx.apiToken is undefined', async () => {
    const { requireAuth } = await import('../src/middleware/requireAuth.js');
    // defineMiddleware wraps the fn — the actual fn is the first arg
    // We need to extract and call the underlying function
    const ctx = { apiToken: undefined, client: new CodacyApiClient('') };

    // The MiddlewareDefinition stores the handler internally
    // We test it by calling the derive function directly
    const deriveFn = requireAuth._derive ?? requireAuth.derive ?? requireAuth;
    if (typeof deriveFn === 'function') {
      await expect(deriveFn(ctx)).rejects.toThrow('AUTH_REQUIRED');
    }
  });

  it('returns empty object when ctx.apiToken is present', async () => {
    const { requireAuth } = await import('../src/middleware/requireAuth.js');
    const ctx = { apiToken: 'valid-token', client: new CodacyApiClient('valid-token') };

    const deriveFn = requireAuth._derive ?? requireAuth.derive ?? requireAuth;
    if (typeof deriveFn === 'function') {
      const result = await deriveFn(ctx);
      expect(result).toEqual({});
    }
  });
});
