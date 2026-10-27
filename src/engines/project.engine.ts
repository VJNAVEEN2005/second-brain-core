import { nanoid } from 'nanoid';
import { StorageAdapter } from '../db/storage.js';
import { EventEngine } from './event.engine.js';
import {
  Project,
  CreateProjectInput,
  CreateProjectInputSchema,
  UpdateProjectInput,
  UpdateProjectInputSchema,
} from '../types/index.js';

export class ProjectEngine {
  constructor(
    private storage: StorageAdapter,
    private eventEngine: EventEngine
  ) {}

  async createProject(
    input: CreateProjectInput,
    source: string = 'SYSTEM'
  ): Promise<Project> {
    const validated = CreateProjectInputSchema.parse(input);

    const workspace = await this.storage.getWorkspace(validated.workspaceId);
    if (!workspace) {
      throw new Error(`Workspace '${validated.workspaceId}' not found`);
    }

    const project: Project = {
      id: validated.id || `proj_${nanoid(10)}`,
      name: validated.name,
      status: validated.status || 'IN_PROGRESS',
      progress: validated.progress ?? 0,
      workspaceId: validated.workspaceId,
      currentTask: validated.currentTask || '',
      nextTask: validated.nextTask || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.storage.createProject(project);

    await this.eventEngine.recordEvent(
      'PROJECT_CREATED',
      source,
      {
        projectId: saved.id,
        name: saved.name,
        workspaceId: saved.workspaceId,
        status: saved.status,
      },
      { projectId: saved.id, workspaceId: saved.workspaceId }
    );

    return saved;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.storage.getProject(id);
  }

  async updateProject(
    id: string,
    updates: UpdateProjectInput,
    source: string = 'SYSTEM'
  ): Promise<Project> {
    const validated = UpdateProjectInputSchema.parse(updates);
    const existing = await this.storage.getProject(id);
    if (!existing) {
      throw new Error(`Project '${id}' not found`);
    }

    const updated = await this.storage.updateProject(id, validated);
    if (!updated) {
      throw new Error(`Failed to update project '${id}'`);
    }

    await this.eventEngine.recordEvent(
      'PROJECT_UPDATED',
      source,
      { projectId: id, updates: validated },
      { projectId: id, workspaceId: existing.workspaceId }
    );

    return updated;
  }

  async listProjects(workspaceId?: string): Promise<Project[]> {
    return this.storage.listProjects(workspaceId);
  }
}
