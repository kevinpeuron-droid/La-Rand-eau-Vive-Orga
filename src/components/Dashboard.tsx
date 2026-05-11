import { useData } from '../contexts/DataContext';

export default function Dashboard() {
  const { volunteers, events, children, loading } = useData();

  if (loading) return <div className="text-gray-500 text-center py-10">Chargement des données...</div>;

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
  const childColor = childPct >= 75 ? '#27ae60' : childPct >= 40 ? '#e67e22' : '#e74c3c';
  
  const priorityEvent = events.find(e => e.priority);
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* priority banner placeholder (simplified) */}
      {priorityEvent && (
        <div className="bg-gradient-to-br from-[#fff3cd] to-[#ffeaa7] border-l-4 border-[#f39c12] p-4 rounded-lg shadow flex items-start gap-3">
          <span className="text-2xl mt-1">⚠️</span>
          <div>
            <strong className="text-gray-800 text-lg">⭐ {priorityEvent.name}</strong> 
            <span className="text-[#e67e22] ml-2 font-semibold">Prioritaire</span>
            <p className="text-gray-700 mt-1 text-sm">Vérifiez le planning pour vous assurer que tous les postes sont pourvus.</p>
          </div>
        </div>
      )}

      {/* Children Banner */}
      {children.length > 0 && (
        <div className={`bg-gradient-to-br from-[#eaf6ff] to-[#d6eeff] border-l-4 shadow p-4 rounded-lg flex items-center justify-between gap-4`} style={{ borderColor: childColor }}>
          <div className="flex items-center gap-4 flex-1">
            <span className="text-2xl">🧒</span>
            <div>
              <strong className="text-gray-800">{childPct}% d'élèves représentés</strong>
              <div className="h-1.5 w-48 bg-[#dde] rounded-full mt-1.5 mb-1 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${childPct}%`, backgroundColor: childColor }}></div>
              </div>
              <span className="text-xs text-gray-600">
                {childPct === 100 ? 'Tous les élèves sont représentés ! 🎉' : 
                 childPct === 0 ? 'Aucun élève n\'a encore de bénévole associé.' : 
                 `${representedChildren} élève${representedChildren>1?'s':''} sur ${children.length} ${representedChildren>1?'sont':'est'} représenté${representedChildren>1?'s':''}.`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">📊 Vue d'ensemble</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-8 rounded-2xl text-center shadow-lg">
            <h2 className="text-5xl font-bold mb-2">{volunteers.length}</h2>
            <p className="text-lg opacity-90">Bénévoles</p>
          </div>
          <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-8 rounded-2xl text-center shadow-lg">
            <h2 className="text-5xl font-bold mb-2">{events.length}</h2>
            <p className="text-lg opacity-90">Événements</p>
          </div>
          <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-8 rounded-2xl text-center shadow-lg">
            <h2 className="text-5xl font-bold mb-2">{totalCategories}</h2>
            <p className="text-lg opacity-90">Catégories</p>
          </div>
          <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white p-8 rounded-2xl text-center shadow-lg">
            <h2 className="text-5xl font-bold mb-2">{totalPositions}</h2>
            <p className="text-lg opacity-90">Postes</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 mt-10">📅 Événements récents</h3>
        <div className="space-y-4">
          {events.length === 0 ? (
            <p className="text-gray-500 italic">Aucun événement</p>
          ) : (
             events.slice().reverse().slice(0, 5).map(e => (
              <div key={e.id} className={`bg-gray-50 p-5 rounded-xl border-l-4 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all ${e.priority ? 'border-[#f39c12] bg-[#fffbf0]' : 'border-[#667eea]'}`}>
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className={`font-bold text-lg mb-1 ${e.priority ? 'text-[#f39c12]' : 'text-[#667eea]'}`}>
                      {e.priority ? '⭐ ' : ''}{e.name}
                    </h3>
                    <p className="text-gray-600 text-sm">📋 {(e.categories || []).length} catégories • 👥 {(e.availableVolunteers || []).length} disponibles</p>
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
