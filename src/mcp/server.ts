import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { SecondBrain } from '../sdk/index.js';

export function createMcpServer(brain: SecondBrain): Server {
  const server = new Server(
    {
      name: 'second-brain-core',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // 1. List available MCP tools for AI models
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'brain_status',
          description:
            'Get the current cognitive status of the active project in Second Brain (progress, active task, next task, blockers, decisions).',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'Optional project ID to check. If omitted, checks most recent project.',
              },
            },
          },
        },
        {
          name: 'brain_resume',
          description:
            'Resume an active project seamlessly. Returns the cognitive state snapshot, decisions, blockers, and knowledge graph context without conversational replay.',
          inputSchema: {
            type: 'object',
            properties: {
              projectId: {
                type: 'string',
                description: 'Optional project ID to resume.',
              },
              targetModel: {
                type: 'string',
                enum: ['Claude', 'Gemini', 'GPT', 'Copilot', 'Codex'],
                description: 'Target model format for continuation prompt (defaults to Gemini).',
              },
            },
          },
        },
        {
          name: 'brain_checkpoint',
          description:
            'Save a cognitive state checkpoint before ending a session, switching models, or hitting a context limit.',
          inputSchema: {
            type: 'object',
            required: ['projectId', 'summary'],
            properties: {
              projectId: {
                type: 'string',
                description: 'Project ID',
              },
              summary: {
                type: 'string',
                description: 'Summary of what was achieved in this session',
              },
              progress: {
                type: 'number',
                description: 'Completion percentage (0 to 100)',
              },
              currentTask: {
                type: 'string',
                description: 'The task being worked on',
              },
              nextTask: {
                type: 'string',
                description: 'The immediate next task for whoever resumes',
              },
              decisions: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key architectural or design decisions made',
              },
              blockers: {
                type: 'array',
                items: { type: 'string' },
                description: 'Any blockers encountered',
              },
              stopReason: {
                type: 'string',
                enum: [
                  'LIMIT_REACHED',
                  'USER_LEFT',
                  'WAITING_INPUT',
                  'BLOCKED',
                  'ERROR',
                  'COMPLETED',
                ],
                description: 'Why the session is pausing',
              },
            },
          },
        },
        {
          name: 'brain_remember',
          description:
            'Store an important decision, architectural pattern, or research finding into Second Brain memory tiers.',
          inputSchema: {
            type: 'object',
            required: ['title', 'content'],
            properties: {
              title: { type: 'string', description: 'Brief title of the memory' },
              content: { type: 'string', description: 'Detailed knowledge content' },
              tier: {
                type: 'string',
                enum: ['WORKING', 'HOT', 'WARM', 'COLD'],
                description: 'Memory tier (defaults to HOT)',
              },
              projectId: { type: 'string', description: 'Associated project ID' },
              tags: {
                type: 'array',
                items: { type: 'string' },
                description: 'Tags for categorization',
              },
            },
          },
        },
        {
          name: 'brain_recall',
          description: 'Search and recall knowledge from Second Brain memory.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search term or keyword' },
              projectId: { type: 'string', description: 'Filter by project' },
              tags: { type: 'array', items: { type: 'string' } },
            },
          },
        },
        {
          name: 'brain_create_project',
          description: 'Create a new project in Second Brain.',
          inputSchema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string', description: 'Project name' },
              workspaceName: {
                type: 'string',
                description: 'Workspace name (defaults to "Default")',
              },
              currentTask: { type: 'string', description: 'Initial task' },
              nextTask: { type: 'string', description: 'Next task' },
            },
          },
        },
      ],
    };
  });

  // 2. Handle Tool Calls from AI Models
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const modelSource = (request.params as any)._meta?.model || 'AI_AGENT';

    try {
      switch (name) {
        case 'brain_status': {
          const projectId = args?.projectId as string | undefined;
          const resume = await brain.resume(projectId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    project: resume.project,
                    projectId: resume.projectId,
                    progress: `${resume.completion}%`,
                    currentTask: resume.currentTask,
                    nextTask: resume.nextTask,
                    stopReason: resume.stopReason,
                    summary: resume.summary,
                    decisions: resume.decisions,
                    blockers: resume.blockers,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'brain_resume': {
          const projectId = args?.projectId as string | undefined;
          const targetModel = (args?.targetModel as any) || 'Gemini';
          const continuation = await brain.continueFor(targetModel, projectId);
          return {
            content: [
              {
                type: 'text',
                text: continuation.prompt,
              },
            ],
          };
        }

        case 'brain_checkpoint': {
          const checkpoint = await brain.checkpoint(args as any, modelSource);
          return {
            content: [
              {
                type: 'text',
                text: `Checkpoint saved successfully! ID: ${checkpoint.checkpointId}. Project progress: ${checkpoint.progress}%. Next task: "${checkpoint.nextTask}".`,
              },
            ],
          };
        }

        case 'brain_remember': {
          const mem = await brain.remember(args as any, modelSource);
          return {
            content: [
              {
                type: 'text',
                text: `Memory stored successfully! [ID: ${mem.id}, Tier: ${mem.tier}, Tokens: ~${mem.tokensEstimate}]`,
              },
            ],
          };
        }

        case 'brain_recall': {
          const memories = await brain.recall(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(memories, null, 2),
              },
            ],
          };
        }

        case 'brain_create_project': {
          const projectName = args?.name as string;
          const wsName = (args?.workspaceName as string) || 'Default';

          let workspace = (await brain.listWorkspaces()).find((w) => w.name === wsName);
          if (!workspace) {
            workspace = await brain.createWorkspace({ name: wsName }, modelSource);
          }

          const project = await brain.createProject(
            {
              name: projectName,
              workspaceId: workspace.id,
              currentTask: (args?.currentTask as string) || '',
              nextTask: (args?.nextTask as string) || '',
            },
            modelSource
          );

          return {
            content: [
              {
                type: 'text',
                text: `Project created! [ID: ${project.id}, Name: "${project.name}", Workspace: "${workspace.name}"]`,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isError: true,
        content: [{ type: 'text', text: `Second Brain Error: ${msg}` }],
      };
    }
  });

  return server;
}

export async function runMcpStdio(brain: SecondBrain): Promise<void> {
  const server = createMcpServer(brain);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🧠 Second Brain MCP Server running on stdio');
}
