import { definePresenter, ui } from '@vurb/core';
import { SecurityItemModel } from '../models/SecurityItemModel.js';
import { SECURITY_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const SecurityPresenter = definePresenter({
  name: 'SecurityItem',
  schema: SecurityItemModel.schema,
  rules: [...SECURITY_RULES],
  // DLP Egress Firewall — mask secrets, tokens, and passwords before they reach the LLM wire
  redactPII: {
    paths: ['*.secret', '*.token', '*.password', '*.apiKey', '*.credentials'],
    censor: '[REDACTED]',
  },
  agentLimit: { max: 100, onTruncate: (n) => ui.summary(`⚠️ ${n} security findings omitted. Use priority, category, or scanType filters to narrow results.`) },
  collectionUi: (items) => [
    ui.summary(`🔒 ${items.length} security finding${items.length !== 1 ? 's' : ''} returned.`),
  ],
  suggestActions: (item) => {
    const actions: SuggestAction[] = [];
    const openStatuses = ['OnTrack', 'DueSoon', 'Overdue'];
    if (openStatuses.includes(item.status)) {
      actions.push({
        tool: 'codacy_security',
        reason: 'Ignore if false positive or accepted risk',
        args: { action: 'ignore', srmItemId: item.id },
      });
    }
    if (item.scanType === 'SCA' && item.cve) {
      actions.push({
        tool: 'codacy_security',
        reason: 'Search SBOM for affected dependency',
        args: { action: 'sbom_search' },
      });
    }
    return actions;
  },
});
