import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { ArchivedIdea } from '../types';

export default function IdeasView() {
  const { volunteers, events, updateVolunteer, updateEvent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [archiveEventId, setArchiveEventId] = useState<string>('');

  // Only get volunteers that have ideas/comments
  const volunteersWithIdeas = volunteers.filter(v => v.ideas && v.ideas.trim().length > 0);
  
  const filteredIdeas = volunteersWithIdeas.filter(v => 
    v.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.ideas?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearIdea = async (id: string) => {
    if (confirm("Marquer cette idée comme traitée / la supprimer ?")) {
      await updateVolunteer(id, { ideas: '' });
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedIds([]);
    setArchiveEventId('');
  };

  const selectAll = () => {
    if (selectedIds.length === filteredIdeas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredIdeas.map(v => v.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const archiveSelected = async () => {
    if (selectedIds.length === 0) return alert("Veuillez sélectionner des idées à archiver.");
    if (!archiveEventId) return alert("Veuillez choisir un événement pour l'archivage.");
    
    if (confirm(`Archiver ${selectedIds.length} idée(s) dans cet événement ?`)) {
      const trgEvent = events.find(e => e.id === archiveEventId);
      if (!trgEvent) return;

      const newArchivedIdeas: ArchivedIdea[] = [...(trgEvent.archivedIdeas || [])];

      for (const id of selectedIds) {
        const vol = volunteers.find(v => v.id === id);
        if (vol && vol.ideas) {
          newArchivedIdeas.push({
             volunteerId: vol.id,
             volunteerName: `${vol.firstName} ${vol.lastName}`,
             text: vol.ideas
          });
          await updateVolunteer(vol.id, { ideas: '' });
        }
      }

      await updateEvent(archiveEventId, { archivedIdeas: newArchivedIdeas });
      setIsSelectionMode(false);
      setSelectedIds([]);
      setArchiveEventId('');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">💡 Boîte à idées</h1>
          <p className="text-slate-400">Recensement des idées et commentaires laissés par les bénévoles.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            <span className="pl-3 py-2 text-slate-400">🔍</span>
            <input 
              type="text" 
              placeholder="Rechercher une idée..." 
              className="bg-transparent border-none text-white px-3 py-2 w-full md:w-64 focus:outline-none placeholder-slate-500 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {volunteersWithIdeas.length > 0 && (
             <button 
               onClick={toggleSelectionMode}
               className={`text-sm px-4 py-2 rounded-xl font-medium transition-colors border ${isSelectionMode ? 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-500' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
             >
               {isSelectionMode ? 'Annuler la sélection' : 'Archiver des idées'}
             </button>
          )}
        </div>
      </header>

      {isSelectionMode && (
         <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <button onClick={selectAll} className="text-sm bg-black/20 hover:bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-indigo-300 transition-colors">
                 {selectedIds.length === filteredIdeas.length ? 'Tout désélectionner' : 'Tout sélectionner'}
               </button>
               <span className="text-sm text-indigo-200 font-medium">{selectedIds.length} sélectionnée(s)</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
               <select 
                 value={archiveEventId} 
                 onChange={e => setArchiveEventId(e.target.value)}
                 className="bg-black/40 border border-white/10 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-indigo-500 max-w-[200px]"
               >
                 <option value="">Sélectionner un événement</option>
                 {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
               </select>
               <button onClick={archiveSelected} className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-4 py-2 text-sm font-bold shadow-lg transition-colors whitespace-nowrap">
                 Archiver
               </button>
            </div>
         </div>
      )}

      <div className="space-y-6">
        {volunteersWithIdeas.length === 0 && (
          <div className="text-center bg-white/5 border border-white/10 rounded-2xl p-12">
            <span className="text-4xl block mb-4">📭</span>
            <p className="text-slate-300 text-lg">La boîte à idées est vide.</p>
            <p className="text-slate-500 text-sm mt-2">Aucun bénévole n'a encore laissé de commentaire pour le moment.</p>
          </div>
        )}

        {volunteersWithIdeas.length > 0 && filteredIdeas.length === 0 && (
           <p className="text-center text-slate-500 py-10 italic">Aucune idée ne correspond à votre recherche.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIdeas.map(v => (
            <div key={v.id} className={`bg-white/5 backdrop-blur-xl border ${isSelectionMode && selectedIds.includes(v.id) ? 'border-indigo-500 outline outline-2 outline-indigo-500/50' : 'border-white/10'} p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:bg-white/10 transition-all ${isSelectionMode ? 'cursor-pointer' : ''}`} onClick={() => isSelectionMode && toggleSelect(v.id)}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {isSelectionMode && (
                        <div className={`w-5 h-5 rounded overflow-hidden flex items-center justify-center shrink-0 border ${selectedIds.includes(v.id) ? 'bg-indigo-500 border-indigo-500' : 'bg-black/20 border-white/20'}`}>
                          {selectedIds.includes(v.id) && <span className="text-white text-xs leading-none">✓</span>}
                        </div>
                    )}
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      👤 {v.firstName} {v.lastName}
                    </h3>
                  </div>
                  {(v.isOrganizer || v.isReferent) && (
                     <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm mt-1 inline-block ${v.isOrganizer ? 'bg-amber-400/20 text-amber-400' : 'bg-rose-400/20 text-rose-400'}`}>
                        {v.isOrganizer ? 'ORGA' : 'RÉF'}
                      </span>
                  )}
                </div>
                
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6">
                  <p className="text-indigo-100 text-sm whitespace-pre-wrap leading-relaxed">
                    "{v.ideas}"
                  </p>
                </div>
              </div>

              {!isSelectionMode && (
                 <div className="flex justify-end pt-4 border-t border-white/10">
                   <button 
                     onClick={(e) => { e.stopPropagation(); clearIdea(v.id); }}
                     className="text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors border border-rose-500/30 hover:border-transparent flex items-center gap-1.5"
                   >
                     ✓ Marquer traitée
                   </button>
                 </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
