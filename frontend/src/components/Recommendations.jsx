import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Check, Flame, ChevronRight, HelpCircle } from 'lucide-react';

export default function Recommendations() {
  const { token, API_URL } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [adopted, setAdopted] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [token]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${API_URL}/footprint/recommendations`, { headers });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Error fetching recommendations", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdopt = (index) => {
    setAdopted(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getDifficultyColor = (diff) => {
    switch (diff.toLowerCase()) {
      case 'easy':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'medium':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'hard':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-emerald-400" />
          Personalized Recommendations
        </h1>
        <p className="text-slate-400 mt-2 max-w-xl">
          Based on your carbon logging history, we have compiled actionable steps to target your highest emission areas.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-24 text-slate-500 animate-pulse">
          Loading recommendations engine...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recommendations.map((rec, index) => (
            <div 
              key={index} 
              className={`backdrop-blur-md bg-slate-900/40 border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 ${
                adopted[index] 
                  ? 'border-emerald-500/50 bg-emerald-950/10 shadow-lg shadow-emerald-950/10' 
                  : 'border-slate-800/80 hover:border-slate-700/80'
              }`}
            >
              <div className="space-y-4">
                {/* Meta details */}
                <div className="flex justify-between items-center">
                  <span className="bg-slate-950/60 border border-slate-800 px-3 py-1 rounded-full text-xs font-semibold text-slate-300">
                    {rec.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${getDifficultyColor(rec.difficulty)}`}>
                    {rec.difficulty}
                  </span>
                </div>

                {/* Description */}
                <h3 className="text-lg font-bold text-white leading-snug">
                  {rec.action}
                </h3>
              </div>

              {/* Action and Savings details */}
              <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Estimated Savings</div>
                  <div className="text-emerald-400 font-extrabold text-lg flex items-center gap-0.5">
                    <Flame className="w-4 h-4" />
                    {rec.co2_savings_kg.toFixed(1)} <span className="text-xs font-normal text-slate-400">kg CO₂e/day</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleAdopt(index)}
                  className={`flex items-center gap-1.5 font-semibold text-sm rounded-xl py-2.5 px-4 border transition-all ${
                    adopted[index]
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {adopted[index] ? (
                    <>
                      <Check className="w-4 h-4" /> Adopted
                    </>
                  ) : (
                    <>
                      Adopt Action <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
