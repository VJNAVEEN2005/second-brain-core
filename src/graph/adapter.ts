import {
  GraphNode,
  GraphRelationship,
  GraphNeighbor,
  GraphContext,
  NodeType,
  RelationshipType,
} from '../types/graph.js';

export interface GraphAdapter {
  createNode(node: GraphNode): Promise<GraphNode>;
  getNode(id: string): Promise<GraphNode | null>;
  deleteNode(id: string): Promise<boolean>;
  findNodesByType(type: NodeType): Promise<GraphNode[]>;

  createRelationship(rel: GraphRelationship): Promise<GraphRelationship>;
  deleteRelationship(id: string): Promise<boolean>;
  getRelationships(nodeId: string, direction?: 'IN' | 'OUT' | 'BOTH'): Promise<GraphRelationship[]>;

  getNeighbors(
    nodeId: string,
    options?: {
      direction?: 'IN' | 'OUT' | 'BOTH';
      relType?: RelationshipType;
    }
  ): Promise<GraphNeighbor[]>;

  getSubgraph(rootId: string, maxDepth?: number): Promise<GraphContext>;
  getAll(): Promise<{ nodes: GraphNode[]; relationships: GraphRelationship[] }>;
  close?(): Promise<void>;
}
