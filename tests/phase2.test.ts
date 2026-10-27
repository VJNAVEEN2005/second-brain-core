import { describe, it, expect, beforeEach } from 'vitest';
import { SecondBrain } from '../src/sdk/index.js';
import { buildServer } from '../src/server.js';
import { FastifyInstance } from 'fastify';

describe('Second Brain Core - Phase 2 Graph Engine Test Suite', () => {
  let brain: SecondBrain;

  beforeEach(() => {
    brain = new SecondBrain(); // in-memory storage & in-memory graph
  });

  describe('Graph Engine Fundamentals', () => {
    it('should create and retrieve nodes with valid types', async () => {
      const userNode = await brain.createNode('user_naveen', 'User', {
        name: 'Naveen',
        role: 'Software Engineer',
      });

      expect(userNode.id).toBe('user_naveen');
      expect(userNode.type).toBe('User');
      expect(userNode.properties.name).toBe('Naveen');

      const fetched = await brain.getNode('user_naveen');
      expect(fetched).not.toBeNull();
      expect(fetched?.properties.role).toBe('Software Engineer');
    });

    it('should reject invalid node types', async () => {
      // @ts-expect-error - testing runtime schema validation
      await expect(brain.createNode('node_invalid', 'InvalidType')).rejects.toThrow();
    });

    it('should relate two nodes with typed relationship', async () => {
      await brain.createNode('user_naveen', 'User', { name: 'Naveen' });
      await brain.createNode('proj_brain', 'Project', { name: 'Second Brain' });

      const rel = await brain.relate(
        'user_naveen',
        'OWNS',
        'proj_brain',
        { since: '2026-10-27' },
        'Claude'
      );

      expect(rel.sourceId).toBe('user_naveen');
      expect(rel.relType).toBe('OWNS');
      expect(rel.targetId).toBe('proj_brain');

      // Check event sourcing
      const events = await brain.getEvents();
      expect(events.some((e) => e.eventType === 'GRAPH_RELATION_CREATED')).toBe(true);
    });

    it('should query neighbors by direction and relationship type', async () => {
      await brain.createNode('proj_core', 'Project', { name: 'Second Brain Core' });
      await brain.createNode('task_graph', 'Task', { name: 'Build Graph Engine' });
      await brain.createNode('tech_neo4j', 'Repository', { name: 'Neo4j' });

      await brain.relate('proj_core', 'CONTAINS', 'task_graph');
      await brain.relate('proj_core', 'USES', 'tech_neo4j');

      const outNeighbors = await brain.getNeighbors('proj_core', { direction: 'OUT' });
      expect(outNeighbors.length).toBe(2);

      const onlyUses = await brain.getNeighbors('proj_core', {
        direction: 'OUT',
        relType: 'USES',
      });
      expect(onlyUses.length).toBe(1);
      expect(onlyUses[0].node.id).toBe('tech_neo4j');
      expect(onlyUses[0].relationship.relType).toBe('USES');

      const inNeighbors = await brain.getNeighbors('task_graph', { direction: 'IN' });
      expect(inNeighbors.length).toBe(1);
      expect(inNeighbors[0].node.id).toBe('proj_core');
    });

    it('should reproduce the exact master spec graph hierarchy', async () => {
      // [Naveen] --OWNS--> [Second Brain] --CONTAINS--> [Memory Engine] --USES--> [Neo4j]
      await brain.createNode('user_naveen', 'User', { name: 'Naveen' });
      await brain.createNode('proj_second_brain', 'Project', { name: 'Second Brain' });
      await brain.createNode('mod_memory_engine', 'Workspace', { name: 'Memory Engine' });
      await brain.createNode('tool_neo4j', 'Repository', { name: 'Neo4j' });

      await brain.relate('user_naveen', 'OWNS', 'proj_second_brain');
      await brain.relate('proj_second_brain', 'CONTAINS', 'mod_memory_engine');
      await brain.relate('mod_memory_engine', 'USES', 'tool_neo4j');

      const context = await brain.getGraphContext('user_naveen', 3);
      expect(context.nodes.length).toBe(4);
      expect(context.relationships.length).toBe(3);

      const formatted = brain.graph.formatContextForPrompt(context);
      expect(formatted).toContain('[User: Naveen] --OWNS--> [Project: Second Brain]');
      expect(formatted).toContain('[Project: Second Brain] --CONTAINS--> [Workspace: Memory Engine]');
      expect(formatted).toContain('[Workspace: Memory Engine] --USES--> [Repository: Neo4j]');
    });
  });

  describe('Automatic Graph Synchronization', () => {
    it('should automatically reflect workspaces, projects, checkpoints, decisions, and blockers in graph', async () => {
      // 1. Create Workspace
      const ws = await brain.createWorkspace({ name: 'Cognitive OS' });
      const wsNode = await brain.getNode(ws.id);
      expect(wsNode).not.toBeNull();
      expect(wsNode?.type).toBe('Workspace');

      // 2. Create Project
      const proj = await brain.createProject({
        name: 'Context Layer',
        workspaceId: ws.id,
      });
      const projNode = await brain.getNode(proj.id);
      expect(projNode).not.toBeNull();
      expect(projNode?.type).toBe('Project');

      // Verify (Workspace)-[:CONTAINS]->(Project) relationship
      const wsNeighbors = await brain.getNeighbors(ws.id, { direction: 'OUT' });
      expect(wsNeighbors.some((n) => n.node.id === proj.id && n.relationship.relType === 'CONTAINS')).toBe(true);

      // 3. Create Checkpoint with decisions and blockers
      const chk = await brain.checkpoint({
        projectId: proj.id,
        summary: 'Graph adapter ready',
        progress: 55,
        currentTask: 'Cypher Query Optimizer',
        nextTask: 'Resume Engine Serialization',
        decisions: ['Use bidirectional in-memory adjacency', 'Neo4j Bolt protocol'],
        blockers: ['Awaiting Neo4j cluster credentials'],
        stopReason: 'LIMIT_REACHED',
      });

      const chkNode = await brain.getNode(chk.checkpointId);
      expect(chkNode).not.toBeNull();
      expect(chkNode?.type).toBe('Checkpoint');

      // Verify Project -> Checkpoint
      const projNeighbors = await brain.getNeighbors(proj.id, { direction: 'OUT' });
      expect(projNeighbors.some((n) => n.node.id === chk.checkpointId && n.relationship.relType === 'CONTAINS')).toBe(true);

      // Verify Checkpoint -> Decisions and Checkpoint -> Blocker
      const chkNeighbors = await brain.getNeighbors(chk.checkpointId, { direction: 'OUT' });
      expect(chkNeighbors.filter((n) => n.relationship.relType === 'CONTAINS').length).toBe(2);
      expect(chkNeighbors.some((n) => n.relationship.relType === 'BLOCKED_BY')).toBe(true);
    });

    it('should inject formatted graph context directly into Resume Package', async () => {
      const ws = await brain.createWorkspace({ name: 'Agent Handoff' });
      const proj = await brain.createProject({
        name: 'Cross-Model Pipeline',
        workspaceId: ws.id,
      });

      await brain.checkpoint({
        projectId: proj.id,
        summary: 'Phase 2 graph engine completed',
        progress: 65,
        currentTask: 'Resume Serialization',
        nextTask: 'Version Control Layer',
        decisions: ['Format graph for prompt injection'],
        blockers: [],
        stopReason: 'LIMIT_REACHED',
      });

      const resumePackage = await brain.resume(proj.id);
      expect(resumePackage.graphContext).toBeDefined();
      expect(resumePackage.graphContext).toContain('### Graph Context (Cognitive Map):');
      expect(resumePackage.graphContext).toContain('Cross-Model Pipeline');
      expect(resumePackage.graphContext).toContain('Phase 2 graph engine completed');
    });
  });

  describe('Fastify REST API Graph Endpoints', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
      app = await buildServer(brain);
    });

    it('POST /api/graph/nodes creates a node', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/graph/nodes',
        payload: {
          id: 'user_alex',
          type: 'User',
          properties: { name: 'Alex' },
        },
      });
      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.id).toBe('user_alex');
      expect(json.type).toBe('User');
    });

    it('POST /api/graph/relate creates a relationship and returns neighbors', async () => {
      await app.inject({
        method: 'POST',
        url: '/api/graph/nodes',
        payload: { id: 'proj_alpha', type: 'Project', properties: { name: 'Alpha' } },
      });
      await app.inject({
        method: 'POST',
        url: '/api/graph/nodes',
        payload: { id: 'task_beta', type: 'Task', properties: { name: 'Beta' } },
      });

      const relateRes = await app.inject({
        method: 'POST',
        url: '/api/graph/relate',
        payload: {
          sourceId: 'proj_alpha',
          relType: 'CONTAINS',
          targetId: 'task_beta',
        },
      });
      expect(relateRes.statusCode).toBe(201);

      const neighborsRes = await app.inject({
        method: 'GET',
        url: '/api/graph/nodes/proj_alpha/neighbors?direction=OUT',
      });
      expect(neighborsRes.statusCode).toBe(200);
      const neighbors = JSON.parse(neighborsRes.payload);
      expect(neighbors.length).toBe(1);
      expect(neighbors[0].node.id).toBe('task_beta');

      const contextRes = await app.inject({
        method: 'GET',
        url: '/api/graph/nodes/proj_alpha/context?depth=1',
      });
      expect(contextRes.statusCode).toBe(200);
      const context = JSON.parse(contextRes.payload);
      expect(context.nodes.length).toBe(2);
      expect(context.relationships.length).toBe(1);
    });
  });
});
