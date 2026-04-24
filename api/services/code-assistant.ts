import { aiEngine } from "../engine/ai-engine";
import type { AIRequest, AIResponse } from "../engine/ai-engine";

export interface CodeGenerationRequest {
  description: string;
  language: string;
  framework?: string;
  type?: "function" | "class" | "component" | "api" | "script" | "test" | "full_app";
  context?: string;
  requirements?: string[];
  style?: string;
  modelId?: string;
}

export interface CodeAnalysisRequest {
  code: string;
  language: string;
  analysisType: "review" | "explain" | "optimize" | "debug" | "document" | "refactor" | "security";
  context?: string;
  modelId?: string;
}

export interface CodeProjectRequest {
  name: string;
  description: string;
  type: string;
  language: string;
  framework?: string;
  features?: string[];
  architecture?: string;
  modelId?: string;
}

export interface GeneratedCode {
  code: string;
  language: string;
  explanation: string;
  dependencies?: string[];
  fileName?: string;
  imports?: string[];
  usage?: string;
}

export interface CodeReviewResult {
  overallScore: number;
  issues: CodeIssue[];
  suggestions: string[];
  strengths: string[];
  summary: string;
}

export interface CodeIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface CodeExplanation {
  summary: string;
  components: CodeComponent[];
  flow: string;
  complexity: string;
}

export interface CodeComponent {
  name: string;
  type: string;
  description: string;
  parameters?: string[];
  returns?: string;
}

export interface ProjectStructure {
  files: ProjectFile[];
  structure: string;
  setup: string;
  dependencies: Record<string, string>;
  readme: string;
}

export interface ProjectFile {
  path: string;
  content: string;
  description: string;
}

const LANGUAGE_CONFIGS: Record<string, { extension: string; comment: string }> = {
  javascript: { extension: "js", comment: "//" },
  typescript: { extension: "ts", comment: "//" },
  python: { extension: "py", comment: "#" },
  java: { extension: "java", comment: "//" },
  go: { extension: "go", comment: "//" },
  rust: { extension: "rs", comment: "//" },
  cpp: { extension: "cpp", comment: "//" },
  c: { extension: "c", comment: "//" },
  csharp: { extension: "cs", comment: "//" },
  ruby: { extension: "rb", comment: "#" },
  php: { extension: "php", comment: "//" },
  swift: { extension: "swift", comment: "//" },
  kotlin: { extension: "kt", comment: "//" },
  dart: { extension: "dart", comment: "//" },
  elixir: { extension: "ex", comment: "#" },
  scala: { extension: "scala", comment: "//" },
  clojure: { extension: "clj", comment: ";;" },
  haskell: { extension: "hs", comment: "--" },
  lua: { extension: "lua", comment: "--" },
  perl: { extension: "pl", comment: "#" },
  r: { extension: "r", comment: "#" },
  matlab: { extension: "m", comment: "%" },
  shell: { extension: "sh", comment: "#" },
  powershell: { extension: "ps1", comment: "#" },
  sql: { extension: "sql", comment: "--" },
  html: { extension: "html", comment: "<!-- -->" },
  css: { extension: "css", comment: "/* */" },
  sass: { extension: "scss", comment: "//" },
  json: { extension: "json", comment: "//" },
  yaml: { extension: "yaml", comment: "#" },
  xml: { extension: "xml", comment: "<!-- -->" },
  markdown: { extension: "md", comment: "<!-- -->" },
  dockerfile: { extension: "Dockerfile", comment: "#" },
  terraform: { extension: "tf", comment: "#" },
  graphql: { extension: "graphql", comment: "#" },
  protobuf: { extension: "proto", comment: "//" },
  solidity: { extension: "sol", comment: "//" },
  vyper: { extension: "vy", comment: "#" },
  move: { extension: "move", comment: "//" },
  cairo: { extension: "cairo", comment: "//" },
};

