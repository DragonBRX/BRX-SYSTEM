import { relations } from "drizzle-orm";
import {
  users,
  conversations,
  messages,
  agents,
  knowledgeBases,
  documents,
  workflows,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  agents: many(agents),
  workflows: many(workflows),
  knowledgeBases: many(knowledgeBases),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, { fields: [conversations.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
}));

export const agentsRelations = relations(agents, ({ one }) => ({
  user: one(users, { fields: [agents.userId], references: [users.id] }),
}));

export const knowledgeBasesRelations = relations(knowledgeBases, ({ one, many }) => ({
  user: one(users, { fields: [knowledgeBases.userId], references: [users.id] }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  knowledgeBase: one(knowledgeBases, { fields: [documents.knowledgeBaseId], references: [knowledgeBases.id] }),
}));

export const workflowsRelations = relations(workflows, ({ one }) => ({
  user: one(users, { fields: [workflows.userId], references: [users.id] }),
}));
