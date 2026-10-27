<p align="center">
  <img src="assets/logo.png" alt="Second Brain Core Logo" width="180" style="border-radius: 24px;" />
</p>

<h1 align="center">Second Brain Core</h1>

<p align="center">
  <strong>Universal Memory Layer for AI Systems & Autonomous Developers</strong><br>
  <em>Models are temporary. Memory is permanent.</em>
</p>

<p align="center">
  <a href="https://github.com/VJNAVEEN2005/second-brain-core"><img src="https://img.shields.io/badge/Status-Active-emerald" alt="Status"></a>
  <a href="#"><img src="https://img.shields.io/badge/Language-TypeScript-blue" alt="Language"></a>
  <a href="#"><img src="https://img.shields.io/badge/Runtime-Node.js%2022+-green" alt="Runtime"></a>
  <a href="#"><img src="https://img.shields.io/badge/Persistence-Local%20%7C%20Postgres-purple" alt="Storage"></a>
  <a href="#"><img src="https://img.shields.io/badge/Tests-43%20Passing-brightgreen" alt="Tests"></a>
</p>

---

## ⚡ Overview

**Second Brain Core** is the local-first cognitive substrate and universal memory layer for AI models and autonomous developer agents. It allows any LLM (Claude, Gemini, GPT, Copilot, Codex) to seamlessly pause, switch, and resume complex engineering work without re-explaining context, losing architectural decisions, or replaying massive conversation histories.

Instead of storing raw ephemeral chat logs, Second Brain stores structured **decisions**, **goals**, **tasks**, **relationships**, and **checkpoints** inside a high-performance graph and event-sourced persistence architecture.

---

## 💎 Key Features

- **🌐 100% Local-First Storage:** Runs completely offline on your machine (`~/.second-brain/`) with zero cloud lock-in and zero Docker prerequisites.
- **🌌 3D Interactive Cognitive Universe:** A visual 3D WebGL Force Graph running in real-time (`brain 3d` or `brain ui`) with node inspection and theme toggling.
- **🧠 Identity & CEO Executive Mode:** Remembers who you are (Naveen / Founder), your companies, YouTube channels, coding standards, and prioritizes strategic ROI when in `CEO` mode.
- **🔄 Universal Cross-Model Continuation:** One-click resume prompts formatted specifically for Claude (XML), Gemini (Structured Markdown), GPT (System/User frames), and Copilot.
- **🔌 Model Context Protocol (MCP) Server:** Native `stdio` MCP server allowing Cursor, Claude Desktop, Antigravity, or Cline to autonomously query and write to Second Brain.
- **🌲 Semantic Knowledge Graph:** Automatically interlinks Workspaces, Projects, Goals, Decisions, Checkpoints, and Memories into an interconnected knowledge web.

---

## 🏗️ 4-Tier Memory Architecture

```
[ User: Naveen (Founder / CEO) ]
        │
        │ OWNS
        ▼
[ Workspace: Personal / Business ]
        │
        │ CONTAINS
        ▼
[ Project: Second Brain Core ]
        │
        ├─► [ Working Memory ] (<= 1000 tokens - Active blocker & immediate goal)
        ├─► [ Hot Memory ] (Current milestones, active architecture, open tasks)
        ├─► [ Warm Memory ] (Past research, domain context, benchmarks)
        └─► [ Cold Memory ] (Archived checkpoints, logs, and historical events)
```

---

## 🚀 Quick Start

### 1. Installation

Clone the repository and install dependencies:
```bash
git clone https://github.com/VJNAVEEN2005/second-brain-core.git
cd second-brain-core
npm install
npm run build
npm link
```

### 2. CLI Usage (`brain`)

You can now use the global `brain` CLI from **any terminal or directory** on your computer:

```bash
# Check current cognitive state
brain status

# Launch the interactive 3D WebGL Cognitive Universe
brain 3d

# Generate instant resume prompt for any model
brain resume Gemini
brain resume Claude
brain resume GPT

# Manage Identity & CEO Mode
brain identity show
brain mode CEO
brain mode ARCHITECT
brain mode CODER

# Create a checkpoint
brain checkpoint "Completed 3D WebGL graph and official logo integration"

# View recent event stream
brain log
```

### 3. Model Context Protocol (MCP) Setup

Add Second Brain Core to your **Claude Desktop** or **Cursor** configuration:

```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["d:/project/Second Brain Core/dist/cli/index.js", "mcp"]
    }
  }
}
```

Now any AI agent can autonomously invoke:
- `brain_status`: Inspect active project, goal, and working memory.
- `brain_checkpoint`: Snapshot engineering progress before context limits.
- `brain_resume`: Pull resume instructions when starting a new session.
- `brain_remember`: Store long-term knowledge, decisions, or user preferences.
- `brain_recall`: Query the 4-tier memory by semantic tags or query.

---

## 🧪 Testing & Verification

Run the comprehensive test suite (43 unit & integration tests):
```bash
npm test
```

---

## 📋 Master Specification

Refer to [`SECOND_BRAIN_MASTER_SPEC.md`](./SECOND_BRAIN_MASTER_SPEC.md) for the complete design contract, data schemas, SDK API specification, and architectural blueprint.

---

<p align="center">
  Built with ❤️ for AI Engineers and Autonomous Builders
</p>
