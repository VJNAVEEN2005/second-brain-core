import { StorageAdapter, MemoryStorageAdapter } from '../db/storage.js';
import { PostgresStorageAdapter } from '../db/postgres.js';
import { EventEngine } from '../engines/event.engine.js';
import { WorkspaceEngine } from '../engines/workspace.engine.js';
import { ProjectEngine } from '../engines/project.engine.js';
import { CheckpointEngine } from '../engines/checkpoint.engine.js';
import { GraphEngine } from '../engines/graph.engine.js';
import { MemoryEngine } from '../memory/memory.engine.js';
import { ContinuationEngine } from '../adapters/models/continuation.engine.js';
import { GraphAdapter } from '../graph/adapter.js';
import { MemoryGraphAdapter } from '../graph/memory.adapter.js';
import { Neo4jGraphAdapter, Neo4jConfig } from '../graph/neo4j.adapter.js';
import {
  Workspace,
  CreateWorkspaceInput,
  Project,
  CreateProjectInput,
  UpdateProjectInput,
  Checkpoint,
  CreateCheckpointInput,
  ResumePackage,
  BrainEvent,
  NodeType,
  RelationshipType,
  GraphNode,
  GraphRelationship,
  GraphNeighbor,
  GraphContext,
  MemoryItem,
  CreateMemoryInput,
  MemoryQuery,
  TargetModel,
  ModelContinuationPackage,
} from '../types/index.js';

export interface SecondBrainConfig {
  databaseUrl?: string;
  storage?: StorageAdapter;
  graphAdapter?: GraphAdapter;
  neo4j?: Neo4jConfig;
  defaultSource?: string;
}

export class SecondBrain {
  public storage: StorageAdapter;
  public events: EventEngine;
  public workspaces: WorkspaceEngine;
  public projects: ProjectEngine;
  public checkpoints: CheckpointEngine;
  public graph: GraphEngine;
  public memory: MemoryEngine;
  public continuation: ContinuationEngine;
  private defaultSource: string;

  constructor(config: SecondBrainConfig = {}) {
    // Relational/Document Storage
    if (config.storage) {
      this.storage = config.storage;
    } else if (config.databaseUrl) {
      this.storage = new PostgresStorageAdapter(config.databaseUrl);
    } else {
      this.storage = new MemoryStorageAdapter();
    }

    this.defaultSource = config.defaultSource || 'SYSTEM';
    this.events = new EventEngine(this.storage);
    this.workspaces = new WorkspaceEngine(this.storage, this.events);
    this.projects = new ProjectEngine(this.storage, this.events);
    this.checkpoints = new CheckpointEngine(this.storage, this.events);
    this.memory = new MemoryEngine(this.storage, this.events);
    this.continuation = new ContinuationEngine();

    // Graph Engine Initialization
    let graphAdapter: GraphAdapter;
    if (config.graphAdapter) {
      graphAdapter = config.graphAdapter;
    } else if (config.neo4j || process.env.NEO4J_URI) {
      const neo4jConfig: Neo4jConfig = config.neo4j || {
        uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
        user: process.env.NEO4J_USER || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'password',
      };
      graphAdapter = new Neo4jGraphAdapter(neo4jConfig);
    } else {
      graphAdapter = new MemoryGraphAdapter();
    }
    this.graph = new GraphEngine(graphAdapter, this.events);
  }

  // ==========================================
  // WORKSPACE API
  // ==========================================
  async createWorkspace(
    input: CreateWorkspaceInput,
    source?: string
  ): Promise<Workspace> {
    const src = source || this.defaultSource;
    const workspace = await this.workspaces.createWorkspace(input, src);

    // Mirror to Graph
    await this.graph.createNode(workspace.id, 'Workspace', {
      name: workspace.name,
      slug: workspace.slug,
    });

    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    return this.workspaces.getWorkspace(id);
  }

  async listWorkspaces(): Promise<Workspace[]> {
    return this.workspaces.listWorkspaces();
  }

