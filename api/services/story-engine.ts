import { aiEngine } from "../engine/ai-engine";
import type { AIRequest, AIResponse } from "../engine/ai-engine";

export interface StoryCharacter {
  name: string;
  description: string;
  role: "protagonist" | "antagonist" | "supporting" | "mentor" | "love_interest" | "other";
  traits: string[];
  backstory?: string;
  goals?: string;
}

export interface StoryChapter {
  number: number;
  title: string;
  summary: string;
  scenes: StoryScene[];
  content?: string;
  wordCount?: number;
}

export interface StoryScene {
  title: string;
  setting: string;
  characters: string[];
  summary: string;
  content?: string;
}

export interface StoryOutline {
  title: string;
  premise: string;
  setting: string;
  themes: string[];
  characters: StoryCharacter[];
  chapters: StoryChapter[];
  targetWordCount: number;
  estimatedChapters: number;
}

export interface StoryGenerationRequest {
  title?: string;
  genre: string;
  tone: string;
  targetAudience: string;
  premise?: string;
  setting?: string;
  characters?: StoryCharacter[];
  targetWordCount?: number;
  chapterCount?: number;
  language?: string;
  modelId?: string;
  temperature?: number;
}

export interface StoryGenerationResult {
  outline: StoryOutline;
  chapters: StoryChapter[];
  fullStory: string;
  wordCount: number;
  generationTime: number;
  modelUsed: string;
}

const GENRE_DESCRIPTIONS: Record<string, string> = {
  fantasy: "Mundos magicos, criaturas miticas, herois e buscas epicas",
  sci_fi: "Tecnologia avancada, espaco, viagem no tempo, futuros alternativos",
  horror: "Sustos, terror psicologico, monstros, atmosfera sombria",
  romance: "Relacionamentos, amor, conexoes emocionais, drama pessoal",
  mystery: "Enigmas, detetives, crimes, pistas, revelacoes",
  thriller: "Suspense, acao, perigo, tensao constante",
  adventure: "Jornadas, exploracao, descobertas, desafios fisicos",
  historical: "Eventos reais do passado, figuras historicas, epocas antigas",
  drama: "Conflitos humanos, emocoes, relacionamentos complexos",
  comedy: "Humor, situacoes engracadas, personagens eccentricos",
  dystopian: "Sociedades opressivas, futuros sombrios, resistencia",
  cyberpunk: "Alta tecnologia baixa vida, hackers, corporacoes, IA",
  steampunk: "Era vitoriana com tecnologia a vapor, aventuras retro-futuristas",
  supernatural: "Fantasmas, demonios, poderes sobrenaturais, mundos ocultos",
  noir: "Detetives cinicos, crimes, moralidade ambigua, estilo anos 40",
  custom: "Genero personalizado definido pelo usuario",
};

const TONE_DESCRIPTIONS: Record<string, string> = {
  dark: "Sombrio, pesado, temas serious, finalidade existencial",
  light: "Leve, otimista, momentos felizes, resolucoes positivas",
  humorous: "Engracado, ironico, satirico, comedia situacional",
  serious: "Grave, realista, sem floreios, abordagem direta",
  epic: "Grande escala, heroica, mitica, momentos memoraveis",
  intimate: "Pessoal, emocional, foco em relacionamentos, detalhes sensiveis",
  suspenseful: "Tensionante, imprevisivel, reviravoltas, suspense",
  whimsical: "Encantador, fantastico, imagativo, fora do comum",
  gritty: "Cru, realista, violento, mundo duro sem filtros",
  inspirational: "Motivacional, transformador, superacao, esperanca",
};

export class StoryEngine {
  async generateOutline(request: StoryGenerationRequest): Promise<StoryOutline> {
    const prompt = this.buildOutlinePrompt(request);
    const aiRequest: AIRequest = {
      messages: [{ role: "user", content: prompt }],
      model: request.modelId || "gpt-4o",
      temperature: request.temperature || 0.8,
      maxTokens: 4096,
      responseFormat: "json",
      systemPrompt:
        "Voce e um escritor profissional especialista em criar outlines de historias. Responda apenas em JSON valido.",
    };

    const response = await aiEngine.generate(aiRequest);
    const outline = this.parseOutlineResponse(response, request);
    return outline;
  }

