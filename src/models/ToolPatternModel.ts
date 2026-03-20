import { defineModel } from '@vurb/core';

export const ToolPatternModel = defineModel('ToolPattern', m => {
  m.casts({
    id:             m.string('Pattern identifier'),
    title:          m.string('Pattern display name'),
    category:       m.string('Issue category this pattern detects'),
    severityLevel:  m.string('Default severity level'),
    description:    m.string('What this pattern checks for'),
    enabled:        m.boolean('Whether this pattern is currently enabled'),
    recommended:    m.boolean('Whether Codacy recommends this pattern'),
    languages:      m.list('Languages', { name: m.string() }),
    parameters:     m.list('Parameters', {
      name: m.string(),
      value: m.string(),
      description: m.string(),
    }),
  });
});
