/**
 * Vurb.ts initialization — context-typed factory for all tools, prompts, and routers.
 */

import { initVurb } from '@vurb/core';
import type { CodacyContext } from './context.js';

export const f = initVurb<CodacyContext>();
export const registry = f.registry();