  async generateChapter(
    outline: StoryOutline,
    chapterNumber: number,
    previousChapters: string[],
    modelId?: string,
    temperature?: number
  ): Promise<StoryChapter> {
    const chapter = outline.chapters.find((c) => c.number === chapterNumber);
    if (!chapter) throw new Error(`Chapter ${chapterNumber} not found in outline`);

    const prompt = this.buildChapterPrompt(outline, chapter, previousChapters);
    const aiRequest: AIRequest = {
      messages: [{ role: "user", content: prompt }],
      model: modelId || "gpt-4o",
      temperature: temperature || 0.85,
      maxTokens: 6000,
      systemPrompt:
        "Voce e um escritor premiado. Escreva capitulos envolventes com dialogo natural, descricoes vividas e desenvolvimento de personagens. Escreva em portugues brasileiro.",
    };

    const response = await aiEngine.generate(aiRequest);
    const generatedChapter: StoryChapter = {
      ...chapter,
      content: response.content,
      wordCount: this.countWords(response.content),
    };

    return generatedChapter;
  }

  async generateFullStory(request: StoryGenerationRequest): Promise<StoryGenerationResult> {
    const startTime = Date.now();
    const outline = await this.generateOutline(request);
    const chapters: StoryChapter[] = [];
    const previousSummaries: string[] = [];

    for (const chapterOutline of outline.chapters) {
      const generated = await this.generateChapter(
        outline,
        chapterOutline.number,
        previousSummaries,
        request.modelId,
        request.temperature
      );
      chapters.push(generated);
      previousSummaries.push(`Capitulo ${generated.number}: ${generated.title} - ${generated.summary}`);
    }

    const fullStory = chapters.map((c) => `## Capitulo ${c.number}: ${c.title}\n\n${c.content}`).join("\n\n---\n\n");
    const totalWordCount = chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0);

