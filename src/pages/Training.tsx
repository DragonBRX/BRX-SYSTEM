import { AppLayout } from "@/components/AppLayout"
import { trpc } from "@/providers/trpc"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  GraduationCap,
  Plus,
  Loader2,
  Play,
  Square,
  Trash2,
  Database,
  Clock,
  Cpu,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { useState } from "react"

const TRAINING_TYPES = [
  { value: "fine_tuning", label: "Fine Tuning" },
  { value: "rlhf", label: "RLHF" },
  { value: "dpo", label: "DPO" },
  { value: "distillation", label: "Distillation" },
  { value: "grpo", label: "GRPO" },
  { value: "sft", label: "SFT" },
  { value: "lora", label: "LoRA" },
  { value: "qlora", label: "QLoRA" },
]

const STATUS_COLORS: Record<string, string> = {
  queued: "secondary",
  preparing: "secondary",
  running: "default",
  paused: "warning",
  completed: "default",
  failed: "destructive",
  cancelled: "outline",
}

export default function Training() {
  const { data: jobs, refetch } = trpc.training.listJobs.useQuery()
  const { data: datasets } = trpc.training.listDatasets.useQuery()
  const createJob = trpc.training.createJob.useMutation({ onSuccess: () => refetch() })
  const cancelJob = trpc.training.cancelJob.useMutation({ onSuccess: () => refetch() })
  const deleteJob = trpc.training.deleteJob.useMutation({ onSuccess: () => refetch() })
  const createDataset = trpc.training.createDataset.useMutation()
  const seedCatalog = trpc.catalog.seedCatalog.useMutation()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [datasetDialogOpen, setDatasetDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("jobs")

  const [jobForm, setJobForm] = useState({
    name: "",
    description: "",
    baseModel: "",
    trainingType: "fine_tuning",
    datasetId: undefined as number | undefined,
    gpuType: "A100",
    gpuCount: 1,
  })

  const [datasetForm, setDatasetForm] = useState({
    name: "",
    description: "",
    type: "text" as string,
    format: "jsonl" as string,
    source: "",
    recordCount: undefined as number | undefined,
  })

  const handleCreateJob = () => {
    createJob.mutate(
      { ...jobForm, datasetId: jobForm.datasetId },
      { onSuccess: () => setDialogOpen(false) }
    )
  }

  const handleCreateDataset = () => {
    createDataset.mutate(datasetForm, { onSuccess: () => setDatasetDialogOpen(false) })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-primary" />
              Training Center
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Fine-tune and train AI models with advanced techniques
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => seedCatalog.mutate()}>
            <Database className="h-4 w-4 mr-2" />
            Seed Catalog
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="jobs">Training Jobs</TabsTrigger>
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Training Jobs</h3>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Training Job
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Create Training Job</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        placeholder="Job name..."
                        value={jobForm.name}
                        onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        placeholder="Optional description..."
                        value={jobForm.description}
                        onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Base Model</label>
                        <Input
                          placeholder="e.g., meta-llama/Llama-2-7b"
                          value={jobForm.baseModel}
                          onChange={(e) => setJobForm({ ...jobForm, baseModel: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Training Type</label>
                        <Select
                          value={jobForm.trainingType}
                          onValueChange={(v) => setJobForm({ ...jobForm, trainingType: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRAINING_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Dataset</label>
                        <Select
                          value={jobForm.datasetId?.toString()}
                          onValueChange={(v) => setJobForm({ ...jobForm, datasetId: parseInt(v) })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select dataset" />
                          </SelectTrigger>
                          <SelectContent>
                            {datasets?.map((ds) => (
                              <SelectItem key={ds.id} value={ds.id.toString()}>
                                {ds.name} ({ds.recordCount} records)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">GPU Type</label>
                        <Input
                          value={jobForm.gpuType}
                          onChange={(e) => setJobForm({ ...jobForm, gpuType: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCreateJob}
                      disabled={!jobForm.name || !jobForm.baseModel || createJob.isPending}
                    >
                      {createJob.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Create Job
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {jobs?.map((job) => (
                <Card key={job.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{job.name}</CardTitle>
                        <CardDescription className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="secondary">{job.baseModel}</Badge>
                          <Badge variant="outline">{job.trainingType}</Badge>
                          <Badge variant={STATUS_COLORS[job.status] as any || "default"}>
                            {job.status}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {job.status === "running" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelJob.mutate({ id: job.id })}
                          >
                            <Square className="h-4 w-4" />
                            <span className="ml-1">Stop</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => deleteJob.mutate({ id: job.id })}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {job.progress > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{job.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={job.progress} />
                      </div>
                    )}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      {job.currentEpoch > 0 && (
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          Epoch {job.currentEpoch}/{job.totalEpochs}
                        </span>
                      )}
                      {job.loss !== null && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          Loss: {job.loss.toFixed(4)}
                        </span>
                      )}
                      {job.gpuType && (
                        <span className="flex items-center gap-1">
                          <Cpu className="h-4 w-4" />
                          {job.gpuType} x{job.gpuCount}
                        </span>
                      )}
                      {job.startedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(job.startedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {job.errorMessage && (
                      <div className="p-3 bg-destructive/10 text-destructive text-sm rounded">
                        {job.errorMessage}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(!jobs || jobs.length === 0) && (
                <Card className="p-8 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No training jobs</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first training job to fine-tune a model
                  </p>
                  <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Training Job
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Datasets</h3>
              <Dialog open={datasetDialogOpen} onOpenChange={setDatasetDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Dataset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Dataset</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={datasetForm.name}
                        onChange={(e) => setDatasetForm({ ...datasetForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={datasetForm.description}
                        onChange={(e) => setDatasetForm({ ...datasetForm, description: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleCreateDataset}
                      disabled={!datasetForm.name}
                    >
                      Create Dataset
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets?.map((ds) => (
                <Card key={ds.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{ds.name}</CardTitle>
                    <CardDescription className="flex gap-2 mt-1">
                      <Badge variant="secondary">{ds.type}</Badge>
                      <Badge variant="outline">{ds.format}</Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ds.description || "No description"}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {ds.recordCount || 0} records
                      </span>
                      {ds.huggingfaceDataset && (
                        <Badge variant="outline">HuggingFace</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {(!datasets || datasets.length === 0) && (
                <Card className="col-span-full p-8 text-center">
                  <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No datasets</h3>
                  <p className="text-sm text-muted-foreground">
                    Create or import your first dataset
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
