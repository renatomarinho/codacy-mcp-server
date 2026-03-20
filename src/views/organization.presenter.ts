import { definePresenter, ui } from '@vurb/core';
import { OrganizationModel } from '../models/OrganizationModel.js';
import { ORGANIZATION_RULES } from '../utils/rules.js';

export const OrganizationPresenter = definePresenter({
  name: 'Organization',
  schema: OrganizationModel.schema,
  rules: [...ORGANIZATION_RULES],
  agentLimit: { max: 50, onTruncate: (n) => ui.summary(`⚠️ ${n} organizations omitted. Use provider filter to narrow results.`) },
  suggestActions: (org) => [
    { tool: 'codacy_organizations', reason: `List repositories in ${org.name}`, args: { action: 'list_repos', provider: org.provider, organization: org.name } },
  ],
});
