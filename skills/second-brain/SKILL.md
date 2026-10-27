---
name: second-brain
description: Universal persistent memory and cognitive state continuation for AI agents (Cursor, Claude, Gemini, Antigravity, Copilot). Guarantees zero context loss across conversations by restoring active memory at session start and creating structured checkpoints at session end.
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

## 🛠️ 2. In-Session Execution Protocol

During active development:

- **Record Critical Architectural Decisions**:
  When you or the user make an important technical choice (e.g. database, framework, algorithm, API design), save it to memory:
  ```bash
  brain remember "Architectural Choice: <details>" --tags architecture,decision
  ```
- **Respect User Identity & Persona**:
  Check stored identity (`brain identity show`). If the active mode is `CEO`, prioritize business ROI, timeline velocity, and modularity. If `ENGINEER`, prioritize test coverage, typing, and system resilience.

---

## 💾 3. Session Checkpoint Protocol (MANDATORY)

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

## 📋 4. Universal Prompt Setup for Any AI Assistant

Users can paste the following prompt into **Cursor Rules (`.cursorrules`)**, **Claude Project Instructions**, **Custom GPT Instructions**, or **Gemini System Instructions**:

```markdown
<!-- SECOND BRAIN CORE INSTRUCTION -->
You have access to Second Brain Core. 
1. At the start of this session, run `brain status` (or use the MCP `brain_status` tool) to inspect the active project, current progress, next task, and architectural decisions.
2. Always maintain consistency with previous decisions recorded in Second Brain.
3. Before this conversation concludes or when a milestone is completed, create a checkpoint using `brain checkpoint "<summary>" --next "<next step>"`.
4. Run `brain identity show` to load my founder identity and reasoning preferences.
```
