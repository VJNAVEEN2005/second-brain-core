import { describe, it, expect, beforeEach } from 'vitest';
import { SecondBrain } from '../src/sdk/index.js';
import { buildServer } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Second Brain Core - Phase 3 & 4 Test Suite', () => {
  let brain: SecondBrain;

  beforeEach(() => {
    brain = new SecondBrain();
  });

  describe('4-Tier Memory Architecture', () => {
    it('should store and recall memory items in working, hot, and warm tiers', async () => {
      const ws = await brain.createWorkspace({ name: 'Architecture' });
      const proj = await brain.createProject({
        name: 'Universal Memory',
        workspaceId: ws.id,
      });

      // 1. Working memory
      await brain.remember({
        title: 'Active Task Objective',
        content: 'Implement token budgeting in Resume Engine',
        tier: 'WORKING',
        projectId: proj.id,
      });

      // 2. Hot memory
      await brain.remember({
        title: 'Recent Decision',
        content: 'Adopt Fastify for ultra-low latency routing',
        tier: 'HOT',
        projectId: proj.id,
      });

      // 3. Warm memory
      await brain.remember({
        title: 'Research Note',
        content: 'Survey of modern graph databases comparing Neo4j and Memgraph',
        tier: 'WARM',
        projectId: proj.id,
      });

      const memories = await brain.recall({ projectId: proj.id });
      expect(memories.length).toBe(3);
      expect(memories.some((m) => m.tier === 'WORKING')).toBe(true);
      expect(memories.some((m) => m.tier === 'HOT')).toBe(true);
      expect(memories.some((m) => m.tier === 'WARM')).toBe(true);
    });

    it('should NEVER auto-load cold memory unless explicitly requested', async () => {
      const ws = await brain.createWorkspace({ name: 'Storage' });
      const proj = await brain.createProject({
        name: 'Archive Test',
        workspaceId: ws.id,
      });

      // Active hot memory
      await brain.remember({
        title: 'Current Milestone',
        content: 'Finish Phase 4',
        tier: 'HOT',
        projectId: proj.id,
      });

      // Archived cold memory (e.g. 2-hour conversation log)
      await brain.remember({
        title: 'Old Conversation Chat Log',
        content: 'Historical chat transcript containing 50,000 words of chatter',
        tier: 'COLD',
        projectId: proj.id,
      });

      // Standard recall (auto-load)
      const defaultRecall = await brain.recall({ projectId: proj.id });
      expect(defaultRecall.length).toBe(1);
      expect(defaultRecall[0].title).toBe('Current Milestone');
      expect(defaultRecall.some((m) => m.tier === 'COLD')).toBe(false);

      // Explicit recall requesting cold memory
      const explicitColdRecall = await brain.recall({
        projectId: proj.id,
        includeCold: true,
      });
      expect(explicitColdRecall.length).toBe(2);
      expect(explicitColdRecall.some((m) => m.tier === 'COLD')).toBe(true);
    });

    it('should enforce <= 1000 tokens limit in WORKING memory by demoting oldest to HOT', async () => {
      const ws = await brain.createWorkspace({ name: 'Limits' });
      const proj = await brain.createProject({
        name: 'Token Limit Test',
        workspaceId: ws.id,
      });

      // Add 600 tokens worth of text (2400 chars)
      const largeContent1 = 'A'.repeat(2400);
      const mem1 = await brain.remember({
        title: 'Working Chunk 1',
        content: largeContent1,
        tier: 'WORKING',
        projectId: proj.id,
      });
      expect(mem1.tokensEstimate).toBeGreaterThanOrEqual(600);

      // Add another 600 tokens (2400 chars).
      // Combined = 1200 tokens (> 1000 tokens).
      // mem1 must be automatically demoted to HOT to protect the 1000 tokens limit!
      const largeContent2 = 'B'.repeat(2400);
      const mem2 = await brain.remember({
        title: 'Working Chunk 2',
        content: largeContent2,
        tier: 'WORKING',
        projectId: proj.id,
      });

      const updatedMem1 = await brain.memory.getMemory(mem1.id);
      const updatedMem2 = await brain.memory.getMemory(mem2.id);

      expect(updatedMem1?.tier).toBe('HOT'); // Auto-demoted
      expect(updatedMem2?.tier).toBe('WORKING'); // Newest kept in working
    });
  });

  describe('Cross-Model Continuation Engine (Claude -> Gemini -> GPT -> Copilot -> Codex)', () => {
    let testProjectId: string;

    beforeEach(async () => {
      // 1. User starts project in Claude
      const ws = await brain.createWorkspace({ name: 'CrossModelHandoff' }, 'Claude');
      const proj = await brain.createProject(
        {
          name: 'Universal Brain Layer',
          workspaceId: ws.id,
          currentTask: 'Conflict Resolution',
          nextTask: 'Workspace Isolation',
        },
        'Claude'
      );
      testProjectId = proj.id;

      // 2. Claude works, sets up architecture, then context limit is reached
      await brain.checkpoint(
        {
          projectId: proj.id,
          summary: 'Fastify server and memory routing operational',
          progress: 42,
          currentTask: 'Conflict Resolution',
          nextTask: 'Workspace Isolation',
          decisions: [
            'Use Fastify for high throughput',
            'Model-independent cognitive checkpoints',
            'Graph-based entity relationships',
          ],
          blockers: ['Awaiting conflict detection schema'],
          openQuestions: ['Should 3-way merge be automated or user-confirmed?'],
          stopReason: 'LIMIT_REACHED',
        },
        'Claude'
      );
    });

    it('generates Claude XML-structured continuation prompt', async () => {
      const continuation = await brain.continueFor('Claude', testProjectId);
      expect(continuation.targetModel).toBe('Claude');
      expect(continuation.prompt).toContain('<second_brain_continuation');
      expect(continuation.prompt).toContain('<current_task>Conflict Resolution</current_task>');
      expect(continuation.prompt).toContain('<stopped_because>LIMIT_REACHED</stopped_because>');
      expect(continuation.prompt).toContain('<decision>Use Fastify for high throughput</decision>');
      expect(continuation.metadata.tokenCountEstimate).toBeLessThan(1000); // Token efficient!
    });

    it('generates Gemini grounded markdown continuation prompt', async () => {
      // User switches to Gemini
      const continuation = await brain.continueFor('Gemini', testProjectId);
      expect(continuation.targetModel).toBe('Gemini');
      expect(continuation.prompt).toContain('## 🧠 Second Brain Cognitive Handoff: Universal Brain Layer');
      expect(continuation.prompt).toContain('**Progress**: 42%');
      expect(continuation.prompt).toContain('**Active Task**: Conflict Resolution');
      expect(continuation.prompt).toContain('**Handoff Reason**: LIMIT_REACHED');
      expect(continuation.prompt).toContain('- Use Fastify for high throughput');
      expect(continuation.prompt).toContain('### 🌐 Knowledge Graph Context');
      expect(continuation.metadata.tokenCountEstimate).toBeLessThan(1000);
    });

    it('generates GPT system restoration prompt', async () => {
      // User switches to GPT
      const continuation = await brain.continueFor('GPT', testProjectId);
      expect(continuation.targetModel).toBe('GPT');
      expect(continuation.prompt).toContain('System State Restoration: Second Brain Universal Memory Layer');
      expect(continuation.prompt).toContain('CURRENT TASK: Conflict Resolution');
      expect(continuation.prompt).toContain('Handoff Reason: LIMIT_REACHED');
      expect(continuation.metadata.tokenCountEstimate).toBeLessThan(1000);
    });

    it('generates Copilot in-editor comment header prompt', async () => {
      // User opens VS Code with Copilot
      const continuation = await brain.continueFor('Copilot', testProjectId);
      expect(continuation.targetModel).toBe('Copilot');
      expect(continuation.prompt).toContain('// @second-brain-continuation');
      expect(continuation.prompt).toContain('// Project: Universal Brain Layer (42% Complete)');
      expect(continuation.prompt).toContain('// Current Task: Conflict Resolution');
      expect(continuation.metadata.tokenCountEstimate).toBeLessThan(500);
    });

    it('generates Codex execution scaffolding prompt', async () => {
      // User sends code task to Codex
      const continuation = await brain.continueFor('Codex', testProjectId);
      expect(continuation.targetModel).toBe('Codex');
      expect(continuation.prompt).toContain('Second Brain Cognitive State Header');
      expect(continuation.prompt).toContain('Current Task: Conflict Resolution');
      expect(continuation.metadata.tokenCountEstimate).toBeLessThan(500);
    });
  });

  describe('Fastify REST API - Memory & Continuation Endpoints', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = await buildServer(brain);
    });

    it('POST /api/memory/remember and GET /api/memory/recall work over HTTP', async () => {
      const remRes = await app.inject({
        method: 'POST',
        url: '/api/memory/remember',
        payload: {
          title: 'HTTP Decision',
          content: 'Keep routes decoupled via Fastify plugins',
          tier: 'HOT',
        },
        headers: { 'x-brain-source': 'Gemini' },
      });
      expect(remRes.statusCode).toBe(201);
      const created = JSON.parse(remRes.payload);
      expect(created.title).toBe('HTTP Decision');

      const recallRes = await app.inject({
        method: 'GET',
        url: '/api/memory/recall?query=decoupled',
      });
      expect(recallRes.statusCode).toBe(200);
      const list = JSON.parse(recallRes.payload);
      expect(list.length).toBe(1);
      expect(list[0].title).toBe('HTTP Decision');
    });

    it('POST /api/continuation/:model generates continuation package over HTTP', async () => {
      const ws = await brain.createWorkspace({ name: 'Continuation API' });
      const proj = await brain.createProject({
        name: 'API Cross Model',
        workspaceId: ws.id,
      });

      await brain.checkpoint({
        projectId: proj.id,
        summary: 'REST endpoints tested',
        progress: 88,
        currentTask: 'Deployment',
        nextTask: 'Monitoring',
        stopReason: 'COMPLETED',
      });

      const res = await app.inject({
        method: 'POST',
        url: '/api/continuation/Gemini',
        payload: { projectId: proj.id },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.targetModel).toBe('Gemini');
      expect(json.prompt).toContain('API Cross Model');
      expect(json.metadata.progress).toBe(88);
      expect(json.metadata.currentTask).toBe('Deployment');
    });
  });
});
