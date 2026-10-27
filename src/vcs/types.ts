import { z } from 'zod';

// ==========================================
// BRANCH TYPES
// ==========================================
export const BranchTypePattern = /^(main|feature\/[a-zA-Z0-9_-]+|research\/[a-zA-Z0-9_-]+|experimental\/[a-zA-Z0-9_-]+)$/;

export const BranchSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  name: z.string().regex(BranchTypePattern, 'Branch must be main, feature/*, research/*, or experimental/*'),
  headCheckpointId: z.string().optional(),
  version: z.string().default('0.1.0'), // Semantic versioning: MAJOR.MINOR.PATCH
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type Branch = z.infer<typeof BranchSchema>;

export const CreateBranchInputSchema = z.object({
  projectId: z.string(),
  name: z.string().regex(BranchTypePattern, 'Branch must be main, feature/*, research/*, or experimental/*'),
  fromCheckpointId: z.string().optional(),
  version: z.string().optional().default('0.1.0'),
});

export type CreateBranchInput = z.input<typeof CreateBranchInputSchema>;

// ==========================================
// CONFLICT RESOLUTION TYPES
// ==========================================
export const ConflictActionEnum = z.enum([
  'KEEP_EXISTING',
  'ACCEPT_NEW',
  'MERGE',
  'USER_REQUIRED',
]);

export type ConflictAction = z.infer<typeof ConflictActionEnum>;

export const ConflictStatusEnum = z.enum(['DETECTED', 'RESOLVED']);
export type ConflictStatus = z.infer<typeof ConflictStatusEnum>;

export const ConflictRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  field: z.string(),
  existingValue: z.unknown(),
  existingSource: z.string(), // e.g., 'Claude'
  newValue: z.unknown(),
  newSource: z.string(),      // e.g., 'Gemini'
  status: ConflictStatusEnum.default('DETECTED'),
  resolutionAction: ConflictActionEnum.optional(),
  resolvedValue: z.unknown().optional(),
  detectedAt: z.date().or(z.string()),
  resolvedAt: z.date().or(z.string()).optional(),
});

export type ConflictRecord = z.infer<typeof ConflictRecordSchema>;

export const ResolveConflictInputSchema = z.object({
  action: ConflictActionEnum,
  customMergedValue: z.unknown().optional(),
  resolverSource: z.string().optional().default('USER'),
});

export type ResolveConflictInput = z.input<typeof ResolveConflictInputSchema>;
