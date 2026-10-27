import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { SecondBrain } from './sdk/index.js';
import { getDashboardHtml } from './ui/dashboard.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  CreateWorkspaceInputSchema,
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
  CreateCheckpointInputSchema,
  CreateMemoryInputSchema,
} from './types/index.js';

export async function buildServer(
  brain: SecondBrain,
  options: { logger?: boolean } = {}
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
  });

  await app.register(cors, { origin: true });

  // Visual Dashboard Web UI
  app.get('/', async (_req, reply) => {
    return reply.type('text/html').send(getDashboardHtml());
  });

  app.get('/ui', async (_req, reply) => {
    return reply.type('text/html').send(getDashboardHtml());
  });

  // Official Landing Page Website
  app.get('/website', async (_req, reply) => {
    const candidatePaths = [
      path.resolve(__dirname, '../docs/index.html'),
      path.resolve(__dirname, '../../docs/index.html'),
      path.resolve(process.cwd(), 'docs/index.html'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return reply.type('text/html').send(fs.readFileSync(p, 'utf8'));
      }
    }
    return reply.status(404).send('Landing page not found');
  });

  // Raw Skill File Endpoint
  app.get('/skill', async (_req, reply) => {
    const candidatePaths = [
      path.resolve(__dirname, '../skills/second-brain/SKILL.md'),
      path.resolve(__dirname, '../../skills/second-brain/SKILL.md'),
      path.resolve(process.cwd(), 'skills/second-brain/SKILL.md'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return reply.type('text/markdown').send(fs.readFileSync(p, 'utf8'));
      }
    }
    return reply.status(404).send('Skill not found');
  });

  // Serve official logo asset
  app.get('/assets/logo.png', async (_req, reply) => {
    const candidatePaths = [
      path.resolve(__dirname, '../assets/logo.png'),
      path.resolve(__dirname, '../../assets/logo.png'),
      path.resolve(process.cwd(), 'assets/logo.png'),
      path.join(os.homedir(), '.second-brain', 'assets', 'logo.png'),
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const stream = fs.createReadStream(p);
        return reply.type('image/png').send(stream);
      }
    }
    return reply.status(404).send({ error: 'Logo not found' });
  });

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', service: 'second-brain-core', timestamp: new Date().toISOString() };
  });

  // ==========================================
  // WORKSPACES
  // ==========================================
  app.post('/api/workspaces', async (req, reply) => {
    const parse = CreateWorkspaceInputSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    const workspace = await brain.createWorkspace(parse.data, source);
    return reply.status(201).send(workspace);
  });

  app.get('/api/workspaces', async () => {
    return brain.listWorkspaces();
  });

  app.get<{ Params: { id: string } }>('/api/workspaces/:id', async (req, reply) => {
    const workspace = await brain.getWorkspace(req.params.id);
    if (!workspace) {
      return reply.status(404).send({ error: 'Workspace not found' });
    }
    return workspace;
  });

  // ==========================================
  // PROJECTS
  // ==========================================
  app.post('/api/projects', async (req, reply) => {
    const parse = CreateProjectInputSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    const project = await brain.createProject(parse.data, source);
    return reply.status(201).send(project);
  });

  app.get<{ Querystring: { workspaceId?: string } }>('/api/projects', async (req) => {
    return brain.listProjects(req.query.workspaceId);
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id', async (req, reply) => {
    const project = await brain.getProject(req.params.id);
    if (!project) {
      return reply.status(404).send({ error: 'Project not found' });
    }
    return project;
  });

  app.patch<{ Params: { id: string } }>('/api/projects/:id', async (req, reply) => {
    const parse = UpdateProjectInputSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    const updated = await brain.updateProject(req.params.id, parse.data, source);
    return updated;
  });

  // ==========================================
  // CHECKPOINTS
  // ==========================================
  app.post('/api/checkpoints', async (req, reply) => {
    const parse = CreateCheckpointInputSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    const checkpoint = await brain.checkpoint(parse.data, source);
    return reply.status(201).send(checkpoint);
  });

  app.get<{ Params: { projectId: string } }>(
    '/api/checkpoints/:projectId/latest',
    async (req, reply) => {
      const latest = await brain.getLatestCheckpoint(req.params.projectId);
      if (!latest) {
        return reply.status(404).send({ error: 'No checkpoints found for project' });
      }
      return latest;
    }
  );

  app.get<{ Params: { projectId: string } }>(
    '/api/checkpoints/:projectId',
    async (req) => {
      return brain.listCheckpoints(req.params.projectId);
    }
  );

  // ==========================================
  // RESUME
  // ==========================================
  app.get<{ Querystring: { projectId?: string } }>('/api/resume', async (req, reply) => {
    try {
      const resumePackage = await brain.resume(req.query.projectId);
      return resumePackage;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to resume project';
      return reply.status(404).send({ error: msg });
    }
  });

  // ==========================================
  // GRAPH API
  // ==========================================
  app.post('/api/graph/nodes', async (req, reply) => {
    const body = req.body as { id: string; type: any; properties?: Record<string, unknown> };
    if (!body?.id || !body?.type) {
      return reply.status(400).send({ error: 'id and type are required' });
    }
    const node = await brain.createNode(body.id, body.type, body.properties || {});
    return reply.status(201).send(node);
  });

  app.get<{ Params: { id: string } }>('/api/graph/nodes/:id', async (req, reply) => {
    const node = await brain.getNode(req.params.id);
    if (!node) {
      return reply.status(404).send({ error: 'Node not found' });
    }
    return node;
  });

  app.post('/api/graph/relate', async (req, reply) => {
    const body = req.body as {
      sourceId: string;
      relType: any;
      targetId: string;
      properties?: Record<string, unknown>;
    };
    if (!body?.sourceId || !body?.relType || !body?.targetId) {
      return reply.status(400).send({ error: 'sourceId, relType, and targetId are required' });
    }
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    const rel = await brain.relate(
      body.sourceId,
      body.relType,
      body.targetId,
      body.properties || {},
      source
    );
    return reply.status(201).send(rel);
  });

  app.get<{
    Params: { id: string };
    Querystring: { direction?: 'IN' | 'OUT' | 'BOTH'; relType?: any };
  }>('/api/graph/nodes/:id/neighbors', async (req) => {
    return brain.getNeighbors(req.params.id, {
      direction: req.query.direction,
      relType: req.query.relType,
    });
  });

  app.get<{
    Params: { id: string };
    Querystring: { depth?: string };
  }>('/api/graph/nodes/:id/context', async (req) => {
    const depth = parseInt(req.query.depth || '2', 10);
    return brain.getGraphContext(req.params.id, depth);
  });

  app.get('/api/graph/3d', async () => {
    const raw = await brain.graph.getAll();
    const colors: Record<string, string> = {
      User: '#a855f7',
      Workspace: '#6366f1',
      Project: '#10b981',
      Checkpoint: '#06b6d4',
      Decision: '#f59e0b',
      Task: '#f43f5e',
      Repository: '#3b82f6',
      Channel: '#ec4899',
      Document: '#8b5cf6',
      Meeting: '#14b8a6',
    };

    const nodes = raw.nodes.map((n) => ({
      id: n.id,
      name: (n.properties.name as string) || (n.properties.summary as string) || n.id,
      type: n.type,
      val: n.type === 'Project' ? 15 : n.type === 'Workspace' ? 12 : n.type === 'Checkpoint' ? 9 : 6,
      color: colors[n.type] || '#94a3b8',
      properties: n.properties,
    }));

    const links = raw.relationships.map((r) => ({
      source: r.sourceId,
      target: r.targetId,
      label: r.relType,
      color: 'rgba(255, 255, 255, 0.35)',
    }));

    return { nodes, links };
  });

  // ==========================================
  // 4-TIER MEMORY
  // ==========================================
  app.post('/api/memory/remember', async (req, reply) => {
    const parse = CreateMemoryInputSchema.safeParse(req.body);
    if (!parse.success) {
      return reply.status(400).send({ error: parse.error.format() });
    }
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    const item = await brain.remember(parse.data, source);
    return reply.status(201).send(item);
  });

  app.get<{
    Querystring: {
      projectId?: string;
      workspaceId?: string;
      query?: string;
      includeCold?: string;
    };
  }>('/api/memory/recall', async (req) => {
    return brain.recall({
      projectId: req.query.projectId,
      workspaceId: req.query.workspaceId,
      query: req.query.query,
      includeCold: req.query.includeCold === 'true',
    });
  });

  // ==========================================
  // CROSS-MODEL CONTINUATION
  // ==========================================
  app.post<{
    Params: { model: string };
    Body: { projectId?: string };
  }>('/api/continuation/:model', async (req, reply) => {
    const model = req.params.model;
    const projectId = req.body?.projectId;
    try {
      const continuation = await brain.continueFor(model as any, projectId);
      return reply.status(200).send(continuation);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Continuation generation failed';
      return reply.status(400).send({ error: msg });
    }
  });

  // ==========================================
  // VERSION CONTROL & BRANCHING
  // ==========================================
  app.post<{
    Params: { id: string };
    Body: { name: string; version?: string; fromCheckpointId?: string };
  }>('/api/projects/:id/branches', async (req, reply) => {
    const source = (req.headers['x-brain-source'] as string) || 'SYSTEM';
    if (!req.body?.name) {
      return reply.status(400).send({ error: 'Branch name is required' });
    }
    try {
      const branch = await brain.createBranch(
        {
          projectId: req.params.id,
          name: req.body.name,
          version: req.body.version,
          fromCheckpointId: req.body.fromCheckpointId,
        },
        source
      );
      return reply.status(201).send(branch);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create branch';
      return reply.status(400).send({ error: msg });
    }
  });

  app.get<{ Params: { id: string } }>('/api/projects/:id/branches', async (req) => {
    return brain.listBranches(req.params.id);
  });

  // ==========================================
  // CONFLICT RESOLUTION
  // ==========================================
  app.post<{
    Params: { id: string };
    Body: {
      field: string;
      existingValue: unknown;
      newValue: unknown;
      existingSource: string;
      newSource: string;
    };
  }>('/api/projects/:id/conflicts/detect', async (req, reply) => {
    const conflict = await brain.detectConflict(
      req.params.id,
      req.body.field,
      req.body.existingValue,
      req.body.newValue,
      req.body.existingSource,
      req.body.newSource
    );
    if (!conflict) {
      return reply.status(200).send({ message: 'No conflict detected' });
    }
    return reply.status(200).send(conflict);
  });

  app.get<{
    Params: { id: string };
    Querystring: { status?: any };
  }>('/api/projects/:id/conflicts', async (req) => {
    return brain.listConflicts(req.params.id, req.query.status);
  });

  app.post<{
    Params: { id: string };
    Body: { action: any; customMergedValue?: unknown; resolverSource?: string };
  }>('/api/conflicts/:id/resolve', async (req, reply) => {
    try {
      const resolved = await brain.resolveConflict(req.params.id, req.body);
      return reply.status(200).send(resolved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Resolution failed';
      return reply.status(400).send({ error: msg });
    }
  });

  // ==========================================
  // EVENTS
  // ==========================================
  app.get<{ Querystring: { projectId?: string; workspaceId?: string } }>(
    '/api/events',
    async (req) => {
      return brain.getEvents(req.query);
    }
  );

  return app;
}
