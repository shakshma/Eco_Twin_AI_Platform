import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import Simulator from './components/Simulator';
import Recommendations from './components/Recommendations';
import Analytics from './components/Analytics';
import Roadmap from './components/Roadmap';
import { Leaf, LayoutDashboard, Shuffle, Sparkles, BarChart2, LogOut, Menu, X, Compass } from 'lucide-react';

function AppContent() {
  const { user, token, logout, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="w-12 h-12 text-emerald-400 animate-spin" />
          <span className="text-sm font-semibold tracking-wider">Syncing EcoTwin AI...</span>
        </div>
      </div>
    );
  }

  // Require login
  if (!token || !user) {
    return <Auth />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'simulator', label: 'Reduction Simulator', icon: Shuffle },
    { id: 'roadmap', label: 'AI Roadmap', icon: Compass },
    { id: 'recommendations', label: 'Recommendations', icon: Sparkles },
    { id: 'analytics', label: 'Global Analytics', icon: BarChart2 }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'simulator':
        return <Simulator />;
      case 'roadmap':
        return <Roadmap />;
      case 'recommendations':
        return <Recommendations />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/40 border-r border-slate-800/80 backdrop-blur-xl p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">EcoTwin AI</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/80">Twin Your Footprint</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5" aria-label="Main Navigation">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 text-sm font-semibold rounded-2xl border transition-all ${
                    active 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-950/20' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-emerald-400' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile section */}
        <div className="pt-6 border-t border-slate-800/80 flex items-center justify-between gap-3">
          <div className="truncate">
            <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Active Twin</div>
            <div className="text-sm font-bold text-white truncate">{user.full_name || user.email}</div>
          </div>
          <button
            onClick={logout}
            aria-label="Log out of session"
            className="w-10 h-10 bg-slate-950/60 border border-slate-850 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 rounded-xl flex items-center justify-center text-slate-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Menu & Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900/40 border-b border-slate-800/80 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <Leaf className="w-6 h-6 text-emerald-400" />
            <h1 className="font-extrabold text-base text-white">EcoTwin AI</h1>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-10 h-10 rounded-xl border border-slate-800 flex items-center justify-center text-slate-350"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden bg-slate-900/90 border-b border-slate-800/80 p-4 space-y-2 absolute top-16 left-0 right-0 z-50 backdrop-blur-xl">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-semibold rounded-2xl border ${
                    active 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-400' 
                      : 'border-transparent text-slate-400 hover:bg-slate-950/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-sm font-semibold rounded-2xl border border-transparent text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </nav>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto" id="main-content">
          {renderContent()}
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
