# SECOND_BRAIN_MASTER_SPEC.md

The framework must become the universal memory layer for AI systems.
Its purpose is to allow any AI model to understand:
- Who the user is
- What projects exist
- What decisions were made
- What work is unfinished
- Why work stopped
- What should happen next
without replaying complete conversation histories.

---

## 1. VISION

> **Models are temporary. Memory is permanent.**

The framework must ensure that:
$$\text{Claude} \longrightarrow \text{Gemini} \longrightarrow \text{GPT} \longrightarrow \text{Copilot} \longrightarrow \text{Codex}$$
can continue the same work seamlessly.
The user should never need to repeatedly explain the same project.

---

## 2. CORE PROBLEM

Current AI systems suffer from:
1. **Memory Loss**
2. **Context Recreation**
3. **Token Waste**
4. **Project Fragmentation**
5. **Knowledge Siloes**

### Example Workflow Breakdown:
```text
Claude (Works 2 hours)
  ↓
Context Limit Reached
  ↓
Gemini
  ↓
User explains project again (Token waste & fatigue)
```
This framework eliminates that problem.

---

## 3. PRIMARY OBJECTIVE

Enable instantaneous cognitive resume across models:
```text
User: "Continue Project"
  ↓
System:
  - Found active project: "Second Brain"
  - Progress: 42%
  - Current Task: "Conflict Resolution"
  - Stopped Because: "Claude Context Limit"
  - Next Task: "Workspace Isolation"
  ↓
Immediately resume work with full structured context.
```

---

## 4. SUCCESS CRITERIA

A user must be able to:
$$\text{Start in Claude} \rightarrow \text{Switch to Gemini} \rightarrow \text{Switch to GPT} \rightarrow \text{Switch to Copilot} \rightarrow \text{Switch to Codex}$$
and continue seamlessly without re-explaining context.

---

## 5. PRODUCT PHILOSOPHY

The framework behaves like a **brain**, not a raw message log.

| Bad Pattern | Good Pattern |
| :--- | :--- |
| Store Raw Chats | Store Knowledge |
| Store Messages | Store Decisions |
| Replay History | Store Goals & Tasks |
| Flat Logs | Store Relationships & Progress |

---

## 6. ARCHITECTURE PRINCIPLES

1. **Principle 1 — Model Independence:** Memory must never depend on OpenAI, Anthropic, Google, Microsoft, or Meta proprietary memory lock-in.
2. **Principle 2 — Graph-Based Foundation:** All information exists as Nodes, Relationships, and Events.
3. **Principle 3 — Token Efficiency:** Never replay 100,000 tokens when a 500-token checkpoint can restore full cognitive state.
4. **Principle 4 — Knowledge as Ground Truth:** Structured knowledge is the source of truth; conversation logs are evidence only.

---

## 7. CORE ARCHITECTURE

The core framework consists of:
- **Identity Engine**
- **Memory Engine**
- **Graph Engine**
- **Checkpoint Engine**
- **Resume Engine**
- **Conflict Resolver**
- **Version Control Layer**
- *Reflection Engine (Future)*
- *Personality Engine (Future)*

---

## 8. IDENTITY ENGINE

### Purpose
Store user identity, background, preferences, and long-term trajectory.

### Stores
- Profile
- Preferences
- Skills
- Roles
- Interests
- Goals

### Schema Example
```json
{
  "name": "Naveen",
  "role": "Software Engineer",
  "interests": [
    "AI",
    "Startups",
    "3D Models"
  ]
}
```

---

## 9. MEMORY ARCHITECTURE (FOUR-TIER HIERARCHY)

1. **Working Memory**
   - Contains: Current Project, Current Task, Current Goal
   - Target Size: $\le 1000\text{ tokens}$
2. **Hot Memory**
   - Contains: Active Projects, Recent Decisions, Current Milestones
3. **Warm Memory**
   - Contains: Research, Past Projects, Notes
4. **Cold Memory**
   - Contains: Archived Chats, Old Documents, Historical Artifacts
   - *Rule: Cold memory must never be automatically loaded into prompt context.*

