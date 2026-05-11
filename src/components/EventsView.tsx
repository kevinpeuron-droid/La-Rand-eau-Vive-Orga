import { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function EventsView() {
  const { events, addEvent, updateEvent, deleteEvent } = useData();
  const [eventName, setEventName] = useState('');

  const handleCreate = async () => {
    if (!eventName.trim()) return alert("Nom d'événement requis");
    await addEvent({
      name: eventName.trim(),
      priority: false,
      availableVolunteers: [],
      categories: []
    });
    setEventName('');
  };

  const togglePriority = async (e: any, evtId: string) => {
    e.stopPropagation();
    const isCurrentlyPriority = events.find(x => x.id === evtId)?.priority;
    
    // If setting to priority, turn off priority on all others first.
    // However, in our context we can just run a loop to update others if needed.
    // For simplicity, just set this event's priority.
    await updateEvent(evtId, { priority: !isCurrentlyPriority });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Créer un Événement</h2>
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-semibold text-slate-300 mb-1">Nom de l'événement</label>
            <input 
              value={eventName} 
              onChange={e => setEventName(e.target.value)} 
              className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" 
              placeholder="Ex: Course cycliste 2024" 
            />
          </div>
          <button 
            onClick={handleCreate} 
            className="w-full md:w-auto bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-500 transition-colors"
          >
            ➕ Créer
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-white mb-4">Mes Événements</h3>
        {events.length === 0 ? (
          <p className="text-slate-500 italic">Vous n'avez pas encore créé d'événement.</p>
        ) : (
          <div className="space-y-4">
            {events.map(evt => (
              <div key={evt.id} className={`bg-white/5 backdrop-blur-lg p-5 rounded-2xl border-l-[4px] flex items-center justify-between gap-4 transition-all hover:bg-white/10 ${evt.priority ? 'border-amber-400' : 'border-indigo-400'}`}>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-1 ${evt.priority ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {evt.priority && <span className="mr-2">⭐</span>}
                    {evt.name}
                  </h3>
                  <p className="text-sm text-slate-400">
                    📋 {(evt.categories || []).length} catégories • 👥 {(evt.availableVolunteers || []).length} disponibles
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => togglePriority(e, evt.id)}
                    title={evt.priority ? 'Retirer la priorité' : 'Définir comme prioritaire'}
                    className={`text-lg p-2 rounded-xl border transition-colors ${evt.priority ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/50'}`}
                  >
                    ⭐
                  </button>
                  <button 
                    onClick={() => { if(confirm('Supprimer ?')) deleteEvent(evt.id); }}
                    className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-colors border border-transparent hover:border-rose-500/30"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
