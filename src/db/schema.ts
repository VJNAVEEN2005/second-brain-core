import { pgTable, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core';

// ==========================================
// WORKSPACES TABLE
// ==========================================
export const workspaces = pgTable('workspaces', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// PROJECTS TABLE
// ==========================================
export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull().default('IN_PROGRESS'),
  progress: integer('progress').notNull().default(0),
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  currentTask: text('current_task').notNull().default(''),
  nextTask: text('next_task').notNull().default(''),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ==========================================
// CHECKPOINTS TABLE
// ==========================================
export const checkpoints = pgTable('checkpoints', {
  checkpointId: text('checkpoint_id').primaryKey(),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  summary: text('summary').notNull(),
  progress: integer('progress').notNull().default(0),
  currentTask: text('current_task').notNull().default(''),
  nextTask: text('next_task').notNull().default(''),
  decisions: jsonb('decisions').notNull().$type<string[]>(),
  blockers: jsonb('blockers').notNull().$type<string[]>(),
  openQuestions: jsonb('open_questions').notNull().$type<string[]>(),
  stopReason: text('stop_reason').notNull().default('USER_LEFT'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// EVENTS SOURCING TABLE
// ==========================================
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  source: text('source').notNull().default('SYSTEM'),
  projectId: text('project_id'),
  workspaceId: text('workspace_id'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  data: jsonb('data').notNull().$type<Record<string, unknown>>(),
});
