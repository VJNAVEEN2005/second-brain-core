import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { SecondBrain } from './sdk/index.js';
import {
  CreateWorkspaceInputSchema,
  CreateProjectInputSchema,
  UpdateProjectInputSchema,
  CreateCheckpointInputSchema,
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