---

## 10. GRAPH ARCHITECTURE

Everything in the brain exists as graph nodes and typed relationships.

### Node Types
- `User`
- `Workspace`
- `Project`
- `Task`
- `Goal`
- `Decision`
- `Checkpoint`
- `Conversation`
- `Company`
- `Document`
- `Meeting`
- `Repository`
- `Channel`

### Relationship Types
- `OWNS`
- `CREATED`
- `CONTAINS`
- `DEPENDS_ON`
- `USES`
- `RELATED_TO`
- `BLOCKED_BY`
- `ASSIGNED_TO`
- `REFERENCES`
- `PART_OF`

### Graph Hierarchy Example
```text
[Naveen]
   │
   │ OWNS
   ▼
[Second Brain]
   │
   │ CONTAINS
   ▼
[Memory Engine]
   │
   │ USES
   ▼
[Neo4j]
```

---

## 11. WORKSPACE SYSTEM

Allows multiple distinct contexts to coexist safely without cross-contamination.

### Workspaces
- `Personal`
- `Startup`
- `Research`
- `YouTube`
- `Business`

Each workspace isolates its own:
- Projects
- Tasks
- Checkpoints
- Documents
- Memories

---

## 12. PROJECT SCHEMA

```json
{
  "id": "proj_01H...",
  "name": "Second Brain Core",
  "status": "IN_PROGRESS",
  "progress": 42,
  "workspace": "ws_startup",
  "currentTask": "task_conflict_resolver",
  "nextTask": "task_workspace_isolation"
}
```

---

## 13. CHECKPOINT ENGINE

The checkpoint system represents a saved cognitive state snapshot.

### Checkpoint Schema
```json
{
  "checkpointId": "chk_01H...",
  "projectId": "proj_01H...",
  "summary": "Implemented fastify server bootstrap and core memory router",
  "progress": 42,
  "currentTask": "Conflict Resolution",
  "nextTask": "Workspace Isolation",
  "decisions": [
    "dec_use_drizzle_orm",
    "dec_fastify_over_express"
  ],
  "blockers": [],
  "openQuestions": [],
  "stopReason": "LIMIT_REACHED"
}
```

### Stop Reasons
- `LIMIT_REACHED`
- `USER_LEFT`
- `WAITING_INPUT`
- `BLOCKED`
- `ERROR`
- `COMPLETED`

---

## 14. CHAT REFERENCES (TRACEABILITY)

Never store raw multi-megabyte chat transcripts in working memory. Store concise evidentiary pointers:

```json
{
  "provider": "anthropic",
  "chatId": "chat_claude_20261027",
  "timestamp": "2026-10-27T19:15:00Z",
  "summary": "Architectural discussion regarding Neo4j node schemas and Drizzle migrations",
  "topics": [
    "neo4j",
    "graph-schema",
    "migration"
  ]
}
```
**Purposes:** Traceability, Reason Reconstruction, Deep Context Retrieval when requested.

---

## 15. RESUME ENGINE

### User Command
`"Continue Project"`

### Workflow
```text
Find Active Project
  ↓
Load Latest Checkpoint
  ↓
Load Current Branch
  ↓
Load Relevant Decisions
  ↓
Generate Resume Package
  ↓
Continue Work Immediately
```

### Resume Package Example
```json
{
  "project": "Second Brain",
  "completion": 42,
  "currentTask": "Conflict Resolution",
  "nextTask": "Workspace Isolation",
  "stopReason": "LIMIT_REACHED"
}
```

---

## 16. CROSS-MODEL CONTINUATION

Supported transitions:
$$\text{Claude} \longrightarrow \text{Gemini} \longrightarrow \text{GPT} \longrightarrow \text{Copilot} \longrightarrow \text{Codex}$$

The destination model receives:
1. Current Project State
2. Relevant Decisions
3. Current Task & Next Task
4. Checkpoint Data
5. Graph Context
*(No conversational replay required)*

---

