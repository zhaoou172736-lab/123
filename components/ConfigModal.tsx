import React from 'react';
import { AiConfig } from '../types';

interface ConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    config: AiConfig;
    onSave: (newConfig: AiConfig) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
    const [localConfig, setLocalConfig] = React.useState<AiConfig>(config);
    const [showKey, setShowKey] = React.useState(false);

    React.useEffect(() => {
        setLocalConfig(config);
    }, [config, isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave(localConfig);
        onClose();
    };

    const handleProviderChange = (provider: 'gemini' | 'openai') => {
        let newModel = localConfig.modelName;
        
        // Intelligent default switching
        if (provider === 'openai') {
            // If currently using a Gemini model name, switch to GPT-4o
            if (newModel.includes('gemini')) {
                newModel = 'gpt-4o';
            }
        } else {
            // If currently using a GPT model name, switch to Gemini
            if (newModel.includes('gpt')) {
                newModel = 'gemini-2.5-flash';
            }
        }

        setLocalConfig({
            ...localConfig,
            provider,
            modelName: newModel
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <i className="fas fa-robot text-orange-500"></i> AI 模型配置
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">选择服务商</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => handleProviderChange('gemini')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition text-sm font-bold ${localConfig.provider === 'gemini' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 text-slate-600'}`}
                            >
                                <i className="fas fa-star"></i> Gemini (官方/中转)
                            </button>
                            <button 
                                onClick={() => handleProviderChange('openai')}
                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition text-sm font-bold ${localConfig.provider === 'openai' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                            >
                                <i className="fas fa-network-wired"></i> OpenAI / 其他中转
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Base URL {localConfig.provider === 'gemini' ? '(选填，用于中转)' : '(必填)'}
                            </label>
                            <input 
                                type="text" 
                                value={localConfig.baseUrl}
                                onChange={(e) => setLocalConfig({...localConfig, baseUrl: e.target.value})}
                                placeholder={localConfig.provider === 'gemini' ? "默认: https://generativelanguage.googleapis.com" : "https://api.openai.com/v1"}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none placeholder-slate-400"
                            />
                            {localConfig.provider === 'gemini' && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    如果您使用 BestGPT 等中转服务，请在此输入中转地址（通常无需 /v1 后缀）。
                                </p>
                            )}
                        </div>

                        {/* User API Key (Simplified) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">用户 API Key</label>
                            <div className="relative">
                                <input 
                                    type={showKey ? "text" : "password"} 
                                    value={localConfig.apiKey}
                                    onChange={(e) => setLocalConfig({...localConfig, apiKey: e.target.value})}
                                    placeholder="sk-..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono border-orange-200"
                                />
                                <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                                    <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                请输入您的中转 Key 或官方 Key。
                            </p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">模型名称</label>
                            <input 
                                type="text" 
                                value={localConfig.modelName}
                                onChange={(e) => setLocalConfig({...localConfig, modelName: e.target.value})}
                                list="common-models"
                                placeholder={localConfig.provider === 'gemini' ? "推荐: gemini-2.5-flash" : "推荐: gpt-4o"}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none font-mono"
                            />
                            <datalist id="common-models">
                                {/* Gemini Pro Series - Sorted */}
                                <option value="gemini-2.5-pro" label="6小时长视频解析 | 影视内容拆解 | 专业级能力" />
                                <option value="gemini-2.5-pro-thinking" label="长视频+思考模式 | 逻辑因果梳理 | 适合深度任务" />
                                <option value="gemini-3-pro-preview" label="4K视频解析/实时多模态 | 工业质检 | 3代旗舰性能" />
                                <option value="gemini-3-pro-preview-thinking" label="高分解析+增强推理 | 运动赛事分析 | 旗舰级精度" />
                                
                                {/* Gemini Flash Series - Sorted */}
                                <option value="gemini-2.5-flash" label="短视频解析(≤1h) | 字幕/摘要生成 | 速度快成本低" />
                                <option value="gemini-2.5-flash-image" label="视频转图像片段 | 截图提取/标注 | 均衡多模态" />
                                <option value="gemini-2.5-flash-thinking" label="短视频解析+轻量时序推理 | 短视频剧情脉络梳理、Vlog内容分类 | 性价比高，轻量任务更高效" />
                                <option value="gemini-3-flash-preview" label="实时短视频解析 | 直播内容摘要 | 3代轻量旗舰" />
                            </datalist>
                            <p className="text-[10px] text-slate-400 mt-1">
                                注意：若使用 OpenAI 协议，请确保该模型支持 Vision/图像输入 (如 gpt-4o)。
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition">取消</button>
                    <button onClick={handleSave} className="px-6 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-black rounded-lg shadow-lg transition transform active:scale-95">
                        保存配置
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigModal;