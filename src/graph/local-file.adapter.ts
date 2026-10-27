import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  GraphNode,
  GraphRelationship,
  GraphNeighbor,
  GraphContext,
  NodeType,
  RelationshipType,
} from '../types/graph.js';
import { GraphAdapter } from './adapter.js';

interface GraphDump {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export class LocalFileGraphAdapter implements GraphAdapter {
  private filePath: string;
  private nodes = new Map<string, GraphNode>();
  private relationships = new Map<string, GraphRelationship>();
  private outEdges = new Map<string, Set<string>>();
  private inEdges = new Map<string, Set<string>>();
  private isLoaded = false;

  constructor(customPath?: string) {
    if (customPath) {
      this.filePath = customPath;
    } else {
      const dir = path.join(os.homedir(), '.second-brain');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.filePath = path.join(dir, 'graph.json');
    }
    this.loadFromDisk();
  }

  private loadFromDisk() {
    if (this.isLoaded) return;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed: GraphDump = JSON.parse(raw);
        if (Array.isArray(parsed.nodes)) {
          for (const n of parsed.nodes) {
            this.nodes.set(n.id, n);
            if (!this.outEdges.has(n.id)) this.outEdges.set(n.id, new Set());
            if (!this.inEdges.has(n.id)) this.inEdges.set(n.id, new Set());
          }
        }
        if (Array.isArray(parsed.relationships)) {
          for (const r of parsed.relationships) {
            this.relationships.set(r.id, r);
            if (!this.outEdges.has(r.sourceId)) this.outEdges.set(r.sourceId, new Set());
            if (!this.inEdges.has(r.targetId)) this.inEdges.set(r.targetId, new Set());
            this.outEdges.get(r.sourceId)!.add(r.id);
            this.inEdges.get(r.targetId)!.add(r.id);
          }
        }
      }
    } catch {
      // Start clean
    }
    this.isLoaded = true;
  }

  private async persistToDisk(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data: GraphDump = {
        nodes: Array.from(this.nodes.values()),
        relationships: Array.from(this.relationships.values()),
      };
      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, this.filePath);
    } catch (err) {
      console.error('Failed to persist Second Brain graph to disk:', err);
    }
  }

  async createNode(node: GraphNode): Promise<GraphNode> {
    this.nodes.set(node.id, { ...node });
    if (!this.outEdges.has(node.id)) this.outEdges.set(node.id, new Set());
    if (!this.inEdges.has(node.id)) this.inEdges.set(node.id, new Set());
    await this.persistToDisk();
    return { ...node };
  }

  async getNode(id: string): Promise<GraphNode | null> {
    const node = this.nodes.get(id);
    return node ? { ...node } : null;
  }

  async deleteNode(id: string): Promise<boolean> {
    if (!this.nodes.has(id)) return false;

    const outRelIds = this.outEdges.get(id) || new Set();
    const inRelIds = this.inEdges.get(id) || new Set();

    for (const relId of [...outRelIds, ...inRelIds]) {
      await this.deleteRelationship(relId);
    }

    this.outEdges.delete(id);
    this.inEdges.delete(id);
    const deleted = this.nodes.delete(id);
    await this.persistToDisk();
    return deleted;
  }

  async findNodesByType(type: NodeType): Promise<GraphNode[]> {
    const matched: GraphNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.type === type) matched.push({ ...node });
    }
    return matched;
  }

  async createRelationship(rel: GraphRelationship): Promise<GraphRelationship> {
    if (!this.nodes.has(rel.sourceId)) {
      throw new Error(`Source node '${rel.sourceId}' does not exist in graph`);
    }
    if (!this.nodes.has(rel.targetId)) {
      throw new Error(`Target node '${rel.targetId}' does not exist in graph`);
    }

    this.relationships.set(rel.id, { ...rel });

    if (!this.outEdges.has(rel.sourceId)) this.outEdges.set(rel.sourceId, new Set());
    if (!this.inEdges.has(rel.targetId)) this.inEdges.set(rel.targetId, new Set());

    this.outEdges.get(rel.sourceId)!.add(rel.id);
    this.inEdges.get(rel.targetId)!.add(rel.id);

    await this.persistToDisk();
    return { ...rel };
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const rel = this.relationships.get(id);
    if (!rel) return false;

    this.outEdges.get(rel.sourceId)?.delete(id);
    this.inEdges.get(rel.targetId)?.delete(id);
    const deleted = this.relationships.delete(id);
    await this.persistToDisk();
    return deleted;
  }

  async getRelationships(
    nodeId: string,
    direction: 'IN' | 'OUT' | 'BOTH' = 'BOTH'
  ): Promise<GraphRelationship[]> {
    const rels: GraphRelationship[] = [];

    if (direction === 'OUT' || direction === 'BOTH') {
      const outIds = this.outEdges.get(nodeId) || new Set();
      for (const id of outIds) {
        const rel = this.relationships.get(id);
        if (rel) rels.push({ ...rel });
      }
    }

    if (direction === 'IN' || direction === 'BOTH') {
      const inIds = this.inEdges.get(nodeId) || new Set();
      for (const id of inIds) {
        const rel = this.relationships.get(id);
        if (rel && !rels.some((r) => r.id === rel.id)) {
          rels.push({ ...rel });
        }
      }
    }

    return rels;
  }

  async getNeighbors(
    nodeId: string,
    options?: {
      direction?: 'IN' | 'OUT' | 'BOTH';
      relType?: RelationshipType;
    }
  ): Promise<GraphNeighbor[]> {
    const direction = options?.direction || 'BOTH';
    const relType = options?.relType;
    const neighbors: GraphNeighbor[] = [];

    if (direction === 'OUT' || direction === 'BOTH') {
      const outIds = this.outEdges.get(nodeId) || new Set();
      for (const id of outIds) {
        const rel = this.relationships.get(id);
        if (!rel || (relType && rel.relType !== relType)) continue;
        const targetNode = this.nodes.get(rel.targetId);
        if (targetNode) {
          neighbors.push({
            node: { ...targetNode },
            relationship: { ...rel },
            direction: 'OUT',
          });
        }
      }
    }

    if (direction === 'IN' || direction === 'BOTH') {
      const inIds = this.inEdges.get(nodeId) || new Set();
      for (const id of inIds) {
        const rel = this.relationships.get(id);
        if (!rel || (relType && rel.relType !== relType)) continue;
        const sourceNode = this.nodes.get(rel.sourceId);
        if (sourceNode) {
          neighbors.push({
            node: { ...sourceNode },
            relationship: { ...rel },
            direction: 'IN',
          });
        }
      }
    }

    return neighbors;
  }

  async getSubgraph(rootId: string, maxDepth: number = 2): Promise<GraphContext> {
    const visitedNodes = new Set<string>();
    const includedRelationships = new Map<string, GraphRelationship>();

    const root = this.nodes.get(rootId);
    if (!root) {
      return { rootNodeId: rootId, depth: maxDepth, nodes: [], relationships: [] };
    }

    visitedNodes.add(rootId);
    let currentLevel: string[] = [rootId];

    for (let depth = 0; depth < maxDepth; depth++) {
      const nextLevel: string[] = [];

      for (const currentId of currentLevel) {
        const outIds = this.outEdges.get(currentId) || new Set();
        for (const relId of outIds) {
          const rel = this.relationships.get(relId);
          if (!rel) continue;
          includedRelationships.set(rel.id, { ...rel });
          if (!visitedNodes.has(rel.targetId)) {
            visitedNodes.add(rel.targetId);
            nextLevel.push(rel.targetId);
          }
        }

        const inIds = this.inEdges.get(currentId) || new Set();
        for (const relId of inIds) {
          const rel = this.relationships.get(relId);
          if (!rel) continue;
          includedRelationships.set(rel.id, { ...rel });
          if (!visitedNodes.has(rel.sourceId)) {
            visitedNodes.add(rel.sourceId);
            nextLevel.push(rel.sourceId);
          }
        }
      }

      currentLevel = nextLevel;
      if (currentLevel.length === 0) break;
    }

    const resultNodes: GraphNode[] = [];
    for (const id of visitedNodes) {
      const node = this.nodes.get(id);
      if (node) resultNodes.push({ ...node });
    }

    return {
      rootNodeId: rootId,
      depth: maxDepth,
      nodes: resultNodes,
      relationships: Array.from(includedRelationships.values()),
    };
  }
}
