import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { ChartDataPoint, RadarDataPoint } from '../types';

interface ChartsSectionProps {
    pacingData: ChartDataPoint[];
    pacingInsight: string;
    personaData: RadarDataPoint[];
    personaTraits: string[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ 
    pacingData, 
    pacingInsight, 
    personaData, 
    personaTraits 
}) => {
    return (
        <section id="pacing" className="scroll-mt-24 grid md:grid-cols-2 gap-8 items-start">
            {/* Pacing Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg w-full min-w-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">视频节奏心电图</h2>
                    <div className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">留存节奏</div>
                </div>
                {/* 1. Added relative positioning to parent 
                    2. Added minWidth/minHeight to ResponsiveContainer to prevent -1 error */}
                <div className="w-full h-[300px] relative" style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                        <LineChart data={pacingData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                            <XAxis dataKey="time" hide />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px' }} 
                                itemStyle={{ color: '#64748b' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#f97316" 
                                strokeWidth={3} 
                                dot={{ r: 4, fill: '#fff', stroke: '#f97316', strokeWidth: 2 }} 
                                activeDot={{ r: 6 }} 
                                animationDuration={1000}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 bg-slate-50 p-4 rounded-xl text-sm text-slate-600 border-l-4 border-orange-400">
                    <strong className="text-slate-900">节奏洞察：</strong> 
                    <span dangerouslySetInnerHTML={{ __html: pacingInsight }} />
                </div>
            </div>

            {/* Persona Radar Chart */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-lg w-full min-w-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">人设维度解析</h2>
                    <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">人设属性</div>
                </div>
                <div className="w-full h-[300px] relative" style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={personaData}>
                            <PolarGrid stroke="#e2e8f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar 
                                name="当前模型" 
                                dataKey="A" 
                                stroke="#3b82f6" 
                                strokeWidth={2} 
                                fill="#3b82f6" 
                                fillOpacity={0.2} 
                                animationDuration={1000}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                    {personaTraits.map((trait, index) => (
                        <div key={index} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">关键特征 {index + 1}</div>
                            <p className="text-sm text-slate-700">{trait}</p>
                        </div>
                    ))}
                    {personaTraits.length === 0 && (
                         <div className="col-span-2 text-center text-slate-400 text-xs py-2">暂无特征数据</div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default ChartsSection;