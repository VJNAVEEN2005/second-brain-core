import { nanoid } from 'nanoid';
import { GraphAdapter } from '../graph/adapter.js';
import {
  GraphNode,
  GraphRelationship,
  GraphNeighbor,
  GraphContext,
  NodeType,
  RelationshipType,
  GraphNodeSchema,
} from '../types/graph.js';
import { EventEngine } from './event.engine.js';

export class GraphEngine {
  constructor(
    private adapter: GraphAdapter,
    private eventEngine?: EventEngine
  ) {}

  async createNode(
    id: string,
    type: NodeType,
    properties: Record<string, unknown> = {}
  ): Promise<GraphNode> {
    const node: GraphNode = {
      id,
      type,
      properties,
      createdAt: new Date().toISOString(),
    };
    GraphNodeSchema.parse(node);
    const created = await this.adapter.createNode(node);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent('GRAPH_NODE_CREATED', 'GRAPH_ENGINE', {
        id,
        type,
      });
    }

    return created;
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.adapter.getNode(id);
  }

  async findNodesByType(type: NodeType): Promise<GraphNode[]> {
    return this.adapter.findNodesByType(type);
  }

  async relate(
    sourceId: string,
    relType: RelationshipType,
    targetId: string,
    properties: Record<string, unknown> = {},
    source: string = 'GRAPH_ENGINE'
  ): Promise<GraphRelationship> {
    const rel: GraphRelationship = {
      id: `rel_${nanoid(10)}`,
      sourceId,
      relType,
      targetId,
      properties,
      createdAt: new Date().toISOString(),
    };

    const created = await this.adapter.createRelationship(rel);

    if (this.eventEngine) {
      await this.eventEngine.recordEvent(
        'GRAPH_RELATION_CREATED',
        source,
        {
          id: rel.id,
          sourceId,
          relType,
          targetId,
        }
      );
    }

    return created;
  }

  async getNeighbors(
    nodeId: string,
    options?: {
      direction?: 'IN' | 'OUT' | 'BOTH';
      relType?: RelationshipType;
    }
  ): Promise<GraphNeighbor[]> {
    return this.adapter.getNeighbors(nodeId, options);
  }

  async getGraphContext(nodeId: string, depth: number = 2): Promise<GraphContext> {
    return this.adapter.getSubgraph(nodeId, depth);
  }

  /**
   * Compactly formats a GraphContext into a token-efficient visual representation
   * for prompt injection across models (Claude, Gemini, GPT).
   */
  formatContextForPrompt(context: GraphContext): string {
    if (context.nodes.length === 0) return 'No graph context available.';

    const nodeNameMap = new Map<string, string>();
    for (const node of context.nodes) {
      const name = (node.properties.name as string) || (node.properties.summary as string) || node.id;
      nodeNameMap.set(node.id, `[${node.type}: ${name}]`);
    }

    const lines: string[] = ['### Graph Context (Cognitive Map):'];
    if (context.relationships.length === 0) {
      for (const node of context.nodes) {
        lines.push(`- ${nodeNameMap.get(node.id) || node.id}`);
      }
      return lines.join('\n');
    }

    for (const rel of context.relationships) {
      const src = nodeNameMap.get(rel.sourceId) || rel.sourceId;
      const tgt = nodeNameMap.get(rel.targetId) || rel.targetId;
      lines.push(`${src} --${rel.relType}--> ${tgt}`);
    }

    return lines.join('\n');
  }
}
