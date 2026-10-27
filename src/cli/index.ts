#!/usr/bin/env node

import { Command } from 'commander';
import { SecondBrain } from '../sdk/index.js';
import { LocalFileStorageAdapter } from '../db/local-file.adapter.js';
import { LocalFileGraphAdapter } from '../graph/local-file.adapter.js';
import { buildServer } from '../server.js';
import { runMcpStdio } from '../mcp/server.js';

// Initialize SecondBrain with persistent local storage
const brain = new SecondBrain({
  storage: new LocalFileStorageAdapter(),
  graphAdapter: new LocalFileGraphAdapter(),
  defaultSource: 'CLI_USER',
});

const program = new Command();

program
  .name('second-brain')
  .description('Universal Memory Layer for AI Systems - Local Edition')
  .version('0.1.0');

// ==========================================
// STATUS COMMAND
// ==========================================
program
  .command('status')
  .description('Show cognitive status of active project')
  .option('-p, --project <id>', 'Specific project ID')
  .action(async (options) => {
    try {
      const resume = await brain.resume(options.project);
      const filled = Math.round(resume.completion / 5);
      const empty = 20 - filled;
      const bar = '█'.repeat(filled) + '░'.repeat(empty);

      console.log('\n🧠 SECOND BRAIN: ACTIVE COGNITIVE STATE');
      console.log('────────────────────────────────────────────────');
      console.log(`📌 Project:      ${resume.project} (${resume.projectId})`);
      console.log(`📊 Progress:     [${bar}] ${resume.completion}%`);
      console.log(`⚡ Current Task: ${resume.currentTask || 'None'}`);
      console.log(`🎯 Next Task:    ${resume.nextTask || 'None'}`);
      console.log(`🛑 Stop Reason:  ${resume.stopReason}`);
      console.log(`📝 Last Summary: ${resume.summary}`);

      if (resume.decisions.length > 0) {
        console.log('\n🏛️ Key Decisions:');
        for (const d of resume.decisions) {
          console.log(`  • ${d}`);
        }
      }

      if (resume.blockers.length > 0) {
        console.log('\n⚠️ Active Blockers:');
        for (const b of resume.blockers) {
          console.log(`  ⛔ ${b}`);
        }
      }
      console.log('────────────────────────────────────────────────\n');
    } catch (err: unknown) {
      console.log('\n💡 No active project found. Create one with:');
      console.log('   npx second-brain-core project create "My Project"\n');
    }
  });

// ==========================================
// RESUME COMMAND
// ==========================================
program
  .command('resume [model]')
  .description('Generate cognitive continuation prompt for AI (Claude, Gemini, GPT, Copilot, Codex)')
  .option('-p, --project <id>', 'Specific project ID')
  .action(async (model = 'Gemini', options) => {
    try {
      const validModels = ['Claude', 'Gemini', 'GPT', 'Copilot', 'Codex'];
      const targetModel = validModels.find(
        (m) => m.toLowerCase() === model.toLowerCase()
      ) || 'Gemini';

      const continuation = await brain.continueFor(targetModel as any, options.project);
      console.log(continuation.prompt);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${msg}`);
      process.exit(1);
    }
  });

// ==========================================
// CHECKPOINT COMMAND
// ==========================================
program
  .command('checkpoint <summary>')
  .description('Save current cognitive state checkpoint')
  .option('-p, --project <id>', 'Project ID (defaults to active project)')
  .option('--progress <number>', 'Completion percentage (0-100)')
  .option('-c, --current <task>', 'Current task')
  .option('-n, --next <task>', 'Next task')
  .option('-d, --decision <decisions...>', 'Architectural decisions')
  .option('-b, --blocker <blockers...>', 'Blockers encountered')
  .option('-r, --reason <reason>', 'Stop reason', 'USER_LEFT')
  .action(async (summary, options) => {
    try {
      let projectId = options.project;
      if (!projectId) {
        const projects = await brain.listProjects();
        if (projects.length === 0) {
          throw new Error('No projects found. Create one first with: brain project create <name>');
        }
        projectId = projects[projects.length - 1].id;
      }

      const checkpoint = await brain.checkpoint(
        {
          projectId,
          summary,
          progress: options.progress ? parseInt(options.progress, 10) : undefined,
          currentTask: options.current,
          nextTask: options.next,
          decisions: options.decision || [],
          blockers: options.blocker || [],
          stopReason: options.reason,
        },
        'CLI'
      );

      console.log(`\n✅ Checkpoint saved! ID: ${checkpoint.checkpointId}`);
      console.log(`   Progress: ${checkpoint.progress}% | Next Task: "${checkpoint.nextTask || 'None'}"\n`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${msg}`);
      process.exit(1);
    }
  });

// ==========================================
// PROJECT COMMANDS
// ==========================================
const projectCmd = program.command('project').description('Manage Second Brain projects');

projectCmd
  .command('create <name>')
  .description('Create a new project')
  .option('-w, --workspace <workspaceName>', 'Workspace name', 'Default')
  .option('-c, --current <task>', 'Current task', '')
  .option('-n, --next <task>', 'Next task', '')
  .action(async (name, options) => {
    try {
      let workspace = (await brain.listWorkspaces()).find((w) => w.name === options.workspace);
      if (!workspace) {
        workspace = await brain.createWorkspace({ name: options.workspace });
      }

      const proj = await brain.createProject({
        name,
        workspaceId: workspace.id,
        currentTask: options.current,
        nextTask: options.next,
      });

      console.log(`\n🎉 Project created successfully!`);
      console.log(`   ID:        ${proj.id}`);
      console.log(`   Name:      ${proj.name}`);
      console.log(`   Workspace: ${workspace.name}\n`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error: ${msg}`);
      process.exit(1);
    }
  });

projectCmd
  .command('list')
  .description('List all projects')
  .action(async () => {
    const list = await brain.listProjects();
    if (list.length === 0) {
      console.log('\nNo projects found. Create one with: brain project create <name>\n');
      return;
    }
    console.log('\n📋 SECOND BRAIN: PROJECTS');
    console.log('────────────────────────────────────────────────');
    for (const p of list) {
      console.log(`• ${p.name.padEnd(25)} [${p.id}] - ${p.progress}% (${p.status})`);
    }
    console.log('────────────────────────────────────────────────\n');
  });

// ==========================================
// SERVE COMMAND (LOCAL REST API)
// ==========================================
program
  .command('serve')
  .description('Start local background HTTP server (port 3000)')
  .option('-p, --port <number>', 'Port number', '3000')
  .action(async (options) => {
    const port = parseInt(options.port, 10);
    const app = await buildServer(brain, { logger: true });
    await app.listen({ port, host: '127.0.0.1' });
    console.log(`\n🧠 Second Brain API running at http://127.0.0.1:${port}`);
    console.log(`   Health check: http://127.0.0.1:${port}/health\n`);
  });

// ==========================================
// MCP COMMAND (STDIO SERVER FOR AI AGENTS)
// ==========================================
program
  .command('mcp')
  .description('Run Model Context Protocol (MCP) server for Claude / Cursor / Antigravity')
  .action(async () => {
    await runMcpStdio(brain);
  });

// Default action: if no args, show status or help
if (process.argv.length <= 2) {
  process.argv.push('status');
}

program.parse(process.argv);