  // ==========================================
  // PROJECT API
  // ==========================================
  async createProject(
    input: CreateProjectInput,
    source?: string
  ): Promise<Project> {
    const src = source || this.defaultSource;
    const project = await this.projects.createProject(input, src);

    // Mirror to Graph
    await this.graph.createNode(project.id, 'Project', {
      name: project.name,
      status: project.status,
      progress: project.progress,
    });

    // Link: (Workspace)-[:CONTAINS]->(Project)
    await this.graph.relate(
      project.workspaceId,
      'CONTAINS',
      project.id,
      {},
      src
    );

    return project;
  }

  async updateProject(
    id: string,
    updates: UpdateProjectInput,
    source?: string
  ): Promise<Project> {
    const src = source || this.defaultSource;
    const updated = await this.projects.updateProject(id, updates, src);

    // Update node properties in graph if exists
    const node = await this.graph.getNode(id);
    if (node) {
      await this.graph.createNode(id, 'Project', {
        ...node.properties,
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.status ? { status: updates.status } : {}),
        ...(updates.progress !== undefined ? { progress: updates.progress } : {}),
      });
    }

    return updated;
  }

  async getProject(id: string): Promise<Project | null> {
    return this.projects.getProject(id);
  }

  async listProjects(workspaceId?: string): Promise<Project[]> {
    return this.projects.listProjects(workspaceId);
  }

  // ==========================================
  // CHECKPOINT API
  // ==========================================
  async checkpoint(
    input: CreateCheckpointInput,
    source?: string
  ): Promise<Checkpoint> {
    const src = source || this.defaultSource;
    const checkpoint = await this.checkpoints.createCheckpoint(input, src);

    // Mirror Checkpoint Node to Graph
    await this.graph.createNode(checkpoint.checkpointId, 'Checkpoint', {
      summary: checkpoint.summary,
      progress: checkpoint.progress,
      stopReason: checkpoint.stopReason,
    });

    // Link: (Project)-[:CONTAINS]->(Checkpoint)
    await this.graph.relate(
      checkpoint.projectId,
      'CONTAINS',
      checkpoint.checkpointId,
      {},
      src
    );

    // Mirror Decisions into Graph & Link: (Checkpoint)-[:CONTAINS]->(Decision)
    for (let i = 0; i < checkpoint.decisions.length; i++) {
      const decisionText = checkpoint.decisions[i];
      const decisionId = `dec_${checkpoint.checkpointId}_${i}`;
      await this.graph.createNode(decisionId, 'Decision', {
        summary: decisionText,
      });
      await this.graph.relate(
        checkpoint.checkpointId,
        'CONTAINS',
        decisionId,
        {},
        src
      );
    }

    // Mirror Blockers into Graph & Link: (Checkpoint)-[:BLOCKED_BY]->(Blocker)
    for (let i = 0; i < checkpoint.blockers.length; i++) {
      const blockerText = checkpoint.blockers[i];
      const blockerId = `blk_${checkpoint.checkpointId}_${i}`;
      await this.graph.createNode(blockerId, 'Task', {
        summary: blockerText,
        isBlocker: true,
      });
      await this.graph.relate(
        checkpoint.checkpointId,
        'BLOCKED_BY',
        blockerId,
        {},
        src
      );
    }

    return checkpoint;
  }

  async getLatestCheckpoint(projectId: string): Promise<Checkpoint | null> {
    return this.checkpoints.getLatestCheckpoint(projectId);
  }

  async listCheckpoints(projectId: string): Promise<Checkpoint[]> {
    return this.checkpoints.listCheckpoints(projectId);
  }

  // ==========================================
  // 4-TIER MEMORY API
  // ==========================================
  async remember(input: CreateMemoryInput, source?: string): Promise<MemoryItem> {
    return this.memory.remember(input, source || this.defaultSource);
  }

  async recall(query: MemoryQuery = {}): Promise<MemoryItem[]> {
    return this.memory.recall(query);
  }

  // ==========================================
  // GRAPH API (DIRECT ACCESS)
  // ==========================================
  async createNode(
    id: string,
    type: NodeType,
    properties: Record<string, unknown> = {}
  ): Promise<GraphNode> {
    return this.graph.createNode(id, type, properties);
  }

  async getNode(id: string): Promise<GraphNode | null> {
    return this.graph.getNode(id);
  }

  async relate(
    sourceId: string,
    relType: RelationshipType,
    targetId: string,
    properties: Record<string, unknown> = {},
    source?: string
  ): Promise<GraphRelationship> {
    return this.graph.relate(
      sourceId,
      relType,
      targetId,
      properties,
      source || this.defaultSource
    );
  }

  async getNeighbors(
    nodeId: string,
    options?: {
      direction?: 'IN' | 'OUT' | 'BOTH';
      relType?: RelationshipType;
    }
  ): Promise<GraphNeighbor[]> {
    return this.graph.getNeighbors(nodeId, options);
  }

  async getGraphContext(nodeId: string, depth: number = 2): Promise<GraphContext> {
    return this.graph.getGraphContext(nodeId, depth);
  }

  // ==========================================
  // RESUME ENGINE (COGNITIVE SNAPSHOT + GRAPH CONTEXT)
  // ==========================================
  async resume(projectId?: string): Promise<ResumePackage> {
    let targetProject: Project | null = null;

    if (projectId) {
      targetProject = await this.projects.getProject(projectId);
    } else {
      const allProjects = await this.projects.listProjects();
      if (allProjects.length > 0) {
        targetProject = allProjects[allProjects.length - 1];
      }
    }

    if (!targetProject) {
      throw new Error('No active project found to resume');
    }

    const latestCheckpoint = await this.checkpoints.getLatestCheckpoint(
      targetProject.id
    );

    // Build Graph Cognitive Context for the prompt
    let graphContextFormatted: string | undefined;
    try {
      const graphContext = await this.graph.getGraphContext(targetProject.id, 2);
      graphContextFormatted = this.graph.formatContextForPrompt(graphContext);
    } catch {
      graphContextFormatted = undefined;
    }

    return {
      project: targetProject.name,
      projectId: targetProject.id,
      workspaceId: targetProject.workspaceId,
      completion: latestCheckpoint ? latestCheckpoint.progress : targetProject.progress,
      currentTask: latestCheckpoint
        ? latestCheckpoint.currentTask
        : targetProject.currentTask,
      nextTask: latestCheckpoint ? latestCheckpoint.nextTask : targetProject.nextTask,
      stopReason: latestCheckpoint ? latestCheckpoint.stopReason : 'USER_LEFT',
      summary: latestCheckpoint
        ? latestCheckpoint.summary
        : `Resuming project ${targetProject.name}`,
      decisions: latestCheckpoint ? latestCheckpoint.decisions : [],
      blockers: latestCheckpoint ? latestCheckpoint.blockers : [],
      openQuestions: latestCheckpoint ? latestCheckpoint.openQuestions : [],
      timestamp: new Date().toISOString(),
      graphContext: graphContextFormatted,
    };
  }

  // ==========================================
  // CROSS-MODEL CONTINUATION (PHASE 4)
  // Claude -> Gemini -> GPT -> Copilot -> Codex
  // ==========================================
  async continueFor(
    targetModel: TargetModel,
    projectId?: string
  ): Promise<ModelContinuationPackage> {
    const resumePackage = await this.resume(projectId);
    return this.continuation.generateContinuation(targetModel, resumePackage);
  }

  // ==========================================
  // EVENTS API
  // ==========================================
  async getEvents(filter?: {
    projectId?: string;
    workspaceId?: string;
  }): Promise<BrainEvent[]> {
    if (filter?.projectId) {
      return this.events.getEventsForProject(filter.projectId);
    }
    if (filter?.workspaceId) {
      return this.events.getEventsForWorkspace(filter.workspaceId);
    }
    return this.storage.listEvents();
  }
}
