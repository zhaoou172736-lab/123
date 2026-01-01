
import { ScriptItem, SopStepData, LogicDetail, ChartDataPoint, RadarDataPoint } from './types';

export const initialScriptData: ScriptItem[] = [
    {
        id: "01", time: "00:00 - 00:02", shot: "推轨/特写",
        visual: "场景：电梯门缓缓打开，展示入户长廊；【花字】：真正的高级；【MG】：文字随光影渐变浮现。",
        ai_prompt: "Cinematic shot, elevator doors opening, revealing a luxury minimalist hallway, text 'Luxury' appearing.",
        dialogue: "真正高级的家",
        logic: "黄金3秒：利用【花字】定义概念，配合高颜值画面吸引注意。"
    },
    {
        id: "02", time: "00:02 - 00:03", shot: "推轨/跟拍",
        visual: "场景：镜头继续向前推进，展示长廊的景深；【字幕】：从你走出电梯。",
        ai_prompt: "Camera moving forward into the luxury hallway, soft lighting.",
        dialogue: "是从你走出电梯的那一刻",
        logic: "承接上文，制造场景代入感。"
    },
    {
        id: "03", time: "00:03 - 00:05", shot: "固定/全景",
        visual: "场景：展示完整的电梯厅空间；【字幕】：就开始设计了。",
        ai_prompt: "Wide shot of the elevator hall, marble floor, minimalist design.",
        dialogue: "就开始设计了",
        logic: "完成第一句完整的观点输出，确立视频基调。"
    },
    {
        id: "04", time: "00:05 - 00:07", shot: "中景/平移",
        visual: "场景：白色烤漆墙板；【字幕】：L型圆弧包裹；【MG】：白色虚线勾勒出圆弧轨迹动画。",
        ai_prompt: "White wall paneling, dotted lines tracing the curved corner animation.",
        dialogue: "从电梯出来 我们用一整面的烤漆墙板",
        logic: "视觉可视化：开始介绍具体工艺，MG动画辅助理解。"
    },
    {
        id: "05", time: "00:07 - 00:09", shot: "特写/旋转",
        visual: "场景：镜头围绕圆弧转角旋转；【字幕】：L型圆弧。",
        ai_prompt: "Close up of curved wall corner, smooth surface.",
        dialogue: "做了一个L型的圆弧",
        logic: "特写镜头展示细节质感。"
    },
    {
        id: "06", time: "00:09 - 00:11", shot: "中景",
        visual: "场景：展示墙板包裹住电梯门；【字幕】：包裹电梯。",
        ai_prompt: "Wall paneling wrapping around elevator door.",
        dialogue: "把整个电梯包裹起来",
        logic: "通过画面语言解释“包裹感”。"
    },
    {
        id: "07", time: "00:11 - 00:13", shot: "特写",
        visual: "场景：内凹斜口按钮特写；【表情】：😱 惊讶贴纸；【花字】：细节控福音；【MG】：箭头指向内凹处。",
        ai_prompt: "Close up of recessed button, arrow pointing to it, shock emoji overlay.",
        dialogue: "电梯显示屏移到了侧面",
        logic: "情绪引导：利用【表情包】和【箭头指示】引导观众关注微小的设计亮点。"
    },
    {
        id: "08", time: "00:13 - 00:15", shot: "特写",
        visual: "场景：手指按下按钮；【字幕】：内凹斜口。",
        ai_prompt: "Finger pressing the recessed elevator button.",
        dialogue: "并在墙板上开了一个内凹斜口 把按钮嵌进去",
        logic: "展示交互细节，体现“定制化”。"
    }
];

export const initialSopData: Record<number, SopStepData> = {
    1: { step: "第一步", title: "黄金开头", desc: "利用视听刺激或痛点前置，在3秒内留住用户。", original: "[原片案例台词]", formula: `" [万能公式：填空式开头] "` },
    2: { step: "第二步", title: "引入主题", desc: "快速交代背景，建立信任或抛出悬念。", original: "[原片案例台词]", formula: `" [万能公式] "` },
    3: { step: "第三步", title: "情绪铺垫", desc: "通过细节描写或场景渲染，调动观众情绪。", original: "[原片案例台词]", formula: `" [万能公式] "` },
    4: { step: "第四步", title: "核心转折", desc: "打破预期，制造反差或提出新观点。", original: "[原片案例台词]", formula: `" [万能公式] "` },
    5: { step: "第五步", title: "价值输出", desc: "提供干货、情绪价值或爽点。", original: "[原片案例台词]", formula: `" [万能公式] "` },
    6: { step: "第六步", title: "信任验证", desc: "通过第三方视角、数据或细节证明真实性。", original: "[原片案例台词]", formula: `" [万能公式] "` },
    7: { step: "第七步", title: "高潮/升华", desc: "将具体事件上升到普世价值或情感共鸣。", original: "[原片案例台词]", formula: `" [万能公式] "` },
    8: { step: "第八步", title: "行动呼吁", desc: "引导关注、点赞或转化。", original: "[原片案例台词]", formula: `" [万能公式] "` }
};

export const initialLogicDetails: Record<string, LogicDetail> = {
    hook: { title: "阶段 01: 黄金开场 (0-5s)", desc: "策略：<b>高颜值空镜 + 认知定义</b><br>目的：利用“意式大平层”的视觉冲击和“真正高级”的暴论，快速筛选目标高净值人群。", action: "推轨镜头进入" },
    turn: { title: "阶段 02: 细节展开 (5-20s)", desc: "策略：<b>工艺特写 + 仪式感</b><br>目的：通过圆弧墙板、内凹按钮等非常规设计，展示差异化，建立专业人设。", action: "细节特写展示" },
    hunt: { title: "阶段 03: 功能反转 (20-40s)", desc: "策略：<b>隐形收纳 + 人文关怀</b><br>目的：展示“好看且实用”。隐形门和折叠凳是具体的“爽点”，解决实际居住痛点。", action: "真人交互演示" },
    meta: { title: "阶段 04: 钩子结尾 (40-50s)", desc: "策略：<b>未完待续 + 场景留白</b><br>目的：展示客厅一角但不完全展示，利用“蔡格尼克效应”引导点击主页关注。", action: "全景后退/黑屏" }
};

export const initialPacingData: ChartDataPoint[] = [
  { time: '0s', value: 60 },
  { time: '10s', value: 75 }, // Details
  { time: '25s', value: 55 }, // Storage demo (calmer)
  { time: '35s', value: 85 }, // Foldable stool (Surprise/Aha moment)
  { time: '50s', value: 90 }  // Teaser
];

export const initialPersonaData: RadarDataPoint[] = [
  { subject: '专业度', A: 90, fullMark: 100 },
  { subject: '审美力', A: 95, fullMark: 100 },
  { subject: '亲和力', A: 75, fullMark: 100 },
  { subject: '逻辑性', A: 85, fullMark: 100 },
  { subject: '创新度', A: 80, fullMark: 100 },
];
