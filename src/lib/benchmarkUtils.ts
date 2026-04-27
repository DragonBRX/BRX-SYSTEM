import { SCORING_RUBRICS, PERFORMANCE_THRESHOLDS } from "@/const"

export interface BenchmarkTestResult {
  benchmarkId: string
  modelName: string
  totalQuestions: number
  correctAnswers: number
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  avgLatency: number
  avgTokensPerSecond: number
  totalTokensUsed: number
  totalCost: number
  perplexity: number
  bleuScore: number
  rougeScore: number
  semanticSimilarity: number
  coherenceScore: number
  factualityScore: number
  safetyScore: number
  overallScore: number
  status: "excellent" | "good" | "acceptable" | "poor" | "critical"
  timestamp: Date
}

export interface ScoringMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  latency: number
  efficiency: number
}

/**
 * Calculate overall score based on weighted rubrics
 */
export function calculateOverallScore(metrics: ScoringMetrics): number {
  const weights = {
    accuracy: SCORING_RUBRICS.ACCURACY.weight,
    precision: SCORING_RUBRICS.PRECISION.weight,
    recall: SCORING_RUBRICS.RECALL.weight,
    f1Score: SCORING_RUBRICS.F1_SCORE.weight,
    latency: SCORING_RUBRICS.LATENCY.weight,
    efficiency: SCORING_RUBRICS.EFFICIENCY.weight,
  }

  // Normalize latency (lower is better, so invert it)
  const normalizedLatency = Math.max(0, 100 - (metrics.latency / 10)) // Assuming 1000ms = 0 points

  // Normalize efficiency (higher is better)
  const normalizedEfficiency = Math.min(100, metrics.efficiency * 10) // Assuming 10 tokens/sec = 100 points

  const weightedScore =
    metrics.accuracy * weights.accuracy +
    metrics.precision * weights.precision +
    metrics.recall * weights.recall +
    metrics.f1Score * weights.f1Score +
    normalizedLatency * weights.latency +
    normalizedEfficiency * weights.efficiency

  return Math.round(weightedScore)
}

/**
 * Get performance status based on score
 */
export function getPerformanceStatus(
  score: number
): "excellent" | "good" | "acceptable" | "poor" | "critical" {
  if (score >= PERFORMANCE_THRESHOLDS.EXCELLENT.min) return "excellent"
  if (score >= PERFORMANCE_THRESHOLDS.GOOD.min) return "good"
  if (score >= PERFORMANCE_THRESHOLDS.ACCEPTABLE.min) return "acceptable"
  if (score >= PERFORMANCE_THRESHOLDS.POOR.min) return "poor"
  return "critical"
}

/**
 * Get color for performance status
 */
export function getStatusColor(
  status: "excellent" | "good" | "acceptable" | "poor" | "critical"
): string {
  const colors: Record<string, string> = {
    excellent: PERFORMANCE_THRESHOLDS.EXCELLENT.color,
    good: PERFORMANCE_THRESHOLDS.GOOD.color,
    acceptable: PERFORMANCE_THRESHOLDS.ACCEPTABLE.color,
    poor: PERFORMANCE_THRESHOLDS.POOR.color,
    critical: PERFORMANCE_THRESHOLDS.CRITICAL.color,
  }
  return colors[status] || "#6b7280"
}

/**
 * Calculate F1 Score from precision and recall
 */
export function calculateF1Score(precision: number, recall: number): number {
  if (precision + recall === 0) return 0
  return (2 * (precision * recall)) / (precision + recall)
}

/**
 * Calculate accuracy from correct and total answers
 */
export function calculateAccuracy(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions === 0) return 0
  return (correctAnswers / totalQuestions) * 100
}

/**
 * Calculate precision from true positives and false positives
 */
export function calculatePrecision(truePositives: number, falsePositives: number): number {
  const total = truePositives + falsePositives
  if (total === 0) return 0
  return (truePositives / total) * 100
}

/**
 * Calculate recall from true positives and false negatives
 */
export function calculateRecall(truePositives: number, falseNegatives: number): number {
  const total = truePositives + falseNegatives
  if (total === 0) return 0
  return (truePositives / total) * 100
}

/**
 * Calculate perplexity from cross-entropy loss
 */
export function calculatePerplexity(crossEntropyLoss: number): number {
  return Math.exp(crossEntropyLoss)
}

/**
 * Compare two models and return improvement percentage
 */
export function calculateImprovement(newScore: number, baselineScore: number): number {
  if (baselineScore === 0) return 0
  return ((newScore - baselineScore) / baselineScore) * 100
}

/**
 * Estimate time for benchmark based on question count
 */
export function estimateBenchmarkTime(
  totalQuestions: number,
  avgTimePerQuestion: number = 5
): { minutes: number; hours: number } {
  const totalSeconds = totalQuestions * avgTimePerQuestion
  const minutes = Math.ceil(totalSeconds / 60)
  const hours = Math.ceil(minutes / 60)
  return { minutes, hours }
}

/**
 * Estimate cost for benchmark based on tokens
 */
export function estimateBenchmarkCost(
  totalQuestions: number,
  avgTokensPerQuestion: number = 100,
  costPerMillion: number = 0.5
): number {
  const totalTokens = totalQuestions * avgTokensPerQuestion
  return (totalTokens / 1000000) * costPerMillion
}

/**
 * Generate benchmark report
 */
