import { AppLayout } from "@/components/AppLayout"
import { useAuth } from "@/hooks/useAuth"
import { trpc } from "@/providers/trpc"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  Zap,
  TrendingUp,
  Cpu,
  Gauge,
  Activity,
  Brain,
  Flame,
  Target,
  Settings,
  Play,
  BarChart3,
  AlertCircle,
} from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

// Mock data for evolution metrics
const evolutionData = [
  { version: "BRX v0.1", agents: 10, threads: 4, efficiency: 45, speed: 120, accuracy: 72 },
  { version: "BRX v0.2", agents: 25, threads: 8, efficiency: 58, speed: 145, accuracy: 78 },
  { version: "BRX v0.3", agents: 50, threads: 16, efficiency: 72, speed: 180, accuracy: 84 },
  { version: "BRX v0.4", agents: 100, threads: 32, efficiency: 85, speed: 220, accuracy: 89 },
  { version: "DragonBRX v1.0", agents: 1000, threads: 128, efficiency: 95, speed: 450, accuracy: 96 },
]

const performanceMetrics = [
  { metric: "Latency", BRX: 120, DragonBRX: 25, unit: "ms" },
  { metric: "Throughput", BRX: 100, DragonBRX: 950, unit: "req/s" },
  { metric: "Memory", BRX: 8192, DragonBRX: 6144, unit: "MB" },
  { metric: "Accuracy", BRX: 89, DragonBRX: 96, unit: "%" },
  { metric: "Power Efficiency", BRX: 72, DragonBRX: 94, unit: "%" },
]

const agentHealthData = [
  { name: "Active", value: 850, fill: "#10b981" },
  { name: "Idle", value: 120, fill: "#6366f1" },
  { name: "Processing", value: 25, fill: "#f59e0b" },
  { name: "Error", value: 5, fill: "#ef4444" },
]

const radarData = [
  { category: "Speed", BRX: 72, DragonBRX: 95 },
  { category: "Accuracy", BRX: 89, DragonBRX: 96 },
  { category: "Efficiency", BRX: 85, DragonBRX: 95 },
  { category: "Scalability", BRX: 60, DragonBRX: 98 },
  { category: "Stability", BRX: 88, DragonBRX: 99 },
  { category: "Adaptability", BRX: 75, DragonBRX: 97 },
]

