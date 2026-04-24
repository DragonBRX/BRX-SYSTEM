import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, Home, Bot, Database, Brain, Search,
  MessageSquare, Eye, Headphones, Settings, Server, ChevronLeft,
  ChevronRight, Terminal
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/agents", label: "Agents", icon: Bot },
  { path: "/rag", label: "RAG System", icon: Database },
  { path: "/models", label: "Models", icon: Brain },
  { path: "/projects", label: "Projects", icon: Search },
  { path: "/nlp", label: "NLP", icon: MessageSquare },
  { path: "/vision", label: "Vision", icon: Eye },
  { path: "/audio", label: "Audio", icon: Headphones },
  { path: "/system", label: "System", icon: Server },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        } bg-gray-900 border-r border-gray-800 flex flex-col`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <Terminal className="w-6 h-6 text-blue-500" />
              <span className="font-bold text-lg tracking-tight">BRX SYSTEM</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {sidebarOpen && (
            <div className="text-xs text-gray-500">
              <p>v2.0.0</p>
              <p className="mt-1">Open Source AI Platform</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
