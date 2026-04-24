import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Search,
  Cpu,
  TrendingUp,
  Globe,
  Zap,
  Layers,
  ExternalLink,
  Download,
  Star,
} from "lucide-react"
import { useState } from "react"

const categories = ["all", "llm", "vision", "audio", "multimodal", "embedding", "code", "agent"]

export default function Models() {
  const { data: models, refetch } = trpc.ai.modelList.useQuery()
  const seedMutation = trpc.ai.seedModels.useMutation({ onSuccess: () => refetch() })
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")

  const filtered = models?.filter((m) => {
    const matchesSearch =
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase()) ||
      (m.tags as string[])?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = category === "all" || m.category === category
    return matchesSearch && matchesCategory
  })

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Model Explorer</h1>
            <p className="text-muted-foreground mt-1">
              Discover and manage open-source AI models from the community.
            </p>
          </div>
          <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
            <Download className="h-4 w-4 mr-2" />
            {seedMutation.isPending ? "Seeding..." : "Seed Default Models"}
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search models, tags, descriptions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat}
                size="sm"
                variant={category === cat ? "default" : "outline"}
                onClick={() => setCategory(cat)}
                className="capitalize"
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Model Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered?.map((model) => (
            <Card key={model.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{model.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{model.provider}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {model.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-3">{model.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {((model.tags as string[]) ?? []).slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Cpu className="h-3 w-3" /> {model.architecture ?? "Unknown"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3" /> {model.parameters ?? "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {model.quantization ?? "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> {model.license ?? "N/A"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {model.downloads?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {model.rating}
                    </span>
                  </div>
                  {model.sourceUrl && (
                    <Button size="sm" variant="ghost" className="h-8 gap-1" asChild>
                      <a href={model.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" /> Source
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered?.length === 0 && (
          <div className="text-center py-20">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No models found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or seed the default models.</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
