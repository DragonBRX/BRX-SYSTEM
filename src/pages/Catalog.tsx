import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Library,
  Search,
  Star,
  GitFork,
  ExternalLink,
  BookOpen,
  Cpu,
  Brain,
  Eye,
  Volume2,
  Layers,
  Database,
  Wrench,
  Layout,
  Workflow,
  HardDrive,
  BarChart3,
  Sparkles,
} from "lucide-react"
import { useState } from "react"

const CATEGORIES = [
  { value: "all", label: "All", icon: Library },
  { value: "llm", label: "LLM Models", icon: Brain },
  { value: "vision", label: "Vision", icon: Eye },
  { value: "audio", label: "Audio", icon: Volume2 },
  { value: "multimodal", label: "Multimodal", icon: Layers },
  { value: "agent_framework", label: "Agent Frameworks", icon: Sparkles },
  { value: "rag", label: "RAG", icon: Database },
  { value: "training", label: "Training", icon: Cpu },
  { value: "inference", label: "Inference", icon: Cpu },
  { value: "vector_database", label: "Vector DBs", icon: Database },
  { value: "workflow", label: "Workflows", icon: Workflow },
  { value: "tool", label: "Tools", icon: Wrench },
]

const CATEGORY_ICONS: Record<string, any> = {
  llm: Brain,
  vision: Eye,
  audio: Volume2,
  multimodal: Layers,
  agent_framework: Sparkles,
  rag: Database,
  training: Cpu,
  inference: Cpu,
  vector_database: Database,
  workflow: Workflow,
  tool: Wrench,
  ui: Layout,
  memory: HardDrive,
  evaluation: BarChart3,
  data_processing: Cpu,
}

export default function Catalog() {
  const { data: items, refetch } = trpc.catalog.list.useQuery()
  const { data: featured } = trpc.catalog.listFeatured.useQuery()
  const seedCatalog = trpc.catalog.seedCatalog.useMutation({ onSuccess: () => refetch() })

  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  const filteredItems = items?.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.tags && (item.tags as string[]).some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    return matchesCategory && matchesSearch
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Library className="h-6 w-6 text-primary" />
              Open Source Catalog
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Curated collection of the best open-source AI projects
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => seedCatalog.mutate()}
            disabled={seedCatalog.isPending}
          >
            {seedCatalog.isPending ? "Seeding..." : "Reset Catalog"}
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="flex flex-wrap h-auto">
            {CATEGORIES.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value} className="gap-1">
                <cat.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            {/* Featured Section */}
            {activeCategory === "all" && !searchQuery && featured && featured.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Featured Projects</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {featured.slice(0, 4).map((item) => (
                    <FeaturedCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            )}

            {/* All Projects */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems?.map((item) => (
                <ProjectCard key={item.id} item={item} />
              ))}
            </div>

            {(!filteredItems || filteredItems.length === 0) && (
              <Card className="p-8 text-center">
                <Library className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "The catalog is empty. Click 'Reset Catalog' to populate it."}
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}

function FeaturedCard({ item }: { item: any }) {
  const Icon = CATEGORY_ICONS[item.category] || Sparkles

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <CardDescription className="flex gap-2 mt-1">
                <Badge variant="secondary">{item.category}</Badge>
                {item.language && <Badge variant="outline">{item.language}</Badge>}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {item.description}
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-4 w-4" />
            {item.stars?.toLocaleString() || 0}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <GitFork className="h-4 w-4" />
            {item.forks?.toLocaleString() || 0}
          </span>
          {item.license && (
            <Badge variant="outline" className="text-xs">
              {item.license}
            </Badge>
          )}
        </div>
        {item.features && (
          <div className="flex gap-2 flex-wrap">
            {(item.features as string[]).slice(0, 3).map((f: string) => (
              <Badge key={f} variant="secondary" className="text-xs">
                {f}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <a href={item.githubUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-1" />
              GitHub
            </a>
          </Button>
          {item.documentationUrl && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={item.documentationUrl} target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-4 w-4 mr-1" />
                Docs
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectCard({ item }: { item: any }) {
  const Icon = CATEGORY_ICONS[item.category] || Sparkles

  return (
    <Card className="hover:border-primary transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">{item.name}</CardTitle>
          </div>
        </div>
        <CardDescription className="flex gap-2 mt-1 flex-wrap">
          <Badge variant="secondary" className="text-xs">{item.category}</Badge>
          {item.language && <Badge variant="outline" className="text-xs">{item.language}</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {item.description}
        </p>
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Star className="h-4 w-4" />
            {item.stars?.toLocaleString() || 0}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <GitFork className="h-4 w-4" />
            {item.forks?.toLocaleString() || 0}
          </span>
          {item.license && (
            <Badge variant="outline" className="text-xs">
              {item.license}
            </Badge>
          )}
        </div>
        {item.tags && (
          <div className="flex gap-1 flex-wrap">
            {(item.tags as string[]).slice(0, 3).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <Button variant="outline" size="sm" className="w-full" asChild>
          <a href={item.githubUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-1" />
            View on GitHub
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
