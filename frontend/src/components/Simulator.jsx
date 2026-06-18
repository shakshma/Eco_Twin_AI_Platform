import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Zap, Shuffle, ArrowDown, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function Simulator() {
  const { API_URL } = useAuth();

  // Current inputs
  const [currTransport, setCurrTransport] = useState('Car');
  const [currDistance, setCurrDistance] = useState(20);
  const [currElectricity, setCurrElectricity] = useState(8);
  const [currRenewable, setCurrRenewable] = useState(10);
  const [currFood, setCurrFood] = useState('Non-Veg');
  const [currWaste, setCurrWaste] = useState(1.2);

  // Simulated inputs
  const [simTransport, setSimTransport] = useState('Public Transit');
  const [simDistance, setSimDistance] = useState(20);
  const [simElectricity, setSimElectricity] = useState(5);
  const [simRenewable, setSimRenewable] = useState(100);
  const [simFood, setSimFood] = useState('Veg');
  const [simWaste, setSimWaste] = useState(0.5);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    runSimulation();
  }, [
    currTransport, currDistance, currElectricity, currRenewable, currFood, currWaste,
    simTransport, simDistance, simElectricity, simRenewable, simFood, simWaste
  ]);

  const runSimulation = async () => {
    try {
      const response = await fetch(`${API_URL}/footprint/simulator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_input: {
            day_type: 'Weekday',
            transport_mode: currTransport,
            distance_km: parseFloat(currDistance),
            electricity_kwh: parseFloat(currElectricity),
            renewable_usage_pct: parseInt(currRenewable),
            food_type: currFood,
            screen_time_hours: 5.0,
            waste_generated_kg: parseFloat(currWaste),
            eco_actions: 1
          },
          simulated_input: {
            day_type: 'Weekday',
            transport_mode: simTransport,
            distance_km: parseFloat(simDistance),
            electricity_kwh: parseFloat(simElectricity),
            renewable_usage_pct: parseInt(simRenewable),
            food_type: simFood,
            screen_time_hours: 5.0,
            waste_generated_kg: parseFloat(simWaste),
            eco_actions: 4
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error("Simulation run error", err);
    }
  };

  const chartData = results ? [
    {
      name: 'Carbon Footprint',
      Current: results.original_footprint_kg,
      Simulated: results.simulated_footprint_kg
    }
  ] : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 border border-slate-800 rounded-3xl p-8 relative overflow-hidden">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Shuffle className="w-8 h-8 text-teal-400" />
          Carbon Reduction Simulator
        </h1>
        <p className="text-slate-400 mt-2 max-w-xl">
          Adjust inputs dynamically to see how swapping commute styles, switching energy sources, or changing diets immediately drops your CO₂ emissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Current Habits Controls (4 Cols) */}
        <div className="lg:col-span-4 backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-5">
          <h3 className="text-slate-300 font-bold text-base flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            Current Habits
          </h3>

          {/* Commute */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-medium">Commute Mode & Distance</label>
            <select
              value={currTransport}
              onChange={(e) => setCurrTransport(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-white text-sm outline-none mb-2"
            >
              <option value="Car">Petrol/Diesel Car</option>
              <option value="Electric Vehicle">Electric Vehicle</option>
              <option value="Public Transit">Bus / Train</option>
              <option value="Bike">Bicycle</option>
              <option value="Walk">Walk</option>
            </select>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Distance: {currDistance} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={currDistance}
              onChange={(e) => setCurrDistance(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-amber-500"
            />
          </div>

          {/* Electricity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Grid Energy: {currElectricity} kWh</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={currElectricity}
              onChange={(e) => setCurrElectricity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-amber-500"
            />
          </div>

          {/* Renewable % */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Renewable Energy: {currRenewable}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={currRenewable}
              onChange={(e) => setCurrRenewable(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-amber-500"
            />
          </div>

          {/* Diet */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-medium">Diet</label>
            <select
              value={currFood}
              onChange={(e) => setCurrFood(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
            >
              <option value="Non-Veg">Non-Vegetarian</option>
              <option value="Veg">Vegetarian</option>
              <option value="Vegan">Vegan</option>
            </select>
          </div>

          {/* Waste */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Waste Produced: {currWaste} kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={currWaste}
              onChange={(e) => setCurrWaste(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-amber-500"
            />
          </div>
        </div>

        {/* Simulated Targets Controls (4 Cols) */}
        <div className="lg:col-span-4 backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-5">
          <h3 className="text-slate-300 font-bold text-base flex items-center gap-2 border-b border-slate-800 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Simulated Swaps
          </h3>

          {/* Commute */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-medium">Commute Mode & Distance</label>
            <select
              value={simTransport}
              onChange={(e) => setSimTransport(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-sm outline-none mb-2"
            >
              <option value="Car">Petrol/Diesel Car</option>
              <option value="Electric Vehicle">Electric Vehicle</option>
              <option value="Public Transit">Bus / Train</option>
              <option value="Bike">Bicycle</option>
              <option value="Walk">Walk</option>
            </select>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Distance: {simDistance} km</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={simDistance}
              onChange={(e) => setSimDistance(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-emerald-500"
            />
          </div>

          {/* Electricity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Grid Energy: {simElectricity} kWh</span>
            </div>
            <input
              type="range"
              min="0"
              max="25"
              value={simElectricity}
              onChange={(e) => setSimElectricity(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-emerald-500"
            />
          </div>

          {/* Renewable % */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Renewable Energy: {simRenewable}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={simRenewable}
              onChange={(e) => setSimRenewable(parseInt(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-emerald-500"
            />
          </div>

          {/* Diet */}
          <div className="space-y-1">
            <label className="text-slate-400 text-xs font-medium">Diet</label>
            <select
              value={simFood}
              onChange={(e) => setSimFood(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
            >
              <option value="Non-Veg">Non-Vegetarian</option>
              <option value="Veg">Vegetarian</option>
              <option value="Vegan">Vegan</option>
            </select>
          </div>

          {/* Waste */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium text-slate-400">
              <span>Waste Produced: {simWaste} kg</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={simWaste}
              onChange={(e) => setSimWaste(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded accent-emerald-500"
            />
          </div>
        </div>

        {/* Simulation Outputs (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Main reduction result badge */}
          {results && (
            <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 text-center space-y-4">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Simulated Savings</span>
              <div className="flex items-center justify-center gap-1 text-emerald-400 font-extrabold text-5xl">
                <ArrowDown className="w-10 h-10 animate-bounce" />
                {results.reduction_percentage}%
              </div>
              <p className="text-xs text-slate-400 px-4">
                Your simulated daily footprint is <span className="text-emerald-400 font-semibold">{results.simulated_footprint_kg} kg</span> (down from {results.original_footprint_kg} kg).
              </p>
              
              {/* Eco Score comparison bar */}
              <div className="pt-4 border-t border-slate-800 flex justify-around items-center">
                <div>
                  <div className="text-slate-500 text-xs">Current Score</div>
                  <div className="text-amber-500 font-bold text-lg">{results.eco_score_original}</div>
                </div>
                <div className="h-8 w-[1px] bg-slate-800"></div>
                <div>
                  <div className="text-slate-500 text-xs">Simulated Score</div>
                  <div className="text-emerald-500 font-bold text-lg">{results.eco_score_simulated}</div>
                </div>
              </div>
            </div>
          )}

          {/* Side by side chart */}
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex-1 flex flex-col justify-between">
            <h4 className="text-slate-300 font-bold text-sm mb-4">Footprint Comparison (kg CO₂)</h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                  <Bar dataKey="Current" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Simulated" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
