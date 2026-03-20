import { definePresenter, ui } from '@vurb/core';
import { GatePolicyModel } from '../models/GatePolicyModel.js';
import { GATE_POLICY_RULES } from '../utils/rules.js';
import type { SuggestAction } from '../utils/types.js';

export const GatePolicyPresenter = definePresenter({
  name: 'GatePolicy',
  schema: GatePolicyModel.schema,
  rules: [...GATE_POLICY_RULES],
  agentLimit: { max: 20, onTruncate: (n) => ui.summary(`⚠️ ${n} policies omitted.`) },
  suggestActions: (policy) => {
    const actions: SuggestAction[] = [];
    if (policy.isDefault) {
      actions.push({
        tool: 'codacy_quality',
        reason: 'This is the default policy — view repository quality settings to see how it is applied',
        args: { action: 'get_settings' },
      });
    }
    return actions;
  },
});
