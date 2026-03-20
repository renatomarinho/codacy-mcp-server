/**
 * Shared type definitions used across the Vurb.ts MVA layers.
 */

/**
 * HATEOAS action suggestion returned by Presenter suggestActions.
 * Extracted to eliminate duplication across 10+ presenter files.
 */
export interface SuggestAction {
  tool: string;
  reason: string;
  args: Record<string, unknown>;
}
