# Second Brain Core 🧠

> **Universal Memory Layer for AI Systems**  
> *Models are temporary. Memory is permanent.*

---

## ⚡ Overview

**Second Brain Core** is the open-source cognitive substrate and universal memory layer for AI models and developer agents. It allows any LLM (Claude, Gemini, GPT, Copilot, Codex) to seamlessly pause, switch, and resume complex engineering work without re-explaining context or replaying massive conversation histories.

Instead of storing raw chat logs, Second Brain stores structured **decisions**, **goals**, **tasks**, **relationships**, and **checkpoints** inside a high-performance graph and event-sourced persistence architecture.

---

## 🏗️ Architecture

```
[ User: Naveen ]
       │
       │ OWNS
       ▼
[ Workspace: Startup ]
       │
       │ CONTAINS
       ▼
[ Project: Second Brain Core ]
       │
       ├─► [ Working Memory ] (<= 1000 tokens)
       ├─► [ Hot Memory ] (Active tasks, milestones, decisions)
       ├─► [ Warm Memory ] (Research, references, past notes)
       └─► [ Cold Memory ] (Archived historical artifacts)
```

### Four-Tier Memory Architecture
1. **Working Memory ($\le 1000$ tokens):** Current active task, immediate goal, active blockers.
2. **Hot Memory:** Active projects, recent architectural decisions, current sprint milestones.
3. **Warm Memory:** Background research, past project indices, engineering notes.
4. **Cold Memory:** Archived sessions and historical evidence (never automatically injected into LLM prompts).

---

## 🚀 Core Engine Components

- **Identity Engine:** User profile, technical skills, preferences, and long-term trajectory.
- **Memory Engine:** Multi-tier storage routing across hot, warm, and cold tiers.
- **Graph Engine:** Neo4j-powered semantic entity graph (Nodes, Typed Relationships, Graph Context).
- **Checkpoint Engine:** Compact snapshots of cognitive state (`LIMIT_REACHED`, `USER_LEFT`, `BLOCKED`, `ERROR`, `COMPLETED`).
- **Resume Engine:** One-click resume package generator for zero-latency model switching.
- **Conflict Resolver:** Proactive detection of contradictory architectural choices across models.
- **Version Control & Event Sourcing:** Immutable event stream tracking every cognitive delta.

---

## 🛠️ Technology Stack

- **Runtime & Language:** TypeScript / Node.js (v22+)
- **API Framework:** Fastify
- **Relational & Event DB:** PostgreSQL + Drizzle ORM
- **Graph Database:** Neo4j (Cypher query language)
- **Vector Search:** Qdrant
- **Object Storage:** S3-compatible (MinIO / Cloudflare R2 / AWS S3)
- **Validation:** Zod

---

## 📋 Master Specification

Refer to [`SECOND_BRAIN_MASTER_SPEC.md`](./SECOND_BRAIN_MASTER_SPEC.md) for the complete design contract, data schemas, SDK API specification, and MVP implementation roadmap.
