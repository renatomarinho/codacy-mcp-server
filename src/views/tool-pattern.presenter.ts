import { definePresenter, ui } from '@vurb/core';
import { ToolPatternModel } from '../models/ToolPatternModel.js';
import { TOOL_PATTERN_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const ToolPatternPresenter = definePresenter({
  name: 'ToolPattern',
  schema: ToolPatternModel.schema,
  rules: [...TOOL_PATTERN_RULES],
  agentLimit: { max: 100, onTruncate: (n) => ui.summary(`⚠️ ${n} patterns omitted. Use category or language filters to narrow results.`) },
  collectionUi: (items) => [
    ui.summary(`🔧 ${items.length} pattern${items.length !== 1 ? 's' : ''} returned.`),
  ],
  suggestActions: (pattern) => {
    const actions: SuggestAction[] = [];
    if (pattern.enabled === false && pattern.recommended) {
      actions.push({
        tool: 'codacy_tools',
        reason: 'Recommended pattern is disabled — consider enabling it',
        args: { action: 'update_patterns' },
      });
    }
    if (pattern.enabled === true && !pattern.recommended) {
      actions.push({
        tool: 'codacy_tools',
        reason: 'Non-recommended pattern is enabled — consider reviewing',
        args: { action: 'update_patterns' },
      });
    }
    return actions;
  },
});
