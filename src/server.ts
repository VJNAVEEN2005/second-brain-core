import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { SecondBrain } from './sdk/index.js';
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
