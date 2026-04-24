import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { aiRouter } from "./ai-router";
import { agentRouter } from "./agent-router";
import { knowledgeRouter } from "./knowledge-router";
import { workflowRouter } from "./workflow-router";
import { integrationRouter, mcpRouter } from "./integration-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  ai: aiRouter,
  agent: agentRouter,
  knowledge: knowledgeRouter,
  workflow: workflowRouter,
  integration: integrationRouter,
  mcp: mcpRouter,
});

export type AppRouter = typeof appRouter;
