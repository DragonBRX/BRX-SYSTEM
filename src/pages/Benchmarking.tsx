import { AppLayout } from "@/components/AppLayout"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import {
  TrendingUp,
  Zap,
  Target,
  Brain,
  AlertCircle,
  CheckCircle,
  Play,
  Plus,
  Settings,
  Download,
  Share2,
  Gauge,
  Flame,
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
import { Select } from "@/components/ui/select"

// Mock data for benchmarks
const benchmarkData = [
  { name: "MMLU", score: 89, category: "Language Understanding", difficulty: "Hard" },
  { name: "GPQA", score: 84, category: "Reasoning", difficulty: "Expert" },
  { name: "HumanEval", score: 92, category: "Programming", difficulty: "Hard" },
  { name: "MATH", score: 78, category: "Mathematics", difficulty: "Expert" },
  { name: "ARC", score: 95, category: "Knowledge", difficulty: "Medium" },
  { name: "HellaSwag", score: 88, category: "Instruction Following", difficulty: "Medium" },
]

const performanceEvolution = [
  { date: "Day 1", accuracy: 72, latency: 250, efficiency: 45 },
  { date: "Day 3", accuracy: 76, latency: 220, efficiency: 52 },
  { date: "Day 5", accuracy: 81, latency: 180, efficiency: 68 },
  { date: "Day 7", accuracy: 85, latency: 150, efficiency: 78 },
  { date: "Day 10", accuracy: 89, latency: 120, efficiency: 85 },
  { date: "Day 14", accuracy: 92, latency: 95, efficiency: 92 },
]

const qualityMetrics = [
  { metric: "Accuracy", value: 92, target: 95, status: "good" },
  { metric: "Latency (ms)", value: 95, target: 50, status: "acceptable" },
  { metric: "Throughput", value: 450, target: 500, status: "good" },
  { metric: "Coherence", value: 88, target: 90, status: "acceptable" },
  { metric: "Factuality", value: 91, target: 95, status: "good" },
  { metric: "Safety", value: 96, target: 95, status: "excellent" },
]

const modelComparison = [
  { model: "Your Model v1", mmlu: 72, gpqa: 65, humaneval: 78, math: 55, arc: 82 },
  { model: "Your Model v2", mmlu: 81, gpqa: 74, humaneval: 87, math: 68, arc: 90 },
  { model: "Your Model v3", mmlu: 89, gpqa: 84, humaneval: 92, math: 78, arc: 95 },
  { model: "Claude 3 Opus", mmlu: 88, gpqa: 85, humaneval: 84, math: 80, arc: 94 },
  { model: "GPT-4", mmlu: 86, gpqa: 83, humaneval: 90, math: 82, arc: 96 },
]

const optimizationSuggestions = [
  {
    id: 1,
    type: "Prompt Engineering",
    priority: "high",
    expectedImprovement: "+5%",
    description: "Refine system prompts for better instruction following",
  },
  {
    id: 2,
    type: "Parameter Tuning",
    priority: "high",
    expectedImprovement: "+3%",
    description: "Optimize temperature and top_p for better coherence",
  },
  {
    id: 3,
    type: "Training Data Quality",
    priority: "medium",
    expectedImprovement: "+8%",
    description: "Improve training data filtering and deduplication",
  },
  {
    id: 4,
    type: "Model Quantization",
    priority: "medium",
    expectedImprovement: "+2% speed",
    description: "Apply quantization for 40% faster inference",
  },
]

export default function Benchmarking() {
  const { user } = useAuth()
  const [selectedBenchmark, setSelectedBenchmark] = useState("all")
  const [apiEndpoint, setApiEndpoint] = useState("")
  const [showApiDialog, setShowApiDialog] = useState(false)

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Gauge className="h-8 w-8 text-blue-500" />
              Model Benchmarking & Optimization
            </h1>
            <p className="text-muted-foreground mt-1">
              Test, measure, and optimize your model with comprehensive benchmarks
            </p>
          </div>
          <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Connect API
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Connect Your Model API</DialogTitle>
                <DialogDescription>
                  Add your model endpoint to start benchmarking and optimization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>API Endpoint</Label>
                  <Input
                    placeholder="https://api.example.com/v1/chat/completions"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                  />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input type="password" placeholder="sk-..." />
                </div>
                <div>
                  <Label>Model Name</Label>
                  <Input placeholder="my-model-v1" />
                </div>
                <Button className="w-full">Connect & Start Testing</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
                <p className="text-3xl font-bold">89.5%</p>
                <p className="text-xs text-green-600">↑ +2.1% from last week</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-3xl font-bold">95ms</p>
                <p className="text-xs text-green-600">↓ 30% improvement</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tests Run</p>
                <p className="text-3xl font-bold">12,450</p>
                <p className="text-xs text-blue-600">Last 30 days</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Optimization Score</p>
                <p className="text-3xl font-bold">8.7/10</p>
                <p className="text-xs text-amber-600">3 suggestions pending</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="benchmarks" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="quality">Quality Metrics</TabsTrigger>
            <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
          </TabsList>

          {/* Benchmarks Tab */}
          <TabsContent value="benchmarks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Benchmark Results</CardTitle>
                <CardDescription>Performance across standard AI benchmarks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {benchmarkData.map((bench) => (
                    <div key={bench.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-semibold">{bench.name}</p>
                        <p className="text-sm text-muted-foreground">{bench.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{bench.difficulty}</Badge>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{bench.score}%</p>
                          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${bench.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Run New Benchmark</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Benchmark Suite</Label>
                    <select className="w-full p-2 border rounded">
                      <option>MMLU (Massive Multitask Language Understanding)</option>
                      <option>GPQA (Graduate-Level Google-Proof Q&A)</option>
                      <option>HumanEval (Programming)</option>
                      <option>MATH (Mathematics)</option>
                      <option>ARC (AI2 Reasoning Challenge)</option>
                    </select>
                  </div>
                  <Button className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Run Benchmark
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Benchmark Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">MMLU: Completed (89%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">GPQA: Completed (84%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                    <span className="text-sm">HumanEval: Running...</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Evolution Over Time</CardTitle>
                <CardDescription>Track improvements as your model is optimized</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={performanceEvolution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Accuracy %"
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="latency"
                      stroke="#ef4444"
                      strokeWidth={2}
                      name="Latency (ms)"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="efficiency"
                      stroke="#10b981"
                      strokeWidth={2}
                      name="Efficiency %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quality Metrics Tab */}
          <TabsContent value="quality" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics Dashboard</CardTitle>
                <CardDescription>Comprehensive quality indicators for your model</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {qualityMetrics.map((metric) => {
                    const percentage = (metric.value / metric.target) * 100
                    const statusColor =
                      metric.status === "excellent"
                        ? "bg-green-500"
                        : metric.status === "good"
                          ? "bg-blue-500"
                          : "bg-amber-500"

                    return (
                      <div key={metric.metric} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{metric.metric}</span>
                          <span className="text-sm text-muted-foreground">
                            {metric.value} / {metric.target}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${statusColor}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {metric.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Model Comparison Tab */}
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Model Comparison Radar</CardTitle>
                <CardDescription>Compare your model versions against industry standards</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={modelComparison}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="model" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Your Model v3" dataKey="mmlu" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                    <Radar name="Claude 3 Opus" dataKey="mmlu" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Your Model v3 vs Claude 3 Opus</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "MMLU", yours: 89, theirs: 88 },
                    { name: "GPQA", yours: 84, theirs: 85 },
                    { name: "HumanEval", yours: 92, theirs: 84 },
                    { name: "MATH", yours: 78, theirs: 80 },
                  ].map((item) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <span className="text-sm">{item.name}</span>
                      <div className="flex gap-4">
                        <Badge className="bg-blue-500">{item.yours}%</Badge>
                        <Badge variant="outline">{item.theirs}%</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Competitive Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-green-500/10 rounded border border-green-500/20">
                    <p className="text-sm font-semibold text-green-700">✓ Better at Programming</p>
                    <p className="text-xs text-muted-foreground">+8% on HumanEval vs Claude 3</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded border border-amber-500/20">
                    <p className="text-sm font-semibold text-amber-700">~ Comparable on Reasoning</p>
                    <p className="text-xs text-muted-foreground">-1% on GPQA vs Claude 3</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded border border-blue-500/20">
                    <p className="text-sm font-semibold text-blue-700">→ Room for Growth</p>
                    <p className="text-xs text-muted-foreground">+2% potential on Math tasks</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Optimization Suggestions</CardTitle>
                <CardDescription>Recommendations to improve your model performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {optimizationSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-lg hover:bg-accent/50 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{suggestion.type}</p>
                          <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        </div>
                        <Badge
                          className={
                            suggestion.priority === "high"
                              ? "bg-red-500"
                              : suggestion.priority === "medium"
                                ? "bg-amber-500"
                                : "bg-blue-500"
                          }
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-600">
                          Expected: {suggestion.expectedImprovement}
                        </span>
                        <Button size="sm" variant="outline">
                          Apply
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Parameter Tuning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Temperature: 0.7</Label>
                  <input type="range" min="0" max="2" step="0.1" defaultValue="0.7" className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Controls randomness in responses</p>
                </div>
                <div>
                  <Label>Top P: 0.9</Label>
                  <input type="range" min="0" max="1" step="0.05" defaultValue="0.9" className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">Controls diversity of token selection</p>
                </div>
                <Button className="w-full">Save & Test Parameters</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
