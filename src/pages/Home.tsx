import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  MessageSquare,
  Bot,
  BookOpen,
  Workflow,
  Plug,
  Cpu,
  Globe,
  Code2,
  Zap,
  ArrowRight,
  Github,
  Layers,
  Database,
  Terminal,
} from "lucide-react"

const features = [
  {
    icon: Brain,
    title: "Model Explorer",
    description: "Discover and manage open-source LLMs, vision models, and embedding models from the community.",
  },
  {
    icon: MessageSquare,
    title: "Universal Chat",
    description: "Chat with any model through a unified interface. Support for local and remote inference engines.",
  },
  {
    icon: Bot,
    title: "Agent Builder",
    description: "Create autonomous agents with memory, tools, and custom system prompts for complex tasks.",
  },
  {
    icon: BookOpen,
    title: "RAG Knowledge Bases",
    description: "Build retrieval-augmented generation pipelines with ChromaDB, Qdrant, and vector search.",
  },
  {
    icon: Workflow,
    title: "Workflow Engine",
    description: "Design multi-step AI pipelines with visual node graphs, triggers, and automation.",
  },
  {
    icon: Plug,
    title: "Integrations & MCP",
    description: "Connect Ollama, vLLM, OpenAI, Anthropic, and Model Context Protocol servers.",
  },
]

const stack = [
  { icon: Layers, label: "React 19 + TypeScript" },
  { icon: Terminal, label: "tRPC + Hono" },
  { icon: Database, label: "Drizzle ORM + MySQL" },
  { icon: Cpu, label: "Tailwind + shadcn/ui" },
]

const models = [
  { name: "Llama 3.3", org: "Meta", params: "70B", tag: "LLM" },
  { name: "DeepSeek R1", org: "DeepSeek", params: "70B", tag: "Reasoning" },
  { name: "Qwen 2.5 VL", org: "Alibaba", params: "72B", tag: "Multimodal" },
  { name: "Stable Diffusion 3.5", org: "Stability AI", params: "8B", tag: "Vision" },
  { name: "Whisper Large v3", org: "OpenAI", params: "1.5B", tag: "Audio" },
  { name: "Nomic Embed", org: "Nomic", params: "137M", tag: "Embedding" },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight">BRX SYSTEM</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32 px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            Open Source AI Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
            Your Complete
            <br />
            <span className="text-primary">Open Source AI Ecosystem</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            BRX System unifies the best open-source AI projects into a single platform.
            Run models locally, build agents, create RAG pipelines, and orchestrate workflows.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                Launch Platform <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://github.com/DragonBRX/BRX-SYSTEM" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" /> View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-12 border-y bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-sm text-muted-foreground mb-6 uppercase tracking-wider font-medium">
            Built with modern open-source technologies
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stack.map((item) => {
              const Icon = item.icon
              return (
                <Card key={item.label} className="bg-card/50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Platform Features</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Everything you need to build, deploy, and manage open-source AI in production.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <Card key={feature.title} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 space-y-3">
                    <div className="p-3 rounded-lg bg-primary/10 w-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Supported Models */}
      <section className="py-20 px-4 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">Supported Open Source Models</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Integrations with the most popular open-source AI models and frameworks.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {models.map((model) => (
              <Card key={model.name} className="text-center">
                <CardContent className="p-4 space-y-2">
                  <Badge variant="outline" className="text-xs">{model.tag}</Badge>
                  <p className="font-semibold text-sm">{model.name}</p>
                  <p className="text-xs text-muted-foreground">{model.org}</p>
                  <p className="text-xs font-medium text-primary">{model.params}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold">System Architecture</h2>
            <p className="text-muted-foreground">
              Modular, extensible, and built for scale.
            </p>
          </div>
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-blue-500/10 mx-auto w-fit">
                    <Globe className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="font-semibold">Frontend</h3>
                  <p className="text-sm text-muted-foreground">React 19 + Vite + Tailwind CSS + shadcn/ui with 40+ components</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-green-500/10 mx-auto w-fit">
                    <Code2 className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-semibold">API Layer</h3>
                  <p className="text-sm text-muted-foreground">Hono HTTP server + tRPC 11 for end-to-end type safety</p>
                </div>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-purple-500/10 mx-auto w-fit">
                    <Database className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="font-semibold">Data Layer</h3>
                  <p className="text-sm text-muted-foreground">Drizzle ORM + MySQL with relational schema and migrations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl font-bold">Ready to build with open-source AI?</h2>
          <p className="text-muted-foreground text-lg">
            BRX System aggregates the best community-driven AI tools into one powerful platform.
            Start building today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/dashboard">
              <Button size="lg" className="gap-2">
                <Cpu className="h-4 w-4" /> Launch Dashboard
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <a href="https://github.com/DragonBRX/BRX-SYSTEM" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4" /> Star on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-semibold">BRX SYSTEM</span>
            <span className="text-sm text-muted-foreground">Open Source AI Platform</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>React 19 + tRPC + Drizzle + MySQL</span>
            <span>MIT License</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