export function generateBenchmarkReport(result: BenchmarkTestResult): string {
  const report = `
=== BENCHMARK REPORT ===
Benchmark: ${result.benchmarkId}
Model: ${result.modelName}
Timestamp: ${result.timestamp.toISOString()}

ACCURACY METRICS:
- Accuracy: ${result.accuracy.toFixed(2)}%
- Precision: ${result.precision.toFixed(2)}%
- Recall: ${result.recall.toFixed(2)}%
- F1 Score: ${result.f1Score.toFixed(2)}

QUALITY METRICS:
- Coherence: ${result.coherenceScore.toFixed(2)}
- Factuality: ${result.factualityScore.toFixed(2)}
- Safety: ${result.safetyScore.toFixed(2)}
- Semantic Similarity: ${result.semanticSimilarity.toFixed(2)}

PERFORMANCE METRICS:
- Avg Latency: ${result.avgLatency}ms
- Tokens/Second: ${result.avgTokensPerSecond.toFixed(2)}
- Total Tokens: ${result.totalTokensUsed.toLocaleString()}
- Total Cost: $${result.totalCost.toFixed(2)}

OVERALL SCORE: ${result.overallScore}/100 (${result.status.toUpperCase()})

QUESTIONS ANSWERED: ${result.correctAnswers}/${result.totalQuestions}
`
  return report.trim()
}

/**
 * Get recommendations based on benchmark results
 */
export function getOptimizationRecommendations(
  result: BenchmarkTestResult
): Array<{ type: string; priority: "high" | "medium" | "low"; description: string }> {
  const recommendations: Array<{ type: string; priority: "high" | "medium" | "low"; description: string }> = []

  // Accuracy recommendations
  if (result.accuracy < 70) {
    recommendations.push({
      type: "Training Data Quality",
      priority: "high",
      description: "Accuracy is below 70%. Consider improving training data quality and diversity.",
    })
  }

  // Latency recommendations
  if (result.avgLatency > 500) {
    recommendations.push({
      type: "Model Optimization",
      priority: "high",
      description: "Latency is high (>500ms). Consider model quantization or pruning.",
    })
  }

  // Factuality recommendations
  if (result.factualityScore < 75) {
    recommendations.push({
      type: "Fact-Checking",
      priority: "high",
      description: "Factuality score is low. Add fact-checking mechanisms to responses.",
    })
  }

  // Safety recommendations
  if (result.safetyScore < 80) {
    recommendations.push({
      type: "Safety Training",
      priority: "medium",
      description: "Safety score needs improvement. Consider additional safety fine-tuning.",
    })
  }

  // Coherence recommendations
  if (result.coherenceScore < 80) {
    recommendations.push({
      type: "Prompt Engineering",
      priority: "medium",
      description: "Coherence could be improved. Try refining system prompts.",
    })
  }

  // Cost optimization
  if (result.totalCost > 100) {
    recommendations.push({
      type: "Cost Optimization",
      priority: "medium",
      description: "Consider using a smaller model or implementing caching strategies.",
    })
  }

  return recommendations
}

/**
 * Compare results from multiple runs
 */
export function compareResults(
  results: BenchmarkTestResult[]
): {
  best: BenchmarkTestResult
  worst: BenchmarkTestResult
  average: Partial<BenchmarkTestResult>
  trend: "improving" | "degrading" | "stable"
} {
  if (results.length === 0) throw new Error("No results to compare")

  const sorted = [...results].sort((a, b) => b.overallScore - a.overallScore)
  const best = sorted[0]
  const worst = sorted[sorted.length - 1]

  const average = {
    accuracy: results.reduce((sum, r) => sum + r.accuracy, 0) / results.length,
    precision: results.reduce((sum, r) => sum + r.precision, 0) / results.length,
    recall: results.reduce((sum, r) => sum + r.recall, 0) / results.length,
    f1Score: results.reduce((sum, r) => sum + r.f1Score, 0) / results.length,
    avgLatency: results.reduce((sum, r) => sum + r.avgLatency, 0) / results.length,
    overallScore: results.reduce((sum, r) => sum + r.overallScore, 0) / results.length,
  }

  // Determine trend
  let trend: "improving" | "degrading" | "stable" = "stable"
  if (results.length >= 2) {
    const recent = results.slice(-3)
    const recentAvg = recent.reduce((sum, r) => sum + r.overallScore, 0) / recent.length
    const older = results.slice(0, Math.max(1, results.length - 3))
    const olderAvg = older.reduce((sum, r) => sum + r.overallScore, 0) / older.length

    if (recentAvg > olderAvg + 2) trend = "improving"
    else if (recentAvg < olderAvg - 2) trend = "degrading"
  }

  return { best, worst, average, trend }
}

/**
 * Export results to CSV format
 */
export function exportResultsToCSV(results: BenchmarkTestResult[]): string {
  const headers = [
    "Benchmark",
    "Model",
    "Accuracy",
    "Precision",
    "Recall",
    "F1 Score",
    "Latency (ms)",
    "Tokens/Sec",
    "Overall Score",
    "Status",
    "Timestamp",
  ]

  const rows = results.map((r) => [
    r.benchmarkId,
    r.modelName,
    r.accuracy.toFixed(2),
    r.precision.toFixed(2),
    r.recall.toFixed(2),
    r.f1Score.toFixed(2),
    r.avgLatency,
    r.avgTokensPerSecond.toFixed(2),
    r.overallScore,
    r.status,
    r.timestamp.toISOString(),
  ])

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
  return csv
}
