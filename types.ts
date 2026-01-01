
export interface ScriptItem {
    id: string;
    time: string;
    shot: string;
    visual: string;
    ai_prompt: string;
    dialogue: string;
    logic: string;
}

export interface SopStepData {
    step: string;
    title: string;
    desc: string;
    original: string;
    formula: string;
}

export interface AiConfig {
    provider: 'gemini' | 'openai';
    apiKey: string;
    systemApiKey?: string;
    baseUrl: string;
    modelName: string;
}

export interface LogicDetail {
    title: string;
    desc: string;
    action: string;
}

export interface ChartDataPoint {
    time: string;
    value: number;
}

export interface RadarDataPoint {
    subject: string;
    A: number;
    fullMark: number;
}

export interface AnalysisResult {
    meta: {
        niche: string;
        topic: string;
        summary: string;
        tags: string[];
        deep_analysis: string;
        stats: {
            duration: string;
            shots: string;
            emotions: string;
            model: string;
        };
    };
    sop_context: string;
    logic_structure: {
        hook: LogicDetail;
        turn: LogicDetail;
        hunt: LogicDetail;
        meta: LogicDetail;
    };
    charts: {
        pacing: ChartDataPoint[];
        pacing_insight: string;
        persona: RadarDataPoint[];
        persona_traits: string[];
    };
    script_table: ScriptItem[];
}

export interface Category {
    id: string;
    name: string;
}

export interface SavedAnalysis {
    id: string;
    categoryId?: string;
    thumbnail?: string; // Base64 encoded thumbnail image
    timestamp: number;
    title: string;
    inputs: { niche: string; topic: string; context: string };
    headerMeta: {
        summary: string;
        tags: string[];
        deepAnalysis: string;
        stats: { duration: string; shots: string; emotions: string; model: string; };
    };
    logicDetails: Record<string, LogicDetail>;
    pacingData: ChartDataPoint[];
    pacingInsight: string;
    personaData: RadarDataPoint[];
    personaTraits: string[];
    scriptTable: ScriptItem[];
    sopData: Record<number, SopStepData>;
}
