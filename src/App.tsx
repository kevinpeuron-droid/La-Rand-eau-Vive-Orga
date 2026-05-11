import React from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { DataProvider } from './contexts/DataContext';
import Dashboard from './components/Dashboard';
import VolunteersView from './components/VolunteersView';
import EventsView from './components/EventsView';
import PlanningView from './components/PlanningView';
import ChildrenView from './components/ChildrenView';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans relative overflow-x-hidden flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]"></div>
      </div>
      
      <div className="z-10 flex flex-col min-h-screen w-full">
        <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 px-8 py-4 sticky top-0 z-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-[1500px] mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <span className="font-bold text-white text-xl">V</span>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 m-0">Voluntree</h1>
                <p className="text-xs text-slate-400">Gestionnaire de Bénévoles</p>
              </div>
            </div>
            
            <nav className="flex flex-wrap gap-2">
              <NavLink to="/" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                📊 Dashboard
              </NavLink>
              <NavLink to="/volunteers" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                👥 Bénévoles
              </NavLink>
              <NavLink to="/events" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                📅 Événements
              </NavLink>
              <NavLink to="/planning" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                🗓️ Planning & Pilotage
              </NavLink>
              <NavLink to="/children" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                🧒 Élèves
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="p-8 flex-1 w-full max-w-[1500px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/volunteers" element={<VolunteersView />} />
            <Route path="/events" element={<EventsView />} />
            <Route path="/planning" element={<PlanningView />} />
            <Route path="/children" element={<ChildrenView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </DataProvider>
  );
}