export default function Evolution() {
  const { user } = useAuth()
  const [maxAgents, setMaxAgents] = useState(1000)
  const [maxThreads, setMaxThreads] = useState(128)
  const [showConfig, setShowConfig] = useState(false)

  const stats = [
    {
      label: "Active Agents",
      value: "850/1000",
      icon: Bot,
      color: "text-green-500",
      bg: "bg-green-500/10",
      trend: "+12%",
    },
    {
      label: "System Efficiency",
      value: "95%",
      icon: Gauge,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      trend: "+8%",
    },
    {
      label: "Avg Latency",
      value: "25ms",
      icon: Zap,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      trend: "-45%",
    },
    {
      label: "Model Accuracy",
      value: "96%",
      icon: Target,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      trend: "+7%",
    },
  ]

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Flame className="h-8 w-8 text-orange-500" />
              Dragon Evolution Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor the evolution from BRX to DragonBRX - 1000x more powerful
            </p>
          </div>
          <Dialog open={showConfig} onOpenChange={setShowConfig}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Settings className="h-4 w-4" />
                Hardware Config
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hardware Configuration</DialogTitle>
                <DialogDescription>
                  Configure agent allocation and thread mapping for optimal performance
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Max Agents: {maxAgents}</Label>
                  <Slider
                    value={[maxAgents]}
                    onValueChange={(value) => setMaxAgents(value[0])}
                    min={100}
                    max={2000}
                    step={100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust the maximum number of concurrent agents
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Max Threads: {maxThreads}</Label>
                  <Slider
                    value={[maxThreads]}
                    onValueChange={(value) => setMaxThreads(value[0])}
                    min={4}
                    max={256}
                    step={4}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set the maximum thread pool size (CPU cores available)
                  </p>
                </div>
                <Button className="w-full">Save Configuration</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.label}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bg}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="evolution" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="evolution">Evolution Path</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="agents">Agent Health</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
          </TabsList>

          {/* Evolution Path Tab */}
          <TabsContent value="evolution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>BRX → DragonBRX Evolution Timeline</CardTitle>
                <CardDescription>
                  Tracking the progression from 100 agents to 1000 agents with exponential improvements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={evolutionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="version" angle={-45} textAnchor="end" height={80} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="agents"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      name="Agents"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Accuracy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Current Model</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="w-fit">BRX v0.4</Badge>
                    <p className="text-sm text-muted-foreground">100 Agents</p>
                    <p className="text-sm text-muted-foreground">32 Threads</p>
                    <p className="text-sm font-semibold text-blue-600">89% Accuracy</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">In Development</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="w-fit bg-amber-500">DragonBRX v1.0</Badge>
                    <p className="text-sm text-muted-foreground">1000 Agents</p>
                    <p className="text-sm text-muted-foreground">128 Threads</p>
                    <p className="text-sm font-semibold text-green-600">96% Accuracy</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="w-fit bg-green-500">+1000x Agents</Badge>
                    <p className="text-sm text-green-600 font-semibold">+10x More Threads</p>
                    <p className="text-sm text-green-600 font-semibold">+7% Accuracy</p>
                    <p className="text-sm text-green-600 font-semibold">-78% Latency</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics: BRX vs DragonBRX</CardTitle>
                <CardDescription>
                  Key performance indicators showing the 1000x improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={performanceMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="BRX" fill="#6366f1" />
                    <Bar dataKey="DragonBRX" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Latency Improvement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">BRX</span>
                      <span className="font-semibold">120ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <span className="text-sm">DragonBRX</span>
                      <span className="font-semibold text-green-600">25ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <Zap className="h-3 w-3 inline mr-1" />
                      4.8x faster response time
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Memory Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">BRX</span>
                      <span className="font-semibold">8192 MB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                    <div className="flex justify-between mt-4">
                      <span className="text-sm">DragonBRX</span>
                      <span className="font-semibold text-green-600">6144 MB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: "75%" }}></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      <TrendingUp className="h-3 w-3 inline mr-1" />
                      25% more efficient with 10x capacity
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agent Health Tab */}
          <TabsContent value="agents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Agent Status Distribution</CardTitle>
                <CardDescription>Current state of all 1000 agents in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={evolutionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="version" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="agents" fill="#f59e0b" stroke="#f59e0b" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {agentHealthData.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{item.name}</span>
                          <Badge variant="outline">{item.value}</Badge>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${(item.value / 1000) * 100}%`, backgroundColor: item.fill }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    System Load
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">CPU Usage</span>
                        <span className="font-semibold">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Memory Usage</span>
                        <span className="font-semibold">62%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: "62%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Network I/O</span>
                        <span className="font-semibold">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Health Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded">
                      <Badge className="bg-green-500 mt-0.5">OK</Badge>
                      <span className="text-sm">All agents operational</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded">
                      <Badge className="bg-blue-500 mt-0.5">INFO</Badge>
                      <span className="text-sm">5 agents in recovery mode</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded">
                      <Badge className="bg-amber-500 mt-0.5">WARN</Badge>
                      <span className="text-sm">CPU threshold at 78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Capability Comparison: BRX vs DragonBRX</CardTitle>
                <CardDescription>Radar chart showing performance across all dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="BRX" dataKey="BRX" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                    <Radar
                      name="DragonBRX"
                      dataKey="DragonBRX"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.25}
                    />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Architecture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold mb-1">BRX</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 100 Concurrent Agents</li>
                      <li>• 32 Thread Pool</li>
                      <li>• Single-node deployment</li>
                      <li>• 8GB Memory baseline</li>
                    </ul>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm font-semibold mb-1">DragonBRX</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 1000 Concurrent Agents</li>
                      <li>• 128 Thread Pool</li>
                      <li>• Distributed architecture</li>
                      <li>• 6GB Memory optimized</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Improvements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Agent Capacity</span>
                      <Badge className="bg-green-500">+900%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Thread Efficiency</span>
                      <Badge className="bg-green-500">+300%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Speed</span>
                      <Badge className="bg-green-500">+1700%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Efficiency</span>
                      <Badge className="bg-green-500">+25%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Accuracy</span>
                      <Badge className="bg-green-500">+7%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
