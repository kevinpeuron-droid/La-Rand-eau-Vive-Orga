import { useData } from '../contexts/DataContext';

export default function Dashboard() {
  const { volunteers, events } = useData();

  let totalCategories = 0;
  let totalPositions = 0;
  
  events.forEach(e => {
    totalCategories += (e.categories || []).length;
    (e.categories || []).forEach(c => totalPositions += (c.positions || []).length);
  });
  
  const incompleteEvents = events.map(e => {
    let requiredSlots = 0;
    let filledSlots = 0;
    const missingDetails: string[] = [];
    (e.categories || []).forEach(c => {
       (c.positions || []).forEach(p => {
         (p.timeSlots || []).forEach(ts => {
           requiredSlots++;
           if (ts.volunteer && ts.volunteer.length > 0) {
             filledSlots++;
           } else {
             missingDetails.push(`${c.name} > ${p.name} (${ts.timeSlot})`);
           }
         })
       })
    });
    return { ...e, requiredSlots, filledSlots, missing: requiredSlots - filledSlots, missingDetails };
  }).filter(e => e.missing > 0);
  
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

      {/* Incomplete events banner */}
      {incompleteEvents.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/20 shadow p-5 rounded-2xl">
          <h3 className="text-rose-400 text-lg font-bold mb-3 flex items-center gap-2">
            <span>🚨</span> Action requise : Postes non pourvus
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {incompleteEvents.map(evt => (
              <div key={evt.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-rose-200">{evt.name}</h4>
                  <span className="bg-rose-500 text-white rounded-md px-2 py-0.5 text-xs font-bold shadow-sm">{evt.missing} manquants</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden flex">
                  <div className="bg-teal-500 h-1.5" style={{ width: `${(evt.filledSlots / evt.requiredSlots) * 100}%` }}></div>
                </div>
                <ul className="text-xs text-slate-300 space-y-1 mt-3 px-1 custom-scrollbar max-h-24 overflow-y-auto">
                  {evt.missingDetails.slice(0, 5).map((d, i) => (
                    <li key={i} className="whitespace-nowrap overflow-hidden text-ellipsis">- {d}</li>
                  ))}
                  {evt.missingDetails.length > 5 && (
                    <li className="text-rose-400 italic mt-1 font-medium">+ {evt.missingDetails.length - 5} autres...</li>
                  )}
                </ul>
              </div>
            ))}
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

      {/* Liens discrets */}
      <div className="mt-16 flex justify-end gap-2 opacity-5 hover:opacity-100 transition-opacity duration-500">
        <a href="https://budget-rv.vercel.app/" target="_blank" rel="noreferrer" title="Budget RV" className="grayscale hover:grayscale-0 transition-all cursor-pointer">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 border border-white/10 text-sm">🪙</div>
        </a>
        <a href="#" target="_blank" rel="noreferrer" title="Autre lien (à modifier)" className="grayscale hover:grayscale-0 transition-all cursor-pointer">
          <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-black/40 border border-white/10 text-sm">🔗</div>
        </a>
      </div>
    </div>
  );
}
