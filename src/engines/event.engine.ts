import { nanoid } from 'nanoid';
import { StorageAdapter } from '../db/storage.js';
import { BrainEvent } from '../types/index.js';

export class EventEngine {
  constructor(private storage: StorageAdapter) {}

  async recordEvent(
    eventType: string,
    source: string = 'SYSTEM',
    data: Record<string, unknown> = {},
    options?: { projectId?: string; workspaceId?: string }
  ): Promise<BrainEvent> {
    const event: BrainEvent = {
      id: `evt_${nanoid(12)}`,
      eventType,
      source,
      projectId: options?.projectId,
      workspaceId: options?.workspaceId,
      timestamp: new Date().toISOString(),
      data,
    };
    return this.storage.appendEvent(event);
  }

  async getEventsForProject(projectId: string): Promise<BrainEvent[]> {
    return this.storage.listEvents({ projectId });
  }

  async getEventsForWorkspace(workspaceId: string): Promise<BrainEvent[]> {
    return this.storage.listEvents({ workspaceId });
  }
}
