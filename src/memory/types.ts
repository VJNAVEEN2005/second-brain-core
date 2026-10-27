import { z } from 'zod';

// ==========================================
// MEMORY TIERS
// ==========================================
export const MemoryTierEnum = z.enum([
  'WORKING', // Target <= 1000 tokens: current project, task, immediate goal
  'HOT',     // Active projects, recent decisions, current sprint milestones
  'WARM',    // Research, past project notes, reference guides
  'COLD',    // Archived chats, old docs, historical artifacts (NEVER auto-loaded)
]);

export type MemoryTier = z.infer<typeof MemoryTierEnum>;

// ==========================================
// MEMORY ITEM SCHEMA
// ==========================================
export const MemoryItemSchema = z.object({
  id: z.string(),
  tier: MemoryTierEnum,
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).default([]),
  tokensEstimate: z.number().default(0),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export type MemoryItem = z.infer<typeof MemoryItemSchema>;

export const CreateMemoryInputSchema = z.object({
  id: z.string().optional(),
  tier: MemoryTierEnum.optional().default('HOT'),
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional().default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export type CreateMemoryInput = z.infer<typeof CreateMemoryInputSchema>;

export const MemoryQuerySchema = z.object({
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  tiers: z.array(MemoryTierEnum).optional(),
  tags: z.array(z.string()).optional(),
  query: z.string().optional(),
  includeCold: z.boolean().optional().default(false), // Cold memory guarded
  limit: z.number().optional().default(20),
});

export type MemoryQuery = z.input<typeof MemoryQuerySchema>;
