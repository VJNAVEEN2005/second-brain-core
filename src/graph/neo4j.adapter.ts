import neo4j, { Driver } from 'neo4j-driver';
import {
  GraphNode,
  GraphRelationship,
  GraphNeighbor,
  GraphContext,
  NodeType,
  RelationshipType,
} from '../types/graph.js';
import { GraphAdapter } from './adapter.js';

export interface Neo4jConfig {
  uri: string;
  user: string;
  password?: string;
  database?: string;
}

export class Neo4jGraphAdapter implements GraphAdapter {
  private driver: Driver;
  private database?: string;

  constructor(config: Neo4jConfig) {
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password || '')
    );
    this.database = config.database;
  }

  private getSession() {
    return this.driver.session({ database: this.database });
  }

  async createNode(node: GraphNode): Promise<GraphNode> {
    const session = this.getSession();
    try {
      const cypher = `
        MERGE (n:${node.type} { id: $id })
        SET n += $props, n.type = $type, n.createdAt = $createdAt
        RETURN n
      `;
      await session.run(cypher, {
        id: node.id,
        type: node.type,
        props: node.properties,
        createdAt: new Date(node.createdAt).toISOString(),
      });
      return { ...node };
    } finally {
      await session.close();
    }
  }

  async getNode(id: string): Promise<GraphNode | null> {
    const session = this.getSession();
    try {
      const cypher = `
        MATCH (n { id: $id })
        RETURN n.id AS id, labels(n)[0] AS type, properties(n) AS props
      `;
      const result = await session.run(cypher, { id });
      if (result.records.length === 0) return null;
      const record = result.records[0];
      const props = (record.get('props') as Record<string, unknown>) || {};
      const createdAt = (props.createdAt as string) || new Date().toISOString();
      delete props.id;
      delete props.type;
      delete props.createdAt;

      return {
        id: record.get('id'),
        type: record.get('type') as NodeType,
        properties: props,
        createdAt,
      };
    } finally {
      await session.close();
    }
  }

  async deleteNode(id: string): Promise<boolean> {
    const session = this.getSession();
    try {
      const cypher = `
        MATCH (n { id: $id })
        DETACH DELETE n
        RETURN count(n) AS deletedCount
      `;
      const result = await session.run(cypher, { id });
      const count = result.records[0]?.get('deletedCount')?.toNumber?.() ?? 0;
      return count > 0;
    } finally {
      await session.close();
    }
  }

  async findNodesByType(type: NodeType): Promise<GraphNode[]> {
    const session = this.getSession();
    try {
      const cypher = `
        MATCH (n:${type})
        RETURN n.id AS id, properties(n) AS props
      `;
      const result = await session.run(cypher);
      return result.records.map((record) => {
        const props = (record.get('props') as Record<string, unknown>) || {};
        const createdAt = (props.createdAt as string) || new Date().toISOString();
        delete props.id;
        delete props.type;
        delete props.createdAt;
        return {
          id: record.get('id'),
          type,
          properties: props,
          createdAt,
        };
      });
    } finally {
      await session.close();
    }
  }

  async createRelationship(rel: GraphRelationship): Promise<GraphRelationship> {
    const session = this.getSession();
    try {
      const cypher = `
        MATCH (a { id: $sourceId }), (b { id: $targetId })
        MERGE (a)-[r:${rel.relType} { id: $id }]->(b)
        SET r += $props, r.createdAt = $createdAt
        RETURN r
      `;
      await session.run(cypher, {
        id: rel.id,
        sourceId: rel.sourceId,
        targetId: rel.targetId,
        props: rel.properties,
        createdAt: new Date(rel.createdAt).toISOString(),
      });
      return { ...rel };
    } finally {
      await session.close();
    }
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const session = this.getSession();
    try {
      const cypher = `
        MATCH ()-[r { id: $id }]->()
        DELETE r
        RETURN count(r) AS deletedCount
      `;
      const result = await session.run(cypher, { id });
      const count = result.records[0]?.get('deletedCount')?.toNumber?.() ?? 0;
      return count > 0;
    } finally {
      await session.close();
    }
  }

  async getRelationships(
    nodeId: string,
    direction: 'IN' | 'OUT' | 'BOTH' = 'BOTH'
  ): Promise<GraphRelationship[]> {
    const session = this.getSession();
    try {
      let pattern = `(a { id: $nodeId })-[r]-(b)`;
      if (direction === 'OUT') pattern = `(a { id: $nodeId })-[r]->(b)`;
      if (direction === 'IN') pattern = `(a { id: $nodeId })<-[r]-(b)`;

      const cypher = `
        MATCH ${pattern}
        RETURN r.id AS id, type(r) AS relType, startNode(r).id AS sourceId, endNode(r).id AS targetId, properties(r) AS props
      `;
      const result = await session.run(cypher, { nodeId });
      return result.records.map((rec) => ({
        id: rec.get('id') || `rel_${Math.random().toString(36).substring(2, 9)}`,
        sourceId: rec.get('sourceId'),
        relType: rec.get('relType') as RelationshipType,
        targetId: rec.get('targetId'),
        properties: (rec.get('props') as Record<string, unknown>) || {},
        createdAt: new Date().toISOString(),
      }));
    } finally {
      await session.close();
    }
  }

  async getNeighbors(
    nodeId: string,
    options?: {
      direction?: 'IN' | 'OUT' | 'BOTH';
      relType?: RelationshipType;
    }
  ): Promise<GraphNeighbor[]> {
    const session = this.getSession();
    try {
      const direction = options?.direction || 'BOTH';
      const typeFilter = options?.relType ? `:${options.relType}` : '';

      let pattern = `(a { id: $nodeId })-[r${typeFilter}]-(b)`;
      if (direction === 'OUT') pattern = `(a { id: $nodeId })-[r${typeFilter}]->(b)`;
      if (direction === 'IN') pattern = `(a { id: $nodeId })<-[r${typeFilter}]-(b)`;

      const cypher = `
        MATCH ${pattern}
        RETURN b.id AS targetId, labels(b)[0] AS targetType, properties(b) AS bProps,
               r.id AS relId, type(r) AS relType, startNode(r).id AS sourceId, endNode(r).id AS endId, properties(r) AS rProps
      `;
      const result = await session.run(cypher, { nodeId });
      return result.records.map((rec) => {
        const isOut = rec.get('sourceId') === nodeId;
        return {
          node: {
            id: rec.get('targetId'),
            type: rec.get('targetType') as NodeType,
            properties: (rec.get('bProps') as Record<string, unknown>) || {},
            createdAt: new Date().toISOString(),
          },
          relationship: {
            id: rec.get('relId') || `rel_${Math.random().toString(36).substring(2, 9)}`,
            sourceId: rec.get('sourceId'),
            relType: rec.get('relType') as RelationshipType,
            targetId: rec.get('endId'),
            properties: (rec.get('rProps') as Record<string, unknown>) || {},
            createdAt: new Date().toISOString(),
          },
          direction: isOut ? 'OUT' : 'IN',
        };
      });
    } finally {
      await session.close();
    }
  }

  async getSubgraph(rootId: string, maxDepth: number = 2): Promise<GraphContext> {
    const session = this.getSession();
    try {
      const cypher = `
        MATCH path = (root { id: $rootId })-[*1..${maxDepth}]-(n)
        UNWIND nodes(path) AS node
        UNWIND relationships(path) AS rel
        RETURN collect(DISTINCT { id: node.id, type: labels(node)[0], props: properties(node) }) AS nodes,
               collect(DISTINCT { id: rel.id, relType: type(rel), sourceId: startNode(rel).id, targetId: endNode(rel).id, props: properties(rel) }) AS rels
      `;
      const result = await session.run(cypher, { rootId });
      if (result.records.length === 0) {
        return { rootNodeId: rootId, depth: maxDepth, nodes: [], relationships: [] };
      }
      const record = result.records[0];
      const rawNodes = (record.get('nodes') as Array<{ id: string; type: string; props: Record<string, unknown> }>) || [];
      const rawRels = (record.get('rels') as Array<{ id: string; relType: string; sourceId: string; targetId: string; props: Record<string, unknown> }>) || [];

      return {
        rootNodeId: rootId,
        depth: maxDepth,
        nodes: rawNodes.map((n) => ({
          id: n.id,
          type: n.type as NodeType,
          properties: n.props || {},
          createdAt: new Date().toISOString(),
        })),
        relationships: rawRels.map((r) => ({
          id: r.id || `rel_${Math.random().toString(36).substring(2, 9)}`,
          sourceId: r.sourceId,
          relType: r.relType as RelationshipType,
          targetId: r.targetId,
          properties: r.props || {},
          createdAt: new Date().toISOString(),
        })),
      };
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
  }
}
