import { nanoid } from 'nanoid';
import { StorageAdapter } from '../db/storage.js';
import { EventEngine } from './event.engine.js';
import {
  Workspace,
  CreateWorkspaceInput,
  CreateWorkspaceInputSchema,
} from '../types/index.js';

export class WorkspaceEngine {
  constructor(
    private storage: StorageAdapter,
    private eventEngine: EventEngine
  ) {}

  async createWorkspace(
    input: CreateWorkspaceInput,
    source: string = 'SYSTEM'
  ): Promise<Workspace> {
    const validated = CreateWorkspaceInputSchema.parse(input);
    const slug =
      validated.slug ||
      validated.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    const existingSlug = await this.storage.getWorkspaceBySlug(slug);
    if (existingSlug) {
      throw new Error(`Workspace with slug '${slug}' already exists`);
    }

    const workspace: Workspace = {
      id: `ws_${nanoid(10)}`,
      name: validated.name,
      slug,
      description: validated.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.storage.createWorkspace(workspace);

    await this.eventEngine.recordEvent(
      'WORKSPACE_CREATED',
      source,
      { workspaceId: saved.id, name: saved.name, slug: saved.slug },
      { workspaceId: saved.id }
    );

    return saved;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.storage.getWorkspace(id);
  }

  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    return this.storage.getWorkspaceBySlug(slug);
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return this.storage.listWorkspaces();
  }
}
