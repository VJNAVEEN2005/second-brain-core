import { describe, it, expect, beforeEach } from 'vitest';
import { SecondBrain } from '../src/sdk/index.js';
import { buildServer } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Second Brain Core - Phase 1 Test Suite', () => {
  let brain: SecondBrain;

  beforeEach(() => {
    brain = new SecondBrain(); // uses In-Memory adapter by default
  });

  describe('Workspace System', () => {
    it('should create a workspace with auto-generated slug', async () => {
      const ws = await brain.createWorkspace(
        { name: 'Startup Labs', description: 'AI startups and experiments' },
        'Claude'
      );

      expect(ws.id).toMatch(/^ws_/);
      expect(ws.name).toBe('Startup Labs');
      expect(ws.slug).toBe('startup-labs');
      expect(ws.description).toBe('AI startups and experiments');

      // Verify event was logged
      const events = await brain.getEvents({ workspaceId: ws.id });
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('WORKSPACE_CREATED');
      expect(events[0].source).toBe('Claude');
    });

    it('should disallow duplicate slugs', async () => {
      await brain.createWorkspace({ name: 'Personal' });
      await expect(brain.createWorkspace({ name: 'Personal' })).rejects.toThrow(
        /already exists/
      );
    });

    it('should list all workspaces', async () => {
      await brain.createWorkspace({ name: 'Personal' });
      await brain.createWorkspace({ name: 'Research' });
      await brain.createWorkspace({ name: 'YouTube' });

      const list = await brain.listWorkspaces();
      expect(list.length).toBe(3);
      expect(list.map((w) => w.slug)).toContain('personal');
      expect(list.map((w) => w.slug)).toContain('research');
      expect(list.map((w) => w.slug)).toContain('youtube');
    });
  });

  describe('Project System', () => {
    it('should create a project attached to a workspace', async () => {
      const ws = await brain.createWorkspace({ name: 'Engineering' });
      const proj = await brain.createProject(
        {
          name: 'Universal Memory Layer',
          workspaceId: ws.id,
          currentTask: 'Setup Drizzle ORM',
          nextTask: 'Fastify API Routes',
        },
        'Gemini'
      );

      expect(proj.id).toMatch(/^proj_/);
      expect(proj.name).toBe('Universal Memory Layer');
      expect(proj.workspaceId).toBe(ws.id);
      expect(proj.progress).toBe(0);
      expect(proj.status).toBe('IN_PROGRESS');
      expect(proj.currentTask).toBe('Setup Drizzle ORM');

      const events = await brain.getEvents({ projectId: proj.id });
      expect(events.some((e) => e.eventType === 'PROJECT_CREATED')).toBe(true);
      expect(events.some((e) => e.source === 'Gemini')).toBe(true);
    });

    it('should throw when creating project in non-existent workspace', async () => {
      await expect(
        brain.createProject({
          name: 'Ghost Project',
          workspaceId: 'ws_does_not_exist',
        })
      ).rejects.toThrow(/not found/);
    });

    it('should update project status and progress', async () => {
      const ws = await brain.createWorkspace({ name: 'Core' });
      const proj = await brain.createProject({
        name: 'Task Orchestrator',
        workspaceId: ws.id,
      });

      const updated = await brain.updateProject(
        proj.id,
        {
          progress: 50,
          currentTask: 'Writing unit tests',
          nextTask: 'Deploy to Cloud',
        },
        'Claude'
      );

      expect(updated.progress).toBe(50);
      expect(updated.currentTask).toBe('Writing unit tests');
      expect(updated.nextTask).toBe('Deploy to Cloud');
    });
  });

  describe('Checkpoint Engine & Cognitive Snapshots', () => {
    it('should save checkpoint, sync project state, and capture stop reason', async () => {
      const ws = await brain.createWorkspace({ name: 'Production' });
      const proj = await brain.createProject({
        name: 'Second Brain MVP',
        workspaceId: ws.id,
        progress: 10,
      });

      const checkpoint = await brain.checkpoint(
        {
          projectId: proj.id,
          summary: 'Fastify server and memory storage completed',
          progress: 42,
          currentTask: 'Conflict Resolution',
          nextTask: 'Workspace Isolation',
          decisions: ['Use Fastify over Express', 'Drizzle ORM for PostgreSQL'],
          blockers: ['Awaiting Neo4j instance connection'],
          openQuestions: ['Should vector search be synchronous or queued?'],
          stopReason: 'LIMIT_REACHED',
        },
        'Claude'
      );

      expect(checkpoint.checkpointId).toMatch(/^chk_/);
      expect(checkpoint.stopReason).toBe('LIMIT_REACHED');
      expect(checkpoint.progress).toBe(42);
      expect(checkpoint.decisions).toContain('Use Fastify over Express');

      // Verify project progress synced automatically
      const refreshedProject = await brain.getProject(proj.id);
      expect(refreshedProject?.progress).toBe(42);
      expect(refreshedProject?.currentTask).toBe('Conflict Resolution');
      expect(refreshedProject?.nextTask).toBe('Workspace Isolation');
    });

    it('should retrieve the latest checkpoint', async () => {
      const ws = await brain.createWorkspace({ name: 'Lab' });
      const proj = await brain.createProject({
        name: 'Multi-Checkpoint Test',
        workspaceId: ws.id,
      });

      await brain.checkpoint({
        projectId: proj.id,
        summary: 'First checkpoint',
        progress: 20,
        stopReason: 'USER_LEFT',
      });

      await brain.checkpoint({
        projectId: proj.id,
        summary: 'Second checkpoint',
        progress: 60,
        currentTask: 'Graph Engine integration',
        nextTask: 'Resume Engine',
        stopReason: 'LIMIT_REACHED',
      });

      const latest = await brain.getLatestCheckpoint(proj.id);
      expect(latest?.summary).toBe('Second checkpoint');
      expect(latest?.progress).toBe(60);
      expect(latest?.stopReason).toBe('LIMIT_REACHED');
    });
  });

  describe('Resume Engine & Cross-Model Cognitive Handoff', () => {
    it('should enable seamless model switching without chat replay (Claude -> Gemini)', async () => {
      // 1. Claude starts project and works
      const ws = await brain.createWorkspace({ name: 'CrossModel' }, 'Claude');
      const proj = await brain.createProject(
        {
          name: 'Second Brain',
          workspaceId: ws.id,
          currentTask: 'Building Models',
        },
        'Claude'
      );

      // 2. Claude hits context limit and creates a checkpoint
      await brain.checkpoint(
        {
          projectId: proj.id,
          summary: 'Built identity and workspace modules',
          progress: 42,
          currentTask: 'Conflict Resolution',
          nextTask: 'Workspace Isolation',
          decisions: ['PostgreSQL for event store', 'Neo4j for entities'],
          blockers: ['Need conflict resolution algorithm'],
          openQuestions: ['How to handle 3-way merge?'],
          stopReason: 'LIMIT_REACHED',
        },
        'Claude'
      );

      // 3. User switches to Gemini and asks: "Continue Project"
      const resumePackage = await brain.resume(proj.id);

      // 4. Gemini immediately knows the exact cognitive state
      expect(resumePackage.project).toBe('Second Brain');
      expect(resumePackage.completion).toBe(42);
      expect(resumePackage.currentTask).toBe('Conflict Resolution');
      expect(resumePackage.nextTask).toBe('Workspace Isolation');
      expect(resumePackage.stopReason).toBe('LIMIT_REACHED');
      expect(resumePackage.decisions).toContain('Neo4j for entities');
      expect(resumePackage.blockers).toContain('Need conflict resolution algorithm');
    });
  });

  describe('Fastify REST API', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = await buildServer(brain);
    });

    it('GET /health returns 200 ok', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.status).toBe('ok');
    });

    it('POST and GET /api/workspaces works over HTTP', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/workspaces',
        payload: { name: 'HTTP Workspace', description: 'Testing over Fastify' },
        headers: { 'x-brain-source': 'Codex' },
      });
      expect(createRes.statusCode).toBe(201);
      const created = JSON.parse(createRes.payload);
      expect(created.slug).toBe('http-workspace');

      const listRes = await app.inject({ method: 'GET', url: '/api/workspaces' });
      expect(listRes.statusCode).toBe(200);
      const list = JSON.parse(listRes.payload);
      expect(list.some((w: any) => w.slug === 'http-workspace')).toBe(true);
    });

    it('GET /api/resume returns resume package over HTTP', async () => {
      const ws = await brain.createWorkspace({ name: 'API Workspace' });
      const proj = await brain.createProject({
        name: 'API Project',
        workspaceId: ws.id,
        progress: 75,
        currentTask: 'Endpoint Validation',
        nextTask: 'Ship MVP',
      });

      await brain.checkpoint({
        projectId: proj.id,
        summary: 'Endpoints verified',
        progress: 80,
        currentTask: 'Write Documentation',
        nextTask: 'Publish Release',
        stopReason: 'COMPLETED',
      });

      const resumeRes = await app.inject({
        method: 'GET',
        url: `/api/resume?projectId=${proj.id}`,
      });
      expect(resumeRes.statusCode).toBe(200);
      const resume = JSON.parse(resumeRes.payload);
      expect(resume.project).toBe('API Project');
      expect(resume.completion).toBe(80);
      expect(resume.currentTask).toBe('Write Documentation');
      expect(resume.stopReason).toBe('COMPLETED');
    });
  });
});
