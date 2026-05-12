import { useData } from '../contexts/DataContext';

export default function Dashboard() {
  const { volunteers, events, children } = useData();

  let totalCategories = 0;
  let totalPositions = 0;
  
  events.forEach(e => {
    totalCategories += (e.categories || []).length;
    (e.categories || []).forEach(c => totalPositions += (c.positions || []).length);
  });

  const getVolChildIds = (v: any) => Array.isArray(v.childIds) ? v.childIds : (v.childId ? [String(v.childId)] : []);
  
  // Stats for children
  const assignedChildIds = new Set(volunteers.flatMap(v => getVolChildIds(v)));
  const representedChildren = children.filter(c => assignedChildIds.has(String(c.id))).length;
  const childPct = children.length > 0 ? Math.round(representedChildren / children.length * 100) : 0;
  const childColor = childPct >= 75 ? '#34d399' : childPct >= 40 ? '#fbbf24' : '#fb7185';
  
  const priorityEvent = events.find(e => e.priority);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* priority banner placeholder (simplified) */}
      {priorityEvent && (
        <div className="bg-amber-500/10 border border-amber-500/20 border-l-[4px] border-l-amber-500 p-5 rounded-2xl shadow flex items-start gap-3">
          <span className="text-2xl mt-1">⚠️</span>
          <div>
            <strong className="text-amber-400 text-lg">⭐ {priorityEvent.name}</strong> 
            <span className="text-amber-500 ml-2 font-semibold">Prioritaire</span>
            <p className="text-amber-200/70 mt-1 text-sm">Vérifiez le planning pour vous assurer que tous les postes sont pourvus.</p>
          </div>
        </div>
      )}

      {/* Children Banner */}
      {children.length > 0 && (
        <div className={`bg-white/5 backdrop-blur-lg border border-white/10 border-l-[4px] shadow p-5 rounded-2xl flex items-center justify-between gap-4`} style={{ borderLeftColor: childColor }}>
          <div className="flex items-center gap-4 flex-1">
            <span className="text-2xl">🧒</span>
            <div>
              <strong className="text-white">{childPct}% d'élèves représentés</strong>
              <div className="h-1.5 w-48 bg-slate-800 rounded-full mt-2 mb-1.5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${childPct}%`, backgroundColor: childColor }}></div>
              </div>
              <span className="text-xs text-slate-400">
                {childPct === 100 ? 'Tous les élèves sont représentés ! 🎉' : 
                 childPct === 0 ? 'Aucun élève n\'a encore de bénévole associé.' : 
                 `${representedChildren} élève${representedChildren>1?'s':''} sur ${children.length} ${representedChildren>1?'sont':'est'} représenté${representedChildren>1?'s':''}.`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">📊 Vue d'ensemble</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 text-white p-8 rounded-3xl text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-indigo-200 mb-2 relative z-10">{volunteers.length}</h2>
            <p className="text-sm font-semibold tracking-wider uppercase text-indigo-300/80 relative z-10">Bénévoles</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 text-white p-8 rounded-3xl text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl -ml-10 -mt-10"></div>
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-teal-400 to-teal-200 mb-2 relative z-10">{events.length}</h2>
            <p className="text-sm font-semibold tracking-wider uppercase text-teal-300/80 relative z-10">Événements</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 text-white p-8 rounded-3xl text-center shadow-lg relative overflow-hidden">
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl -mr-10 -mb-10"></div>
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-amber-400 to-amber-200 mb-2 relative z-10">{totalCategories}</h2>
            <p className="text-sm font-semibold tracking-wider uppercase text-amber-300/80 relative z-10">Catégories</p>
          </div>
          <div className="bg-white/5 backdrop-blur-lg border border-white/10 text-white p-8 rounded-3xl text-center shadow-lg relative overflow-hidden">
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl -ml-10 -mb-10"></div>
            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-rose-400 to-rose-200 mb-2 relative z-10">{totalPositions}</h2>
            <p className="text-sm font-semibold tracking-wider uppercase text-rose-300/80 relative z-10">Postes</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4 mt-6">📅 Événements récents</h3>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-slate-500 italic">Aucun événement</p>
          ) : (
             events.slice().reverse().slice(0, 5).map(e => (
              <div key={e.id} className={`bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 border-l-[4px] shadow-sm hover:bg-white/10 transition-all ${e.priority ? 'border-l-amber-400' : 'border-l-indigo-400'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className={`font-semibold text-lg mb-1 ${e.priority ? 'text-amber-400' : 'text-indigo-400'}`}>
                      {e.priority ? '⭐ ' : ''}{e.name}
                    </h3>
                    <p className="text-slate-400 text-sm">📋 {(e.categories || []).length} catégories • 👥 {(e.availableVolunteers || []).length} disponibles</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
