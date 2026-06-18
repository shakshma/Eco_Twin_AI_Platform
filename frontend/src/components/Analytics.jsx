import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend, Cell, ComposedChart, Line
} from 'recharts';
import { Globe, Shield, Activity, Search, Car, HelpCircle } from 'lucide-react';

export default function Analytics() {
  const { API_URL } = useAuth();
  
  // Tab control
  const [activeTab, setActiveTab] = useState('food'); // 'food' | 'vehicles' | 'countries'

  // Food states
  const [foodCountries, setFoodCountries] = useState([]);
  const [selectedFoodCountry, setSelectedFoodCountry] = useState('United States of America');
  const [foodSummary, setFoodSummary] = useState(null);
  const [foodLoading, setFoodLoading] = useState(false);

  // Vehicle states
  const [vehiclesData, setVehiclesData] = useState([]);
  const [fuelAverages, setFuelAverages] = useState({});
  const [vehicleQuery, setVehicleQuery] = useState('');

  // Country benchmark states
  const [benchmarkCountries, setBenchmarkCountries] = useState([]);
  const [selectedBenchmarkCountry, setSelectedBenchmarkCountry] = useState('United States');
  const [benchmarkSummary, setBenchmarkSummary] = useState(null);

  useEffect(() => {
    fetchFoodCountries();
    fetchBenchmarkCountries();
    fetchVehicles();
  }, []);

  useEffect(() => {
    fetchFoodSummary();
  }, [selectedFoodCountry]);

  useEffect(() => {
    fetchBenchmarkSummary();
  }, [selectedBenchmarkCountry]);

  // Food emissions loading
  const fetchFoodCountries = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/food/countries`);
      if (response.ok) {
        const data = await response.json();
        setFoodCountries(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchFoodSummary = async () => {
    setFoodLoading(true);
    try {
      const response = await fetch(`${API_URL}/analytics/food/summary?area=${encodeURIComponent(selectedFoodCountry)}`);
      if (response.ok) {
        const data = await response.json();
        setFoodSummary(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFoodLoading(false);
    }
  };

  // Vehicles loading
  const fetchVehicles = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/vehicles`);
      if (response.ok) {
        const data = await response.json();
        setVehiclesData(data.vehicles || []);
        setFuelAverages(data.averages_by_fuel_type || {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Benchmark loading
  const fetchBenchmarkCountries = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/countries/list`);
      if (response.ok) {
        const data = await response.json();
        setBenchmarkCountries(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBenchmarkSummary = async () => {
    try {
      const response = await fetch(`${API_URL}/analytics/countries/compare?country_name=${encodeURIComponent(selectedBenchmarkCountry)}`);
      if (response.ok) {
        const data = await response.json();
        setBenchmarkSummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format fuel type values for display
  const getFuelAveragesData = () => {
    return Object.entries(fuelAverages).map(([fuel, value]) => ({
      fuel,
      co2: value
    }));
  };

  const filteredVehicles = vehiclesData.filter(v => 
    v.brand.toLowerCase().includes(vehicleQuery.toLowerCase()) ||
    v.model.toLowerCase().includes(vehicleQuery.toLowerCase()) ||
    v.fuel_type.toLowerCase().includes(vehicleQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex bg-slate-900/60 p-1 border border-slate-800 rounded-2xl max-w-lg">
        {[
          { id: 'food', label: 'Food Systems', icon: Activity },
          { id: 'vehicles', label: 'Vehicle Database', icon: Car },
          { id: 'countries', label: 'Country Benchmark', icon: Globe }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === tab.id 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/10' 
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Tab 1: Food systems --- */}
      {activeTab === 'food' && (
        <div className="space-y-8">
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Agrofood Emissions & Climate</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Visualize historical food supply chain emissions mapped against local annual temperature anomalies.
                </p>
              </div>
              <div className="w-64">
                <select
                  value={selectedFoodCountry}
                  onChange={(e) => setSelectedFoodCountry(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                >
                  {foodCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {foodLoading ? (
              <div className="text-center py-24 text-slate-500 animate-pulse">Loading dataset...</div>
            ) : foodSummary ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Historical Chart */}
                <div className="lg:col-span-8 h-80">
                  <h4 className="text-slate-300 font-bold text-sm mb-4">Emissions Trend vs Temperature Deviation</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={foodSummary.history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="Year" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#10b981" fontSize={10} tickLine={false} label={{ value: 'Emissions (kt CO₂e)', angle: -90, position: 'insideLeft', fill: '#10b981', style: {fontSize: 10} }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} tickLine={false} label={{ value: 'Temp Change (°C)', angle: 90, position: 'insideRight', fill: '#f59e0b', style: {fontSize: 10} }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                      <Area yAxisId="left" type="monotone" dataKey="total_emission" fill="#10b981" stroke="#10b981" fillOpacity={0.15} name="Total Emissions" />
                      <Line yAxisId="right" type="monotone" dataKey="temperature_change" stroke="#f59e0b" strokeWidth={2} name="Temp Change" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Sources breakdown */}
                <div className="lg:col-span-4 flex flex-col justify-between">
                  <h4 className="text-slate-300 font-bold text-sm mb-4">Emissions Breakdown ({foodSummary.latest_year})</h4>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {Object.entries(foodSummary.breakdown)
                      .filter(([_, val]) => val > 0)
                      .sort(([_, a], [__, b]) => b - a)
                      .map(([key, value]) => {
                        const pct = (value / foodSummary.total_emission_kt * 100).toFixed(1);
                        return (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium truncate">{key}</span>
                              <span className="text-slate-200 font-bold">{value.toLocaleString()} kt ({pct}%)</span>
                            </div>
                            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* --- Tab 2: Vehicle Database --- */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left panel: List search */}
          <div className="lg:col-span-7 backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white">Vehicle Database</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search model/fuel..."
                  value={vehicleQuery}
                  onChange={(e) => setVehicleQuery(e.target.value)}
                  className="bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-1.5 pl-8 pr-3 text-white text-xs outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[400px] pr-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase font-semibold">
                    <th className="py-2">Vehicle</th>
                    <th className="py-2">Fuel Type</th>
                    <th className="py-2 text-right">CO₂ (g/km)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm">
                  {filteredVehicles.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/20 text-slate-300">
                      <td className="py-2.5 font-medium">{v.brand} {v.model} <span className="text-xs text-slate-500 font-normal">({v.year})</span></td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          v.is_ev ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          v.is_hybrid || v.is_phev ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          'bg-slate-850 text-slate-400'
                        }`}>
                          {v.fuel_type}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-200">{v.co2_emissions_gkm} g/km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right panel: averages comparison */}
          <div className="lg:col-span-5 backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between">
            <h4 className="text-slate-300 font-bold text-sm mb-4">Average Emissions by Fuel Type</h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getFuelAveragesData()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} />
                  <YAxis type="category" dataKey="fuel" stroke="#94a3b8" fontSize={10} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                  <Bar dataKey="co2" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {getFuelAveragesData().map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fuel.toLowerCase().includes('electric') ? '#10b981' : entry.fuel.toLowerCase().includes('hybrid') ? '#06b6d4' : '#ef4444'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              * Fully Electric Vehicles show 0 g/km tailspipe emissions. Power grid grid-mix emissions are estimated separately in the personal logger dashboard.
            </p>
          </div>
        </div>
      )}

      {/* --- Tab 3: Country Benchmark --- */}
      {activeTab === 'countries' && (
        <div className="space-y-8">
          <div className="backdrop-blur-md bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-white">Global Carbon Benchmark</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Compare countries per capita carbon footprint to understand regional and global targets.
                </p>
              </div>
              <div className="w-64">
                <select
                  value={selectedBenchmarkCountry}
                  onChange={(e) => setSelectedBenchmarkCountry(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-emerald-500 rounded-xl py-2 px-3 text-white text-sm outline-none"
                >
                  {benchmarkCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {benchmarkSummary && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Stats cards */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
                    <span className="text-xs text-slate-500">Per Capita Emissions</span>
                    <div className="text-2xl font-black text-white mt-1">
                      {benchmarkSummary.per_capita_tons} <span className="text-sm font-normal text-slate-400">Tons / year</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
                    <span className="text-xs text-slate-500">Total Yearly Output</span>
                    <div className="text-2xl font-black text-white mt-1">
                      {benchmarkSummary.kilotons_co2.toLocaleString()} <span className="text-sm font-normal text-slate-400">kt CO₂</span>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
                    <span className="text-xs text-slate-500">Geographic Region</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {benchmarkSummary.region}
                    </div>
                  </div>
                </div>

                {/* Regional comparisons */}
                <div className="lg:col-span-8">
                  <h4 className="text-slate-300 font-bold text-sm mb-4">Regional Average Per Capita (Tons / year)</h4>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Object.entries(benchmarkSummary.region_averages).map(([region, val]) => ({ region, val }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="region" stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }} />
                        <Bar dataKey="val" fill="#10b981" radius={[4, 4, 0, 0]}>
                          {Object.entries(benchmarkSummary.region_averages).map(([region, val], index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={region.toLowerCase() === benchmarkSummary.region.toLowerCase() ? '#f59e0b' : '#10b981'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
