import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { StorageAdapter } from './storage.js';
import { Workspace, Project, Checkpoint, BrainEvent } from '../types/index.js';

interface StorageDump {
  workspaces: Workspace[];
  projects: Project[];
  checkpoints: Checkpoint[];
  events: BrainEvent[];
}

export class LocalFileStorageAdapter implements StorageAdapter {
  private filePath: string;
  private workspaces = new Map<string, Workspace>();
  private projects = new Map<string, Project>();
  private checkpoints = new Map<string, Checkpoint>();
  private events: BrainEvent[] = [];
  private isLoaded = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dir = path.join(os.homedir(), '.second-brain');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.filePath = path.join(dir, 'brain.json');
    }
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: StorageDump = JSON.parse(raw);
        if (Array.isArray(parsed.workspaces)) {
          for (const w of parsed.workspaces) this.workspaces.set(w.id, w);
        }
        if (Array.isArray(parsed.projects)) {
          for (const p of parsed.projects) this.projects.set(p.id, p);
        }
        if (Array.isArray(parsed.checkpoints)) {
          for (const c of parsed.checkpoints) this.checkpoints.set(c.checkpointId, c);
        }
        if (Array.isArray(parsed.events)) {
          this.events = parsed.events;
        }
      }
    } catch {
      // In case of read/parse failure, start with fresh state
    }
    this.isLoaded = true;
  }

  private async persistToDisk(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: StorageDump = {
        workspaces: Array.from(this.workspaces.values()),
        projects: Array.from(this.projects.values()),
        checkpoints: Array.from(this.checkpoints.values()),
        events: this.events,
      };
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to persist Second Brain state to local disk:', err);
    }
  }

  async createWorkspace(workspace: Workspace): Promise<Workspace> {
    this.workspaces.set(workspace.id, workspace);
    await this.persistToDisk();
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
    await this.persistToDisk();
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
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    await this.persistToDisk();
    return { ...updated };
  }

  async deleteProject(id: string): Promise<boolean> {
    const deleted = this.projects.delete(id);
    if (deleted) {
      await this.persistToDisk();
    }
    return deleted;
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
    await this.persistToDisk();
    return { ...checkpoint };
  }

  async getCheckpoint(id: string): Promise<Checkpoint | null> {
    const chk = this.checkpoints.get(id);
    return chk ? { ...chk } : null;
  }

  async deleteCheckpoint(id: string): Promise<boolean> {
    const deleted = this.checkpoints.delete(id);
    if (deleted) {
      await this.persistToDisk();
    }
    return deleted;
  }

  async getLatestCheckpoint(projectId: string): Promise<Checkpoint | null> {
    const projectCheckpoints = Array.from(this.checkpoints.values()).filter(
      (c) => c.projectId === projectId
    );
    if (projectCheckpoints.length === 0) return null;
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
    await this.persistToDisk();
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
