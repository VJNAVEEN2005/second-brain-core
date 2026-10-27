import { ResumePackage } from '../../types/index.js';
import {
  TargetModel,
  ModelContinuationPackage,
  ModelAdapter,
} from './types.js';

export class ClaudeAdapter implements ModelAdapter {
  format(resume: ResumePackage): ModelContinuationPackage {
    const decisionsXml = resume.decisions
      .map((d) => `    <decision>${d}</decision>`)
      .join('\n');
    const blockersXml = resume.blockers
      .map((b) => `    <blocker>${b}</blocker>`)
      .join('\n');
    const questionsXml = resume.openQuestions
      .map((q) => `    <question>${q}</question>`)
      .join('\n');

    const prompt = `<second_brain_continuation version="1.0">
  <project id="${resume.projectId}" name="${resume.project}" progress="${resume.completion}%">
    <current_task>${resume.currentTask}</current_task>
    <next_task>${resume.nextTask}</next_task>
    <stopped_because>${resume.stopReason}</stopped_because>
    <summary>${resume.summary}</summary>
  </project>

  <architectural_decisions>
${decisionsXml || '    <none />'}
  </architectural_decisions>

  <active_blockers>
${blockersXml || '    <none />'}
  </active_blockers>

  <open_questions>
${questionsXml || '    <none />'}
  </open_questions>

  <graph_cognitive_map>
${resume.graphContext ? `    ${resume.graphContext.split('\n').join('\n    ')}` : '    <none />'}
  </graph_cognitive_map>

  <continuation_directive>
    You are continuing an active engineering session. Do NOT ask the user to explain the project.
    Immediately resume execution starting at current task: "${resume.currentTask}".
  </continuation_directive>
</second_brain_continuation>`;

    return {
      targetModel: 'Claude',
      prompt,
      metadata: {
        projectId: resume.projectId,
        project: resume.project,
        progress: resume.completion,
        currentTask: resume.currentTask,
        nextTask: resume.nextTask,
        stopReason: resume.stopReason,
        tokenCountEstimate: Math.ceil(prompt.length / 4),
      },
    };
  }
}

export class GeminiAdapter implements ModelAdapter {
  format(resume: ResumePackage): ModelContinuationPackage {
    const prompt = `## 🧠 Second Brain Cognitive Handoff: ${resume.project}
**Progress**: ${resume.completion}% | **Status**: ACTIVE | **Handoff Reason**: ${resume.stopReason}
**Active Task**: ${resume.currentTask}
**Next Task**: ${resume.nextTask}

---

### 📌 Summary of Last State
${resume.summary}

### 🏛️ Key Architectural Decisions
${resume.decisions.length > 0 ? resume.decisions.map((d) => `- ${d}`).join('\n') : '- No historical decisions recorded.'}

### ⚠️ Current Blockers & Open Questions
${resume.blockers.length > 0 ? resume.blockers.map((b) => `- ⛔ Blocker: ${b}`).join('\n') : '- No active blockers.'}
${resume.openQuestions.length > 0 ? resume.openQuestions.map((q) => `- ❓ Question: ${q}`).join('\n') : ''}

${resume.graphContext ? `### 🌐 Knowledge Graph Context\n${resume.graphContext}\n` : ''}
---
### 🎯 Immediate Objective
Resume work directly on **"${resume.currentTask}"**. The project context is pre-loaded; proceed with code implementation immediately without asking for background information.`;

    return {
      targetModel: 'Gemini',
      prompt,
      metadata: {
        projectId: resume.projectId,
        project: resume.project,
        progress: resume.completion,
        currentTask: resume.currentTask,
        nextTask: resume.nextTask,
        stopReason: resume.stopReason,
        tokenCountEstimate: Math.ceil(prompt.length / 4),
      },
    };
  }
}

export class GPTAdapter implements ModelAdapter {
  format(resume: ResumePackage): ModelContinuationPackage {
    const prompt = `System State Restoration: Second Brain Universal Memory Layer
Project: ${resume.project} [${resume.projectId}]
Progress: ${resume.completion}%
Handoff Reason: ${resume.stopReason}

CURRENT TASK: ${resume.currentTask}
NEXT TASK: ${resume.nextTask}

DECISIONS LOG:
${resume.decisions.map((d, i) => `${i + 1}. ${d}`).join('\n') || 'None'}

BLOCKERS:
${resume.blockers.map((b, i) => `${i + 1}. ${b}`).join('\n') || 'None'}

GRAPH MAP:
${resume.graphContext || 'None'}

SUMMARY:
${resume.summary}

INSTRUCTION:
Resume development seamlessly without re-asking project questions. Target task: "${resume.currentTask}".`;

    return {
      targetModel: 'GPT',
      prompt,
      metadata: {
        projectId: resume.projectId,
        project: resume.project,
        progress: resume.completion,
        currentTask: resume.currentTask,
        nextTask: resume.nextTask,
        stopReason: resume.stopReason,
        tokenCountEstimate: Math.ceil(prompt.length / 4),
      },
    };
  }
}

export class CopilotAdapter implements ModelAdapter {
  format(resume: ResumePackage): ModelContinuationPackage {
    const prompt = `// ============================================================================
// @second-brain-continuation
// Project: ${resume.project} (${resume.completion}% Complete)
// Handoff: ${resume.stopReason}
// Current Task: ${resume.currentTask}
// Next Task: ${resume.nextTask}
// Decisions: ${resume.decisions.join(' | ') || 'None'}
// Blockers: ${resume.blockers.join(' | ') || 'None'}
// ============================================================================
// [RESUME DIRECTIVE]: Continue implementation of "${resume.currentTask}" immediately below:
`;

    return {
      targetModel: 'Copilot',
      prompt,
      metadata: {
        projectId: resume.projectId,
        project: resume.project,
        progress: resume.completion,
        currentTask: resume.currentTask,
        nextTask: resume.nextTask,
        stopReason: resume.stopReason,
        tokenCountEstimate: Math.ceil(prompt.length / 4),
      },
    };
  }
}

export class CodexAdapter implements ModelAdapter {
  format(resume: ResumePackage): ModelContinuationPackage {
    const prompt = `"""
Second Brain Cognitive State Header
Project: ${resume.project}
Progress: ${resume.completion}%
Current Task: ${resume.currentTask}
Next Task: ${resume.nextTask}
Decisions: ${JSON.stringify(resume.decisions)}
"""

# START IMMEDIATE WORK ON: ${resume.currentTask}
`;

    return {
      targetModel: 'Codex',
      prompt,
      metadata: {
        projectId: resume.projectId,
        project: resume.project,
        progress: resume.completion,
        currentTask: resume.currentTask,
        nextTask: resume.nextTask,
        stopReason: resume.stopReason,
        tokenCountEstimate: Math.ceil(prompt.length / 4),
      },
    };
  }
}

export class ContinuationEngine {
  private adapters: Record<TargetModel, ModelAdapter> = {
    Claude: new ClaudeAdapter(),
    Gemini: new GeminiAdapter(),
    GPT: new GPTAdapter(),
    Copilot: new CopilotAdapter(),
    Codex: new CodexAdapter(),
  };

  generateContinuation(
    targetModel: TargetModel,
    resumePackage: ResumePackage
  ): ModelContinuationPackage {
    const adapter = this.adapters[targetModel];
    if (!adapter) {
      throw new Error(`Unsupported destination model: '${targetModel}'`);
    }
    return adapter.format(resumePackage);
  }
}
