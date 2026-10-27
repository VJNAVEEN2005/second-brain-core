import { z } from 'zod';
export * from './graph.js';

// ==========================================
// STOP REASONS
// ==========================================
export const StopReasonEnum = z.enum([
  'LIMIT_REACHED',
  'USER_LEFT',
  'WAITING_INPUT',
  'BLOCKED',
  'ERROR',
  'COMPLETED',
]);

export type StopReason = z.infer<typeof StopReasonEnum>;

// ==========================================
// WORKSPACE TYPES
// ==========================================
export const WorkspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Workspace name cannot be empty'),
  slug: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const CreateWorkspaceInputSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
});

export type Workspace = z.infer<typeof WorkspaceSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

// ==========================================
// PROJECT TYPES
// ==========================================
export const ProjectStatusEnum = z.enum([
  'ACTIVE',
  'IN_PROGRESS',
  'PAUSED',
  'BLOCKED',
  'COMPLETED',
  'ARCHIVED',
]);

export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Project name is required'),
  status: ProjectStatusEnum.default('IN_PROGRESS'),
  progress: z.number().min(0).max(100).default(0),
  workspaceId: z.string().min(1, 'workspaceId is required'),
  currentTask: z.string().default(''),
  nextTask: z.string().default(''),
  createdAt: z.date().or(z.string()),
  updatedAt: z.date().or(z.string()),
});

export const CreateProjectInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Project name is required'),
  workspaceId: z.string().min(1, 'workspaceId is required'),
  status: ProjectStatusEnum.optional().default('IN_PROGRESS'),
  progress: z.number().min(0).max(100).optional().default(0),
  currentTask: z.string().optional().default(''),
  nextTask: z.string().optional().default(''),
});

export const UpdateProjectInputSchema = z.object({
  name: z.string().optional(),
  status: ProjectStatusEnum.optional(),
  progress: z.number().min(0).max(100).optional(),
  currentTask: z.string().optional(),
  nextTask: z.string().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectInputSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectInputSchema>;

// ==========================================
// CHECKPOINT TYPES
// ==========================================
export const CheckpointSchema = z.object({
  checkpointId: z.string(),
  projectId: z.string().min(1, 'projectId is required'),
  summary: z.string().min(1, 'summary is required'),
  progress: z.number().min(0).max(100).default(0),
  currentTask: z.string().default(''),
  nextTask: z.string().default(''),
  decisions: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  openQuestions: z.array(z.string()).default([]),
  stopReason: StopReasonEnum.default('USER_LEFT'),
  createdAt: z.date().or(z.string()),
});

export const CreateCheckpointInputSchema = z.object({
  checkpointId: z.string().optional(),
  projectId: z.string().min(1, 'projectId is required'),
  summary: z.string().min(1, 'summary is required'),
  progress: z.number().min(0).max(100).optional(),
  currentTask: z.string().optional(),
  nextTask: z.string().optional(),
  decisions: z.array(z.string()).optional().default([]),
  blockers: z.array(z.string()).optional().default([]),
  openQuestions: z.array(z.string()).optional().default([]),
  stopReason: StopReasonEnum.optional().default('USER_LEFT'),
});

export type Checkpoint = z.infer<typeof CheckpointSchema>;
export type CreateCheckpointInput = z.infer<typeof CreateCheckpointInputSchema>;

// ==========================================
// EVENT SOURCING TYPES
// ==========================================
export const EventSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  source: z.string().default('SYSTEM'), // e.g., 'Claude', 'Gemini', 'GPT', 'Copilot'
  projectId: z.string().optional(),
  workspaceId: z.string().optional(),
  timestamp: z.date().or(z.string()),
  data: z.record(z.any()).default({}),
});

export type BrainEvent = z.infer<typeof EventSchema>;

// ==========================================
// IDENTITY TYPES
// ==========================================
export const UserIdentitySchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  skills: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  goals: z.array(z.string()).optional().default([]),
  preferences: z.record(z.any()).optional().default({}),
});

export type UserIdentity = z.infer<typeof UserIdentitySchema>;

// ==========================================
// RESUME PACKAGE (PHASE 1 PREVIEW)
// ==========================================
export interface ResumePackage {
  project: string;
  projectId: string;
  workspaceId: string;
  completion: number;
  currentTask: string;
  nextTask: string;
  stopReason: StopReason;
  summary: string;
  decisions: string[];
  blockers: string[];
  openQuestions: string[];
  timestamp: string;
  graphContext?: string;
}
