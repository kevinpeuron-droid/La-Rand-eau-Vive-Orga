import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './contexts/DataContext';
import Dashboard from './components/Dashboard';
import VolunteersView from './components/VolunteersView';
import EventsAndPlanningView from './components/EventsAndPlanningView';
import MapView from './components/MapView';
import PublicCategoryView from './components/PublicCategoryView';
import PublicVolunteerView from './components/PublicVolunteerView';

import TodoListView from './components/TodoListView';

function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('admin_auth') === 'true');
  const [password, setPassword] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans relative">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        </div>
        <div className="z-10 bg-white/5 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mx-auto mb-6">
            <span className="font-bold text-white text-3xl">R</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Espace Orga</h1>
          <p className="text-slate-400 text-sm mb-6">Logiciel principal d'administration</p>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mot de passe d'accès" 
            className="w-full p-3 border border-white/10 rounded-xl bg-black/40 text-white focus:border-indigo-500 outline-none transition-colors mb-4 text-center font-medium"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (password === 'RV26') {
                  localStorage.setItem('admin_auth', 'true');
                  setIsAuthenticated(true);
                } else {
                  alert('Mot de passe incorrect');
                }
              }
            }}
          />
          <button 
            onClick={() => {
                if (password === 'RV26') {
                  localStorage.setItem('admin_auth', 'true');
                  setIsAuthenticated(true);
                } else {
                  alert('Mot de passe incorrect');
                }
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/20"
          >
            Déverrouiller
          </button>
        </div>
      </div>
    );
  }

  return <Layout>{children}</Layout>;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { syncing, loading } = useData();
  const isSyncing = syncing || loading;

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
                <span className="font-bold text-white text-xl">R</span>
              </div>
              <div className="flex items-end gap-3">
                <div>
                  <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 m-0">Rand'eau Vive</h1>
                  <p className="text-xs text-slate-400">Gestionnaire de Bénévoles</p>
                </div>
                {isSyncing ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] uppercase font-bold tracking-wider rounded-full ml-2 mb-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Synchronisation...
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[10px] uppercase font-bold tracking-wider rounded-full ml-2 mb-1 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    À jour
                  </div>
                )}
              </div>
            </div>
            
            <nav className="flex flex-wrap gap-2">
          <NavLink to="/" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/volunteers" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            👥 Bénévoles
          </NavLink>
          <NavLink to="/events-planning" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            📅 Événements & Planning
          </NavLink>
          <NavLink to="/map" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            🗺️ Carte
          </NavLink>
          <NavLink to="/todos" className={({isActive}) => `px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
            ✅ TdL
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
        <Routes>
          <Route path="/p/:eventId" element={<PublicVolunteerView />} />
          <Route path="/share/event/:eventId/category/:categoryName" element={<PublicCategoryView />} />
          <Route path="*" element={
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/volunteers" element={<VolunteersView />} />
                <Route path="/events-planning" element={<EventsAndPlanningView />} />
                <Route path="/map" element={<MapView />} />
                <Route path="/todos" element={<TodoListView />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AdminLayout>
          } />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}

