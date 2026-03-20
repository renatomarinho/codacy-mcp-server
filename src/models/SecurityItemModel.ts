import { defineModel } from '@vurb/core';

export const SecurityItemModel = defineModel('SecurityItem', m => {
  m.casts({
    id:          m.string('SRM item identifier'),
    title:       m.string('Security finding title'),
    status:      m.enum('Status', ['OnTrack', 'DueSoon', 'Overdue', 'ClosedOnTime', 'ClosedLate', 'Ignored']),
    priority:    m.enum('Priority', ['Critical', 'High', 'Medium', 'Low', 'Info']),
    category:    m.string('Security category (e.g., Injection, XSS, CSRF). NOT for code quality — use Issues for that.'),
    scanType:    m.enum('ScanType', ['SAST', 'SCA', 'Secrets', 'IaC', 'CICD', 'DAST', 'PenTesting']),
    filePath:    m.string('File path of the finding'),
    detectedAt:  m.timestamp('When the issue was first detected'),
    tool:        m.string('Security tool name'),
    repository:  m.string('Repository name'),
    cve:         m.string('CVE identifier if applicable'),
  });
});
