import { definePresenter, ui } from '@vurb/core';
import { RepositoryModel } from '../models/RepositoryModel.js';
import { REPOSITORY_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const RepositoryPresenter = definePresenter({
  name: 'Repository',
  schema: RepositoryModel.schema,
  rules: [...REPOSITORY_RULES],
  agentLimit: { max: 50, onTruncate: (n) => ui.summary(`⚠️ ${n} repositories omitted. Use search or language filters to narrow results.`) },
  suggestActions: (repo) => {
    const actions: SuggestAction[] = [
      { tool: 'codacy_issues', reason: 'View code quality issues', args: { action: 'list', provider: repo.provider, organization: repo.owner, repository: repo.name } },
      { tool: 'codacy_security', reason: 'Check security findings', args: { action: 'search_repo', provider: repo.provider, organization: repo.owner, repository: repo.name } },
    ];
    if (repo.coverage !== undefined && repo.coverage < 60) {
      actions.push({ tool: 'codacy_files', reason: 'Investigate low coverage files', args: { action: 'list', provider: repo.provider, organization: repo.owner, repository: repo.name } });
    }
    return actions;
  },
});
