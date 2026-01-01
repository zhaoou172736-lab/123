
import { GoogleGenAI } from "@google/genai";
import { AiConfig, AnalysisResult } from '../types';

// Helper to reliably extract JSON from a potentially messy string
function extractJsonString(str: string): string {
    // 1. Try to remove markdown code blocks
    let cleaned = str.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // 2. Find the first '{' and the last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return cleaned.substring(firstBrace, lastBrace + 1);
    }
    
    // Fallback: return original cleaned string
    return cleaned;
}

// Simple OpenAI fetcher without complex fallback restrictions
async function fetchOpenAI(
    url: string, 
    apiKey: string, 
    payload: any
): Promise<any> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${errText}`);
    }
    return response.json();
}

const callAiModel = async (config: AiConfig, prompt: string, useSearch: boolean = false): Promise<string> => {
    // Prioritize User API Key, fall back to System API Key
    const apiKey = config.apiKey || config.systemApiKey;
    
    if (!apiKey) {
        throw new Error("Missing API Key. Please configure your User API Key or contact the administrator.");
    }

    if (config.provider === 'gemini') {
        // Support custom Base URL for Gemini (e.g., for proxy/intermediate platforms)
        const clientOptions: any = { apiKey: apiKey };
        if (config.baseUrl && config.baseUrl.trim() !== '') {
            clientOptions.baseUrl = config.baseUrl.replace(/\/+$/, "");
        }

        const ai = new GoogleGenAI(clientOptions);
        const requestConfig: any = {};
        if (useSearch) {
            requestConfig.tools = [{ googleSearch: {} }];
        }

        try {
            const response = await ai.models.generateContent({
                model: config.modelName || 'gemini-2.5-flash-preview-09-2025',
                contents: [{ parts: [{ text: prompt }] }],
                config: requestConfig
            });
            return response.text || "";
        } catch (error) {
            console.error("Gemini API Error", error);
            throw error;
        }
    } else {
        // OpenAI Compatible
        const baseUrl = config.baseUrl ? config.baseUrl.replace(/\/+$/, "") : "https://api.openai.com/v1";
        const url = `${baseUrl}/chat/completions`;
        
        try {
            const payload = {
                model: config.modelName || 'gpt-4o',
                messages: [
                    { role: "system", content: "You are a creative script writer and viral video analyst." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 16384 // Increased for long-form content generation
            };

            const data = await fetchOpenAI(url, apiKey, payload);
            return data.choices[0].message.content;
        } catch (error) {
            throw error;
        }
    }
};

export const extractVideoContent = async (config: AiConfig, videoUrl: string): Promise<string> => {
    const prompt = `
        Role: 资深爆款视频拆解专家 (Senior Viral Analyst).
        Task: 深度分析 URL: ${videoUrl} 的视频内容，提取用于二次创作“瑞瑞狸/商业探访风格”视频的核心素材。
        
        请用【中文】按以下维度提取，务必精准、具体：

        1. **钩子策略 (Hook Strategy)**:
           - 开场前5秒用了什么视觉奇观（如：成堆现金、废墟中的豪车）？
           - 用了什么反直觉的数据或暴论？

        2. **叙事弧光 (Narrative Arc)**:
           - 主角的情绪是如何变化的？（例如：从“不屑一顾”到“大受震撼”再到“陷入沉思”）。
           - 关键的转折点（Aha Moment）在哪里？

        3. **硬据与细节 (Hard Evidence)**:
           - *核心项*：提取视频中提到的具体薪资、成本、利润率、工时等数字。
           - 提取具体的行业黑话、SOP流程步骤或合同条款。

        4. **场景反差 (Visual Contrast)**:
           - 描述视频中具有强烈对比的场景（例如：高端写字楼 vs 撸猫现场，西装革履 vs 蹲地吃盒饭）。

        5. **金句收录 (Golden Quotes)**:
           - 摘录 3-5 句直击人心或富有哲理的原话台词。

        6. **商业逻辑 (Business Logic)**:
           - 用一句话总结这个生意的赚钱门道或核心壁垒是什么？

        输出目标：直接生成一段结构化的素材笔记，供脚本生成器直接调用。
    `;
    
    return await callAiModel(config, prompt, true);
};

export const generateSopScript = async (
    config: AiConfig, 
    niche: string, 
    topic: string, 
    context: string
): Promise<any> => {
    
    const prompt = `
            Role: 商业人类学纪录片编导 (Commercial Anthropologist).
            Style: 瑞瑞狸/商业探访风格 (Skeptic -> Explorer -> Believer).
            
            [Input Data]
            - 赛道 (Niche): ${niche}
            - 选题 (Topic): ${topic}
            - 核心素材 (Context): ${context || "（注意：如果此处为空，请基于行业常识，进行合理的“微构思”，编造具体的、符合逻辑的案例数据，严禁留白）"}

            [Mission]
            编写一个 8 步走的短视频脚本。该脚本需要展现“从质疑庸俗成功，到发现某种高级商业模式，最后完成自我认知升级”的过程。
            
            [Writing Rules - 核心军规]
            1. **拒绝抽象**: 严禁使用“赋能、闭环、底层逻辑、抓手”等互联网黑话。必须说“大白话”。
            2. **数据具体化**: 凡是填空处，必须填入具体数字或具象名词（例如：不要写“赚了很多钱”，要写“月流水45万”；不要写“很辛苦”，要写“凌晨4点还在对账”）。*若素材不足，请根据常识编造一个合理的具体数据*。
            3. **语气去油腻**: 保持一种“冷静的旁观者”或“带着偏见的质疑者”语气，多用自问自答。
            4. **格式严格**: 严格按照 JSON 格式输出，不要包含 Markdown 代码块标记。

            [Strict JSON Output Format]
            Return a JSON object with keys '1' to '8'. 
            Each value object must have:
            - 'formula': The script text with HTML tags <b> for emphasis and <br> for rhythm pauses.
            - 'desc': A short strategy explanation (< 20 chars).

            [Script Templates & Instructions]

            Step 1 (黄金钩子 - 庸俗的爽感):
            Template: "（展示[具体的、令人咋舌的高收入/高流量/强视觉结果]）...说实话，我发现做[${niche}]这件事真的挺简单的。主线无非就是[一句看似废话的大实话]嘛。其实只要达成一个条件，就是有足够多的[简单粗暴的核心资源/冤大头]。"
            *Instruction: Start with a visual or numerical shock. Act arrogant.*

            Step 2 (情绪转折 - 意义危机):
            Template: "钱确实是能[解决具体的生活烦恼]，但要说对我的[职业护城河/长期抗风险能力]有什么推波助澜的作用，那确实也没有。这样继续[描述一个具体的、机械的重复动作]下去，真的算是一步一个脚印的往前走吗？"
            *Instruction: The turn. Question the sustainability of "easy money".*

            Step 3 (实地探访 - 认知错位):
            Template: "于是我又开始重新思考，我来到了[一个地点，具有强烈的反差感，如：CBD里的破旧仓库]。刚开始我并不理解，在[高大上的地点]里面竟然[做着一件很接地气/很离谱的事]？"
            *Instruction: Visual contrast creates curiosity. The "POV" shift.*

            Step 4 (核心高潮 - 猎奇冲击):
            Template: "我真的没有想到，[原本以为低端的职业/事物]竟然能有[具体的惊人待遇/SOP标准]。更有意思的是，他们行内有个黑话叫“[自编一个合理的行业黑话]”，其实意思就是“[用大白话解释这个黑话]”。我当时就想：要求这么高？那我为什么不去[更高大上的职业]？"
            *Instruction: Break stereotypes with hard data and insider slang.*

            Step 5 (深度分析 - 模式拆解):
            Template: "他们给我的解释让我受益匪浅。所谓的“[高端/专业]”，不是自己说了算，是[特定的客户群体]说了算。他们最厉害的，其实是把[原本非标的/普通的素材]，通过一套[具体的SOP流程/标准]，硬是调教成了[客户想要的样子/高溢价产品]。"
            *Instruction: Reveal the secret sauce (usually Standardization/Quality Control).*

            Step 6 (实地验证 - 人性观察):
            Template: "而且我发现，这些[支付高价的客户/人群]，素质极高。第一次见面的时候，我确实没有感觉到[弱势方]有多么的卑躬屈膝，反而是一种[具体的平等/尊重细节，如：主动帮忙提重物/倒水]。"
            *Instruction: Humanize the transaction. Break class prejudice.*

            Step 7 (价值升华 - 文化锚点):
            Template: "看到这一幕，我突然想到了[电影/书籍]里的一句话：<b>“[一句深刻的台词，关于尊重/时间/价值]”</b>。无论是对人还是对事，体面才是长久的生意。"
            *Instruction: Elevate the specific business lesson to a universal life lesson.*

            Step 8 (闭环收尾 - 投名状):
            Template: "所以我才问他们能不能授权...能不能把我的[我的核心能力]和他们的[他们的稀缺资源]结合起来？即使到了今天，合作还没谈成……但这不重要。重要的是，祝你也能像我一样，遇到这样能够扶你一把的[核心资源/贵人]吧。"
            *Instruction: The video itself is the "Application Letter". End with a blessing.*

            End of Prompt.
            Language: Simplified Chinese.
            Output: Raw JSON string only. No markdown fences.
    `;

    const rawText = await callAiModel(config, prompt, false);
    const jsonStr = extractJsonString(rawText);
    return JSON.parse(jsonStr);
};

// Helper to extract keyframes from video for OpenAI protocol
async function extractFramesFromVideo(base64Data: string, mimeType: string): Promise<string[]> {
    // Use fetch to create a Blob from the base64 data to avoid large string issues in video.src
    // This is more memory efficient than string manipulation for large files
    const res = await fetch(`data:${mimeType};base64,${base64Data}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true; // Required for some environments
    video.src = url;

    await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => resolve(true);
        video.onerror = (e) => reject(new Error("Video load error: " + e));
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const frames: string[] = [];
    const duration = video.duration || 1;
    
    // MASSIVE SCALE SAMPLING: 1 Frame Per Second, Max 3600 frames (1 Hour)
    const maxFrames = 3600; 
    const count = Math.min(Math.ceil(duration), maxFrames);

    // Dynamic Compression Logic to avoid payload explosion
    // If video is long (> 5 min / 300s), reduce resolution and quality to fit in HTTP body
    const isLongVideo = count > 300;
    const maxDim = isLongVideo ? 320 : 512; // 320px for long videos, 512px for short
    const quality = isLongVideo ? 0.3 : 0.5; // Lower quality for massive frame counts
    
    for (let i = 0; i < count; i++) {
        const currentTime = (duration / count) * i;
        
        video.currentTime = currentTime;
        await new Promise((resolve) => {
            video.onseeked = resolve;
            // Timeout fallback
            setTimeout(resolve, 500); 
        });

        let width = video.videoWidth;
        let height = video.videoHeight;
        
        // Scale down to max dimension
        if (width > height) {
            if (width > maxDim) {
                height = height * (maxDim / width);
                width = maxDim;
            }
        } else {
            if (height > maxDim) {
                width = width * (maxDim / height);
                height = maxDim;
            }
        }

        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(video, 0, 0, width, height);
        // Apply dynamic quality compression
        frames.push(canvas.toDataURL('image/jpeg', quality));
    }

    URL.revokeObjectURL(url);
    return frames;
}

