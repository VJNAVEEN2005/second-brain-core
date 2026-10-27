import { Workspace, Project, Checkpoint, BrainEvent } from '../types/index.js';

export interface StorageAdapter {
  // Workspaces
  createWorkspace(workspace: Workspace): Promise<Workspace>;
  getWorkspace(id: string): Promise<Workspace | null>;
  getWorkspaceBySlug(slug: string): Promise<Workspace | null>;
  listWorkspaces(): Promise<Workspace[]>;

  // Projects
  createProject(project: Project): Promise<Project>;
  getProject(id: string): Promise<Project | null>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | null>;
  listProjects(workspaceId?: string): Promise<Project[]>;

  // Checkpoints
  createCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint>;
  getCheckpoint(id: string): Promise<Checkpoint | null>;
  getLatestCheckpoint(projectId: string): Promise<Checkpoint | null>;
  listCheckpoints(projectId: string): Promise<Checkpoint[]>;

  // Event Sourcing
  appendEvent(event: BrainEvent): Promise<BrainEvent>;
  listEvents(filter?: { projectId?: string; workspaceId?: string }): Promise<BrainEvent[]>;
}

/**
 * In-Memory Storage Adapter for fast testing, local development, and zero-dependency boot
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private workspaces = new Map<string, Workspace>();
  private projects = new Map<string, Project>();
  private checkpoints = new Map<string, Checkpoint>();
  private events: BrainEvent[] = [];

  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    this.workspaces.set(workspace.id, workspace);
    return { ...workspace };
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    const ws = this.workspaces.get(id);
    return ws ? { ...ws } : null;
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    for (const ws of this.workspaces.values()) {
      if (ws.slug === slug) return { ...ws };
    }
    return null;
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return Array.from(this.workspaces.values());
  }

  async createProject(project: Project): Promise<Project> {
    this.projects.set(project.id, project);
    return { ...project };
  }

  async getProject(id: string): Promise<Project | null> {
    const proj = this.projects.get(id);
    return proj ? { ...proj } : null;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const existing = this.projects.get(id);
    if (!existing) return null;
    const updated: Project = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    this.projects.set(id, updated);
    return { ...updated };
  }

  async listProjects(workspaceId?: string): Promise<Project[]> {
    const all = Array.from(this.projects.values());
    if (workspaceId) {
      return all.filter((p) => p.workspaceId === workspaceId);
    }
    return all;
  }

  async createCheckpoint(checkpoint: Checkpoint): Promise<Checkpoint> {
    this.checkpoints.set(checkpoint.checkpointId, checkpoint);
    return { ...checkpoint };
  }

  async getCheckpoint(id: string): Promise<Checkpoint | null> {
    const chk = this.checkpoints.get(id);
    return chk ? { ...chk } : null;
  }

  async getLatestCheckpoint(projectId: string): Promise<Checkpoint | null> {
    const projectCheckpoints = Array.from(this.checkpoints.values()).filter(
      (c) => c.projectId === projectId
    );
    if (projectCheckpoints.length === 0) return null;
    // Fallback to insertion order (latest inserted first) if timestamps are in the same millisecond
    projectCheckpoints.reverse();
    projectCheckpoints.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return { ...projectCheckpoints[0] };
  }

  async listCheckpoints(projectId: string): Promise<Checkpoint[]> {
    const projectCheckpoints = Array.from(this.checkpoints.values()).filter(
      (c) => c.projectId === projectId
    );
    projectCheckpoints.reverse();
    projectCheckpoints.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return projectCheckpoints.map((c) => ({ ...c }));
  }

  async appendEvent(event: BrainEvent): Promise<BrainEvent> {
    this.events.push(event);
    return { ...event };
  }

  async listEvents(filter?: { projectId?: string; workspaceId?: string }): Promise<BrainEvent[]> {
    let result = [...this.events];
    if (filter?.projectId) {
      result = result.filter((e) => e.projectId === filter.projectId);
    }
    if (filter?.workspaceId) {
      result = result.filter((e) => e.workspaceId === filter.workspaceId);
    }
    return result;
  }
}
