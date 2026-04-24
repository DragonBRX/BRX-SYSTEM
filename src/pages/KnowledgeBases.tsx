import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  FileText,
  Database,
  Layers,
  Loader2,
  Upload,
  Sparkles,
} from "lucide-react"
import { useState } from "react"

export default function KnowledgeBases() {
  const { data: bases, refetch } = trpc.knowledge.listBases.useQuery()
  const createBase = trpc.knowledge.createBase.useMutation({ onSuccess: () => refetch() })
  const deleteBase = trpc.knowledge.deleteBase.useMutation({ onSuccess: () => refetch() })
  const addDoc = trpc.knowledge.addDocument.useMutation({ onSuccess: () => refetch() })
  const queryRag = trpc.knowledge.queryRag.useMutation()

  const [open, setOpen] = useState(false)
  const [ragDialog, setRagDialog] = useState<number | null>(null)
  const [ragQuery, setRagQuery] = useState("")
  const [ragResult, setRagResult] = useState("")
  const [isQuerying, setIsQuerying] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    embeddingModel: "nomic-embed-text",
    vectorStore: "chromadb" as const,
    chunkSize: 512,
    chunkOverlap: 50,
  })
  const [docForm, setDocForm] = useState({ name: "", content: "" })
  const [activeBase, setActiveBase] = useState<number | null>(null)

  const handleCreate = async () => {
    await createBase.mutateAsync(form)
    setOpen(false)
    setForm({ name: "", description: "", embeddingModel: "nomic-embed-text", vectorStore: "chromadb", chunkSize: 512, chunkOverlap: 50 })
  }

  const handleAddDoc = async () => {
    if (!activeBase) return
    await addDoc.mutateAsync({ knowledgeBaseId: activeBase, ...docForm, size: docForm.content.length })
    setDocForm({ name: "", content: "" })
  }

  const handleQuery = async () => {
    if (!ragDialog) return
    setIsQuerying(true)
    setRagResult("")
    try {
      const result = await queryRag.mutateAsync({ knowledgeBaseId: ragDialog, query: ragQuery })
      setRagResult(result.response)
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Knowledge Bases</h1>
            <p className="text-muted-foreground mt-1">
              Build RAG systems with vector databases for semantic search and retrieval.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Base</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Knowledge Base</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="My Docs" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="space-y-2"><Label>Vector Store</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.vectorStore} onChange={e => setForm({...form, vectorStore: e.target.value as any})}>
                    <option value="chromadb">ChromaDB</option>
                    <option value="qdrant">Qdrant</option>
                    <option value="weaviate">Weaviate</option>
                    <option value="milvus">Milvus</option>
                    <option value="pgvector">pgvector</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Chunk Size</Label><Input type="number" value={form.chunkSize} onChange={e => setForm({...form, chunkSize: parseInt(e.target.value)})} /></div>
                  <div className="space-y-2"><Label>Overlap</Label><Input type="number" value={form.chunkOverlap} onChange={e => setForm({...form, chunkOverlap: parseInt(e.target.value)})} /></div>
                </div>
                <Button className="w-full" disabled={!form.name || createBase.isPending} onClick={handleCreate}>
                  {createBase.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {bases?.map((base) => (
            <Card key={base.id} className={`cursor-pointer transition-colors ${activeBase === base.id ? "border-primary" : "hover:border-primary/50"}`} onClick={() => setActiveBase(base.id)}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange-500/10"><Database className="h-5 w-5 text-orange-500" /></div>
                  <div>
                    <CardTitle className="text-base">{base.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{base.vectorStore}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{base.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline"><Layers className="h-3 w-3 mr-1" />{base.chunkSize} chunk</Badge>
                  <Badge variant="outline"><FileText className="h-3 w-3 mr-1" />{base.documentCount} docs</Badge>
                </div>
                <div className="flex gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={e => { e.stopPropagation(); setRagDialog(base.id); setRagQuery(""); setRagResult(""); }}>
                    <Search className="h-3 w-3" /> Query
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={e => { e.stopPropagation(); deleteBase.mutate({ id: base.id }); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeBase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4" /> Add Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Document name" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} />
              <Textarea placeholder="Paste document content..." rows={6} value={docForm.content} onChange={e => setDocForm({...docForm, content: e.target.value})} />
              <Button disabled={!docForm.name || !docForm.content || addDoc.isPending} onClick={handleAddDoc}>
                {addDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Document"}
              </Button>
            </CardContent>
          </Card>
        )}

        {bases?.length === 0 && (
          <div className="text-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No knowledge bases</p>
            <p className="text-sm text-muted-foreground">Create a knowledge base to start building RAG pipelines.</p>
          </div>
        )}

        <Dialog open={ragDialog !== null} onOpenChange={() => setRagDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>RAG Query</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Ask a question..." value={ragQuery} onChange={e => setRagQuery(e.target.value)} />
              </div>
              <Button className="w-full gap-2" disabled={!ragQuery.trim() || isQuerying} onClick={handleQuery}>
                {isQuerying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isQuerying ? "Retrieving..." : "Search Knowledge"}
              </Button>
              {ragResult && (
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{ragResult}</pre>
                  </CardContent>
                </Card>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
