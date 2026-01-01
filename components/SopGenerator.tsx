
import React, { useState } from 'react';
import { AiConfig, SopStepData } from '../types';
import { initialSopData } from '../constants';
import { generateSopScript } from '../services/aiService';

interface SopGeneratorProps {
    aiConfig: AiConfig;
    onOpenConfig: () => void;
    inputs: { niche: string; topic: string; context: string };
    setInputs: React.Dispatch<React.SetStateAction<{ niche: string; topic: string; context: string }>>;
    sopData: Record<number, SopStepData>;
    setSopData: React.Dispatch<React.SetStateAction<Record<number, SopStepData>>>;
}

const SopGenerator: React.FC<SopGeneratorProps> = ({ aiConfig, onOpenConfig, inputs, setInputs, sopData, setSopData }) => {
    const [activeStep, setActiveStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Determine if it's AI mode based on whether data differs from initial (simple heuristic)
    const isAiMode = sopData[1].formula !== initialSopData[1].formula;

    const handleGenerate = async () => {
        if (!aiConfig.apiKey && !aiConfig.systemApiKey) {
            alert("请先配置 API Key");
            onOpenConfig();
            return;
        }
        if (!inputs.niche || !inputs.topic) {
            alert("请填写赛道和选题");
            return;
        }

        setLoading(true);
        try {
            const result = await generateSopScript(aiConfig, inputs.niche, inputs.topic, inputs.context);
            // Merge results
            const newData = { ...initialSopData };
            Object.keys(result).forEach((key: any) => {
                const k = parseInt(key);
                if (newData[k]) {
                    newData[k] = {
                        ...newData[k],
                        formula: result[key].formula.replace(/\n/g, "<br>"),
                        desc: result[key].desc || newData[k].desc
                    };
                }
            });
            setSopData(newData);
            setActiveStep(1);
        } catch (error: any) {
            alert("生成失败: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const currentStep = sopData[activeStep];

    return (
        <section id="sop" className="scroll-mt-24 bg-slate-900 rounded-3xl p-8 md:p-12 text-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-700 opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-600 opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

            <div className="relative z-10 mb-8 text-center">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2">✨ AI 万能仿写 SOP</h2>
                <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                    输入赛道、选题和素材，<span className="bg-white/10 px-2 py-1 rounded text-orange-300 font-mono text-xs">{aiConfig.modelName}</span> 为你一键生成爆款脚本。
                </p>

                <div className="max-w-2xl mx-auto bg-slate-800/80 p-6 rounded-2xl border border-slate-600 shadow-lg backdrop-blur-sm mb-10 space-y-4 text-left">
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">您的赛道</label>
                            <input 
                                value={inputs.niche}
                                onChange={(e) => setInputs({...inputs, niche: e.target.value})}
                                type="text" placeholder="例如: 健身教练 / 独立开发" 
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">本期选题</label>
                            <input 
                                value={inputs.topic}
                                onChange={(e) => setInputs({...inputs, topic: e.target.value})}
                                type="text" placeholder="例如: 30天减脂挑战 / 低成本创业" 
                                className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none" 
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1 ml-1">文案素材或核心观点 (选填)</label>
                        <textarea 
                            value={inputs.context}
                            onChange={(e) => setInputs({...inputs, context: e.target.value})}
                            rows={4} placeholder="粘贴您的粗剪文案、核心金句，或使用上方按钮提取视频内容..." 
                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none" 
                        />
                    </div>
                    <button 
                        onClick={handleGenerate} 
                        disabled={loading}
                        className={`w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 text-white font-bold py-3 px-6 rounded-xl transition shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {loading ? (
                             <><div className="loader border-white border-t-transparent w-4 h-4"></div> AI 正在疯狂构思中...</>
                        ) : (
                             <><i className="fas fa-magic"></i> 生成爆款脚本</>
                        )}
                    </button>
                </div>

                {/* SOP Steps Visualization (Desktop) */}
                <div className="hidden md:grid grid-cols-4 gap-4 mb-8">
                    {(Object.values(sopData) as SopStepData[]).map((step, idx) => (
                         <div 
                            key={idx} 
                            onClick={() => setActiveStep(idx + 1)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all duration-300 ${activeStep === idx + 1 ? 'bg-orange-500 border-orange-400 text-white shadow-lg transform -translate-y-1' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
                         >
                            <div className="text-xs font-bold opacity-60 mb-1">{step.step}</div>
                            <div className="font-bold text-sm truncate">{step.title}</div>
                         </div>
                    ))}
                </div>

                {/* Mobile Selector */}
                <div className="md:hidden mb-6 flex overflow-x-auto space-x-2 pb-2 scrollbar-hide">
                    {(Object.values(sopData) as SopStepData[]).map((step, idx) => (
                         <button 
                            key={idx} 
                            onClick={() => setActiveStep(idx + 1)}
                            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition ${activeStep === idx + 1 ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                         >
                            {step.step}
                         </button>
                    ))}
                </div>

                {/* Active Step Display */}
                <div className="bg-slate-800/50 rounded-2xl p-6 md:p-8 border border-slate-700/50 backdrop-blur text-left animate-fadeIn min-h-[300px]">
                     <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-white mb-1">
                                <span className="text-orange-500 mr-2">{currentStep.step}</span>
                                {currentStep.title}
                            </h3>
                            <p className="text-slate-400 text-sm">{currentStep.desc}</p>
                        </div>
                        {isAiMode && (
                            <span className="bg-orange-500/20 text-orange-300 px-2 py-1 rounded text-xs font-bold border border-orange-500/30">
                                AI 智能生成
                            </span>
                        )}
                     </div>

                     <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">爆款公式</div>
                            <div 
                                className="text-lg leading-relaxed text-slate-200 font-medium bg-slate-900/50 p-4 rounded-xl border border-slate-700"
                                dangerouslySetInnerHTML={{ __html: currentStep.formula }}
                            />
                        </div>
                        <div className="space-y-6">
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2">原片案例</div>
                                <div className="text-sm text-slate-400 italic bg-slate-800 p-3 rounded-lg border border-slate-700/50">
                                    “{currentStep.original}”
                                </div>
                            </div>
                            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <i className="fas fa-lightbulb text-yellow-400"></i>
                                    <span className="text-xs font-bold text-blue-200 uppercase">拍摄指导</span>
                                </div>
                                <p className="text-sm text-blue-100">
                                    拍摄时注意景别切换，建议使用{activeStep % 2 !== 0 ? '特写镜头捕捉微表情' : '全景镜头交代环境'}，增强代入感。
                                </p>
                            </div>
                        </div>
                     </div>
                </div>

            </div>
        </section>
    );
};

export default SopGenerator;