## 17. VERSION CONTROL SYSTEM & EVENT SOURCING

Everything in the Second Brain is versioned:
- Projects, Tasks, Goals, Nodes, Relationships, Checkpoints, Decisions.

### Branch Types
- `main`
- `feature/*`
- `research/*`
- `experimental/*`

### Versioning
Semantic Versioning: `MAJOR.MINOR.PATCH` (e.g. `1.0.0`)

### Event Sourcing
Every state modification emits an immutable event:
```json
{
  "eventType": "PROJECT_UPDATED",
  "source": "Claude",
  "timestamp": "2026-10-27T19:15:00Z",
  "data": {
    "currentTask": "Workspace Isolation",
    "progress": 45
  }
}
```

---

## 18. CONFLICT DETECTION & RESOLUTION

### Conflict Example
- **Claude:** `Backend = NodeJS`
- **Gemini:** `Backend = Go`
- **Result:** `Conflict Detected`

> **Rule:** The framework must **never** silently overwrite conflicting architectural decisions.

### Supported Actions
- `KEEP_EXISTING`
- `ACCEPT_NEW`
- `MERGE`
- `USER_REQUIRED`

---

## 19. TECHNOLOGY STACK

- **Backend:** TypeScript, Node.js (v22+), Fastify
- **Database:** PostgreSQL (Relational metadata & event logs)
- **Graph Database:** Neo4j (Cypher query engine, graph relationships)
- **Vector Search:** Qdrant (Semantic search & embeddings)
- **Storage:** S3-compatible Object Storage (MinIO / AWS S3 / Cloudflare R2)
- **Validation:** Zod
- **ORM:** Drizzle ORM

---

## 20. SECOND BRAIN SDK API

```typescript
brain.remember(knowledge: KnowledgeItem): Promise<void>;
brain.recall(query: MemoryQuery): Promise<MemoryResult>;
brain.search(semanticQuery: string): Promise<SearchResult[]>;
brain.relate(sourceId: string, relType: string, targetId: string): Promise<void>;
brain.checkpoint(snapshot: CheckpointInput): Promise<Checkpoint>;
brain.resume(projectId?: string): Promise<ResumePackage>;
brain.reflect(period: 'daily' | 'weekly' | 'monthly'): Promise<ReflectionReport>;
brain.resolveConflict(conflictId: string, action: ResolutionAction): Promise<void>;
brain.createProject(project: ProjectInput): Promise<Project>;
brain.createWorkspace(workspace: WorkspaceInput): Promise<Workspace>;
```

---

## 21. MVP IMPLEMENTATION PHASES

- **Phase 1:** Workspace System, Project System, Checkpoint System
- **Phase 2:** Graph Engine (Neo4j integration, typed nodes & edges)
- **Phase 3:** Resume Engine (Context package generation, prompt injection format)
- **Phase 4:** Cross-Model Continuation (Adapters for Claude, Gemini, GPT, Copilot, Codex)
- **Phase 5:** Version Control & Event Sourcing (Branches, event replay, conflict resolution)

### Non-Goals for MVP
- Personality Modes
- Autonomous Agents
- Email Integrations
- YouTube Integrations
- Enterprise Marketplace
- Multi-Tenant SaaS Features

---

## 22. FUTURE FEATURES

1. **Personality Engine:**
   - Same memory, different reasoning modes:
   - *Engineer, CEO, Scientist, Creative, Teacher, Einstein*
2. **Reflection Engine:**
   - Daily: *What happened today?*
   - Weekly: *What progress was made?*
   - Monthly: *What should be archived to Cold Memory?*

---

## 23. FINAL OBJECTIVE

$$\text{Git for AI Memory} + \text{Operating System for AI Context} + \text{Universal Brain Layer}$$

Empower any AI model to instantly comprehend:
- **Who the user is**
- **What projects exist**
- **What decisions were made**
- **Where work stopped**
- **Why it stopped**
- **What should happen next**
without requiring conversation replay, manual context restoration, or provider-specific memory lock-in.
