/**
 * CodacyApiClient — URL building, headers, error handling, HTTP methods.
 *
 * An QA engineer smiles when: the API client silently drops
 * undefined params instead of sending them as "undefined" strings.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodacyApiClient, CodacyApiError } from '../src/context.js';

describe('CodacyApiClient', () => {
  let client: CodacyApiClient;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new CodacyApiClient('test-token-abc', 'https://api.example.com/v3');
    fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── URL Building ──────────────────────────────────────────────────────────

  describe('URL Building', () => {
    it('builds URL from base + path', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
      await client.get('organizations/gh/myorg');
      const url = new URL(fetchSpy.mock.calls[0][0]);
      expect(url.pathname).toBe('/v3/organizations/gh/myorg');
    });

    it('appends query params', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.get('repos', { cursor: 10, limit: 50 });
      const url = new URL(fetchSpy.mock.calls[0][0]);
      expect(url.searchParams.get('cursor')).toBe('10');
      expect(url.searchParams.get('limit')).toBe('50');
    });

    it('strips undefined params (critical: prevents "undefined" string in URL)', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.get('repos', { cursor: undefined, limit: 50 });
      const url = new URL(fetchSpy.mock.calls[0][0]);
      expect(url.searchParams.has('cursor')).toBe(false);
      expect(url.searchParams.get('limit')).toBe('50');
    });

    it('converts boolean params to strings', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.get('repos', { enabled: true });
      const url = new URL(fetchSpy.mock.calls[0][0]);
      expect(url.searchParams.get('enabled')).toBe('true');
    });
  });

  // ── Headers ───────────────────────────────────────────────────────────────

  describe('Headers', () => {
    it('always includes api-token header', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.get('test');
      const init = fetchSpy.mock.calls[0][1];
      expect(init.headers['api-token']).toBe('test-token-abc');
    });

    it('always includes Accept: application/json', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.get('test');
      const init = fetchSpy.mock.calls[0][1];
      expect(init.headers['Accept']).toBe('application/json');
    });

    it('POST with body includes Content-Type: application/json', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.post('test', { key: 'value' });
      const init = fetchSpy.mock.calls[0][1];
      expect(init.headers['Content-Type']).toBe('application/json');
    });

    it('POST without body does NOT include Content-Type', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.post('test');
      const init = fetchSpy.mock.calls[0][1];
      expect(init.headers['Content-Type']).toBeUndefined();
    });
  });

  // ── HTTP Methods ──────────────────────────────────────────────────────────

  describe('HTTP Methods', () => {
    for (const method of ['get', 'post', 'patch', 'put', 'delete'] as const) {
      it(`has ${method}() method`, () => {
        expect(typeof (client as any)[method]).toBe('function');
      });
    }

    it('GET uses GET method', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.get('test');
      expect(fetchSpy.mock.calls[0][1].method).toBe('GET');
    });

    it('POST uses POST method and stringifies body', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.post('test', { key: 'value' });
      const init = fetchSpy.mock.calls[0][1];
      expect(init.method).toBe('POST');
      expect(init.body).toBe(JSON.stringify({ key: 'value' }));
    });

    it('PATCH uses PATCH method', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.patch('test', { enabled: true });
      expect(fetchSpy.mock.calls[0][1].method).toBe('PATCH');
    });

    it('PUT uses PUT method', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.put('test', { data: 'x' });
      expect(fetchSpy.mock.calls[0][1].method).toBe('PUT');
    });

    it('DELETE uses DELETE method', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      await client.delete('test');
      expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  // ── Response Handling ─────────────────────────────────────────────────────

  describe('Response Handling', () => {
    it('returns parsed JSON on success', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify({ data: [1, 2, 3] }), { status: 200 }));
      const result = await client.get('test');
      expect(result).toEqual({ data: [1, 2, 3] });
    });

    it('returns undefined for 204 No Content', async () => {
      fetchSpy.mockResolvedValueOnce(new Response(null, { status: 204 }));
      const result = await client.post('test');
      expect(result).toBeUndefined();
    });

    it('throws CodacyApiError on 4xx', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{"error":"not found"}', { status: 404, statusText: 'Not Found' }));
      await expect(client.get('test')).rejects.toThrow(CodacyApiError);
    });

    it('CodacyApiError contains statusCode and body', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('{"error":"forbidden"}', { status: 403, statusText: 'Forbidden' }));
      try {
        await client.get('test');
        expect.unreachable('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(CodacyApiError);
        const apiError = err as CodacyApiError;
        expect(apiError.statusCode).toBe(403);
        expect(apiError.body).toContain('forbidden');
        expect(apiError.name).toBe('CodacyApiError');
      }
    });

    it('throws CodacyApiError on 5xx', async () => {
      fetchSpy.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500, statusText: 'Internal Server Error' }));
      await expect(client.get('test')).rejects.toThrow(CodacyApiError);
    });

    it('handles response.text() failure gracefully', async () => {
      const badResponse = new Response(null, { status: 500, statusText: 'ISE' });
      Object.defineProperty(badResponse, 'ok', { value: false });
      Object.defineProperty(badResponse, 'text', { value: () => Promise.reject(new Error('stream broken')) });
      fetchSpy.mockResolvedValueOnce(badResponse);
      await expect(client.get('test')).rejects.toThrow(CodacyApiError);
    });
  });
});
