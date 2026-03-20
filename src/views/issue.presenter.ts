import { definePresenter, ui } from '@vurb/core';
import { IssueModel } from '../models/IssueModel.js';
import { ISSUE_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const IssuePresenter = definePresenter({
  name: 'Issue',
  schema: IssueModel.schema,
  rules: [...ISSUE_RULES],
  agentLimit: { max: 100, onTruncate: (n) => ui.summary(`⚠️ ${n} issues omitted. Use severity, category, or language filters to narrow results.`) },
  collectionUi: (items) => [
    ui.summary(`📋 ${items.length} issue${items.length !== 1 ? 's' : ''} returned.`),
  ],
  suggestActions: (issue) => {
    const actions: SuggestAction[] = [];
    if (issue.hasQuickfix) {
      actions.push({
        tool: 'codacy_issues',
        reason: 'Auto-fix patch available — download and apply',
        args: { action: 'quickfix_patch' },
      });
    }
    if (issue.level !== 'Error') {
      actions.push({
        tool: 'codacy_issues',
        reason: 'Mark as ignored if false positive or not relevant',
        args: { action: 'ignore', issueId: issue.issueId },
      });
    }
    return actions;
  },
});