export const analyzeUploadedVideo = async (config: AiConfig, fileBase64: string, mimeType: string): Promise<AnalysisResult> => {
    const apiKey = config.apiKey || config.systemApiKey;
    if (!apiKey) throw new Error("Missing API Key. Please configure your User API Key or contact the administrator.");

    const prompt = `
        Role: 视觉信息提取专家 (Visual Information Extraction Specialist).
        Task: 仔细检查视频，筛选出所有包含“关键信息元素”的画面帧，并记录精确时间戳。

        【拆解粒度核心规则：全量覆盖，一句一行】
        1. **完整性优先 (CRITICAL)**：视频从 00:00 开始直到结束，每一秒都必须被分析。绝不能只分析前几十秒。如果视频有50秒，你的输出时间戳必须延续到50秒左右。
        2. **一句台词 = 一行数据**：只要台词出现句号、停顿或字幕变化，必须另起一行。严禁合并多句台词。
        3. **不遗漏**：即使画面没有大变化，只要有新的台词，就必须记录。
        
        【筛选标准 - 必须包含以下任意一种元素】
        1. 📝 **可见文本 (Visible Text)**: 
           - 屏幕上出现的任何形式的文字（底部字幕、花字标题、弹窗、弹幕、手机屏幕内容）。
           - 必须完整OCR识别并记录。
        2. 🎨 **动态图形 (Motion Graphics)**: 
           - 任何形式的 MG 动画、动态图标、线条、箭头、转场动画效果。
        3. 🤡 **表情元素 (Memes/Stickers)**: 
           - 画面中出现的表情包、贴纸、夸张特效。

        【输出要求】
        - 严格按照 JSON 格式输出。
        - 重点在 "script_table" 数组。每一行代表一句独立的台词或一个独立的视觉动作。
        - **重要：确保所有字符串内部的双引号都已正确转义 (例如: "他说: \\"你好\\"")，否则JSON将无法解析。**
        
        【字段填写指南】
        - time: 必须精确到秒 (e.g. "00:01 - 00:03")，时间跨度通常很短（1-3秒）。
        - visual: 必须按以下格式描述，明确标注元素类型：
          格式：场景：[物理场景描述]；【字幕】：[识别到的文字]；【MG】：[动画描述]；【表情】：[表情描述]
          （如果没有某项，则不写该标签）
        - ai_prompt: 针对该画面的AI绘画提示词。
        - dialogue: 该时段内对应的那**一句话**口播。**请去除所有标点符号**（不要包含逗号、句号、感叹号等，仅保留纯文本）。

        Strict JSON Output Format:
        {
            "meta": {
                "niche": "视频赛道",
                "topic": "视频标题",
                "summary": "内容总结",
                "tags": ["tag1", "tag2"],
                "deep_analysis": "分析...",
                "stats": {
                    "duration": "mm:ss",
                    "shots": "识别到的关键帧数",
                    "emotions": "情绪",
                    "model": "Gemini Vision"
                }
            },
            "sop_context": "素材笔记...",
            "logic_structure": { ... },
            "charts": { ... },
            "script_table": [
                { 
                    "id": "01", 
                    "time": "00:00 - 00:02", 
                    "shot": "特写", 
                    "visual": "场景：黑色背景；【字幕】：全网首发；【MG】：文字放大特效", 
                    "ai_prompt": "Black background, text 'Exclusive' appearing with zoom effect", 
                    "dialogue": "这是全网首发", 
                    "logic": "利用花字特效强调稀缺性" 
                },
                { 
                    "id": "02", 
                    "time": "00:02 - 00:04", 
                    "shot": "中景", 
                    "visual": "场景：展示产品外观；【字幕】：超级耐用", 
                    "ai_prompt": "Product shot, clean lighting", 
                    "dialogue": "而且它超级耐用", 
                    "logic": "紧接上文，抛出核心卖点" 
                }
                ... (Continue for ALL sentences until video end)
            ]
        }
    `;

    if (config.provider === 'gemini') {
        const clientOptions: any = { apiKey: apiKey };
        if (config.baseUrl && config.baseUrl.trim() !== '') {
            clientOptions.baseUrl = config.baseUrl.replace(/\/+$/, "");
        }
        const ai = new GoogleGenAI(clientOptions);
        
        try {
            const response = await ai.models.generateContent({
                model: config.modelName || 'gemini-2.5-flash-preview-09-2025',
                contents: {
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: fileBase64
                            }
                        },
                        { text: prompt }
                    ]
                },
                config: {
                    responseMimeType: "application/json"
                }
            });
            
            const text = response.text || "{}";
            return JSON.parse(text);
        } catch (error) {
             console.error("Gemini Video Analysis Error", error);
             throw error;
        }
    } else {
        // Handle OpenAI / Compatible Providers using Frame Extraction
        console.log("Using OpenAI Protocol with Frame Extraction...");
        try {
            const frames = await extractFramesFromVideo(fileBase64, mimeType);
            
            // Construct message with text and images
            const contentParts: any[] = [
                { type: "text", text: prompt }
            ];
            
            frames.forEach(frame => {
                contentParts.push({
                    type: "image_url",
                    image_url: {
                        url: frame,
                        detail: "low" // Save tokens
                    }
                });
            });

            const baseUrl = config.baseUrl ? config.baseUrl.replace(/\/+$/, "") : "https://api.openai.com/v1";
            const url = `${baseUrl}/chat/completions`;

            const payload = {
                model: config.modelName || 'gpt-4o',
                messages: [
                    { role: "system", content: "You are a creative script writer and viral video analyst. You must output strictly valid JSON." },
                    { role: "user", content: contentParts }
                ],
                max_tokens: 16384, // Increase max token limit for potentially long responses (approx 12k Chinese chars)
                temperature: 0.2
            };

            const data = await fetchOpenAI(url, apiKey, payload);
            const content = data.choices[0].message.content;
            
            // Improved JSON extraction
            const jsonStr = extractJsonString(content);
            return JSON.parse(jsonStr);

        } catch (error: any) {
            console.error("OpenAI Video Analysis Error", error);
            throw new Error("视频分析失败: " + error.message);
        }
    }
};
