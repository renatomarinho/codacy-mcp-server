import { definePresenter, ui } from '@vurb/core';
import { SbomDependencyModel } from '../models/SbomDependencyModel.js';
import { SBOM_DEPENDENCY_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const SbomDependencyPresenter = definePresenter({
  name: 'SbomDependency',
  schema: SbomDependencyModel.schema,
  rules: [...SBOM_DEPENDENCY_RULES],
  agentLimit: { max: 100, onTruncate: (n) => ui.summary(`⚠️ ${n} dependencies omitted. Use severity or risk filters to narrow results.`) },
  suggestActions: (dep) => {
    const actions: SuggestAction[] = [];
    if (dep.vulnerabilities > 0) {
      actions.push({
        tool: 'codacy_security',
        reason: `${dep.name}@${dep.version} has ${dep.vulnerabilities} known vulnerabilities`,
        args: { action: 'ossf_scorecard', purl: dep.purl },
      });
    }
    return actions;
  },
});
