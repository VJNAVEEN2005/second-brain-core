import 'dotenv/config';
import { SecondBrain } from './sdk/index.js';
import { buildServer } from './server.js';

export * from './types/index.js';
export * from './db/storage.js';
export * from './db/local-file.adapter.js';
export * from './graph/local-file.adapter.js';
export * from './mcp/server.js';
export * from './engines/workspace.engine.js';
export * from './engines/project.engine.js';
export * from './engines/checkpoint.engine.js';
export * from './engines/event.engine.js';
export * from './engines/graph.engine.js';
export * from './graph/adapter.js';
export * from './graph/memory.adapter.js';
export * from './graph/neo4j.adapter.js';
export * from './memory/memory.engine.js';
export * from './adapters/models/continuation.engine.js';
export * from './vcs/branch.engine.js';
export * from './vcs/conflict.engine.js';
export * from './sdk/index.js';
export * from './server.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const port = parseInt(process.env.PORT || '3000', 10);
  const host = process.env.HOST || '0.0.0.0';

  const brain = new SecondBrain({ databaseUrl });
  const app = await buildServer(brain, { logger: true });

  try {
    await app.listen({ port, host });
    console.log(`\n🧠 Second Brain Core running at http://${host}:${port}`);
    console.log(`   Mode: ${databaseUrl ? 'PostgreSQL' : 'In-Memory (Fast Dev/Test)'}`);
    console.log(`   Health check: http://localhost:${port}/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  main();
}
