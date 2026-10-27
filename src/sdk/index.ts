import { StorageAdapter, MemoryStorageAdapter } from '../db/storage.js';
import { PostgresStorageAdapter } from '../db/postgres.js';
import { EventEngine } from '../engines/event.engine.js';
import { WorkspaceEngine } from '../engines/workspace.engine.js';
import { ProjectEngine } from '../engines/project.engine.js';
import { CheckpointEngine } from '../engines/checkpoint.engine.js';
import {
  Workspace,
  CreateWorkspaceInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Checkpoint,
  CreateCheckpointInput,
  ResumePackage,
  BrainEvent,
} from '../types/index.js';

export interface SecondBrainConfig {
  databaseUrl?: string;
  storage?: StorageAdapter;
  defaultSource?: string;
}

export class SecondBrain {
  public storage: StorageAdapter;
  public events: EventEngine;
  public workspaces: WorkspaceEngine;
  public projects: ProjectEngine;
  public checkpoints: CheckpointEngine;
  private defaultSource: string;

  constructor(config: SecondBrainConfig = {}) {
    if (config.storage) {
      this.storage = config.storage;
    } else if (config.databaseUrl) {
      this.storage = new PostgresStorageAdapter(config.databaseUrl);
    } else {
      this.storage = new MemoryStorageAdapter();
    }

    this.defaultSource = config.defaultSource || 'SYSTEM';
    this.events = new EventEngine(this.storage);
    this.workspaces = new WorkspaceEngine(this.storage, this.events);
    this.projects = new ProjectEngine(this.storage, this.events);
    this.checkpoints = new CheckpointEngine(this.storage, this.events);
  }

  // ==========================================
  // WORKSPACE API
  // ==========================================
  async createWorkspace(
    input: CreateWorkspaceInput,
    source?: string
  ): Promise<Workspace> {
    return this.workspaces.createWorkspace(input, source || this.defaultSource);
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.getWorkspace(id);
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return this.workspaces.listWorkspaces();
  }

  // ==========================================
  // PROJECT API
  // ==========================================
  async createProject(
    input: CreateProjectInput,
    source?: string
  ): Promise<Project> {
    return this.projects.createProject(input, source || this.defaultSource);
  }

  async updateProject(
    id: string,
    updates: UpdateProjectInput,
    source?: string
  ): Promise<Project> {
    return this.projects.updateProject(id, updates, source || this.defaultSource);
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projects.getProject(id);
  }

  async listProjects(workspaceId?: string): Promise<Project[]> {
    return this.projects.listProjects(workspaceId);
  }

  // ==========================================
  // CHECKPOINT API
  // ==========================================
  async checkpoint(
    input: CreateCheckpointInput,
    source?: string
  ): Promise<Checkpoint> {
    return this.checkpoints.createCheckpoint(input, source || this.defaultSource);
  }

  async getLatestCheckpoint(projectId: string): Promise<Checkpoint | null> {
    return this.checkpoints.getLatestCheckpoint(projectId);
  }

  async listCheckpoints(projectId: string): Promise<Checkpoint[]> {
    return this.checkpoints.listCheckpoints(projectId);
  }

  // ==========================================
  // RESUME ENGINE (PHASE 1 IMPLEMENTATION)
  // ==========================================
  async resume(projectId?: string): Promise<ResumePackage> {
    let targetProject: Project | null = null;

    if (projectId) {
      targetProject = await this.projects.getProject(projectId);
    } else {
      // Find the most recently active project
      const allProjects = await this.projects.listProjects();
      if (allProjects.length > 0) {
        targetProject = allProjects[allProjects.length - 1];
      }
    }

    if (!targetProject) {
      throw new Error('No active project found to resume');
    }

    const latestCheckpoint = await this.checkpoints.getLatestCheckpoint(
      targetProject.id
    );

    return {
      project: targetProject.name,
      projectId: targetProject.id,
      workspaceId: targetProject.workspaceId,
      completion: latestCheckpoint ? latestCheckpoint.progress : targetProject.progress,
      currentTask: latestCheckpoint
        ? latestCheckpoint.currentTask
        : targetProject.currentTask,
      nextTask: latestCheckpoint ? latestCheckpoint.nextTask : targetProject.nextTask,
      stopReason: latestCheckpoint ? latestCheckpoint.stopReason : 'USER_LEFT',
      summary: latestCheckpoint
        ? latestCheckpoint.summary
        : `Resuming project ${targetProject.name}`,
      decisions: latestCheckpoint ? latestCheckpoint.decisions : [],
      blockers: latestCheckpoint ? latestCheckpoint.blockers : [],
      openQuestions: latestCheckpoint ? latestCheckpoint.openQuestions : [],
      timestamp: new Date().toISOString(),
    };
  }

  // ==========================================
  // EVENTS API
  // ==========================================
  async getEvents(filter?: {
    projectId?: string;
    workspaceId?: string;
  }): Promise<BrainEvent[]> {
    if (filter?.projectId) {
      return this.events.getEventsForProject(filter.projectId);
    }
    if (filter?.workspaceId) {
      return this.events.getEventsForWorkspace(filter.workspaceId);
    }
    return this.storage.listEvents();
  }
}
