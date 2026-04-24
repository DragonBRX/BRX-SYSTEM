import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import axios from "axios";
import {
  Activity, Bot, Database, Brain, TrendingUp,
  Clock, Zap, Layers
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

interface SystemStats {
  cpu_percent: number;
  memory: {
    total: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: health } = useQuery("health", () =>
    axios.get(`${API_BASE}/health/detailed`).then((r) => r.data)
  );

  const { data: stats } = useQuery("stats", () =>
    axios.get(`${API_BASE}/system/stats`).then((r) => r.data)
  );

  const { data: agents } = useQuery("agents", () =>
    axios.get(`${API_BASE}/agents/list`).then((r) => r.data)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">BRX SYSTEM Dashboard</h1>
        <p className="text-gray-400 mt-1">
          Open Source AI Integration Platform - Unified control center
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active Agents"
          value={agents?.length || 0}
          subtitle="Registered agents"
          icon={Bot}
          color="bg-blue-500/20 text-blue-400"
        />
        <StatCard
          title="System Status"
          value={health?.status || "Unknown"}
          subtitle={health ? `${Object.values(health.checks).filter(Boolean).length}/${Object.keys(health.checks).length} checks passing` : ""}
          icon={Activity}
          color="bg-green-500/20 text-green-400"
        />
        <StatCard
          title="CPU Usage"
          value={`${stats?.cpu_percent || 0}%`}
          subtitle={stats ? `${(stats.memory.available / 1024 / 1024 / 1024).toFixed(1)}GB RAM free` : ""}
          icon={Zap}
          color="bg-yellow-500/20 text-yellow-400"
        />
        <StatCard
          title="Disk Usage"
          value={`${stats?.disk?.percent || 0}%`}
          subtitle={stats ? `${(stats.disk.free / 1024 / 1024 / 1024).toFixed(1)}GB free` : ""}
          icon={Layers}
          color="bg-purple-500/20 text-purple-400"
        />
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold">AI Models</h3>
          </div>
          <p className="text-sm text-gray-400">
            Manage LLM providers, configure models, and monitor usage across OpenAI, Anthropic, Ollama, and HuggingFace.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-green-400" />
            <h3 className="font-semibold">RAG System</h3>
          </div>
          <p className="text-sm text-gray-400">
            Ingest documents, build knowledge bases, and query with retrieval-augmented generation across multiple vector stores.
          </p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold">Agent Framework</h3>
          </div>
          <p className="text-sm text-gray-400">
            Create and orchestrate ReAct and Planning agents with tool usage, memory, and multi-agent collaboration.
          </p>
        </div>
      </div>

      {/* System Info */}
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold mb-4">System Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Version</p>
            <p className="text-gray-200">2.0.0</p>
          </div>
          <div>
            <p className="text-gray-500">Environment</p>
            <p className="text-gray-200">{health?.version || "development"}</p>
          </div>
          <div>
            <p className="text-gray-500">Default LLM</p>
            <p className="text-gray-200">Ollama / llama3.2</p>
          </div>
          <div>
            <p className="text-gray-500">Vector Store</p>
            <p className="text-gray-200">ChromaDB / Qdrant</p>
          </div>
        </div>
      </div>
    </div>
  );
}
