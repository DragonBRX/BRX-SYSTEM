import { AppLayout } from "@/components/AppLayout"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/providers/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Brain,
  MessageSquare,
  Bot,
  BookOpen,
  Workflow,
  Plug,
  ArrowRight,
  TrendingUp,
  Cpu,
  Globe,
  Zap,
} from "lucide-react"
import { Link } from "react-router"

export default function Dashboard() {
  const { user } = useAuth()
  const { data: models } = trpc.ai.modelList.useQuery()
  const { data: conversations } = trpc.ai.conversationList.useQuery({ archived: false }, { enabled: !!user })
  const { data: agents } = trpc.agent.list.useQuery(undefined, { enabled: !!user })
  const { data: knowledgeBases } = trpc.knowledge.listBases.useQuery(undefined, { enabled: !!user })

  const stats = [
    { label: "AI Models", value: models?.length ?? 0, icon: Brain, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Conversations", value: conversations?.length ?? 0, icon: MessageSquare, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Agents", value: agents?.length ?? 0, icon: Bot, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Knowledge Bases", value: knowledgeBases?.length ?? 0, icon: BookOpen, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]

  const quickActions = [
    { label: "New Chat", path: "/chat", icon: MessageSquare, desc: "Start a conversation with any model" },
    { label: "Explore Models", path: "/models", icon: Brain, desc: "Browse open-source AI models" },
    { label: "Create Agent", path: "/agents", icon: Bot, desc: "Build a custom AI agent" },
    { label: "Add Knowledge", path: "/knowledge", icon: BookOpen, desc: "Create a RAG knowledge base" },
    { label: "Build Workflow", path: "/workflows", icon: Workflow, desc: "Design an automation pipeline" },
    { label: "Connect Service", path: "/integrations", icon: Plug, desc: "Link external AI providers" },
  ]

  const featuredModels = models?.slice(0, 4) ?? []

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name ?? "User"}. Manage your open-source AI ecosystem.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Card key={action.label} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-5">
                    <Link to={action.path} className="flex items-start gap-4">
                      <div className="p-2.5 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{action.label}</h3>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{action.desc}</p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Featured Models */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Featured Open Source Models</h2>
            <Link to="/models">
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredModels.map((model) => (
              <Card key={model.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase">{model.category}</span>
                  </div>
                  <CardTitle className="text-base">{model.name}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{model.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {model.downloads?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {model.parameters}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {model.license}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
