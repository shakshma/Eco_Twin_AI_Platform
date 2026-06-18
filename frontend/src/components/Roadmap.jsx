import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Compass, CheckCircle2, Star, Sparkles, TrendingDown, Car, Zap, Utensils, Trash2, Users, Cpu, ChevronDown, ChevronUp, Target } from 'lucide-react';

const FOCUS_ICONS = {
  'Transport': Car,
  'Energy': Zap,
  'Food & Diet': Utensils,
  'Waste': Trash2,
  'Community & Lifestyle': Users,
  'Tech & Optimization': Cpu,
};

const FOCUS_COLORS = {
  'Transport': { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', text: '#10b981' },
  'Energy': { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)', text: '#3b82f6' },
  'Food & Diet': { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', text: '#f59e0b' },
  'Waste': { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', text: '#ef4444' },
  'Community & Lifestyle': { bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.25)', text: '#a855f7' },
  'Tech & Optimization': { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)', text: '#06b6d4' },
};

const CATEGORY_COLORS = {
  'Transport': '#10b981',
  'Energy': '#3b82f6',
  'Food': '#f59e0b',
  'Waste': '#ef4444',
};

export default function Roadmap() {
  const { token, API_URL } = useAuth();
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMonth, setExpandedMonth] = useState(1);
  const [narrativeVisible, setNarrativeVisible] = useState(false);

  useEffect(() => {
    fetchRoadmap();
  }, [token]);

  useEffect(() => {
    if (roadmapData) {
      // Trigger narrative fade-in after data loads
      const timer = setTimeout(() => setNarrativeVisible(true), 300);
      return () => clearTimeout(timer);
    }
  }, [roadmapData]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/footprint/roadmap`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoadmapData(data);
      }
    } catch (err) {
      console.error("Error fetching roadmap data", err);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    if (!roadmapData) return [];
    return [
      { name: 'Now', footprint: roadmapData.current_footprint_kg, score: roadmapData.current_eco_score },
      ...roadmapData.roadmap.map(m => ({
        name: `M${m.month}`,
        footprint: m.target_footprint_kg,
        score: m.projected_eco_score
      }))
    ];
  };

  const getReductionPercent = () => {
    if (!roadmapData) return 0;
    const current = roadmapData.current_footprint_kg;
    const target = roadmapData.roadmap[roadmapData.roadmap.length - 1]?.target_footprint_kg || current;
    if (current <= 0) return 0;
    return Math.round(((current - target) / current) * 100);
  };

  const toggleMonth = (month) => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/2 bottom-0 w-48 h-48 bg-teal-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-start justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Compass className="w-8 h-8 text-emerald-400" />
              AI Carbon Reduction Roadmap
            </h1>
            <p className="text-slate-400 mt-2 max-w-xl">
              Your personalized, Gemini AI-powered 6-month plan to systematically reduce your carbon footprint with data-driven monthly targets.
            </p>
          </div>
          {roadmapData && (
            <div className="hidden md:flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-full px-4 py-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-400">Powered by Gemini AI</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              <Sparkles className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="text-slate-500 text-sm font-medium animate-pulse">
              Generating your AI-powered roadmap...
            </div>
          </div>
        </div>
      ) : roadmapData ? (
        <>
          {/* AI Narrative Banner */}
          <div
            className="backdrop-blur-md bg-gradient-to-r from-emerald-950/30 via-slate-900/40 to-teal-950/30 border border-emerald-500/15 rounded-3xl p-6 relative overflow-hidden"
            style={{
              opacity: narrativeVisible ? 1 : 0,
              transform: narrativeVisible ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div className="absolute right-6 top-6">
              <Sparkles className="w-5 h-5 text-emerald-500/30" />
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Gemini AI Insight</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {roadmapData.gemini_narrative}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Current Footprint */}
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-center">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Current Daily</div>
              <div className="text-2xl font-black text-white">
                {roadmapData.current_footprint_kg}
                <span className="text-xs font-normal text-slate-500 ml-1">kg</span>
              </div>
            </div>

            {/* Target Footprint */}
            <div className="backdrop-blur-md bg-slate-900/40 border border-emerald-500/15 rounded-2xl p-5 text-center">
              <div className="text-emerald-500/80 text-xs font-bold uppercase tracking-wider mb-1">Month 6 Target</div>
              <div className="text-2xl font-black text-emerald-400">
                {roadmapData.roadmap[roadmapData.roadmap.length - 1]?.target_footprint_kg}
                <span className="text-xs font-normal text-emerald-500/60 ml-1">kg</span>
              </div>
            </div>

            {/* Reduction Percent */}
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-center">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Reduction</div>
              <div className="text-2xl font-black text-teal-400 flex items-center justify-center gap-1">
                <TrendingDown className="w-5 h-5" />
                {getReductionPercent()}%
              </div>
            </div>

            {/* Annual Target */}
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-center">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Annual Target</div>
              <div className="text-2xl font-black text-white">
                {roadmapData.target_annual_tons}
                <span className="text-xs font-normal text-slate-500 ml-1">tons</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left: 6-Month Timeline (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Current Starting Point */}
              <div className="backdrop-blur-md bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 relative">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Target className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Starting Point</div>
                      <div className="text-lg font-black text-white">
                        {roadmapData.current_footprint_kg} <span className="text-sm font-normal text-slate-400">kg CO₂e/day</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/10 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/20">
                      Score: {roadmapData.current_eco_score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Cards with Timeline */}
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[19px] top-0 bottom-0 w-px bg-gradient-to-b from-emerald-500/30 via-teal-500/20 to-cyan-500/10"></div>

                <div className="space-y-3">
                  {roadmapData.roadmap.map((m) => {
                    const isExpanded = expandedMonth === m.month;
                    const FocusIcon = FOCUS_ICONS[m.focus_area] || Compass;
                    const colors = FOCUS_COLORS[m.focus_area] || FOCUS_COLORS['Transport'];
                    const prevFp = m.month === 1 ? roadmapData.current_footprint_kg : roadmapData.roadmap[m.month - 2]?.target_footprint_kg;
                    const monthSaving = prevFp ? (prevFp - m.target_footprint_kg).toFixed(1) : '0.0';

                    return (
                      <div key={m.month} className="relative pl-10">
                        {/* Timeline node */}
                        <div
                          className="absolute left-[11px] top-5 w-4 h-4 rounded-full border-2 z-10"
                          style={{
                            backgroundColor: isExpanded ? colors.text : 'rgb(30, 41, 59)',
                            borderColor: colors.text,
                            boxShadow: isExpanded ? `0 0 12px ${colors.text}40` : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        ></div>

                        <div
                          className="backdrop-blur-md bg-slate-900/40 border rounded-2xl overflow-hidden cursor-pointer"
                          style={{
                            borderColor: isExpanded ? colors.border : 'rgba(51, 65, 85, 0.5)',
                            transition: 'all 0.3s ease',
                          }}
                          onClick={() => toggleMonth(m.month)}
                        >
                          {/* Header (always visible) */}
                          <div className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center border"
                                style={{ backgroundColor: colors.bg, borderColor: colors.border }}
                              >
                                <FocusIcon className="w-4 h-4" style={{ color: colors.text }} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-white font-bold text-sm">Month {m.month}</h3>
                                  <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded-md border"
                                    style={{ backgroundColor: colors.bg, borderColor: colors.border, color: colors.text }}
                                  >
                                    {m.focus_area}
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                  Target: <span className="text-slate-300 font-semibold">{m.target_footprint_kg} kg</span>
                                  <span className="mx-1.5 text-slate-700">•</span>
                                  Save <span className="font-semibold" style={{ color: colors.text }}>-{monthSaving} kg</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="hidden sm:flex items-center gap-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {m.projected_eco_score}
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <div
                            style={{
                              maxHeight: isExpanded ? '600px' : '0',
                              opacity: isExpanded ? 1 : 0,
                              overflow: 'hidden',
                              transition: 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
                            }}
                          >
                            <div className="px-5 pb-5 space-y-4 border-t border-slate-800/60 pt-4">
                              {/* AI Insight */}
                              {m.ai_insight && (
                                <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-3.5 flex items-start gap-3">
                                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <p className="text-xs text-slate-400 leading-relaxed italic">{m.ai_insight}</p>
                                </div>
                              )}

                              {/* Actions */}
                              <div>
                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Action Items</div>
                                <ul className="space-y-2">
                                  {m.actions.map((act, idx) => (
                                    <li key={idx} className="flex items-start gap-2.5 text-slate-300 text-sm">
                                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: colors.text }} />
                                      <span>{act}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Category Breakdown Mini Bars */}
                              {m.category_breakdown && m.category_breakdown.length > 0 && (
                                <div>
                                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Category Breakdown</div>
                                  <div className="space-y-2">
                                    {m.category_breakdown.map((cat, idx) => {
                                      const pct = cat.current_kg > 0 ? ((cat.saving_kg / cat.current_kg) * 100) : 0;
                                      const barColor = CATEGORY_COLORS[cat.category] || '#64748b';
                                      return (
                                        <div key={idx} className="flex items-center gap-3">
                                          <span className="text-xs text-slate-500 w-16 shrink-0">{cat.category}</span>
                                          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                                            <div
                                              className="h-full rounded-full"
                                              style={{
                                                width: `${Math.min(100, Math.max(2, pct))}%`,
                                                backgroundColor: barColor,
                                                opacity: 0.7,
                                                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                                              }}
                                            ></div>
                                          </div>
                                          <span className="text-xs font-semibold text-slate-400 w-16 text-right">
                                            -{cat.saving_kg} kg
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Chart + Summary (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Projection Chart */}
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <div>
                  <h3 className="text-slate-300 font-bold text-base">6-Month Reduction Curve</h3>
                  <p className="text-slate-500 text-xs mt-1">Your projected daily footprint trajectory</p>
                </div>
                
                <div className="h-56 w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="roadmapGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit=" kg" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="footprint"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#roadmapGradient)"
                        dot={{ r: 4, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                        activeDot={{ r: 6, fill: '#10b981', stroke: '#0f172a', strokeWidth: 2 }}
                        name="Target Footprint"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Eco Score Progression */}
              <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
                <h3 className="text-slate-300 font-bold text-base mb-1">Eco Score Journey</h3>
                <p className="text-slate-500 text-xs mb-4">Watch your score climb as you hit monthly targets</p>
                
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getChartData()} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="score"
                        fill="#10b981"
                        radius={[6, 6, 0, 0]}
                        name="Eco Score"
                        opacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Final Target Card */}
              <div className="bg-gradient-to-br from-emerald-950/40 via-slate-900/40 to-teal-950/40 border border-emerald-500/15 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 mb-1">Month 6 Goal</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      By maintaining all 6 months of habits, your daily footprint will drop to{' '}
                      <span className="text-emerald-400 font-bold">
                        {roadmapData.roadmap[roadmapData.roadmap.length - 1]?.target_footprint_kg} kg/day
                      </span>
                      {' '}with an Eco Score of{' '}
                      <span className="text-emerald-400 font-bold">
                        {roadmapData.roadmap[roadmapData.roadmap.length - 1]?.projected_eco_score}/100
                      </span>
                      . That's{' '}
                      <span className="text-teal-400 font-bold">
                        {roadmapData.target_annual_tons} tons/year
                      </span>
                      {' '} — well on your way to a sustainable lifestyle!
                    </p>
                  </div>
                </div>
              </div>

              {/* Powered by badge */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 bg-slate-900/30 border border-slate-800/50 rounded-full px-4 py-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-semibold text-slate-500">Insights generated by Gemini AI + ML Model</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-24 text-slate-500">
          <p>Unable to load roadmap. Please log your daily footprint first.</p>
        </div>
      )}
    </div>
  );
}
