import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';

export default function IdeasView() {
  const { volunteers, updateVolunteer } = useData();
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">💡 Boîte à idées</h1>
          <p className="text-slate-400">Recensement des idées et commentaires laissés par les bénévoles.</p>
        </div>
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
      </header>

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
            <div key={v.id} className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between hover:bg-white/10 transition-colors">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
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

              <div className="flex justify-end pt-4 border-t border-white/10">
                <button 
                  onClick={() => clearIdea(v.id)}
                  className="text-xs bg-rose-500/20 text-rose-300 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-medium transition-colors border border-rose-500/30 hover:border-transparent flex items-center gap-1.5"
                >
                  ✓ Marquer traitée
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
