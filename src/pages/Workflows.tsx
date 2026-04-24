import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Workflow,
  Plus,
  Trash2,
  Play,
  GitBranch,
  Circle,
  ArrowRight,
  Loader2,
  Sparkles,
  Clock,
  Webhook,
  Zap,
} from "lucide-react"
import { useState } from "react"

export default function Workflows() {
  const { data: workflows, refetch } = trpc.workflow.list.useQuery()
  const createWf = trpc.workflow.create.useMutation({ onSuccess: () => refetch() })
  const deleteWf = trpc.workflow.delete.useMutation({ onSuccess: () => refetch() })
  const runWf = trpc.workflow.run.useMutation()

  const [open, setOpen] = useState(false)
  const [runDialog, setRunDialog] = useState<number | null>(null)
  const [runResult, setRunResult] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    triggerType: "manual" as string,
    cronExpression: "",
  })

  const handleCreate = async () => {
    await createWf.mutateAsync({
      ...form,
      triggerType: form.triggerType as "manual" | "scheduled" | "webhook" | "event",
      nodes: [
        { id: "start", type: "trigger", label: "Start", position: { x: 100, y: 100 } },
        { id: "llm", type: "llm", label: "LLM Node", position: { x: 300, y: 100 } },
        { id: "end", type: "output", label: "Output", position: { x: 500, y: 100 } },
      ],
      edges: [
        { id: "e1", source: "start", target: "llm" },
        { id: "e2", source: "llm", target: "end" },
      ],
    })
    setOpen(false)
    setForm({ name: "", description: "", triggerType: "manual", cronExpression: "" })
  }

  const handleRun = async (wfId: number) => {
    setIsRunning(true)
    setRunResult("")
    try {
      const result = await runWf.mutateAsync({ id: wfId, inputData: { query: "test" } })
      setRunResult(result.response)
    } finally {
      setIsRunning(false)
    }
  }

  const triggerIcons = {
    manual: Zap,
    scheduled: Clock,
    webhook: Webhook,
    event: GitBranch,
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground mt-1">
              Design multi-step AI pipelines and automation with visual node graphs.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Workflow</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Data Pipeline" /></div>
                <div className="space-y-2"><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
                <div className="space-y-2"><Label>Trigger</Label>
                  <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.triggerType} onChange={e => setForm({...form, triggerType: e.target.value as any})}>
                    <option value="manual">Manual</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="webhook">Webhook</option>
                    <option value="event">Event</option>
                  </select>
                </div>
                {form.triggerType === "scheduled" && (
                  <div className="space-y-2"><Label>Cron Expression</Label><Input value={form.cronExpression} onChange={e => setForm({...form, cronExpression: e.target.value})} placeholder="0 */6 * * *" /></div>
                )}
                <Button className="w-full" disabled={!form.name || createWf.isPending} onClick={handleCreate}>
                  {createWf.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Workflow"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workflows?.map((wf) => {
            const TriggerIcon = triggerIcons[wf.triggerType as keyof typeof triggerIcons] || Zap
            const nodeCount = (wf.nodes as any[])?.length ?? 0
            const edgeCount = (wf.edges as any[])?.length ?? 0
            return (
              <Card key={wf.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-blue-500/10"><Workflow className="h-5 w-5 text-blue-500" /></div>
                      <div>
                        <CardTitle className="text-base">{wf.name}</CardTitle>
                        <p className="text-xs text-muted-foreground">{wf.triggerType}</p>
                      </div>
                    </div>
                    <Badge variant={wf.isActive ? "default" : "secondary"}>{wf.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pb-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{wf.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Circle className="h-3 w-3" /> {nodeCount} nodes</span>
                    <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" /> {edgeCount} edges</span>
                    <span className="flex items-center gap-1"><TriggerIcon className="h-3 w-3" /> {wf.runCount} runs</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button size="sm" className="flex-1 gap-1" onClick={() => { setRunDialog(wf.id); setRunResult(""); }}>
                      <Play className="h-3 w-3" /> Run
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => deleteWf.mutate({ id: wf.id })}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {workflows?.length === 0 && (
          <div className="text-center py-20">
            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No workflows</p>
            <p className="text-sm text-muted-foreground">Create your first automation pipeline.</p>
          </div>
        )}

        <Dialog open={runDialog !== null} onOpenChange={() => setRunDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Run Workflow</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Button className="w-full gap-2" disabled={isRunning} onClick={() => runDialog && handleRun(runDialog)}>
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isRunning ? "Executing..." : "Execute Workflow"}
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
