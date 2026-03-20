/**
 * CodacyScopeModel — Shared API scope fields for .fromModel()
 *
 * Eliminates the repetitive .withEnum('provider') / .withString('organization') /
 * .withString('repository') chains across every agent by providing fillable profiles.
 *
 * Profiles:
 *   org       → provider + organization
 *   repo      → provider + organization + repository
 *   branch    → provider + organization + repository + branchName
 *   paginated → provider + organization + repository + cursor + limit
 */

import { defineModel } from '@vurb/core';
import { PROVIDERS } from '../utils/constants.js';

export const CodacyScopeModel = defineModel('CodacyScope', m => {
  m.casts({
    provider:     m.enum('Git provider', [...PROVIDERS]),
    organization: m.string('Organization name'),
    repository:   m.string('Repository name'),
    branchName:   m.string('Branch name'),
    cursor:       m.number('Pagination cursor'),
    limit:        m.number('Results per page (max 100)'),
  });
  m.fillable({
    org:       ['provider', 'organization'],
    repo:      ['provider', 'organization', 'repository'],
    branch:    ['provider', 'organization', 'repository', 'branchName'],
    paginated: ['provider', 'organization', 'repository', 'cursor', 'limit'],
  });
});
