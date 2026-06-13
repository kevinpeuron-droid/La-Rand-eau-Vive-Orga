import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function TodoListView() {
  const { events, updateEvent, volunteers, updateVolunteer } = useData();
  const [activeTab, setActiveTab] = useState<'TODOS' | 'SUPPLIES'>('TODOS');
  const [archivingForVolId, setArchivingForVolId] = useState<string | null>(null);

  const toggleTask = async (eventId: string, catIndex: number, taskId: string) => {
    const evt = events.find(e => e.id === eventId);
    if (!evt || !evt.categories) return;

    const newCats = [...evt.categories];
    const cat = newCats[catIndex];
    if (!cat.tasks) return;

    const taskIndex = cat.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    cat.tasks[taskIndex].completed = !cat.tasks[taskIndex].completed;
    await updateEvent(evt.id, { categories: newCats });
  };

  const handleArchiveSupplies = async (volunteerId: string, eventId: string) => {
    const vol = volunteers.find(v => v.id === volunteerId);
    const evt = events.find(e => e.id === eventId);
    if (!vol || !evt || !vol.equipmentNeeds) return;

    const newSupply = {
      id: crypto.randomUUID(),
      role: vol.lastRole || 'Poste non défini',
      volunteerName: `${vol.firstName} ${vol.lastName}`,
      text: vol.equipmentNeeds,
      date: new Date().toISOString()
    };

    const updatedSupplies = [...(evt.archivedSupplies || []), newSupply];
    
    // Update event
    await updateEvent(eventId, { archivedSupplies: updatedSupplies });
    
    // Clear volunteer needs
    await updateVolunteer(volunteerId, { equipmentNeeds: '' });
    
    setArchivingForVolId(null);
  };

  const equipementVols = volunteers.filter(v => (v.isReferent || v.isOrganizer) && v.equipmentNeeds && v.equipmentNeeds.trim().length > 0);

  return (
    <div className="flex flex-col h-full gap-6 w-full">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">✅ To-Do List (TdL)</h1>
          <p className="text-slate-400">Suivi des tâches et gestion du matériel.</p>
        </div>
        <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
           <button 
              onClick={() => setActiveTab('TODOS')} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'TODOS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
           >
              📝 Tâches
           </button>
           <button 
              onClick={() => setActiveTab('SUPPLIES')} 
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'SUPPLIES' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
           >
              📦 Fournitures et Matériel
           </button>
        </div>
      </header>

      <div className="space-y-8">
        {activeTab === 'SUPPLIES' && (
           <div className="space-y-8 animate-in fade-in duration-300">
             <div className="bg-amber-500/5 backdrop-blur-xl border border-amber-500/20 p-6 rounded-3xl shadow-xl">
               <h2 className="text-2xl font-bold text-amber-400 mb-6 flex items-center gap-2">
                  🛒 Besoins Actifs (En cours)
               </h2>
               {equipementVols.length === 0 ? (
                 <p className="text-amber-500/50 italic p-4 bg-black/20 rounded-xl">Aucun besoin matériel signalé par les référents/organisateurs.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {equipementVols.map((v) => (
                       <div key={v.id} className="bg-black/40 border border-amber-500/10 rounded-2xl p-5 flex flex-col gap-4">
                          <div className="flex flex-col gap-1">
                             <h3 className="text-lg font-bold text-amber-200">{v.lastRole || 'Poste non défini'}</h3>
                             <p className="text-xs text-amber-500/70">Responsable : {v.firstName} {v.lastName}</p>
                          </div>
                          <div className="bg-white/5 border border-white/5 p-4 rounded-xl text-sm text-slate-300 whitespace-pre-wrap flex-1">
                             {v.equipmentNeeds}
                          </div>
                          
                          <div className="mt-2 pt-4 border-t border-white/5 relative">
                             {archivingForVolId === v.id ? (
                                <div className="space-y-2">
                                   <label className="text-xs text-slate-400 block">Choisir l'événement pour archiver :</label>
                                   <div className="flex gap-2">
                                     <select id={`archive-select-${v.id}`} className="flex-1 bg-black/50 border border-white/10 rounded-lg text-sm text-white p-2 outline-none">
                                        <option value="">-- Événement --</option>
                                        {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                     </select>
                                     <button 
                                        onClick={() => {
                                          const sel = document.getElementById(`archive-select-${v.id}`) as HTMLSelectElement;
                                          if(sel.value) handleArchiveSupplies(v.id, sel.value);
                                        }}
                                        className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                     >Go</button>
                                     <button onClick={() => setArchivingForVolId(null)} className="bg-white/10 hover:bg-white/20 text-white px-2 py-2 rounded-lg text-xs transition-colors">✕</button>
                                   </div>
                                </div>
                             ) : (
                                <button 
                                   onClick={() => setArchivingForVolId(v.id)}
                                   className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                                >
                                   📦 Archiver pour un événement...
                                </button>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
               )}
             </div>

             <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
               <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  🗄️ Archives par Événement
               </h2>
               {events.length === 0 || events.every(e => !e.archivedSupplies || e.archivedSupplies.length === 0) ? (
                 <p className="text-slate-500 italic p-4 bg-black/20 rounded-xl">Aucune archive de matériel.</p>
               ) : (
                 <div className="space-y-6">
                    {events.filter(e => e.archivedSupplies && e.archivedSupplies.length > 0).map(evt => (
                       <div key={evt.id} className="border border-white/10 rounded-2xl overflow-hidden">
                          <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/10">
                             <h3 className="text-lg font-bold text-indigo-300">{evt.name}</h3>
                             <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">{evt.archivedSupplies?.length} listes</span>
                          </div>
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {evt.archivedSupplies?.map(supply => (
                                <div key={supply.id} className="bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col gap-2">
                                   <div className="flex justify-between items-start">
                                      <p className="text-sm font-bold text-slate-200">{supply.role}</p>
                                      <p className="text-[10px] text-slate-500">{new Date(supply.date).toLocaleDateString()}</p>
                                   </div>
                                   <p className="text-xs text-slate-500">Par {supply.volunteerName}</p>
                                   <div className="mt-2 text-sm text-slate-400 whitespace-pre-wrap">
                                      {supply.text}
                                   </div>
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
               )}
             </div>
           </div>
        )}

        {activeTab === 'TODOS' && events.length === 0 && (
          <p className="text-slate-500 italic text-center p-8 bg-white/5 rounded-2xl border border-white/10">
            Aucun événement pour le moment.
          </p>
        )}
        
        {activeTab === 'TODOS' && events.map((evt) => {
          const hasTasks = evt.categories?.some(c => c.tasks && c.tasks.length > 0);
          if (!hasTasks) return null;

          return (
            <div key={evt.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-indigo-300 mb-6 flex items-center gap-2">
                {evt.priority && <span>⭐</span>}
                {evt.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(evt.categories || []).map((cat, ci) => {
                  if (!cat.tasks || cat.tasks.length === 0) return null;
                  
                  const completedCount = cat.tasks.filter(t => t.completed).length;
                  const progress = Math.round((completedCount / cat.tasks.length) * 100);

                  return (
                    <div key={ci} className="bg-black/20 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
                      <div className="flex justify-between items-center -mb-2">
                        <h3 className="text-lg font-bold text-slate-200">📁 {cat.name}</h3>
                        <span className={`text-xs font-mono px-2 py-1 rounded-md ${progress === 100 ? 'bg-teal-500/20 text-teal-300' : 'bg-white/10 text-slate-400'}`}>
                          {completedCount}/{cat.tasks.length} ({progress}%)
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${progress === 100 ? 'bg-teal-500' : 'bg-indigo-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="space-y-2 mt-2">
                        {cat.tasks.map((task) => (
                          <div 
                            key={task.id}
                            className={`flex justify-between items-center bg-white/5 border p-3 rounded-xl transition-all cursor-pointer hover:bg-white/10 ${task.completed ? 'border-teal-500/30' : 'border-white/5'}`}
                            onClick={() => toggleTask(evt.id, ci, task.id)}
                          >
                            <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                              {task.title}
                            </span>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-teal-500/20 border-teal-500 text-teal-400' : 'border-slate-500'}`}>
                              {task.completed && <span>✓</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {activeTab === 'TODOS' && events.every(evt => !evt.categories?.some(c => c.tasks && c.tasks.length > 0)) && events.length > 0 && (
          <p className="text-slate-500 italic text-center p-8 bg-white/5 rounded-2xl border border-white/10">
            Aucune tâche n'a été ajoutée dans les catégories.
          </p>
        )}
      </div>
    </div>
  );
}
