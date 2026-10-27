import { nanoid } from 'nanoid';
import { StorageAdapter } from '../db/storage.js';
import { EventEngine } from '../engines/event.engine.js';
import {
  MemoryItem,
  CreateMemoryInput,
  CreateMemoryInputSchema,
  MemoryQuery,
  MemoryTier,
} from './types.js';

export class MemoryEngine {
  private memories = new Map<string, MemoryItem>();

  constructor(
    private storage: StorageAdapter,
    private eventEngine?: EventEngine
  ) {}

  /**
   * Approximate token counter (4 characters per token estimate)
   */
  estimateTokens(text: string): number {
    return Math.max(1, Math.ceil(text.length / 4));
  }

  async remember(
    input: CreateMemoryInput,
    source: string = 'SYSTEM'
  ): Promise<MemoryItem> {
    const validated = CreateMemoryInputSchema.parse(input);
    const tokens = this.estimateTokens(validated.content + ' ' + validated.title);

    const memoryItem: MemoryItem = {
      id: validated.id || `mem_${nanoid(10)}`,
      tier: validated.tier || 'HOT',
      projectId: validated.projectId,
      workspaceId: validated.workspaceId,
      title: validated.title,
      content: validated.content,
      tags: validated.tags || [],
      tokensEstimate: tokens,
      metadata: validated.metadata || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If added to WORKING memory, ensure working memory doesn't exceed 1000 tokens limit.
    // If it does, automatically evict / demote oldest working items to HOT.
    if (memoryItem.tier === 'WORKING' && memoryItem.projectId) {
      await this.enforceWorkingMemoryLimit(memoryItem.projectId, tokens);
    }

    this.memories.set(memoryItem.id, memoryItem);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent(
        'MEMORY_STORED',
        source,
        {
          memoryId: memoryItem.id,
          tier: memoryItem.tier,
          title: memoryItem.title,
          tokensEstimate: memoryItem.tokensEstimate,
        },
        {
          projectId: memoryItem.projectId,
          workspaceId: memoryItem.workspaceId,
        }
      );
    }

    return { ...memoryItem };
  }

  async getMemory(id: string): Promise<MemoryItem | null> {
    const item = this.memories.get(id);
    return item ? { ...item } : null;
  }

  async recall(query: MemoryQuery = {}): Promise<MemoryItem[]> {
    const all = Array.from(this.memories.values());
    const includeCold = query.includeCold ?? false;

    let filtered = all.filter((item) => {
      // RULE: Cold memory must NEVER be automatically returned unless explicitly requested
      if (item.tier === 'COLD' && !includeCold) {
        return false;
      }

      if (query.projectId && item.projectId !== query.projectId) {
        return false;
      }

      if (query.workspaceId && item.workspaceId !== query.workspaceId) {
        return false;
      }

      if (query.tiers && query.tiers.length > 0 && !query.tiers.includes(item.tier)) {
        return false;
      }

      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some((t) => item.tags.includes(t));
        if (!hasTag) return false;
      }

      if (query.query) {
        const q = query.query.toLowerCase();
        const inTitle = item.title.toLowerCase().includes(q);
        const inContent = item.content.toLowerCase().includes(q);
        if (!inTitle && !inContent) return false;
      }

      return true;
    });

    // Sort by recent first
    filtered.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    return filtered.map((m) => ({ ...m }));
  }

  async promote(id: string, targetTier: MemoryTier): Promise<MemoryItem> {
    const item = this.memories.get(id);
    if (!item) throw new Error(`Memory '${id}' not found`);

    item.tier = targetTier;
    item.updatedAt = new Date().toISOString();
    this.memories.set(id, item);
    return { ...item };
  }

  async archiveToCold(id: string): Promise<MemoryItem> {
    return this.promote(id, 'COLD');
  }

  /**
   * Working memory has a hard target size of <= 1000 tokens per project.
   * If adding new items exceeds this, demote older items to HOT memory.
   */
  private async enforceWorkingMemoryLimit(
    projectId: string,
    newTokens: number
  ): Promise<void> {
    const workingItems = Array.from(this.memories.values())
      .filter((m) => m.projectId === projectId && m.tier === 'WORKING')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let currentTotal = workingItems.reduce((acc, cur) => acc + cur.tokensEstimate, 0);

    while (currentTotal + newTokens > 1000 && workingItems.length > 0) {
      const oldest = workingItems.shift()!;
      oldest.tier = 'HOT';
      oldest.updatedAt = new Date().toISOString();
      this.memories.set(oldest.id, oldest);
      currentTotal -= oldest.tokensEstimate;
    }
  }
}
