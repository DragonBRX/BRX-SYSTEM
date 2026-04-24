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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Code2,
  Plus,
  Loader2,
  Sparkles,
  Trash2,
  Copy,
  Check,
  FileCode,
  Bug,
  BookOpen,
  RefreshCw,
  Wand2,
} from "lucide-react"
import { useState } from "react"

const CODE_TYPES = [
  { value: "function", label: "Function" },
  { value: "class", label: "Class" },
  { value: "component", label: "Component" },
  { value: "api", label: "API Endpoint" },
  { value: "script", label: "Script" },
  { value: "test", label: "Test" },
  { value: "full_app", label: "Full Application" },
]

const ANALYSIS_TYPES = [
  { value: "review", label: "Code Review" },
  { value: "explain", label: "Explain" },
  { value: "optimize", label: "Optimize" },
  { value: "debug", label: "Debug" },
  { value: "document", label: "Document" },
  { value: "refactor", label: "Refactor" },
  { value: "security", label: "Security Audit" },
]

export default function Code() {
  const { data: projects, refetch } = trpc.code.listProjects.useQuery()
  const generateCode = trpc.code.generate.useMutation()
  const analyzeCode = trpc.code.analyze.useMutation()
  const fixCode = trpc.code.fix.useMutation()
  const generateTests = trpc.code.generateTests.useMutation()

  const [activeTab, setActiveTab] = useState("generate")
  const [copied, setCopied] = useState(false)
  const [generatedResult, setGeneratedResult] = useState<any>(null)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [fixedCode, setFixedCode] = useState<string>("")

  const [genForm, setGenForm] = useState({
    description: "",
    language: "typescript",
    framework: "",
    type: "function" as string,
    context: "",
  })

  const [analysisForm, setAnalysisForm] = useState({
    code: "",
    language: "typescript",
    analysisType: "review",
  })

  const [fixForm, setFixForm] = useState({
    code: "",
    error: "",
    language: "typescript",
  })

  const handleGenerate = () => {
    generateCode.mutate(genForm, {
      onSuccess: (data) => setGeneratedResult(data),
    })
  }

  const handleAnalyze = () => {
    analyzeCode.mutate(analysisForm, {
      onSuccess: (data) => setAnalysisResult(data),
    })
  }

  const handleFix = () => {
    fixCode.mutate(fixForm, {
      onSuccess: (data) => setFixedCode(data.code),
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code2 className="h-6 w-6 text-primary" />
            Code Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered code generation, analysis, and debugging
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="generate">Generate</TabsTrigger>
            <TabsTrigger value="analyze">Analyze</TabsTrigger>
            <TabsTrigger value="fix">Fix</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Generate Code
                </CardTitle>
                <CardDescription>Describe what you need and AI will generate clean code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Describe what the code should do..."
                    value={genForm.description}
                    onChange={(e) => setGenForm({ ...genForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <Input
                      value={genForm.language}
                      onChange={(e) => setGenForm({ ...genForm, language: e.target.value })}
                      placeholder="typescript"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select value={genForm.type} onValueChange={(v) => setGenForm({ ...genForm, type: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CODE_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Framework (optional)</label>
                    <Input
                      value={genForm.framework}
                      onChange={(e) => setGenForm({ ...genForm, framework: e.target.value })}
                      placeholder="react, express..."
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Context (optional)</label>
                  <Textarea
                    placeholder="Additional context or existing code..."
                    value={genForm.context}
                    onChange={(e) => setGenForm({ ...genForm, context: e.target.value })}
                    rows={2}
                  />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={!genForm.description || generateCode.isPending}
                >
                  {generateCode.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate Code
                </Button>
              </CardContent>
            </Card>

            {generatedResult && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileCode className="h-5 w-5" />
                      Generated {generatedResult.language} Code
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generatedResult.code)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                    <code>{generatedResult.code}</code>
                  </pre>
                  {generatedResult.explanation && (
                    <div>
                      <h4 className="font-medium mb-1">Explanation</h4>
                      <p className="text-sm text-muted-foreground">{generatedResult.explanation}</p>
                    </div>
                  )}
                  {generatedResult.dependencies && generatedResult.dependencies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-1">Dependencies</h4>
                      <div className="flex gap-2 flex-wrap">
                        {generatedResult.dependencies.map((dep: string) => (
                          <Badge key={dep} variant="secondary">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analyze" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Code Analysis
                </CardTitle>
                <CardDescription>Review, explain, optimize or audit your code</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Language</label>
                    <Input
                      value={analysisForm.language}
                      onChange={(e) => setAnalysisForm({ ...analysisForm, language: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Analysis Type</label>
                    <Select
                      value={analysisForm.analysisType}
                      onValueChange={(v) => setAnalysisForm({ ...analysisForm, analysisType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ANALYSIS_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Code to Analyze</label>
                  <Textarea
                    placeholder="Paste your code here..."
                    value={analysisForm.code}
                    onChange={(e) => setAnalysisForm({ ...analysisForm, code: e.target.value })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!analysisForm.code || analyzeCode.isPending}
                >
                  {analyzeCode.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Bug className="h-4 w-4 mr-2" />
                  )}
                  Analyze Code
                </Button>
              </CardContent>
            </Card>

            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisResult.overallScore !== undefined ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">
                          {analysisResult.overallScore}/100
                        </div>
                        <Badge
                          variant={analysisResult.overallScore >= 80 ? "default" : analysisResult.overallScore >= 60 ? "secondary" : "destructive"}
                        >
                          {analysisResult.overallScore >= 80 ? "Excellent" : analysisResult.overallScore >= 60 ? "Good" : "Needs Work"}
                        </Badge>
                      </div>
                      {analysisResult.issues && analysisResult.issues.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Issues Found</h4>
                          <div className="space-y-2">
                            {analysisResult.issues.map((issue: any, i: number) => (
                              <div key={i} className="p-3 bg-muted rounded flex gap-3">
                                <Badge
                                  variant={
                                    issue.severity === "critical"
                                      ? "destructive"
                                      : issue.severity === "warning"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {issue.severity}
                                </Badge>
                                <div>
                                  <p className="font-medium text-sm">{issue.category}</p>
                                  <p className="text-sm text-muted-foreground">{issue.message}</p>
                                  {issue.suggestion && (
                                    <p className="text-sm text-primary mt-1">{issue.suggestion}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Suggestions</h4>
                          <ul className="list-disc list-inside text-sm space-y-1">
                            {analysisResult.suggestions.map((s: string, i: number) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm whitespace-pre-wrap">{JSON.stringify(analysisResult, null, 2)}</div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="fix" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Fix Code
                </CardTitle>
                <CardDescription>Provide code and error message to get a fix</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Input
                    value={fixForm.language}
                    onChange={(e) => setFixForm({ ...fixForm, language: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Error Message</label>
                  <Textarea
                    placeholder="Paste the error message..."
                    value={fixForm.error}
                    onChange={(e) => setFixForm({ ...fixForm, error: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Code</label>
                  <Textarea
                    placeholder="Paste your code here..."
                    value={fixForm.code}
                    onChange={(e) => setFixForm({ ...fixForm, code: e.target.value })}
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  onClick={handleFix}
                  disabled={!fixForm.code || !fixForm.error || fixCode.isPending}
                >
                  {fixCode.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4 mr-2" />
                  )}
                  Fix Code
                </Button>
              </CardContent>
            </Card>

            {fixedCode && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Fixed Code</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(fixedCode)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span className="ml-1">{copied ? "Copied" : "Copy"}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                    <code>{fixedCode}</code>
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Code Projects</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects?.map((project) => (
                <Card key={project.id} className="hover:border-primary transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="flex gap-2 mt-1">
                          <Badge variant="secondary">{project.language}</Badge>
                          <Badge variant="outline">{project.type}</Badge>
                          <Badge variant="default">{project.status}</Badge>
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      {project.framework && (
                        <Badge variant="outline">{project.framework}</Badge>
                      )}
                      <span className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        {project.fileCount || 0} files
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!projects || projects.length === 0) && (
                <Card className="col-span-full p-8 text-center">
                  <Code2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Create your first code project
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
