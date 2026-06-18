import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  Car, Lightbulb, Utensils, Trash, Star, Leaf, Award, Calendar, RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const { token, API_URL } = useAuth();
  
  // Input fields for daily activities
  const [dayType, setDayType] = useState('Weekday');
  const [transportMode, setTransportMode] = useState('Car');
  const [distanceKm, setDistanceKm] = useState(15.0);
  const [electricityKwh, setElectricityKwh] = useState(6.0);
  const [renewableUsagePct, setRenewableUsagePct] = useState(20);
  const [foodType, setFoodType] = useState('Non-Veg');
  const [screenTime, setScreenTime] = useState(5.0);
  const [wasteKg, setWasteKg] = useState(0.8);
  const [ecoActions, setEcoActions] = useState(2);

  // Prediction and history states
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loggingSuccess, setLoggingSuccess] = useState(false);

  // Calculate local/immediate footprint values for non-submitted UI
  const getTemporaryBreakdown = () => {
    const transportMultipliers = { Car: 0.18, "Public Transit": 0.05, "Electric Vehicle": 0.03, Bike: 0.0, Walk: 0.0 };
    const transportEmissions = distanceKm * (transportMultipliers[transportMode] || 0.1);
    
    const renewableFactor = 1.0 - (renewableUsagePct / 100.0);
    const electricityEmissions = electricityKwh * 0.45 * renewableFactor;
    
    const foodBaselines = { Vegan: 1.5, Veg: 2.5, "Non-Veg": 6.0 };
    const foodEmissions = foodBaselines[foodType] || 3.5;
    
    const wasteEmissions = wasteKg * 1.2;

    return [
      { name: 'Transport', value: parseFloat(transportEmissions.toFixed(2)), color: '#10b981' },
      { name: 'Electricity', value: parseFloat(electricityEmissions.toFixed(2)), color: '#3b82f6' },
      { name: 'Diet/Food', value: parseFloat(foodEmissions.toFixed(2)), color: '#f59e0b' },
      { name: 'Waste Management', value: parseFloat(wasteEmissions.toFixed(2)), color: '#ef4444' }
    ];
  };

  const currentBreakdown = getTemporaryBreakdown();
  const totalCalculatedFootprint = currentBreakdown.reduce((sum, item) => sum + item.value, 0);

  // Load history & initial prediction
  useEffect(() => {
    fetchHistory();
    handlePredict(false); // Initial load predict without database logging
  }, [token]);

  const fetchHistory = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/footprint/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Format dates for plotting
        const formatted = data.map(log => ({
          ...log,
          displayDate: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        })).reverse();
        setHistory(formatted);
      }
    } catch (err) {
      console.error("Error fetching historical footprint logs", err);
    }
  };

  const handlePredict = async (logToDatabase = true) => {
    setLoading(true);
    setLoggingSuccess(false);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const payload = {
        day_type: dayType,
        transport_mode: transportMode,
        distance_km: parseFloat(distanceKm),
        electricity_kwh: parseFloat(electricityKwh),
        renewable_usage_pct: parseInt(renewableUsagePct),
        food_type: foodType,
        screen_time_hours: parseFloat(screenTime),
        waste_generated_kg: parseFloat(wasteKg),
        eco_actions: parseInt(ecoActions)
      };

      const endpoint = logToDatabase && token ? `${API_URL}/footprint/predict` : `${API_URL}/footprint/predict?current_user=None`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
        if (logToDatabase && token) {
          setLoggingSuccess(true);
          fetchHistory();
        }
      }
    } catch (err) {
      console.error("Footprint prediction error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upper Dashboard header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Leaf className="w-8 h-8 text-emerald-400" />
            Carbon Footprint Dashboard
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl">
            Analyze your daily behaviors, log environmental actions, and track your progression towards a zero-carbon lifestyle.
          </p>
        </div>
        {token && (
          <button 
            onClick={fetchHistory}
            className="mt-4 md:mt-0 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-700 text-slate-300 font-medium rounded-xl py-2.5 px-4 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Data
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Daily Logger Input Form (7 Cols) */}
        <div className="lg:col-span-7 backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Log Today's Activities
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Day Type Selector */}
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-400" /> Day Type
              </label>
              <div className="flex bg-slate-950/60 p-1 border border-slate-800 rounded-xl">
                {['Weekday', 'Weekend'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDayType(type)}
                    className={`flex-1 text-center py-2 text-sm font-medium rounded-lg transition-all ${
                      dayType === type 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow' 
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Transport Mode */}
            <div className="space-y-2">
              <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-400" /> Commuting Mode
              </label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-sm outline-none transition-colors"
              >
                <option value="Car">Petrol/Diesel Car</option>
                <option value="Electric Vehicle">Electric Vehicle</option>
                <option value="Public Transit">Bus / Train / Metro</option>
                <option value="Bike">Bicycle</option>
                <option value="Walk">Walking / Running</option>
              </select>
            </div>
          </div>

          <div className="space-y-5">
            {/* Distance Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">Commuted Distance (km)</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">{distanceKm} km</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* Electricity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-blue-400" /> Daily Power Consumption
                </span>
                <span className="text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{electricityKwh} kWh</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.5"
                value={electricityKwh}
                onChange={(e) => setElectricityKwh(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>

            {/* Renewable Percentage */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium">Renewable Grid Mix (%)</span>
                <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">{renewableUsagePct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={renewableUsagePct}
                onChange={(e) => setRenewableUsagePct(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
            </div>

            {/* Food Diet Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-400" /> Diet Type
                </label>
                <select
                  value={foodType}
                  onChange={(e) => setFoodType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-2.5 px-3 text-white text-sm outline-none transition-colors"
                >
                  <option value="Non-Veg">Meat Eater / Non-Veg</option>
                  <option value="Veg">Vegetarian</option>
                  <option value="Vegan">Vegan (Plant-Based)</option>
                </select>
              </div>

              {/* Waste Generation Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Trash className="w-4 h-4 text-red-400" /> Waste Generated (kg/day)
                  </span>
                  <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">{wasteKg} kg</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={wasteKg}
                  onChange={(e) => setWasteKg(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
              </div>
            </div>

            {/* Eco Actions Count */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-400" /> Green actions completed
                </span>
                <span className="text-yellow-400 font-bold bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20">{ecoActions} / 5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={ecoActions}
                onChange={(e) => setEcoActions(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {loggingSuccess && (
              <span className="text-emerald-400 text-sm font-medium animate-pulse">
                ✓ Daily Carbon Footprint Logged Successfully!
              </span>
            )}
            <div className="flex-1"></div>
            <button
              onClick={() => handlePredict(true)}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] text-white font-medium rounded-xl py-3 px-6 shadow-lg shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 min-w-[150px]"
            >
              {loading ? 'Analyzing...' : token ? 'Submit Daily Log' : 'Calculate Footprint'}
            </button>
          </div>
        </div>

        {/* Right Side: Score Card & Breakdown Charts (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* Top Score Circular Gauge */}
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col items-center text-center relative overflow-hidden">
            {prediction && (
              <>
                <h3 className="text-slate-400 font-medium text-sm">Eco Score</h3>
                <div className="relative flex items-center justify-center my-6">
                  {/* Gauge Circle */}
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="54"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-emerald-500"
                      fill="transparent"
                      strokeDasharray={339.29}
                      strokeDashoffset={339.29 - (339.29 * prediction.eco_score) / 100}
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-extrabold text-white">{prediction.eco_score}</span>
                    <span className="text-xs text-slate-500">/ 100</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xl font-bold text-white">
                    {prediction.carbon_footprint_kg} <span className="text-sm font-normal text-slate-400">kg CO₂/day</span>
                  </div>
                  <div className="text-sm font-medium">
                    Impact Level:{' '}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      prediction.carbon_impact_level === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      prediction.carbon_impact_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {prediction.carbon_impact_level}
                    </span>
                  </div>
                </div>
              </>
            )}
            
            {!prediction && (
              <div className="py-24 text-slate-500">
                Please calculate to generate score.
              </div>
            )}
          </div>

          {/* Bottom Carbon Breakdown (Donut Chart) */}
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between flex-1">
            <h3 className="text-slate-300 font-bold text-base mb-4">Emissions Breakdown</h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={currentBreakdown}
                    innerRadius={60}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {currentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              {currentBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}: {item.value} kg</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Historical carbon progression chart */}
      {token && history.length > 0 && (
        <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
          <h3 className="text-slate-300 font-bold text-base mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Your Historical Carbon Footprint
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorFootprint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="carbon_footprint_kg" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorFootprint)" 
                  name="Carbon Footprint"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
