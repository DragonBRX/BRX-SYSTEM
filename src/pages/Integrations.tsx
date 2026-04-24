import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plug,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Link2,
  Loader2,
  Terminal,
  Globe,
} from "lucide-react"
import { useState } from "react"

const integrationTypes = [
  { value: "ollama", label: "Ollama", desc: "Local LLM inference server" },
  { value: "openai", label: "OpenAI", desc: "GPT-4, GPT-3.5, DALL-E" },
  { value: "anthropic", label: "Anthropic", desc: "Claude models" },
  { value: "google", label: "Google", desc: "Gemini, PaLM" },
  { value: "huggingface", label: "HuggingFace", desc: "Model hub and inference API" },
  { value: "local", label: "Local", desc: "Custom local endpoint" },
  { value: "mcp", label: "MCP", desc: "Model Context Protocol" },
  { value: "custom", label: "Custom", desc: "Generic OpenAI-compatible API" },
]

export default function Integrations() {
  const { data: integrations, refetch } = trpc.integration.list.useQuery()
  const { data: mcpServers, refetch: refetchMcp } = trpc.mcp.list.useQuery()
  const createInt = trpc.integration.create.useMutation({ onSuccess: () => refetch() })
  const deleteInt = trpc.integration.delete.useMutation({ onSuccess: () => refetch() })
  const testInt = trpc.integration.testConnection.useMutation({ onSuccess: () => refetch() })
  const createMcp = trpc.mcp.create.useMutation({ onSuccess: () => refetchMcp() })
  const deleteMcp = trpc.mcp.delete.useMutation({ onSuccess: () => refetchMcp() })

  const [intOpen, setIntOpen] = useState(false)
  const [mcpOpen, setMcpOpen] = useState(false)
  const [intForm, setIntForm] = useState({ name: "", type: "ollama" as const, endpoint: "", apiKey: "" })
  const [mcpForm, setMcpForm] = useState({ name: "", transport: "stdio" as const, command: "", url: "" })

  const handleCreateInt = async () => {
    await createInt.mutateAsync(intForm)
    setIntOpen(false)
    setIntForm({ name: "", type: "ollama", endpoint: "", apiKey: "" })
  }

  const handleCreateMcp = async () => {
    await createMcp.mutateAsync(mcpForm)
    setMcpOpen(false)
    setMcpForm({ name: "", transport: "stdio", command: "", url: "" })
  }

  const statusConfig = {
    connected: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10", label: "Connected" },
    disconnected: { icon: XCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Disconnected" },
    error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Error" },
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect external AI providers, local inference engines, and MCP servers.
          </p>
        </div>

        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">AI Providers</TabsTrigger>
            <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={intOpen} onOpenChange={setIntOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add Integration</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Add AI Provider</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={intForm.name} onChange={e => setIntForm({...intForm, name: e.target.value})} placeholder="My Ollama" /></div>
                    <div className="space-y-2"><Label>Type</Label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={intForm.type} onChange={e => setIntForm({...intForm, type: e.target.value as any})}>
                        {integrationTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2"><Label>Endpoint URL</Label><Input value={intForm.endpoint} onChange={e => setIntForm({...intForm, endpoint: e.target.value})} placeholder="http://localhost:11434" /></div>
                    <div className="space-y-2"><Label>API Key (optional)</Label><Input type="password" value={intForm.apiKey} onChange={e => setIntForm({...intForm, apiKey: e.target.value})} /></div>
                    <Button className="w-full" disabled={!intForm.name || createInt.isPending} onClick={handleCreateInt}>
                      {createInt.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrations?.map((int) => {
                const config = statusConfig[int.status as keyof typeof statusConfig] || statusConfig.disconnected
                const StatusIcon = config.icon
                return (
                  <Card key={int.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${config.bg}`}><Plug className={`h-5 w-5 ${config.color}`} /></div>
                          <div>
                            <CardTitle className="text-base">{int.name}</CardTitle>
                            <p className="text-xs text-muted-foreground capitalize">{int.type}</p>
                          </div>
                        </div>
                        <Badge variant={int.status === "connected" ? "default" : "secondary"} className="gap-1">
                          <StatusIcon className="h-3 w-3" /> {config.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3 w-3" /> {int.endpoint ?? "No endpoint"}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <Button size="sm" variant="outline" className="flex-1 gap-1" disabled={testInt.isPending} onClick={() => testInt.mutate({ id: int.id })}>
                          <RefreshCw className={`h-3 w-3 ${testInt.isPending ? "animate-spin" : ""}`} /> Test
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => deleteInt.mutate({ id: int.id })}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {integrations?.length === 0 && (
              <div className="text-center py-20">
                <Plug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No integrations</p>
                <p className="text-sm text-muted-foreground">Connect your first AI provider to get started.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mcp" className="space-y-6">
            <div className="flex justify-end">
              <Dialog open={mcpOpen} onOpenChange={setMcpOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add MCP Server</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Add MCP Server</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2"><Label>Name</Label><Input value={mcpForm.name} onChange={e => setMcpForm({...mcpForm, name: e.target.value})} /></div>
                    <div className="space-y-2"><Label>Transport</Label>
                      <select className="w-full border rounded-md px-3 py-2 text-sm" value={mcpForm.transport} onChange={e => setMcpForm({...mcpForm, transport: e.target.value as any})}>
                        <option value="stdio">stdio</option>
                        <option value="sse">SSE</option>
                        <option value="http">HTTP</option>
                      </select>
                    </div>
                    {mcpForm.transport === "stdio" ? (
                      <div className="space-y-2"><Label>Command</Label><Input value={mcpForm.command} onChange={e => setMcpForm({...mcpForm, command: e.target.value})} placeholder="npx -y @anthropic-ai/mcp-server" /></div>
                    ) : (
                      <div className="space-y-2"><Label>URL</Label><Input value={mcpForm.url} onChange={e => setMcpForm({...mcpForm, url: e.target.value})} placeholder="http://localhost:3000/sse" /></div>
                    )}
                    <Button className="w-full" disabled={!mcpForm.name || createMcp.isPending} onClick={handleCreateMcp}>
                      {createMcp.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add MCP Server"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mcpServers?.map((server) => (
                <Card key={server.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-violet-500/10"><Server className="h-5 w-5 text-violet-500" /></div>
                        <div>
                          <CardTitle className="text-base">{server.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{server.transport}</p>
                        </div>
                      </div>
                      <Badge variant={server.isActive ? "default" : "secondary"}>{server.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 pb-4">
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {server.transport === "stdio" ? <Terminal className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
                      {server.command ?? server.url ?? "N/A"}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {((server.tools as any[]) ?? []).map((tool: any, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{tool.name}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto" onClick={() => deleteMcp.mutate({ id: server.id })}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {mcpServers?.length === 0 && (
              <div className="text-center py-20">
                <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No MCP servers</p>
                <p className="text-sm text-muted-foreground">Add a Model Context Protocol server to extend agent capabilities.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
