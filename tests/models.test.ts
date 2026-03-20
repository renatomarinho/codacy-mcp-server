/**
 * Models — Schema validity, fillable profiles, constants usage.
 *
 * An QA engineer smiles when: a model silently drops a field
 * from a fillable profile and the agent starts hallucinating parameters.
 */

import { describe, it, expect } from 'vitest';
import { ZodType } from 'zod';

// ── Models ─────────────────────────────────────────────────────────────────
import { CodacyScopeModel } from '../src/models/CodacyScopeModel.js';
import { OrganizationModel } from '../src/models/OrganizationModel.js';
import { RepositoryModel } from '../src/models/RepositoryModel.js';
import { IssueModel } from '../src/models/IssueModel.js';
import { SecurityItemModel } from '../src/models/SecurityItemModel.js';
import { PullRequestModel } from '../src/models/PullRequestModel.js';
import { FileModel } from '../src/models/FileModel.js';
import { CommitModel } from '../src/models/CommitModel.js';
import { ToolPatternModel } from '../src/models/ToolPatternModel.js';
import { GatePolicyModel } from '../src/models/GatePolicyModel.js';
import { IssueOverviewModel } from '../src/models/IssueOverviewModel.js';
import { SbomDependencyModel } from '../src/models/SbomDependencyModel.js';

// ── Constants ──────────────────────────────────────────────────────────────
import { PROVIDERS, ISSUE_LEVELS, SEVERITY_LEVELS, SCAN_TYPES, IGNORE_REASONS, SBOM_RISK_CATEGORIES } from '../src/utils/constants.js';

const ALL_MODELS = [
  { name: 'CodacyScope',    model: CodacyScopeModel },
  { name: 'Organization',   model: OrganizationModel },
  { name: 'Repository',     model: RepositoryModel },
  { name: 'Issue',           model: IssueModel },
  { name: 'SecurityItem',   model: SecurityItemModel },
  { name: 'PullRequest',    model: PullRequestModel },
  { name: 'File',            model: FileModel },
  { name: 'Commit',          model: CommitModel },
  { name: 'ToolPattern',    model: ToolPatternModel },
  { name: 'GatePolicy',     model: GatePolicyModel },
  { name: 'IssueOverview',  model: IssueOverviewModel },
  { name: 'SbomDependency', model: SbomDependencyModel },
];

// ── Every Model produces a valid ZodType ────────────────────────────────────

describe('Models — Schema Validity', () => {
  for (const { name, model } of ALL_MODELS) {
    it(`${name} has a valid .schema (ZodType)`, () => {
      expect(model).toBeDefined();
      expect(model.schema).toBeDefined();
      expect(model.schema).toBeInstanceOf(ZodType);
    });
  }
});

// ── CodacyScopeModel — Fillable Profiles ────────────────────────────────────

describe('CodacyScopeModel — Fillable Profiles', () => {
  const profiles = CodacyScopeModel.input;

  it('exposes fillable profiles via .input', () => {
    expect(profiles).toBeDefined();
    expect(typeof profiles).toBe('object');
  });

  it('has "org" profile with exactly [provider, organization]', () => {
    expect(profiles.org).toBeDefined();
    expect(profiles.org).toEqual(['provider', 'organization']);
  });

  it('has "repo" profile with exactly [provider, organization, repository]', () => {
    expect(profiles.repo).toBeDefined();
    expect(profiles.repo).toEqual(['provider', 'organization', 'repository']);
  });

  it('has "branch" profile extending repo with branchName', () => {
    expect(profiles.branch).toBeDefined();
    expect(profiles.branch).toEqual(['provider', 'organization', 'repository', 'branchName']);
  });

  it('has "paginated" profile extending repo with cursor + limit', () => {
    expect(profiles.paginated).toBeDefined();
    expect(profiles.paginated).toEqual(['provider', 'organization', 'repository', 'cursor', 'limit']);
  });

  it('every profile field exists in the model casts', () => {
    const allFields = new Set(Object.values(profiles).flat());
    const schema = CodacyScopeModel.schema;
    // The schema shape should accept all the declared fields
    for (const field of allFields) {
      expect(schema.shape).toHaveProperty(field);
    }
  });
});

// ── Constants are non-empty and consistent ──────────────────────────────────

describe('Constants', () => {
  it('PROVIDERS is non-empty and contains gh, gl, bb', () => {
    expect(PROVIDERS.length).toBe(3);
    expect(PROVIDERS).toContain('gh');
    expect(PROVIDERS).toContain('gl');
    expect(PROVIDERS).toContain('bb');
  });

  it('ISSUE_LEVELS is non-empty', () => {
    expect(ISSUE_LEVELS.length).toBeGreaterThan(0);
    expect(ISSUE_LEVELS).toContain('Error');
    expect(ISSUE_LEVELS).toContain('Warning');
    expect(ISSUE_LEVELS).toContain('Info');
  });

  it('SEVERITY_LEVELS has Critical through Info', () => {
    expect(SEVERITY_LEVELS.length).toBe(5);
    expect(SEVERITY_LEVELS).toContain('Critical');
    expect(SEVERITY_LEVELS).toContain('High');
    expect(SEVERITY_LEVELS).toContain('Medium');
    expect(SEVERITY_LEVELS).toContain('Low');
    expect(SEVERITY_LEVELS).toContain('Info');
  });

  it('SCAN_TYPES covers all expected types', () => {
    expect(SCAN_TYPES.length).toBe(6);
    for (const st of ['SAST', 'SCA', 'Secrets', 'IaC', 'CICD', 'DAST']) {
      expect(SCAN_TYPES).toContain(st);
    }
  });

  it('IGNORE_REASONS is non-empty', () => {
    expect(IGNORE_REASONS.length).toBeGreaterThan(0);
    for (const r of ['FalsePositive', 'WontFix', 'NotRelevant']) {
      expect(IGNORE_REASONS).toContain(r);
    }
  });

  it('SBOM_RISK_CATEGORIES is non-empty', () => {
    expect(SBOM_RISK_CATEGORIES.length).toBe(3);
  });
});
