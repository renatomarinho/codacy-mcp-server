/**
 * requireAuth middleware — checks CODACY_ACCOUNT_TOKEN presence.
 * Throws a self-healing error if missing.
 *
 * Uses defineMiddleware (tRPC-style Context Derivation) to produce a
 * MiddlewareDefinition — the universal format accepted by both
 * FluentRouter.use() and FluentToolBuilder.use().
 */

import { defineMiddleware } from '@vurb/core';
import type { CodacyContext } from '../context.js';

export const requireAuth = defineMiddleware(async (ctx: CodacyContext) => {
  if (!ctx.apiToken) {
    throw new Error('AUTH_REQUIRED: CODACY_ACCOUNT_TOKEN is required. Set this environment variable with your Codacy API token.');
  }
  return {};
});
