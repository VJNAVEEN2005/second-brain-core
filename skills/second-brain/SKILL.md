---
name: second-brain
description: Universal persistent memory and cognitive state continuation for AI agents (Cursor, Claude, Gemini, Antigravity, Copilot). Guarantees zero context loss across conversations by restoring active memory at session start, recording decisions in-flight, deleting unwanted data, and creating structured checkpoints at session end.
---

# Second Brain Agent Skill 🧠

> **Rule for AI Agents**: *Models are temporary. Memory is permanent.*  
> You are connected to **Second Brain Core**, the universal memory substrate. You must NEVER lose track of the user's projects, architectural decisions, identity, or immediate blockers across conversation boundaries.

---

## ⚡ 1. Session Startup Protocol (MANDATORY)

At the very beginning of **every new session or conversation**:

1. **Check for Second Brain CLI / MCP**:
   - If MCP tools are available, invoke `brain_status` or `brain_recall`.
   - If shell access is available, run:
     ```bash
     brain status
     ```
2. **Restore Cognitive State**:
   - Identify the active **Project Name**, **Current Task**, **Next Task**, and **Progress %**.
   - Review past **Key Decisions** to avoid proposing contradictory architectures.
   - Check the user's active reasoning mode (`brain mode`) and identity profile (`brain identity show`).
3. **Resume Instantly**:
   - Greet the user with a concise status update showing where you left off:
     > *"Resuming [Project Name] at [X]% progress. Last task completed: [Task]. Ready to proceed with: [Next Task]."*

---

## 🛠️ 2. Complete Command Reference: What to Use When

| Command | Purpose | When to Use |
|---|---|---|
| `brain status` | Inspect active cognitive state | **Always run first** at the start of any conversation |
| `brain 3d` | Launch 3D WebGL Cosmos | When user wants to visually explore nodes and relationships |
| `brain resume <Model>` | Generate continuation prompt | To hand off to Claude (XML), Gemini (Markdown), or GPT |
| `brain checkpoint "<summary>"` | Snapshot current state | **Before exiting session**, or when reaching milestones |
| `brain remember "<decision>"` | Save long-term memory | When important architectural choices or facts are established |
| `brain recall "<query>"` | Query past memories | When researching past discussions or decisions |
| `brain project create <name>` | Create a new project | When switching to a new codebase or initiative |
| `brain project list` | List all projects | To view all tracked projects and their status |
| `brain project delete <id>` | Delete a project | To remove a completed or abandoned project and its graph nodes |
| `brain delete <id>` | Delete any node/entity | To delete an unwanted node directly from the knowledge graph |
| `brain reset --force` | Wipe & reset all memory | To reset the local database completely and start fresh |
| `brain identity show` | Show founder identity | To read the user's name, role, channels, companies, and goals |
| `brain identity set` | Update founder profile | To update name, channels (e.g. Paradox Tamil), or companies |
| `brain mode <mode>` | Set reasoning mode | Switch persona between `CEO`, `ARCHITECT`, `CODER`, `SCIENTIST` |
| `brain log` | View timeline history | To review past checkpoints and progression logs |

---

## 🗑️ 3. How Data Deletion Works in Second Brain

If the user or agent needs to delete data:

1. **Interactive 3D UI**:
   - Click any node in `brain 3d` &rarr; click the red **Delete** button in the Inspector panel. The node and all its connected edges are deleted in real-time.
2. **CLI Deletion**:
   - Delete specific project: `brain project delete <id>`
   - Delete specific node: `brain delete <id>`
   - Wipe entire local database: `brain reset --force`
3. **Local Files (`~/.second-brain/`)**:
   - All state is stored in plain JSON files (`brain.json`, `graph.json`, `identity.json`, `memory.json`). You can edit or delete them directly anytime.

---

## 💾 4. Session Checkpoint Protocol (MANDATORY)

Before ending the session, when the user says goodbye, when tasks are completed, or before context limits are reached:

1. **Create a Checkpoint**:
   ```bash
   brain checkpoint "Completed <summary of what was accomplished>" --current "<current status>" --next "<exact next step>" --progress <0-100>
   ```
2. **Stop Reason Flags**:
   - `COMPLETED`: Active task or sprint finished.
   - `LIMIT_REACHED`: Approaching context token budget.
   - `USER_LEFT`: User stepping away or pausing work.
   - `BLOCKED`: Blocked on external credentials, API keys, or user decision.

---

## 📋 5. Universal Prompt Setup for Any AI Assistant

Users can paste the following prompt into **Cursor Rules (`.cursorrules`)**, **Claude Project Instructions**, **Custom GPT Instructions**, or **Gemini System Instructions**:

```markdown
<!-- SECOND BRAIN CORE AUTO-SETUP & AGENT SKILL -->
You are my autonomous AI developer. Integrate Second Brain Core for persistent memory across all sessions:

1. INSTALL SECOND BRAIN:
   Run: `npm install -g second-brain-core` (or verify it is installed with `brain status`).

2. CREATE THE AGENT SKILL:
   Create a skill file (in `.cursorrules`, `.claude/skills/second-brain/SKILL.md`, or your agent's skill directory):
   ```markdown
   ---
   name: second-brain
   description: Universal persistent memory layer for AI agents. Loads project state at start and checkpoints before exit.
   ---
   # Second Brain Memory Protocol
   - AT SESSION START: Always execute `brain status` (or use MCP `brain_status`) to load active project, current progress, next task, and architectural decisions.
   - DURING WORK: Never contradict previous decisions. When important technical choices are made, run `brain remember "<decision>" --tags architecture`.
   - DELETING DATA: Run `brain delete <id>` or `brain project delete <id>` to remove unwanted data.
   - AT SESSION END: When we finish or pause, create a checkpoint:
     `brain checkpoint "<summary>" --next "<next task>" --progress <0-100>`.
   - FOUNDER PROFILE: Run `brain identity show` to load profile & CEO reasoning mode.
   ```

3. INITIALIZE NOW:
   Run `brain status` right now and report back with my active project, progress, and immediate next task to resume work!
```
