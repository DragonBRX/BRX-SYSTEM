import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BookText,
  Plus,
  Loader2,
  Sparkles,
  Eye,
  Trash2,
  Wand2,
  FileText,
  Play,
} from "lucide-react"
import { useState } from "react"

const GENRES = [
  { value: "fantasy", label: "Fantasy" },
  { value: "sci_fi", label: "Sci-Fi" },
  { value: "horror", label: "Horror" },
  { value: "romance", label: "Romance" },
  { value: "mystery", label: "Mystery" },
  { value: "thriller", label: "Thriller" },
  { value: "adventure", label: "Adventure" },
  { value: "dystopian", label: "Dystopian" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "steampunk", label: "Steampunk" },
]

const TONES = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "epic", label: "Epic" },
  { value: "humorous", label: "Humorous" },
  { value: "serious", label: "Serious" },
  { value: "suspenseful", label: "Suspenseful" },
  { value: "whimsical", label: "Whimsical" },
  { value: "gritty", label: "Gritty" },
  { value: "inspirational", label: "Inspirational" },
]

const AUDIENCES = [
  { value: "children", label: "Children" },
  { value: "young_adult", label: "Young Adult" },
  { value: "adult", label: "Adult" },
  { value: "all_ages", label: "All Ages" },
]

export default function Stories() {
  const { data: stories, refetch } = trpc.story.list.useQuery()
  const createStory = trpc.story.create.useMutation({ onSuccess: () => refetch() })
  const deleteStory = trpc.story.delete.useMutation({ onSuccess: () => refetch() })
  const generateOutline = trpc.story.generateOutline.useMutation({ onSuccess: () => refetch() })
  const generateChapter = trpc.story.generateChapter.useMutation()
  const generateFull = trpc.story.generateFullStory.useMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedStory, setSelectedStory] = useState<number | null>(null)
  const [generatingChapter, setGeneratingChapter] = useState<number | null>(null)
  const [form, setForm] = useState({
    title: "",
    genre: "fantasy",
    tone: "epic",
    targetAudience: "adult",
    premise: "",
    setting: "",
    targetWordCount: 5000,
    chapterCount: 5,
    language: "pt-BR",
  })

  const activeStory = stories?.find((s) => s.id === selectedStory)

  const handleCreate = () => {
    createStory.mutate(form, {
      onSuccess: () => {
        setDialogOpen(false)
        setForm({
          title: "",
          genre: "fantasy",
          tone: "epic",
          targetAudience: "adult",
          premise: "",
          setting: "",
          targetWordCount: 5000,
          chapterCount: 5,
          language: "pt-BR",
        })
      },
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookText className="h-6 w-6 text-primary" />
              Story Creator
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create AI-powered stories with rich narratives and characters
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Story
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create New Story</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter story title..."
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Genre</label>
                    <Select value={form.genre} onValueChange={(v) => setForm({ ...form, genre: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GENRES.map((g) => (
                          <SelectItem key={g.value} value={g.value}>
                            {g.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Tone</label>
                    <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TONES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Audience</label>
                    <Select value={form.targetAudience} onValueChange={(v) => setForm({ ...form, targetAudience: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCES.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Premise</label>
                  <Textarea
                    placeholder="What is the story about?"
                    value={form.premise}
                    onChange={(e) => setForm({ ...form, premise: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Setting</label>
                  <Textarea
                    placeholder="Where and when does the story take place?"
                    value={form.setting}
                    onChange={(e) => setForm({ ...form, setting: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Target Word Count</label>
                    <Input
                      type="number"
                      value={form.targetWordCount}
                      onChange={(e) => setForm({ ...form, targetWordCount: parseInt(e.target.value) || 5000 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Chapter Count</label>
                    <Input
                      type="number"
                      value={form.chapterCount}
                      onChange={(e) => setForm({ ...form, chapterCount: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreate}
                  disabled={!form.title || createStory.isPending}
                >
                  {createStory.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Create Story
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {selectedStory && activeStory ? (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedStory(null)}>
              Back to Stories
            </Button>

            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{activeStory.title}</CardTitle>
                    <CardDescription className="flex gap-2 mt-2">
                      <Badge variant="secondary">{activeStory.genre}</Badge>
                      <Badge variant="outline">{activeStory.tone}</Badge>
                      <Badge variant="outline">{activeStory.targetAudience}</Badge>
                      <Badge variant="default">{activeStory.status}</Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateOutline.mutate({ id: activeStory.id })}
                      disabled={generateOutline.isPending}
                    >
                      {generateOutline.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      <span className="ml-2">Generate Outline</span>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => generateFull.mutate({ id: activeStory.id })}
                      disabled={generateFull.isPending}
                    >
                      {generateFull.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      <span className="ml-2">Generate Full Story</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeStory.premise && (
                  <div>
                    <h4 className="font-medium mb-1">Premise</h4>
                    <p className="text-sm text-muted-foreground">{activeStory.premise}</p>
                  </div>
                )}
                {activeStory.setting && (
                  <div>
                    <h4 className="font-medium mb-1">Setting</h4>
                    <p className="text-sm text-muted-foreground">{activeStory.setting}</p>
                  </div>
                )}
                {activeStory.mainCharacters && (
                  <div>
                    <h4 className="font-medium mb-2">Characters</h4>
                    <div className="grid gap-2">
                      {(activeStory.mainCharacters as Array<{ name: string; description: string; role: string }>).map((char, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <Badge variant="outline">{char.role}</Badge>
                          <span className="font-medium">{char.name}</span>
                          <span className="text-sm text-muted-foreground">{char.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeStory.chapters && (
                  <div>
                    <h4 className="font-medium mb-2">Chapters</h4>
                    <div className="space-y-2">
                      {(activeStory.chapters as Array<{ number: number; title: string; content?: string; wordCount?: number }>).map((ch) => (
                        <Card key={ch.number} className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">
                              Chapter {ch.number}: {ch.title}
                            </h5>
                            <div className="flex gap-2">
                              {ch.wordCount && (
                                <Badge variant="secondary">{ch.wordCount} words</Badge>
                              )}
                              {!ch.content && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setGeneratingChapter(ch.number)
                                    generateChapter.mutate(
                                      { id: activeStory.id, chapterNumber: ch.number },
                                      { onSettled: () => setGeneratingChapter(null) }
                                    )
                                  }}
                                  disabled={generatingChapter === ch.number}
                                >
                                  {generatingChapter === ch.number ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                  <span className="ml-1">Generate</span>
                                </Button>
                              )}
                            </div>
                          </div>
                          {ch.content && (
                            <div className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded max-h-96 overflow-auto">
                              {ch.content}
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                {activeStory.wordCount > 0 && (
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <Badge variant="secondary">{activeStory.wordCount} total words</Badge>
                    <Badge variant="outline">{activeStory.chapterCount} chapters</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stories?.map((story) => (
              <Card
                key={story.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedStory(story.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{story.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteStory.mutate({ id: story.id })
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <CardDescription className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{story.genre}</Badge>
                    <Badge variant="outline">{story.tone}</Badge>
                    <Badge variant="default">{story.status}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {story.premise || "No premise set"}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      {story.wordCount || 0} words
                    </span>
                    <span className="flex items-center gap-1">
                      <BookText className="h-3 w-3" />
                      {story.chapterCount || 0} chapters
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!stories || stories.length === 0) && (
              <Card className="col-span-full p-8 text-center">
                <BookText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No stories yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first AI-powered story
                </p>
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Story
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
