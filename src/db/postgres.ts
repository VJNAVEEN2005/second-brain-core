import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc } from 'drizzle-orm';
import { StorageAdapter } from './storage.js';
import * as schema from './schema.js';
import { Workspace, Project, Checkpoint, BrainEvent } from '../types/index.js';

export class PostgresStorageAdapter implements StorageAdapter {
  private db: ReturnType<typeof drizzle>;
  private client: postgres.Sql;

  constructor(connectionString: string) {
    this.client = postgres(connectionString);
    this.db = drizzle(this.client, { schema });
  }

  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    const [created] = await this.db
      .insert(schema.workspaces)
      .values({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        createdAt: new Date(workspace.createdAt),
        updatedAt: new Date(workspace.updatedAt),
      })
      .returning();
    return created as unknown as Workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const [found] = await this.db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.id, id));
    return (found as unknown as Workspace) || null;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const [found] = await this.db
      .select()
      .from(schema.workspaces)
      .where(eq(schema.workspaces.slug, slug));
    return (found as unknown as Workspace) || null;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    const list = await this.db.select().from(schema.workspaces);
    return list as unknown as Workspace[];
  }

  async createProject(project: Project): Promise<Project> {
    const [created] = await this.db
      .insert(schema.projects)
      .values({
        id: project.id,
        name: project.name,
        status: project.status,
        progress: project.progress,
        workspaceId: project.workspaceId,
        currentTask: project.currentTask,
        nextTask: project.nextTask,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      })
      .returning();
    return created as unknown as Project;
  }

  async getProject(id: string): Promise<Project | null> {
    const [found] = await this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id));
    return (found as unknown as Project) || null;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.progress !== undefined) updateData.progress = updates.progress;
    if (updates.currentTask !== undefined) updateData.currentTask = updates.currentTask;
    if (updates.nextTask !== undefined) updateData.nextTask = updates.nextTask;

    const [updated] = await this.db
      .update(schema.projects)
      .set(updateData)
      .where(eq(schema.projects.id, id))
      .returning();

    return (updated as unknown as Project) || null;
  }

  async deleteProject(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning();
    return deleted.length > 0;
  }

  async listProjects(workspaceId?: string): Promise<Project[]> {
    if (workspaceId) {
      const list = await this.db
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.workspaceId, workspaceId));
      return list as unknown as Project[];
    }
    const list = await this.db.select().from(schema.projects);
    return list as unknown as Project[];
  }

  async createCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint> {
    const [created] = await this.db
      .insert(schema.checkpoints)
      .values({
        checkpointId: checkpoint.checkpointId,
        projectId: checkpoint.projectId,
        summary: checkpoint.summary,
        progress: checkpoint.progress,
        currentTask: checkpoint.currentTask,
        nextTask: checkpoint.nextTask,
        decisions: checkpoint.decisions,
        blockers: checkpoint.blockers,
        openQuestions: checkpoint.openQuestions,
        stopReason: checkpoint.stopReason,
        createdAt: new Date(checkpoint.createdAt),
      })
      .returning();
    return created as unknown as Checkpoint;
  }

  async getCheckpoint(id: string): Promise<Checkpoint | null> {
    const [found] = await this.db
      .select()
      .from(schema.checkpoints)
      .where(eq(schema.checkpoints.checkpointId, id));
    return (found as unknown as Checkpoint) || null;
  }

  async deleteCheckpoint(id: string): Promise<boolean> {
    const deleted = await this.db
      .delete(schema.checkpoints)
      .where(eq(schema.checkpoints.checkpointId, id))
      .returning();
    return deleted.length > 0;
  }

  async getLatestCheckpoint(projectId: string): Promise<Checkpoint | null> {
    const [found] = await this.db
      .select()
      .from(schema.checkpoints)
      .where(eq(schema.checkpoints.projectId, projectId))
      .orderBy(desc(schema.checkpoints.createdAt))
      .limit(1);
    return (found as unknown as Checkpoint) || null;
  }

  async listCheckpoints(projectId: string): Promise<Checkpoint[]> {
    const list = await this.db
      .select()
      .from(schema.checkpoints)
      .where(eq(schema.checkpoints.projectId, projectId))
      .orderBy(desc(schema.checkpoints.createdAt));
    return list as unknown as Checkpoint[];
  }

  async appendEvent(event: BrainEvent): Promise<BrainEvent> {
    const [created] = await this.db
      .insert(schema.events)
      .values({
        id: event.id,
        eventType: event.eventType,
        source: event.source,
        projectId: event.projectId,
        workspaceId: event.workspaceId,
        timestamp: new Date(event.timestamp),
        data: event.data,
      })
      .returning();
    return created as unknown as BrainEvent;
  }

  async listEvents(filter?: { projectId?: string; workspaceId?: string }): Promise<BrainEvent[]> {
    let query = this.db.select().from(schema.events);
    if (filter?.projectId) {
      query = query.where(eq(schema.events.projectId, filter.projectId)) as typeof query;
    }
    const list = await query.orderBy(desc(schema.events.timestamp));
    return list as unknown as BrainEvent[];
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}
