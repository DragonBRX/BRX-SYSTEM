import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import axios from "axios";
import { Bot, Plus, Play, Trash2, Settings, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export default function Agents() {
  const [showCreate, setShowCreate] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: "",
    role: "general",
    instructions: "",
    model: "llama3.2",
    tools: [] as string[],
  });
  const [queryInput, setQueryInput] = useState("");
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery("agents", () =>
    axios.get(`${API_BASE}/agents/list`).then((r) => r.data)
  );

  const { data: templates } = useQuery("templates", () =>
    axios.get(`${API_BASE}/agents/templates`).then((r) => r.data)
  );

  const createMutation = useMutation(
    (data: any) => axios.post(`${API_BASE}/agents/create`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries("agents");
        setShowCreate(false);
        setNewAgent({ name: "", role: "general", instructions: "", model: "llama3.2", tools: [] });
      },
    }
  );

  const executeMutation = useMutation(
    ({ name, query }: { name: string; query: string }) =>
      axios.post(`${API_BASE}/agents/execute/${name}`, { query }),
    {
      onSuccess: (data) => {
        setExecutionResult(data.data);
      },
    }
  );

  const deleteMutation = useMutation(
    (name: string) => axios.delete(`${API_BASE}/agents/${name}`),
    {
      onSuccess: () => queryClient.invalidateQueries("agents"),
    }
  );

  if (isLoading) return <div className="text-gray-400">Loading agents...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-500" />
            AI Agents
          </h1>
          <p className="text-gray-400">Create and manage autonomous AI agents</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Agent
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Create Agent</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Name</label>
              <input
                value={newAgent.name}
                onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                placeholder="my_agent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <select
                value={newAgent.role}
                onChange={(e) => setNewAgent({ ...newAgent, role: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="research">Research</option>
                <option value="code">Code</option>
                <option value="analysis">Analysis</option>
                <option value="creative">Creative</option>
                <option value="planning">Planning</option>
                <option value="review">Review</option>
                <option value="executor">Executor</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Instructions</label>
              <textarea
                value={newAgent.instructions}
                onChange={(e) => setNewAgent({ ...newAgent, instructions: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm h-24 focus:outline-none focus:border-blue-500"
                placeholder="You are a helpful assistant..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => createMutation.mutate(newAgent)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Agent List */}
      <div className="space-y-3">
        {agents?.map((agent: any) => (
          <div
            key={agent.name}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-xs text-gray-500">
                    {agent.role} | {agent.llm_provider} / {agent.model} | {agent.tools.length || 0} tools
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  agent.status === "idle" ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {agent.status}
                </span>
                <button
                  onClick={() => setExpandedAgent(expandedAgent === agent.name ? null : agent.name)}
                  className="p-1.5 hover:bg-gray-800 rounded-lg"
                >
                  {expandedAgent === agent.name ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteMutation.mutate(agent.name)}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expandedAgent === agent.name && (
              <div className="border-t border-gray-800 p-4">
                <div className="flex gap-2 mb-4">
                  <input
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Enter query for this agent..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        executeMutation.mutate({ name: agent.name, query: queryInput });
                      }
                    }}
                  />
                  <button
                    onClick={() => executeMutation.mutate({ name: agent.name, query: queryInput })}
                    disabled={executeMutation.isLoading || !queryInput}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Run
                  </button>
                </div>

                {executeMutation.isLoading && (
                  <div className="text-sm text-gray-400">Executing agent...</div>
                )}

                {executionResult && executionResult.agent_name === agent.name && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                      <span>Execution ID: {executionResult.execution_id}</span>
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">{executionResult.status}</span>
                    </div>
                    <div className="text-sm whitespace-pre-wrap">{executionResult.output}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      Steps: {executionResult.steps} | Duration: {executionResult.duration_ms.toFixed(0)}ms | Tokens: {executionResult.tokens_used}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
