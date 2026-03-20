import { defineModel } from '@vurb/core';

export const IssueModel = defineModel('Issue', m => {
  m.casts({
    issueId:       m.string('Unique issue identifier'),
    filePath:      m.string('File path where the issue was found'),
    message:       m.string('Human-readable issue description'),
    patternId:     m.string('Pattern identifier that triggered this issue'),
    toolName:      m.string('Analysis tool name (e.g., ESLint, PMD)'),
    level:         m.enum('Severity', ['Error', 'Warning', 'Info']).default('Warning'),
    category:      m.enum('Category', [
      'Security', 'ErrorProne', 'Performance', 'Compatibility',
      'UnusedCode', 'Complexity', 'CodeStyle', 'Documentation',
      'BestPractice', 'Comprehensibility',
    ]),
    lineNumber:    m.number('Line number in the file'),
    suggestion:    m.string('Suggested fix or explanation'),
    hasQuickfix:   m.boolean('Whether an auto-fix patch is available'),
  });
});
