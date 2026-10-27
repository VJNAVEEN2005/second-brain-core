import { nanoid } from 'nanoid';
import { StorageAdapter } from '../db/storage.js';
import { EventEngine } from './event.engine.js';
import {
  Checkpoint,
  CreateCheckpointInput,
  CreateCheckpointInputSchema,
} from '../types/index.js';

export class CheckpointEngine {
  constructor(
    private storage: StorageAdapter,
    private eventEngine: EventEngine
  ) {}

  async createCheckpoint(
    input: CreateCheckpointInput,
    source: string = 'SYSTEM'
  ): Promise<Checkpoint> {
    const validated = CreateCheckpointInputSchema.parse(input);

    const project = await this.storage.getProject(validated.projectId);
    if (!project) {
      throw new Error(`Project '${validated.projectId}' not found`);
    }

    const checkpoint: Checkpoint = {
      checkpointId: validated.checkpointId || `chk_${nanoid(12)}`,
      projectId: validated.projectId,
      summary: validated.summary,
      progress: validated.progress ?? project.progress,
      currentTask: validated.currentTask ?? project.currentTask,
      nextTask: validated.nextTask ?? project.nextTask,
      decisions: validated.decisions || [],
      blockers: validated.blockers || [],
      openQuestions: validated.openQuestions || [],
      stopReason: validated.stopReason || 'USER_LEFT',
      createdAt: new Date().toISOString(),
    };

    const saved = await this.storage.createCheckpoint(checkpoint);

    // Synchronize project status and progress with latest checkpoint
    await this.storage.updateProject(project.id, {
      progress: saved.progress,
      currentTask: saved.currentTask,
      nextTask: saved.nextTask,
    });

    await this.eventEngine.recordEvent(
      'CHECKPOINT_SAVED',
      source,
      {
        checkpointId: saved.checkpointId,
        projectId: saved.projectId,
        stopReason: saved.stopReason,
        progress: saved.progress,
      },
      { projectId: saved.projectId, workspaceId: project.workspaceId }
    );

    return saved;
  }

  async getCheckpoint(checkpointId: string): Promise<Checkpoint | null> {
    return this.storage.getCheckpoint(checkpointId);
  }

  async getLatestCheckpoint(projectId: string): Promise<Checkpoint | null> {
    return this.storage.getLatestCheckpoint(projectId);
  }

  async listCheckpoints(projectId: string): Promise<Checkpoint[]> {
    return this.storage.listCheckpoints(projectId);
  }
}
