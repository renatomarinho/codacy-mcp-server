import { defineModel } from '@vurb/core';

export const GatePolicyModel = defineModel('GatePolicy', m => {
  m.casts({
    id:        m.number('Gate policy ID'),
    name:      m.string('Gate policy name'),
    isDefault: m.boolean('Whether this is the default organization policy'),
    pullRequest: m.object('PR Thresholds', {
      issueThreshold:            m.object('Issue threshold', { threshold: m.number(), minimumSeverity: m.string() }),
      securityIssueThreshold:    m.number('Max new security issues'),
      duplicationThreshold:      m.number('Max duplication percentage'),
      coverageThreshold:         m.number('Minimum diff coverage percentage. CRITICAL: coverage BELOW this fails the gate.'),
      coverageThresholdWithDecimals: m.number('Coverage threshold with decimal precision'),
      diffCoverageThreshold:     m.number('Minimum coverage on new/changed lines'),
    }),
    repository: m.object('Repository Thresholds', {
      issueThreshold:            m.object('Issue threshold', { threshold: m.number(), minimumSeverity: m.string() }),
      securityIssueThreshold:    m.number('Max security issues'),
      duplicationThreshold:      m.number('Max duplication percentage'),
      coverageThreshold:         m.number('Minimum overall coverage'),
      complexityThreshold:       m.number('Maximum average complexity'),
    }),
  });
});
