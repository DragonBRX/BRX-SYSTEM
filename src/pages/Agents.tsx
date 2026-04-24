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
  Bot,
  Plus,
  Trash2,
  Play,
  Wrench,
  Brain,
  Settings2,
  Loader2,
  Sparkles,
} from "lucide-react"
import { useState } from "react"

export default function Agents() {
  const { data: agents, refetch } = trpc.agent.list.useQuery()
  const { data: models } = trpc.ai.modelList.useQuery()
  const createAgent = trpc.agent.create.useMutation({ onSuccess: () => refetch() })
  const deleteAgent = trpc.agent.delete.useMutation({ onSuccess: () => refetch() })
  const runAgent = trpc.agent.run.useMutation()

  const [open, setOpen] = useState(false)
  const [runDialog, setRunDialog] = useState<number | null>(null)
  const [runInput, setRunInput] = useState("")
  const [runResult, setRunResult] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    systemPrompt: "You are a helpful AI assistant.",
    modelId: "",
    temperature: 0.7,
    maxTokens: 2048,
    memoryEnabled: true,
    isPublic: false,
  })

  const handleCreate = async () => {
    await createAgent.mutateAsync(form)
    setOpen(false)
    setForm({
      name: "",
      description: "",
      systemPrompt: "You are a helpful AI assistant.",
      modelId: "",
      temperature: 0.7,
      maxTokens: 2048,
      memoryEnabled: true,
      isPublic: false,
    })
  }

  const handleRun = async (agentId: number) => {
    setIsRunning(true)
    setRunResult("")
    try {
      const result = await runAgent.mutateAsync({ id: agentId, input: runInput })
      setRunResult(result.response)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-muted-foreground mt-1">
              Build, configure, and deploy autonomous AI agents with tools and memory.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Create New Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="My Research Agent"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="What does this agent do?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>System Prompt</Label>
                  <Textarea
                    value={form.systemPrompt}
                    onChange={(e) => setForm({ ...form, systemPrompt: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Model</Label>
                  <select
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    value={form.modelId}
                    onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                  >
                    <option value="">Select a model...</option>
                    {models?.map((m) => (
                      <option key={m.modelId} value={m.modelId}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      min={0}
                      max={2}
                      step={0.1}
                      value={form.temperature}
                      onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Tokens</Label>
                    <Input
                      type="number"
                      value={form.maxTokens}
                      onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="memory"
                    checked={form.memoryEnabled}
                    onChange={(e) => setForm({ ...form, memoryEnabled: e.target.checked })}
                  />
                  <Label htmlFor="memory">Enable Memory</Label>
                </div>
                <Button
                  className="w-full"
                  disabled={!form.name || !form.modelId || createAgent.isPending}
                  onClick={handleCreate}
                >
                  {createAgent.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Agent"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents?.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <Bot className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {models?.find((m) => m.modelId === agent.modelId)?.name ?? agent.modelId}
                      </p>
                    </div>
                  </div>
                  {agent.isPublic && <Badge variant="secondary">Public</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{agent.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Settings2 className="h-3 w-3" /> Temp: {agent.temperature}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" /> {agent.maxTokens} tokens
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" /> {(agent.tools as any[])?.length ?? 0} tools
                  </Badge>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => {
                      setRunDialog(agent.id)
                      setRunInput("")
                      setRunResult("")
                    }}
                  >
                    <Play className="h-3 w-3" /> Run
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => deleteAgent.mutate({ id: agent.id })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {agents?.length === 0 && (
          <div className="text-center py-20">
            <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No agents yet</p>
            <p className="text-sm text-muted-foreground">Create your first AI agent to automate tasks.</p>
          </div>
        )}

        {/* Run Dialog */}
        <Dialog open={runDialog !== null} onOpenChange={() => setRunDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Run Agent</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Textarea
                placeholder="Enter your task or question..."
                value={runInput}
                onChange={(e) => setRunInput(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full gap-2"
                disabled={!runInput.trim() || isRunning}
                onClick={() => runDialog && handleRun(runDialog)}
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRunning ? "Running..." : "Execute Agent"}
              </Button>
              {runResult && (
                <Card className="bg-muted">
                  <CardContent className="p-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{runResult}</pre>
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
