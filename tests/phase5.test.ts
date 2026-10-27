import { describe, it, expect, beforeEach } from 'vitest';
import { SecondBrain } from '../src/sdk/index.js';
import { buildServer } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Second Brain Core - Phase 5 Version Control & Conflict Resolver Test Suite', () => {
  let brain: SecondBrain;

  beforeEach(() => {
    brain = new SecondBrain();
  });

  describe('Version Control & Branching System', () => {
    it('should auto-initialize main branch upon project creation', async () => {
      const ws = await brain.createWorkspace({ name: 'VCS Labs' });
      const proj = await brain.createProject({
        name: 'Brain OS',
        workspaceId: ws.id,
      });

      const branches = await brain.listBranches(proj.id);
      expect(branches.length).toBe(1);
      expect(branches[0].name).toBe('main');
      expect(branches[0].version).toBe('0.1.0');
    });

    it('should create valid feature, research, and experimental branches', async () => {
      const ws = await brain.createWorkspace({ name: 'VCS Labs' });
      const proj = await brain.createProject({
        name: 'Brain OS',
        workspaceId: ws.id,
      });

      const feat = await brain.createBranch({
        projectId: proj.id,
        name: 'feature/graph-optimization',
      });
      const res = await brain.createBranch({
        projectId: proj.id,
        name: 'research/vector-indexing',
      });
      const exp = await brain.createBranch({
        projectId: proj.id,
        name: 'experimental/wasm-runtime',
      });

      expect(feat.name).toBe('feature/graph-optimization');
      expect(res.name).toBe('research/vector-indexing');
      expect(exp.name).toBe('experimental/wasm-runtime');

      const all = await brain.listBranches(proj.id);
      expect(all.length).toBe(4); // main + 3 branches
    });

    it('should reject invalid branch naming patterns', async () => {
      const ws = await brain.createWorkspace({ name: 'VCS Labs' });
      const proj = await brain.createProject({
        name: 'Brain OS',
        workspaceId: ws.id,
      });

      await expect(
        brain.createBranch({
          projectId: proj.id,
          name: 'random-untyped-branch',
        })
      ).rejects.toThrow(/Branch must be main, feature\/\*, research\/\*, or experimental\/\*/);
    });

    it('should bump semantic versions accurately (major, minor, patch)', async () => {
      const ws = await brain.createWorkspace({ name: 'VCS Labs' });
      const proj = await brain.createProject({
        name: 'Versioning Test',
        workspaceId: ws.id,
      });

      // 0.1.0 -> 0.1.1
      const patchBump = await brain.bumpVersion(proj.id, 'main', 'patch');
      expect(patchBump.version).toBe('0.1.1');

      // 0.1.1 -> 0.2.0
      const minorBump = await brain.bumpVersion(proj.id, 'main', 'minor');
      expect(minorBump.version).toBe('0.2.0');

      // 0.2.0 -> 1.0.0
      const majorBump = await brain.bumpVersion(proj.id, 'main', 'major');
      expect(majorBump.version).toBe('1.0.0');
    });
  });

  describe('Conflict Detection Engine', () => {
    it('should detect architectural conflict between models and never overwrite automatically', async () => {
      const ws = await brain.createWorkspace({ name: 'Conflict Labs' });
      const proj = await brain.createProject({
        name: 'Cross-Model Stack',
        workspaceId: ws.id,
      });

      // Spec Example:
      // Claude sets: Backend = NodeJS
      // Gemini sets: Backend = Go
      const conflict = await brain.detectConflict(
        proj.id,
        'architecture.backend',
        'NodeJS',
        'Go',
        'Claude',
        'Gemini'
      );

      expect(conflict).not.toBeNull();
      expect(conflict?.status).toBe('DETECTED');
      expect(conflict?.field).toBe('architecture.backend');
      expect(conflict?.existingValue).toBe('NodeJS');
      expect(conflict?.existingSource).toBe('Claude');
      expect(conflict?.newValue).toBe('Go');
      expect(conflict?.newSource).toBe('Gemini');

      // Event Sourcing record check
      const events = await brain.getEvents({ projectId: proj.id });
      expect(events.some((e) => e.eventType === 'CONFLICT_DETECTED')).toBe(true);
    });

    it('should not flag conflict when proposed value is identical', async () => {
      const ws = await brain.createWorkspace({ name: 'NoConflict' });
      const proj = await brain.createProject({
        name: 'Agreement Stack',
        workspaceId: ws.id,
      });

      const result = await brain.detectConflict(
        proj.id,
        'database',
        'PostgreSQL',
        'PostgreSQL',
        'Claude',
        'GPT'
      );

      expect(result).toBeNull();
    });
  });

  describe('Conflict Resolution Actions', () => {
    let conflictId: string;
    let projId: string;

    beforeEach(async () => {
      const ws = await brain.createWorkspace({ name: 'Resolution Labs' });
      const proj = await brain.createProject({
        name: 'Resolution Test',
        workspaceId: ws.id,
      });
      projId = proj.id;

      const conf = await brain.detectConflict(
        proj.id,
        'architecture.backend',
        'NodeJS',
        'Go',
        'Claude',
        'Gemini'
      );
      conflictId = conf!.id;
    });

    it('KEEP_EXISTING preserves the original choice', async () => {
      const resolved = await brain.resolveConflict(conflictId, {
        action: 'KEEP_EXISTING',
      });

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionAction).toBe('KEEP_EXISTING');
      expect(resolved.resolvedValue).toBe('NodeJS');
    });

    it('ACCEPT_NEW updates to the proposed model choice', async () => {
      const resolved = await brain.resolveConflict(conflictId, {
        action: 'ACCEPT_NEW',
      });

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionAction).toBe('ACCEPT_NEW');
      expect(resolved.resolvedValue).toBe('Go');
    });

    it('MERGE combines decisions or applies customMergedValue', async () => {
      const resolved = await brain.resolveConflict(conflictId, {
        action: 'MERGE',
        customMergedValue: 'Polyglot: NodeJS API Gateway + Go Microservices',
      });

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionAction).toBe('MERGE');
      expect(resolved.resolvedValue).toBe(
        'Polyglot: NodeJS API Gateway + Go Microservices'
      );
    });

    it('USER_REQUIRED flags mandatory human intervention', async () => {
      const resolved = await brain.resolveConflict(conflictId, {
        action: 'USER_REQUIRED',
      });

      expect(resolved.status).toBe('DETECTED'); // Awaiting user
      expect(resolved.resolutionAction).toBe('USER_REQUIRED');
      expect(resolved.resolvedValue).toBeUndefined();
    });
  });

  describe('Fastify REST API - VCS & Conflict Endpoints', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = await buildServer(brain);
    });

    it('POST /api/projects/:id/branches and GET /api/projects/:id/branches', async () => {
      const ws = await brain.createWorkspace({ name: 'HTTP VCS' });
      const proj = await brain.createProject({
        name: 'HTTP Project',
        workspaceId: ws.id,
      });

      const res = await app.inject({
        method: 'POST',
        url: `/api/projects/${proj.id}/branches`,
        payload: { name: 'feature/api-endpoints', version: '0.2.0' },
      });
      expect(res.statusCode).toBe(201);
      const branch = JSON.parse(res.payload);
      expect(branch.name).toBe('feature/api-endpoints');

      const listRes = await app.inject({
        method: 'GET',
        url: `/api/projects/${proj.id}/branches`,
      });
      expect(listRes.statusCode).toBe(200);
      const list = JSON.parse(listRes.payload);
      expect(list.length).toBe(2); // main + feature
    });

    it('POST /api/projects/:id/conflicts/detect and /api/conflicts/:id/resolve over HTTP', async () => {
      const ws = await brain.createWorkspace({ name: 'HTTP Conflicts' });
      const proj = await brain.createProject({
        name: 'HTTP Conf Project',
        workspaceId: ws.id,
      });

      const detectRes = await app.inject({
        method: 'POST',
        url: `/api/projects/${proj.id}/conflicts/detect`,
        payload: {
          field: 'database.orm',
          existingValue: 'Drizzle',
          newValue: 'Prisma',
          existingSource: 'Claude',
          newSource: 'GPT',
        },
      });
      expect(detectRes.statusCode).toBe(200);
      const conflict = JSON.parse(detectRes.payload);
      expect(conflict.id).toMatch(/^conf_/);
      expect(conflict.status).toBe('DETECTED');

      const resolveRes = await app.inject({
        method: 'POST',
        url: `/api/conflicts/${conflict.id}/resolve`,
        payload: { action: 'KEEP_EXISTING' },
      });
      expect(resolveRes.statusCode).toBe(200);
      const resolved = JSON.parse(resolveRes.payload);
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolvedValue).toBe('Drizzle');
    });
  });
});
