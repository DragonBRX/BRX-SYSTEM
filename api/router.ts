import { authRouter } from "./auth-router";
import { createRouter, publicQuery } from "./middleware";
import { aiRouter } from "./ai-router";
import { agentRouter } from "./agent-router";
import { knowledgeRouter } from "./knowledge-router";
import { workflowRouter } from "./workflow-router";
import { integrationRouter, mcpRouter } from "./integration-router";
import { storyRouter } from "./story-router";
import { codeRouter } from "./code-router";
import { trainingRouter } from "./training-router";
import { catalogRouter } from "./catalog-router";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  ai: aiRouter,
  agent: agentRouter,
  knowledge: knowledgeRouter,
  workflow: workflowRouter,
  integration: integrationRouter,
  mcp: mcpRouter,
  story: storyRouter,
  code: codeRouter,
  training: trainingRouter,
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