export class CodeAssistant {
  async generateCode(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const prompt = this.buildGenerationPrompt(request);
    const aiRequest: AIRequest = {
      messages: [{ role: "user", content: prompt }],
      model: request.modelId || "gpt-4o",
      temperature: 0.3,
      maxTokens: 4000,
      systemPrompt:
        "Voce e um engenheiro de software senior especialista em gerar codigo limpo, eficiente e bem documentado. Sempre escreva codigo de producao com tratamento de erros e boas praticas.",
    };

    const response = await aiEngine.generate(aiRequest);
    return this.parseGeneratedCode(response, request.language);
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<CodeReviewResult | CodeExplanation> {
    const prompt = this.buildAnalysisPrompt(request);
    const aiRequest: AIRequest = {
      messages: [{ role: "user", content: prompt }],
      model: request.modelId || "gpt-4o",
      temperature: 0.3,
      maxTokens: 4000,
      responseFormat: request.analysisType === "review" ? "json" : "text",
      systemPrompt: "Voce e um engenheiro de software senior especialista em revisao de codigo e analise.",
    };

    const response = await aiEngine.generate(aiRequest);

    if (request.analysisType === "review" || request.analysisType === "security") {
      return this.parseReviewResponse(response);
    }

    return this.parseExplanationResponse(response);
  }

  async generateProject(request: CodeProjectRequest): Promise<ProjectStructure> {
    const prompt = this.buildProjectPrompt(request);
    const aiRequest: AIRequest = {
      messages: [{ role: "user", content: prompt }],
      model: request.modelId || "gpt-4o",
      temperature: 0.4,
      maxTokens: 8000,
      responseFormat: "json",
      systemPrompt:
        "Voce e um arquiteto de software senior. Gere projetos completos com estrutura de arquivos, codigo e documentacao.",
    };

    const response = await aiEngine.generate(aiRequest);
    return this.parseProjectResponse(response);
  }

  async fixCode(code: string, error: string, language: string, modelId?: string): Promise<string> {
    const aiRequest: AIRequest = {
      messages: [
        {
          role: "user",
          content: `Corrija o seguinte codigo ${language} que esta gerando este erro:\n\nERRO: ${error}\n\nCODIGO:\n\`\`\`${language}\n${code}\n\`\`\`\n\nForneca apenas o codigo corrigido completo.`,
        },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.2,
      maxTokens: 4000,
      systemPrompt: "Voce e um especialista em debug. Corrija o codigo mantendo a mesma estrutura e logica.",
    };

    const response = await aiEngine.generate(aiRequest);
    return this.extractCodeBlock(response.content);
  }

  async generateTests(code: string, language: string, framework?: string, modelId?: string): Promise<string> {
    const aiRequest: AIRequest = {
      messages: [
        {
          role: "user",
          content: `Gere testes completos para o seguinte codigo ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n${framework ? `Use o framework de teste: ${framework}` : ""}`,
        },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.3,
      maxTokens: 4000,
      systemPrompt: "Gere testes unitarios completos cobrindo casos normais, edge cases e tratamento de erros.",
    };

    const response = await aiEngine.generate(aiRequest);
    return this.extractCodeBlock(response.content);
  }

  async refactorCode(
    code: string,
    instruction: string,
    language: string,
    modelId?: string
  ): Promise<{ code: string; explanation: string }> {
    const aiRequest: AIRequest = {
      messages: [
        {
          role: "user",
          content: `Refatore o seguinte codigo ${language}:\n\nINSTRUCAO: ${instruction}\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.3,
      maxTokens: 4000,
      systemPrompt: "Refatore o codigo melhorando qualidade, performance e mantendo funcionalidade.",
    };

    const response = await aiEngine.generate(aiRequest);
    const codeBlock = this.extractCodeBlock(response.content);
    const explanation = response.content.replace(/```[\s\S]*?```/g, "").trim();

    return { code: codeBlock, explanation };
  }

  async convertCode(code: string, fromLang: string, toLang: string, modelId?: string): Promise<string> {
    const aiRequest: AIRequest = {
      messages: [
        {
          role: "user",
          content: `Converta o seguinte codigo ${fromLang} para ${toLang}:\n\n\`\`\`${fromLang}\n${code}\n\`\`\``,
        },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.2,
      maxTokens: 4000,
      systemPrompt: `Converta o codigo mantendo a logica e funcionalidade. Use idiomas e padroes idiomaticos de ${toLang}.`,
    };

    const response = await aiEngine.generate(aiRequest);
    return this.extractCodeBlock(response.content);
  }

  async generateDocumentation(code: string, language: string, modelId?: string): Promise<string> {
    const aiRequest: AIRequest = {
      messages: [
        {
          role: "user",
          content: `Gere documentacao completa para o seguinte codigo ${language}:\n\n\`\`\`${language}\n${code}\n\`\`\``,
        },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.3,
      maxTokens: 4000,
      systemPrompt: "Gere documentacao tecnica clara com exemplos de uso, parametros e retornos.",
    };

    const response = await aiEngine.generate(aiRequest);
    return response.content;
  }

  private buildGenerationPrompt(request: CodeGenerationRequest): string {
    const typeMap: Record<string, string> = {
      function: "funcao",
      class: "classe",
      component: "componente",
      api: "endpoint de API",
      script: "script",
      test: "teste unitario",
      full_app: "aplicacao completa",
    };

    return `Gere codigo ${request.language} para: ${request.description}

Tipo: ${typeMap[request.type || "function"] || request.type}
${request.framework ? `Framework: ${request.framework}` : ""}
${request.context ? `Contexto:\n${request.context}` : ""}
${request.requirements ? `Requisitos:\n${request.requirements.map((r) => `- ${r}`).join("\n")}` : ""}
${request.style ? `Estilo de codigo: ${request.style}` : ""}

Forneca:
1. Codigo completo e funcional
2. Explicacao do funcionamento
3. Dependencias necessarias
4. Exemplo de uso`;
  }

  private buildAnalysisPrompt(request: CodeAnalysisRequest): string {
    const typePrompts: Record<string, string> = {
      review: "Faca uma revisao de codigo completa identificando problemas, bugs, code smells e oportunidades de melhoria.",
      explain: "Explique detalhadamente como este codigo funciona, seus componentes e fluxo de execucao.",
      optimize: "Analise e sugira otimizacoes de performance, memoria e legibilidade.",
      debug: "Identifique possiveis bugs, erros e problemas neste codigo.",
      document: "Gere documentacao para este codigo.",
      refactor: "Sugira refatoracoes para melhorar a qualidade do codigo.",
      security: "Faca uma analise de seguranca identificando vulnerabilidades.",
    };

    return `${typePrompts[request.analysisType] || request.analysisType}

LINGUAGEM: ${request.language}
${request.context ? `CONTEXTO: ${request.context}` : ""}

CODIGO:\n\`\`\`${request.language}\n${request.code}\n\`\`\`

${request.analysisType === "review" || request.analysisType === "security" ? "Retorne em JSON com: overallScore (0-100), issues (array com severity, category, message, line, suggestion), suggestions, strengths, summary" : ""}`;
  }

  private buildProjectPrompt(request: CodeProjectRequest): string {
    return `Gere um projeto completo:

NOME: ${request.name}
DESCRICAO: ${request.description}
TIPO: ${request.type}
LINGUAGEM: ${request.language}
${request.framework ? `FRAMEWORK: ${request.framework}` : ""}
${request.features ? `FUNCIONALIDADES:\n${request.features.map((f) => `- ${f}`).join("\n")}` : ""}
${request.architecture ? `ARQUITETURA: ${request.architecture}` : ""}

Retorne em JSON com:
{
  "files": [
    {
      "path": "caminho/do/arquivo",
      "content": "conteudo completo",
      "description": "descricao do arquivo"
    }
  ],
  "structure": "arvore de diretorios",
  "setup": "instrucoes de instalacao",
  "dependencies": { "nome": "versao" },
  "readme": "conteudo do README.md"
}`;
  }

  private parseGeneratedCode(response: AIResponse, language: string): GeneratedCode {
    const code = this.extractCodeBlock(response.content);
    const explanation = response.content.replace(/```[\s\S]*?```/g, "").trim();

    const langConfig = LANGUAGE_CONFIGS[language.toLowerCase()];
    const dependencies = this.extractDependencies(response.content, language);

    return {
      code,
      language,
      explanation,
      dependencies,
      fileName: langConfig ? `main.${langConfig.extension}` : "main.txt",
    };
  }

  private parseReviewResponse(response: AIResponse): CodeReviewResult {
    try {
      const parsed = JSON.parse(response.content);
      return {
        overallScore: parsed.overallScore || 70,
        issues: parsed.issues || [],
        suggestions: parsed.suggestions || [],
        strengths: parsed.strengths || [],
        summary: parsed.summary || "",
      };
    } catch {
      return {
        overallScore: 70,
        issues: [{ severity: "info", category: "general", message: response.content }],
        suggestions: [],
        strengths: [],
        summary: response.content,
      };
    }
  }

  private parseExplanationResponse(response: AIResponse): CodeExplanation {
    return {
      summary: response.content.substring(0, 500),
      components: [],
      flow: response.content,
      complexity: "N/A",
    };
  }

  private parseProjectResponse(response: AIResponse): ProjectStructure {
    try {
      const parsed = JSON.parse(response.content);
      return {
        files: parsed.files || [],
        structure: parsed.structure || "",
        setup: parsed.setup || "",
        dependencies: parsed.dependencies || {},
        readme: parsed.readme || "",
      };
    } catch {
      return {
        files: [],
        structure: "",
        setup: "",
        dependencies: {},
        readme: response.content,
      };
    }
  }

  private extractCodeBlock(text: string): string {
    const match = text.match(/```(?:\w+)?\n?([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }

  private extractDependencies(text: string, language: string): string[] {
    const deps: string[] = [];

    if (language === "python") {
      const importMatches = text.matchAll(/^(?:import|from)\s+(\w+)/gm);
      for (const match of importMatches) {
        if (!["os", "sys", "json", "re", "math", "random", "datetime", "typing", "collections", "itertools", "functools", "pathlib", "hashlib", "base64", "urllib", "http", "sqlite3", "csv", "xml", "html"].includes(match[1])) {
          deps.push(match[1]);
        }
      }
    } else if (language === "javascript" || language === "typescript") {
      const importMatches = text.matchAll(/(?:import|require)\s*\(?['"]([^'"./][^'"]*)['"]/g);
      for (const match of importMatches) {
        const pkg = match[1].split("/")[0];
        if (!deps.includes(pkg)) deps.push(pkg);
      }
    }

    return [...new Set(deps)];
  }

  getSupportedLanguages(): string[] {
    return Object.keys(LANGUAGE_CONFIGS);
  }

  getLanguageConfig(language: string): { extension: string; comment: string } | undefined {
    return LANGUAGE_CONFIGS[language.toLowerCase()];
  }
}

export const codeAssistant = new CodeAssistant();