    return {
      outline,
      chapters,
      fullStory,
      wordCount: totalWordCount,
      generationTime: Date.now() - startTime,
      modelUsed: request.modelId || "gpt-4o",
    };
  }

  async continueStory(
    existingStory: string,
    instruction: string,
    modelId?: string
  ): Promise<string> {
    const aiRequest: AIRequest = {
      messages: [
        { role: "user", content: `Aqui esta a historia ate agora:\n\n${existingStory}\n\nInstrucao: ${instruction}` },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.85,
      maxTokens: 4000,
      systemPrompt:
        "Continue a historia mantendo o mesmo estilo, tom e voz narrativa. Seja criativo e envolvente.",
    };

    const response = await aiEngine.generate(aiRequest);
    return response.content;
  }

  async rewriteScene(
    scene: string,
    instruction: string,
    modelId?: string
  ): Promise<string> {
    const aiRequest: AIRequest = {
      messages: [
        { role: "user", content: `Cena original:\n\n${scene}\n\nInstrucao de reescrita: ${instruction}` },
      ],
      model: modelId || "gpt-4o",
      temperature: 0.8,
      maxTokens: 3000,
      systemPrompt: "Reescreva a cena seguindo a instrucao mantendo a consistencia com o resto da historia.",
    };

    const response = await aiEngine.generate(aiRequest);
    return response.content;
  }

  private buildOutlinePrompt(request: StoryGenerationRequest): string {
    const genre = GENRE_DESCRIPTIONS[request.genre] || request.genre;
    const tone = TONE_DESCRIPTIONS[request.tone] || request.tone;

    return `Crie um outline detalhado para uma historia com as seguintes especificacoes:

TITULO: ${request.title || "(criar um titulo apropriado)"}
GENERO: ${request.genre} - ${genre}
TOM: ${request.tone} - ${tone}
PUBLICO-ALVO: ${request.targetAudience}
${request.premise ? `PREMISSA: ${request.premise}` : ""}
${request.setting ? `CENARIO: ${request.setting}` : ""}
${request.characters ? `PERSONAGENS:\n${request.characters.map((c) => `- ${c.name}: ${c.description} (${c.role})`).join("\n")}` : ""}
CONTAGEM ALVO DE PALAVRAS: ${request.targetWordCount || 10000}
NUMERO DE CAPITULOS: ${request.chapterCount || 10}

Retorne em JSON com a seguinte estrutura:
{
  "title": "titulo da historia",
  "premise": "premissa completa",
  "setting": "descricao do cenario",
  "themes": ["tema1", "tema2"],
  "characters": [
    {
      "name": "nome",
      "description": "descricao",
      "role": "protagonist|antagonist|supporting|mentor|love_interest|other",
      "traits": ["traco1", "traco2"],
      "backstory": "historia do personagem",
      "goals": "objetivos"
    }
  ],
  "chapters": [
    {
      "number": 1,
      "title": "titulo do capitulo",
      "summary": "resumo do capitulo",
      "scenes": [
        {
          "title": "titulo da cena",
          "setting": "local da cena",
          "characters": ["nome1", "nome2"],
          "summary": "resumo da cena"
        }
      ]
    }
  ],
  "targetWordCount": 10000,
  "estimatedChapters": 10
}`;
  }

  private buildChapterPrompt(
    outline: StoryOutline,
    chapter: StoryChapter,
    previousChapters: string[]
  ): string {
    const characters = outline.characters
      .map((c) => `${c.name}: ${c.description} (${c.traits.join(", ")})`)
      .join("\n");

    const previousContext = previousChapters.length > 0
      ? `\nResumo dos capitulos anteriores:\n${previousChapters.join("\n")}`
      : "";

    return `Escreva o Capitulo ${chapter.number}: "${chapter.title}" da historia "${outline.title}".

PREMISSA: ${outline.premise}
CENARIO: ${outline.setting}
TEMAS: ${outline.themes.join(", ")}

PERSONAGENS:
${characters}

RESUMO DO CAPITULO: ${chapter.summary}

CENAS:
${chapter.scenes.map((s) => `- ${s.title}: ${s.summary}`).join("\n")}
${previousContext}

Instrucoes:
1. Escreva em portugues brasileiro com dialogo natural
2. Use descricoes vividas e sensoriais
3. Desenvolva os personagens atraves de acoes e dialogos
4. Mantenha o tom ${outline.tone}
5. Crie transicoes suaves entre as cenas
6. Termine o capitulo com um gancho que incentive a leitura do proximo
7. A meta e aproximadamente ${Math.round((outline.targetWordCount / outline.chapters.length) * 0.8)} palavras

Escreva o capitulo completo agora:`;
  }

  private parseOutlineResponse(response: AIResponse, request: StoryGenerationRequest): StoryOutline {
    try {
      const parsed = JSON.parse(response.content);
      return {
        title: parsed.title || request.title || "Sem Titulo",
        premise: parsed.premise || request.premise || "",
        setting: parsed.setting || request.setting || "",
        themes: parsed.themes || [],
        characters: parsed.characters || [],
        chapters: parsed.chapters || [],
        targetWordCount: parsed.targetWordCount || request.targetWordCount || 10000,
        estimatedChapters: parsed.estimatedChapters || request.chapterCount || 10,
      };
    } catch {
      // Fallback se o JSON nao for valido
      return {
        title: request.title || "Sem Titulo",
        premise: request.premise || "",
        setting: request.setting || "",
        themes: [],
        characters: request.characters || [],
        chapters: [],
        targetWordCount: request.targetWordCount || 10000,
        estimatedChapters: request.chapterCount || 10,
      };
    }
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }
}

export const storyEngine = new StoryEngine();
