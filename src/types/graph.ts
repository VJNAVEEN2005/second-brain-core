import { z } from 'zod';

// ==========================================
// NODE TYPES
// ==========================================
export const NodeTypeEnum = z.enum([
  'User',
  'Workspace',
  'Project',
  'Task',
  'Goal',
  'Decision',
  'Checkpoint',
  'Conversation',
  'Company',
  'Document',
  'Meeting',
  'Repository',
  'Channel',
]);

export type NodeType = z.infer<typeof NodeTypeEnum>;

// ==========================================
// RELATIONSHIP TYPES
// ==========================================
export const RelationshipTypeEnum = z.enum([
  'OWNS',
  'CREATED',
  'CONTAINS',
  'DEPENDS_ON',
  'USES',
  'RELATED_TO',
  'BLOCKED_BY',
  'ASSIGNED_TO',
  'REFERENCES',
  'PART_OF',
]);

export type RelationshipType = z.infer<typeof RelationshipTypeEnum>;

// ==========================================
// GRAPH DATA SCHEMAS
// ==========================================
export const GraphNodeSchema = z.object({
  id: z.string(),
  type: NodeTypeEnum,
  properties: z.record(z.unknown()).default({}),
  createdAt: z.date().or(z.string()),
});

export type GraphNode = z.infer<typeof GraphNodeSchema>;

export const GraphRelationshipSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  relType: RelationshipTypeEnum,
  targetId: z.string(),
  properties: z.record(z.unknown()).default({}),
  createdAt: z.date().or(z.string()),
});

export type GraphRelationship = z.infer<typeof GraphRelationshipSchema>;

export interface GraphNeighbor {
  node: GraphNode;
  relationship: GraphRelationship;
  direction: 'IN' | 'OUT';
}

export interface GraphContext {
  rootNodeId: string;
  depth: number;
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}
