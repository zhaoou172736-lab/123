
import React, { useState } from 'react';
import { AiConfig, LogicDetail, ChartDataPoint, RadarDataPoint, ScriptItem, SopStepData, SavedAnalysis } from './types';
import { initialLogicDetails, initialScriptData, initialPacingData, initialPersonaData, initialSopData } from './constants';
import ConfigModal from './components/ConfigModal';
import ChartsSection from './components/ChartsSection';
import SopGenerator from './components/SopGenerator';
import HistoryModal from './components/HistoryModal';
import { analyzeUploadedVideo, extractVideoContent } from './services/aiService';
import { saveAnalysisItem } from './services/storageService';

const App: React.FC = () => {
    // Config State
    const [aiConfig, setAiConfig] = useState<AiConfig>({
        provider: 'gemini',
        apiKey: 'sk-SqfHidgttyqgvVG3G63TkrS7XO6I4tGoAKR1cwjVrDPWoiXd',
        systemApiKey: process.env.API_KEY || '',
        baseUrl: 'https://www.towerfun.net/v1',
        modelName: 'gemini-2.5-flash'
    });
    const [isConfigOpen, setIsConfigOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    
    // UI Logic State
    const [activeLogicDetail, setActiveLogicDetail] = useState<LogicDetail | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Add Progress State
    const [uploadProgress, setUploadProgress] = useState(0);
    const [analysisStatus, setAnalysisStatus] = useState<string>(''); // 'reading' | 'analyzing' | ''

    const [currentId, setCurrentId] = useState<string>("");
    const [currentCategoryId, setCurrentCategoryId] = useState<string | undefined>(undefined);

    // URL Extraction State
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [isExtractingUrl, setIsExtractingUrl] = useState(false);

    // Tag Editing State
    const [newTag, setNewTag] = useState('');
    const [isAddingTag, setIsAddingTag] = useState(false);

    // Data State
    const [inputs, setInputs] = useState({ 
        niche: '家居设计', 
        topic: '意式大平层：电梯厅与玄关设计', 
        context: '真正高级的家 是从你走出电梯的那一刻就开始设计了 这是我们在长乐刚落地的一套意式大平层 从电梯出来 我们用一整面的烤漆墙板 做了一个L型的圆弧 把整个电梯包裹起来 电梯显示屏移到了侧面 并在墙板上开了一个内凹斜口 把按钮嵌进去 配合上灯光 迎接你的 是回家的仪式感 再看电梯对面 都说玄关是家的情绪缓冲区 所以我们把所有的收纳 全部隐形在这面墙里 这中间 还藏着一个通往消防通道的隐形门 我们想把一个功能性的门洞 完全融入到木作的系统里 在这个柜子里做了这个隐藏的折叠换鞋凳 平时折叠起来不占地 用的时候 拉出来 方便家里的老人和孩子 下期会继续分享 客厅的设计细节' 
    });
    
    // Header Data
    const [headerMeta, setHeaderMeta] = useState({
        summary: '揭秘豪宅设计逻辑：从电梯厅开始的极致隐形收纳与仪式感营造。',
        tags: ['#意式极简', '#豪宅设计', '#隐形收纳', '#装修干货'],
        deepAnalysis: '“普通人看装修看热闹，内行看门道。本条视频通过‘电梯厅’这一常被忽视的空间，用‘L型圆弧包裹’和‘隐形收纳’两个抓手，完美诠释了‘高级感=克制+隐形’的底层逻辑。”',
        stats: { duration: "00:50", shots: "6", emotions: "3重", model: "Gemini 2.5" }
    });

    // Logic Structure Data
    const [logicDetails, setLogicDetails] = useState<Record<string, LogicDetail>>(initialLogicDetails);

    // Charts Data
    const [pacingData, setPacingData] = useState<ChartDataPoint[]>(initialPacingData);
    const [pacingInsight, setPacingInsight] = useState<string>("[在此处分析视频的节奏快慢、剪辑密度和情绪起伏]");
    const [personaData, setPersonaData] = useState<RadarDataPoint[]>(initialPersonaData);
    const [personaTraits, setPersonaTraits] = useState<string[]>(["极致细节控", "人文关怀"]);

    // Script Data
    const [scriptTable, setScriptTable] = useState<ScriptItem[]>(initialScriptData);

    // SOP Data (Lifted State)
    const [sopData, setSopData] = useState<Record<number, SopStepData>>(initialSopData);

    const scrollToSection = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const isModelReady = !!(aiConfig.apiKey || aiConfig.systemApiKey);

    // Modified to support progress callback
    const fileToBase64 = (file: File, onProgress: (percent: number) => void): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent);
                }
            };

            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSave = () => {
        if (!inputs.topic && !headerMeta.summary) {
            alert("请至少输入一个标题或进行一次分析后再保存。");
            return;
        }

        const id = currentId || Date.now().toString();
        const analysisToSave: SavedAnalysis = {
            id,
            categoryId: currentCategoryId, // Persist current category if loaded, undefined if new
            timestamp: Date.now(),
            title: inputs.topic || "未命名分析",
            inputs,
            headerMeta,
            logicDetails,
            pacingData,
            pacingInsight,
            personaData,
            personaTraits,
            scriptTable,
            sopData
        };

        saveAnalysisItem(analysisToSave);
        setCurrentId(id);
        alert("✅ 保存成功！");
    };

    const handleClear = () => {
        if (window.confirm("确定要清空当前所有分析内容吗？这将重置所有输入和图表数据。")) {
            setInputs({ niche: '', topic: '', context: '' });
            setHeaderMeta({
                summary: '',
                tags: ['#标签1', '#标签2', '#标签3', '#标签4'],
                deepAnalysis: '“[在此处填写核心选题分析，例如：普通人如何通过...实现...]”',
                stats: { duration: "00:00", shots: "0", emotions: "4重", model: "AI ✨" }
            });
            setLogicDetails(initialLogicDetails);
            setPacingData(initialPacingData);
            setPacingInsight("[在此处分析视频的节奏快慢、剪辑密度和情绪起伏]");
            setPersonaData(initialPersonaData);
            setPersonaTraits(["[描述人设关键点]", "[描述人设关键点]"]);
            setScriptTable(initialScriptData);
            setSopData(initialSopData);
            setCurrentId("");
            setCurrentCategoryId(undefined);
            setVideoUrl('');
        }
    };

    const handleLoad = (item: SavedAnalysis) => {
        setCurrentId(item.id);
        setCurrentCategoryId(item.categoryId); // Load category
        setInputs(item.inputs);
        setHeaderMeta(item.headerMeta);
        setLogicDetails(item.logicDetails);
        setPacingData(item.pacingData);
        setPacingInsight(item.pacingInsight);
        setPersonaData(item.personaData);
        setPersonaTraits(item.personaTraits);
        setScriptTable(item.scriptTable);
        setSopData(item.sopData);
    };

    // Tag Handlers
    const handleAddTag = () => {
        if (newTag.trim()) {
            let formattedTag = newTag.trim();
            if (!formattedTag.startsWith('#')) formattedTag = '#' + formattedTag;
            setHeaderMeta(prev => ({
                ...prev,
                tags: [...prev.tags, formattedTag]
            }));
            setNewTag('');
            setIsAddingTag(false);
        }
    };

    const handleRemoveTag = (indexToRemove: number) => {
        setHeaderMeta(prev => ({
            ...prev,
            tags: prev.tags.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleUploadClick = () => {
        if (!aiConfig.apiKey && !aiConfig.systemApiKey) {
             alert("请先配置 API Key (需使用 Gemini 模型)");
             setIsConfigOpen(true);
             return;
        }

        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = async (e: any) => {
            if (e.target.files && e.target.files[0]) {
                const file = e.target.files[0];
                let analysisInterval: any = null;
                
                // Limit set to 1GB (1024 * 1024 * 1024 bytes)
                if (file.size > 1024 * 1024 * 1024) {
                    alert("视频文件过大 (超过 1GB)。\n建议：\n1. 剪辑为短片段后上传\n2. 或上传至 B站/YouTube 并使用下方 URL 提取功能");
                    return;
                }

                setIsAnalyzing(true);
                setUploadProgress(0);
                setAnalysisStatus('reading');

                try {
                    const base64 = await fileToBase64(file, (percent) => {
                        setUploadProgress(percent);
                    });
                    
                    setAnalysisStatus('analyzing');
                    setUploadProgress(0); // Reset progress for analysis phase

                    // Start simulated progress for AI analysis
                    // Smoothly interpolates to ~99% over time, but never hits 100% until done
                    analysisInterval = setInterval(() => {
                        setUploadProgress(prev => {
                            if (prev >= 99) return 99;
                            const remaining = 100 - prev;
                            // Slow down as it gets closer to 100%
                            return prev + Math.max(0.1, remaining * 0.05); 
                        });
                    }, 200);

                    const base64Data = base64.split(',')[1];
                    
                    const result = await analyzeUploadedVideo(aiConfig, base64Data, file.type);
                    
                    // Clear interval and set to 100%
                    if (analysisInterval) clearInterval(analysisInterval);
                    setUploadProgress(100);
                    
                    // 1. Update Header & SOP Inputs
                    setInputs({
                        niche: result.meta.niche || '',
                        topic: result.meta.topic || '',
                        context: result.sop_context || ''
                    });

                    setHeaderMeta({
                        summary: result.meta.summary || '',
                        tags: result.meta.tags || [],
                        deepAnalysis: result.meta.deep_analysis || '',
                        stats: {
                            duration: result.meta.stats.duration || "00:00",
                            shots: result.meta.stats.shots || "0",
                            emotions: result.meta.stats.emotions || "4重",
                            model: result.meta.stats.model || "Gemini"
                        }
                    });

                    // 2. Update Logic Structure
                    if (result.logic_structure) {
                        setLogicDetails(result.logic_structure);
                    }

                    // 3. Update Charts
                    if (result.charts) {
                        if (result.charts.pacing) setPacingData(result.charts.pacing);
                        if (result.charts.pacing_insight) setPacingInsight(result.charts.pacing_insight);
                        if (result.charts.persona) setPersonaData(result.charts.persona);
                        if (result.charts.persona_traits) setPersonaTraits(result.charts.persona_traits);
                    }

                    // 4. Update Script Table
                    if (result.script_table) {
                        setScriptTable(result.script_table);
                    }
                    
                    document.getElementById('structure')?.scrollIntoView({ behavior: 'smooth' });
                    // Reset ID as this is a new analysis
                    setCurrentId("");
                    setCurrentCategoryId(undefined);
                    
                } catch (error: any) {
                    console.error(error);
                    alert("视频分析失败: " + error.message);
                } finally {
                    if (analysisInterval) clearInterval(analysisInterval);
                    setIsAnalyzing(false);
                    setAnalysisStatus('');
                    setUploadProgress(0);
                }
            }
        };
        input.click();
    };

    const handleUrlExtraction = async () => {
        if (!videoUrl.trim()) return;
        if (!aiConfig.apiKey && !aiConfig.systemApiKey) {
            alert("请先配置 API Key");
            setIsConfigOpen(true);
            return;
        }

        setIsExtractingUrl(true);
        try {
            const content = await extractVideoContent(aiConfig, videoUrl);
            setInputs(prev => ({ ...prev, context: content }));
            
            // Try to extract topic from URL if not set? (Optional enhancement)
            if (!inputs.topic) {
                // Simple heuristic or leave empty
            }

            alert("✅ 素材提取成功！内容已填入下方 SOP 生成器。");
            document.getElementById('sop')?.scrollIntoView({ behavior: 'smooth' });
            
            setVideoUrl('');
            setShowUrlInput(false);
        } catch (error: any) {
            alert("提取失败: " + error.message);
        } finally {
            setIsExtractingUrl(false);
        }
    };

    return (
        <div className="min-h-screen">
            {/* Navbar */}
            <nav className="sticky top-0 z-40 bg-[#fcfaf7]/95 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md">
                                <i className="fas fa-layer-group"></i>
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900 hidden sm:block">爆款架构师 <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded ml-1">通用模板</span></span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-6">
                            <div className="hidden md:flex space-x-6 text-sm font-medium">
                                <button onClick={() => scrollToSection('structure')} className="text-slate-600 hover:text-orange-600 transition">逻辑结构</button>
                                <button onClick={() => scrollToSection('pacing')} className="text-slate-600 hover:text-orange-600 transition">节奏数据</button>
                                <button onClick={() => scrollToSection('script')} className="text-slate-600 hover:text-orange-600 transition">脚本拆解</button>
                            </div>

                            <div className="flex items-center gap-2 border-l border-slate-200 pl-4 ml-2">
                                <button onClick={handleClear} className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-600 transition" title="清空当前内容">
                                    <i className="fas fa-trash-alt"></i>
                                </button>
                                <button onClick={handleSave} className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600 transition" title="保存当前分析">
                                    <i className="fas fa-save"></i>
                                </button>
                                <button onClick={() => setIsHistoryOpen(true)} className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition" title="已保存记录">
                                    <i className="fas fa-folder-open"></i>
                                </button>
                            </div>

                            <button onClick={() => setIsConfigOpen(true)} className="group flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 px-4 py-2 rounded-full shadow-sm transition active:scale-95 ml-2" title="点击配置 AI 模型">
                                <div className={`w-2.5 h-2.5 rounded-full shadow-sm animate-pulse ${isModelReady ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI 模型状态</span>
                                    <span className="text-xs font-bold text-slate-700 font-mono" title={aiConfig.modelName}>
                                        {aiConfig.modelName.length > 12 ? `${aiConfig.modelName.substring(0, 12)}...` : aiConfig.modelName}
                                    </span>
                                </div>
                                <i className="fas fa-cog text-slate-400 group-hover:text-slate-600 transition"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <ConfigModal 
                isOpen={isConfigOpen} 
                onClose={() => setIsConfigOpen(false)} 
                config={aiConfig} 
                onSave={setAiConfig} 
            />

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                onLoad={handleLoad}
            />

            {/* Header */}
            <header className="relative pt-10 pb-12 overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="group relative">
                             <input 
                                type="text"
                                value={inputs.niche}
                                onChange={(e) => setInputs({...inputs, niche: e.target.value})}
                                className="px-4 py-1.5 text-xs font-bold tracking-wider text-slate-500 uppercase bg-slate-100 rounded-full shadow-sm border border-slate-200 text-center w-32 focus:w-48 transition-all outline-none focus:ring-2 focus:ring-orange-500 placeholder-slate-400"
                                placeholder="赛道/分类"
                            />
                        </div>
                        
                        {/* Combined Action Button */}
                        <div className="flex items-center bg-white p-1 rounded-full shadow-md border border-slate-200 gap-1 transition-all duration-300 hover:shadow-lg relative overflow-hidden">
                            
                            {/* Progress Bar Background (Fill) */}
                            {isAnalyzing && (
                                <div 
                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-300 z-0 ease-linear ${
                                        analysisStatus === 'reading' ? 'bg-orange-300/40' : 'bg-blue-300/40'
                                    }`}
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            )}

                            <button 
                                onClick={handleUploadClick}
                                disabled={isAnalyzing}
                                className={`relative z-10 flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-300 active:scale-95 overflow-hidden ${isAnalyzing 
                                    ? 'text-slate-700 bg-transparent cursor-wait' 
                                    : 'text-white bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-200 shadow-lg'
                                }`}
                            >
                                {isAnalyzing ? (
                                    analysisStatus === 'reading' ? (
                                        <><i className="fas fa-spinner fa-spin text-orange-600"></i> 读取视频 {Math.round(uploadProgress)}%</>
                                    ) : (
                                        <><div className="loader border-blue-500 border-t-transparent w-3 h-3"></div> AI 思考中 {Math.round(uploadProgress)}%</>
                                    )
                                ) : (
                                    <><i className="fas fa-cloud-upload-alt"></i> 上传参考视频</>
                                )}
                            </button>

                            {/* Separator or Connector */}
                            <div className="w-px h-4 bg-slate-200 mx-1 z-10"></div>

                            {/* URL Input Toggle / Field */}
                            {!showUrlInput ? (
                                <button 
                                    onClick={() => setShowUrlInput(true)}
                                    className="relative z-10 px-3 py-2 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition text-xs font-bold flex items-center gap-2 whitespace-nowrap"
                                    title="粘贴视频链接提取素材"
                                >
                                    <i className="fas fa-link"></i> 粘贴链接
                                </button>
                            ) : (
                                <div className="flex items-center gap-1 animate-fadeIn pr-1 z-10">
                                    <input 
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUrlExtraction()}
                                        placeholder="粘贴 Bilibili / YouTube 链接..."
                                        autoFocus
                                        className="w-48 bg-transparent border-none focus:ring-0 text-xs text-slate-700 placeholder-slate-400 py-1 outline-none"
                                    />
                                    <button 
                                        onClick={handleUrlExtraction}
                                        disabled={isExtractingUrl}
                                        className="bg-slate-800 hover:bg-black text-white w-7 h-7 rounded-full flex items-center justify-center transition active:scale-90"
                                        title="提取素材"
                                    >
                                        {isExtractingUrl ? (
                                            <div className="loader border-white border-t-transparent w-3 h-3"></div>
                                        ) : (
                                            <i className="fas fa-arrow-right text-[10px]"></i>
                                        )}
                                    </button>
                                    <button 
                                        onClick={() => setShowUrlInput(false)}
                                        className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-slate-500 transition rounded-full hover:bg-slate-100"
                                    >
                                        <i className="fas fa-times text-[10px]"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="group relative inline-block max-w-5xl w-full mx-auto mb-6">
                        <span className="absolute left-0 top-2 text-4xl md:text-6xl font-extrabold text-slate-200 select-none hidden md:inline">[</span>
                        <input
                            type="text"
                            value={inputs.topic}
                            onChange={(e) => setInputs({...inputs, topic: e.target.value})}
                            placeholder="请输入视频标题"
                            className="w-full text-center bg-transparent text-3xl md:text-6xl font-extrabold text-slate-900 border-b-2 border-transparent hover:border-slate-200 focus:border-orange-500 focus:ring-0 outline-none placeholder-slate-300 transition-all px-4 py-2"
                        />
                        <span className="absolute right-0 top-2 text-4xl md:text-6xl font-extrabold text-slate-200 select-none hidden md:inline">]</span>
                        <i className="fas fa-pen absolute top-1/2 -right-8 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></i>
                    </div>

                    <div className="group relative max-w-2xl mx-auto mb-10">
                         <textarea
                            value={headerMeta.summary}
                            onChange={(e) => setHeaderMeta({...headerMeta, summary: e.target.value})}
                            rows={2}
                            placeholder="在此处填写视频的核心逻辑一句话总结..."
                            className="w-full text-center bg-transparent text-lg md:text-xl text-slate-600 border border-transparent hover:border-slate-200 focus:border-orange-500 rounded-xl p-2 resize-none outline-none transition-all placeholder-slate-300"
                        />
                        <i className="fas fa-pen absolute top-2 -right-8 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block"></i>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
                        {[
                            { label: "视频时长", value: headerMeta.stats.duration },
                            { label: "核心分镜", value: headerMeta.stats.shots },
                            { label: "情绪转折", value: headerMeta.stats.emotions, color: "text-emerald-500" },
                            { label: "全模型接入", value: headerMeta.stats.model, color: "text-purple-500" }
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                                <div className={`text-2xl font-black ${stat.color || 'text-slate-900'}`}>{stat.value}</div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* AI Prompt Box - Enhanced Interactive UI */}
                    <div className="max-w-4xl mx-auto bg-white rounded-2xl p-1 shadow-lg border border-slate-100 group hover:shadow-2xl hover:border-orange-200 transition-all duration-300">
                        <div className="bg-slate-50 group-hover:bg-white rounded-xl p-6 border border-slate-100 group-hover:border-orange-100 flex flex-col md:flex-row gap-6 items-start text-left transition-colors duration-300 relative">
                            
                            {/* Copy Button (Visible on Hover) */}
                            <button 
                                onClick={() => {
                                    navigator.clipboard.writeText(headerMeta.deepAnalysis);
                                    const btn = document.getElementById('copy-analysis-btn');
                                    if(btn) {
                                        const original = btn.innerHTML;
                                        btn.innerHTML = '<i class="fas fa-check"></i>';
                                        setTimeout(() => btn.innerHTML = original, 1500);
                                    }
                                }}
                                id="copy-analysis-btn"
                                className="absolute top-4 right-4 text-slate-300 hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all p-2 z-20"
                                title="复制分析内容"
                            >
                                <i className="fas fa-copy"></i>
                            </button>

                            <div className="flex-shrink-0 pt-1">
                                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-sm">
                                    <i className="fas fa-bullseye"></i>
                                </div>
                            </div>
                            
                            <div className="flex-1 w-full z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase group-hover:text-orange-400 transition-colors">AI 反推核心选题</h3>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                                        <i className="fas fa-pen text-[8px] mr-1"></i>可编辑
                                    </span>
                                </div>
                                
                                <textarea
                                    value={headerMeta.deepAnalysis}
                                    onChange={(e) => setHeaderMeta({...headerMeta, deepAnalysis: e.target.value})}
                                    className="w-full bg-transparent text-lg font-bold text-slate-800 border-none focus:ring-0 p-0 resize-none outline-none placeholder-slate-300 leading-relaxed group-hover:text-slate-900 transition-colors"
                                    rows={Math.max(2, Math.min(6, Math.ceil(headerMeta.deepAnalysis.length / 35)))}
                                    placeholder="等待分析或在此输入您的核心观点..."
                                    style={{ minHeight: '3.5rem' }}
                                />
                            </div>
                            
                            <div className="flex flex-wrap gap-2 md:max-w-[180px] justify-start md:justify-end content-start opacity-70 group-hover:opacity-100 transition-opacity">
                                {headerMeta.tags.map((tag, idx) => (
                                    <span 
                                        key={idx} 
                                        className="group/tag relative px-3 py-1 bg-slate-200 hover:bg-red-100 hover:text-red-600 text-slate-600 text-xs font-bold rounded-full transition-colors cursor-default select-none flex items-center gap-1"
                                    >
                                        {tag.startsWith('#') ? tag : `#${tag}`}
                                        <button 
                                            onClick={() => handleRemoveTag(idx)}
                                            className="hidden group-hover/tag:inline-block w-3 h-3 flex items-center justify-center rounded-full hover:bg-red-200 ml-1"
                                        >
                                            <i className="fas fa-times text-[8px]"></i>
                                        </button>
                                    </span>
                                ))}
                                
                                {isAddingTag ? (
                                    <input 
                                        type="text" 
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onBlur={handleAddTag}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                        placeholder="#新标签"
                                        autoFocus
                                        className="px-2 py-1 bg-white border border-orange-300 text-xs rounded-full w-20 outline-none focus:ring-2 focus:ring-orange-200"
                                    />
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingTag(true)}
                                        className="px-3 py-1 bg-white border border-slate-200 hover:border-orange-300 text-slate-400 hover:text-orange-500 text-xs font-bold rounded-full transition-all border-dashed"
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-24">
                
                {/* Logic Structure Section */}
                <section id="structure" className="scroll-mt-24">
                    <div className="border-l-4 border-slate-800 pl-6 mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900">叙事结构拆解</h2>
                        <p className="text-slate-500 mt-2">请在 `constants.ts` 中配置以下四个阶段的具体逻辑。</p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        {(Object.entries(logicDetails) as [string, LogicDetail][]).map(([key, detail], idx) => (
                            <div 
                                key={key} 
                                className={`bg-white p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl cursor-pointer ${activeLogicDetail === detail ? 'border-orange-500 ring-2 ring-orange-200' : 'border-slate-100 hover:border-orange-200'}`}
                                onClick={() => setActiveLogicDetail(activeLogicDetail === detail ? null : detail)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded uppercase">阶段 0{idx + 1}</div>
                                    <i className="fas fa-arrow-right text-slate-300"></i>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{detail.title}</h3>
                                <div className="text-xs font-mono text-slate-400 mb-4 bg-slate-50 inline-block px-2 py-1 rounded">
                                    {key === 'hook' ? '00:00 - ?' : key === 'meta' ? '? - End' : '? - ?'}
                                </div>
                                <div 
                                    className="text-sm text-slate-600 leading-relaxed" 
                                    dangerouslySetInnerHTML={{ __html: detail.desc }} 
                                />
                            </div>
                        ))}
                    </div>
                </section>

                <ChartsSection 
                    pacingData={pacingData}
                    pacingInsight={pacingInsight}
                    personaData={personaData}
                    personaTraits={personaTraits}
                />

                {/* Script Section (Moved Up) */}
                <section id="script" className="scroll-mt-24">
                   <div className="border-l-4 border-slate-800 pl-6 mb-10">
                        <h2 className="text-3xl font-extrabold text-slate-900">像素级分镜拆解</h2>
                        <p className="text-slate-500 mt-2 text-lg">
                            拒绝玄学。我们通过 <span className="font-bold text-slate-700">“三维拆解模型”</span> 将爆款视频还原为最小可执行单元。
                        </p>
                    </div>

                    {/* 3-Layer Breakdown Explainer */}
                    <div className="grid md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition">
                            <div className="text-xs font-bold text-slate-500 uppercase mb-2">第一层：表层视觉</div>
                            <div className="font-bold text-lg text-slate-800 mb-1">感官还原</div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                记录观众直接 <span className="font-bold">看到的画面</span> 与 <span className="font-bold">听到的台词</span>。是视频的物质载体。
                            </p>
                        </div>
                        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 hover:shadow-md transition">
                            <div className="text-xs font-bold text-indigo-500 uppercase mb-2">第二层：技术拆解</div>
                            <div className="font-bold text-lg text-slate-800 mb-1">AI 施工图纸</div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                将人类的视觉描述翻译为 AI 模型能听懂的 <span className="font-bold text-indigo-700 font-mono">Prompt</span>，用于指导画面复刻。
                            </p>
                        </div>
                        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 hover:shadow-md transition">
                            <div className="text-xs font-bold text-orange-500 uppercase mb-2">第三层：底层逻辑</div>
                            <div className="font-bold text-lg text-slate-800 mb-1">流量心理学</div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                解释每个分镜的 <span className="font-bold text-orange-700">功利性目的</span>。它是为了拉升完播、建立信任，还是制造互动？
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase w-12">#</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase w-20">时间</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase w-20">景别</th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase w-1/4">
                                            <span className="block text-slate-800">表层: 画面内容</span>
                                            <span className="block text-[10px] text-indigo-500 mt-0.5">技术层: AI 提示词</span>
                                        </th>
                                        <th className="p-4 text-xs font-bold text-slate-500 uppercase w-1/4">
                                            <span className="block text-slate-800">表层: 台词/文案</span>
                                        </th>
                                        <th className="p-4 text-xs font-bold text-orange-500 uppercase w-1/4">
                                            <span className="block">底层: 爆款逻辑</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {scriptTable.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 transition group">
                                            <td className="p-4 text-sm font-bold text-slate-400">{row.id}</td>
                                            <td className="p-4 text-sm font-mono text-slate-500">{row.time}</td>
                                            <td className="p-4 text-sm font-bold text-slate-700">
                                                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{row.shot}</span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-sm font-bold text-slate-800 mb-2 leading-snug">{row.visual}</div>
                                                <div className="text-xs text-slate-500 bg-indigo-50/50 p-2 rounded border border-indigo-100/50 font-mono group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                                    <i className="fas fa-robot text-indigo-400 mr-1"></i> {row.ai_prompt}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top text-sm text-slate-700 leading-relaxed font-medium">
                                                {row.dialogue}
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="text-sm text-slate-600 italic border-l-2 border-orange-200 pl-3 py-1 bg-orange-50/30 rounded-r">
                                                    {row.logic}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* SOP Generator (Moved Down) */}
                <SopGenerator 
                    aiConfig={aiConfig} 
                    onOpenConfig={() => setIsConfigOpen(true)}
                    inputs={inputs}
                    setInputs={setInputs}
                    sopData={sopData}
                    setSopData={setSopData}
                />

            </main>
            
            <footer className="bg-white border-t border-slate-200 py-12 mt-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                     <p className="text-slate-400 text-sm">© 2024 爆款架构师 | 视频去玄学分析工具</p>
                </div>
            </footer>
        </div>
    );
};

export default App;
