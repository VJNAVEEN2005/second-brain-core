import { nanoid } from 'nanoid';
import { EventEngine } from '../engines/event.engine.js';
import {
  ConflictRecord,
  ConflictAction,
  ConflictStatus,
  ResolveConflictInput,
  ResolveConflictInputSchema,
} from './types.js';

export class ConflictEngine {
  private conflicts = new Map<string, ConflictRecord>();

  constructor(private eventEngine?: EventEngine) {}

  /**
   * Evaluates whether two values conflict.
   * "The framework must never overwrite automatically."
   */
  async detectConflict(
    projectId: string,
    field: string,
    existingValue: unknown,
    newValue: unknown,
    existingSource: string,
    newSource: string
  ): Promise<ConflictRecord | null> {
    const existingStr = JSON.stringify(existingValue);
    const newStr = JSON.stringify(newValue);

    // If identical, there is no conflict
    if (existingStr === newStr) {
      return null;
    }

    const conflict: ConflictRecord = {
      id: `conf_${nanoid(10)}`,
      projectId,
      field,
      existingValue,
      existingSource,
      newValue,
      newSource,
      status: 'DETECTED',
      detectedAt: new Date().toISOString(),
    };

    this.conflicts.set(conflict.id, conflict);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent(
        'CONFLICT_DETECTED',
        newSource,
        {
          conflictId: conflict.id,
          field,
          existingSource,
          existingValue,
          newSource,
          newValue,
        },
        { projectId }
      );
    }

    return { ...conflict };
  }

  async getConflict(conflictId: string): Promise<ConflictRecord | null> {
    const record = this.conflicts.get(conflictId);
    return record ? { ...record } : null;
  }

  async listConflicts(
    projectId: string,
    status?: ConflictStatus
  ): Promise<ConflictRecord[]> {
    const list: ConflictRecord[] = [];
    for (const record of this.conflicts.values()) {
      if (record.projectId === projectId) {
        if (!status || record.status === status) {
          list.push({ ...record });
        }
      }
    }
    return list;
  }

  async resolveConflict(
    conflictId: string,
    input: ResolveConflictInput
  ): Promise<ConflictRecord> {
    const validated = ResolveConflictInputSchema.parse(input);
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict record '${conflictId}' not found`);
    }

    let resolvedValue: unknown;
    let newStatus: ConflictStatus = 'RESOLVED';

    switch (validated.action) {
      case 'KEEP_EXISTING':
        resolvedValue = conflict.existingValue;
        break;

      case 'ACCEPT_NEW':
        resolvedValue = conflict.newValue;
        break;

      case 'MERGE':
        if (validated.customMergedValue !== undefined) {
          resolvedValue = validated.customMergedValue;
        } else if (
          Array.isArray(conflict.existingValue) &&
          Array.isArray(conflict.newValue)
        ) {
          // Merge arrays uniquely
          resolvedValue = Array.from(
            new Set([...conflict.existingValue, ...conflict.newValue])
          );
        } else if (
          typeof conflict.existingValue === 'object' &&
          typeof conflict.newValue === 'object' &&
          conflict.existingValue !== null &&
          conflict.newValue !== null
        ) {
          // Merge shallow objects
          resolvedValue = {
            ...conflict.existingValue,
            ...conflict.newValue,
          };
        } else {
          throw new Error(
            `Cannot automatically merge non-collection values for field '${conflict.field}'. Provide customMergedValue.`
          );
        }
        break;

      case 'USER_REQUIRED':
        newStatus = 'DETECTED'; // Remains blocked awaiting direct user intervention
        resolvedValue = undefined;
        break;
    }

    const updated: ConflictRecord = {
      ...conflict,
      status: newStatus,
      resolutionAction: validated.action,
      resolvedValue,
      resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : undefined,
    };

    this.conflicts.set(conflictId, updated);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent(
        'CONFLICT_RESOLVED',
        validated.resolverSource || 'USER',
        {
          conflictId,
          action: validated.action,
          status: newStatus,
          resolvedValue,
        },
        { projectId: conflict.projectId }
      );
    }

    return { ...updated };
  }
}
