import { nanoid } from 'nanoid';
import { StorageAdapter } from '../db/storage.js';
import { EventEngine } from '../engines/event.engine.js';
import {
  Branch,
  CreateBranchInput,
  CreateBranchInputSchema,
} from './types.js';

export class BranchEngine {
  private branches = new Map<string, Branch>(); // Key: `${projectId}:${name}`

  constructor(
    private storage: StorageAdapter,
    private eventEngine?: EventEngine
  ) {}

  private getKey(projectId: string, name: string): string {
    return `${projectId}:${name}`;
  }

  async createBranch(
    input: CreateBranchInput,
    source: string = 'SYSTEM'
  ): Promise<Branch> {
    const validated = CreateBranchInputSchema.parse(input);
    const key = this.getKey(validated.projectId, validated.name);

    if (this.branches.has(key)) {
      throw new Error(
        `Branch '${validated.name}' already exists for project '${validated.projectId}'`
      );
    }

    const branch: Branch = {
      id: `br_${nanoid(10)}`,
      projectId: validated.projectId,
      name: validated.name,
      headCheckpointId: validated.fromCheckpointId,
      version: validated.version || '0.1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.branches.set(key, branch);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent(
        'BRANCH_CREATED',
        source,
        {
          branchId: branch.id,
          name: branch.name,
          version: branch.version,
          headCheckpointId: branch.headCheckpointId,
        },
        { projectId: branch.projectId }
      );
    }

    return { ...branch };
  }

  async getBranch(projectId: string, name: string): Promise<Branch | null> {
    const key = this.getKey(projectId, name);
    const branch = this.branches.get(key);
    return branch ? { ...branch } : null;
  }

  async listBranches(projectId: string): Promise<Branch[]> {
    const list: Branch[] = [];
    for (const [key, branch] of this.branches.entries()) {
      if (key.startsWith(`${projectId}:`)) {
        list.push({ ...branch });
      }
    }
    return list;
  }

  async updateBranchHead(
    projectId: string,
    name: string,
    checkpointId: string
  ): Promise<Branch> {
    const key = this.getKey(projectId, name);
    const branch = this.branches.get(key);
    if (!branch) {
      throw new Error(`Branch '${name}' not found for project '${projectId}'`);
    }

    branch.headCheckpointId = checkpointId;
    branch.updatedAt = new Date().toISOString();
    this.branches.set(key, branch);
    return { ...branch };
  }

  async bumpVersion(
    projectId: string,
    name: string,
    type: 'major' | 'minor' | 'patch'
  ): Promise<Branch> {
    const key = this.getKey(projectId, name);
    const branch = this.branches.get(key);
    if (!branch) {
      throw new Error(`Branch '${name}' not found for project '${projectId}'`);
    }

    const [major, minor, patch] = branch.version.split('.').map((n) => parseInt(n, 10));
    let newVersion = '';
    if (type === 'major') newVersion = `${major + 1}.0.0`;
    else if (type === 'minor') newVersion = `${major}.${minor + 1}.0`;
    else if (type === 'patch') newVersion = `${major}.${minor}.${patch + 1}`;

    branch.version = newVersion;
    branch.updatedAt = new Date().toISOString();
    this.branches.set(key, branch);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent(
        'VERSION_BUMPED',
        'SYSTEM',
        { projectId, branch: name, newVersion },
        { projectId }
      );
    }

    return { ...branch };
  }
}
