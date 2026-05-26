import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

export default function PublicCategoryView() {
  const { eventId, categoryName } = useParams();
  const { events, volunteers, loading } = useData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex items-center justify-center">
        <p className="text-slate-400 animate-pulse">Chargement...</p>
      </div>
    );
  }

  const selectedEvent = events.find(e => e.id === eventId);
  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl text-rose-400">Événement introuvable</h1>
        <p className="text-slate-400">Ce lien semble invalide ou l'événement a été supprimé.</p>
      </div>
    );
  }

  const category = selectedEvent.categories?.find(c => c.name.toLowerCase() === decodeURIComponent(categoryName || '').toLowerCase());
  
  if (!category) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl text-rose-400">Catégorie introuvable</h1>
        <p className="text-slate-400">Cette catégorie n'existe pas ou a été supprimée.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans relative overflow-x-hidden flex flex-col p-4 md:p-8">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/10 blur-[120px]"></div>
      </div>
      
      <div className="z-10 w-full max-w-4xl mx-auto flex flex-col h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl">
        <header className="mb-8 border-b border-white/10 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-1">
              📁 {category.name}
            </h1>
            <h2 className="text-lg text-slate-400">
              Événement : <span className="text-slate-300 font-medium">{selectedEvent.name}</span>
            </h2>
          </div>
          <div className="bg-black/30 px-4 py-2 rounded-xl border border-white/5">
            <p className="text-slate-300 text-sm">
              <strong className="text-white text-lg">{category.positions.length}</strong> postes
            </p>
          </div>
        </header>

        {category.referentId && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <h3 className="text-rose-300 font-semibold text-sm">Référent de catégorie</h3>
              <p className="text-white text-lg font-bold">
                {(() => {
                  const ref = volunteers.find(v => v.id === category.referentId);
                  return ref ? `${ref.firstName} ${ref.lastName}` + (ref.phone ? ` - ${ref.phone}` : '') : 'Inconnu';
                })()}
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-6">
          {category.positions.length === 0 && (
            <p className="text-center py-10 text-slate-500 italic">Aucun poste défini pour cette catégorie.</p>
          )}

          {category.positions.map((pos, pi) => (
            <div key={pi} className="bg-black/20 border border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col md:flex-row gap-4 md:items-center">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-indigo-300">{pos.name}</h3>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {pos.responsableId && (() => {
                    const resp = volunteers.find(v => v.id === pos.responsableId);
                    return resp ? (
                      <div className="flex gap-2 items-center bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                        <span>⭐</span>
                        <span className="text-xs text-amber-200">
                          Responsable : <strong>{resp.firstName} {resp.lastName}</strong>
                          {resp.phone && <span className="ml-1 opacity-75">({resp.phone})</span>}
                        </span>
                      </div>
                    ) : null;
                  })()}
                  {pos.details && (
                    <div className="flex gap-2 items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      <span>📝</span>
                      <span className="text-xs text-slate-300">{pos.details}</span>
                    </div>
                  )}
                  {pos.equipment && (
                    <div className="flex gap-2 items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                      <span>🦺</span>
                      <span className="text-xs text-slate-300">{pos.equipment}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2 space-y-2">
                {pos.timeSlots.length === 0 && (
                  <p className="text-xs text-slate-500 italic p-3">Aucun créneau affecté.</p>
                )}
                {pos.timeSlots.map((slot, si) => (
                  <div key={si} className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex gap-2 items-center min-w-[200px]">
                      <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-xs font-medium border border-white/10 min-w-[80px] text-center">
                        {slot.day || 'Jour non défini'}
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-md text-xs font-mono border border-white/10 w-full sm:w-auto text-center">
                         {slot.timeSlot || 'Horaire non défini'}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-wrap gap-2">
                      {Array.isArray(slot.volunteer) && slot.volunteer.length > 0 ? (
                         slot.volunteer.map(vid => {
                           const v = volunteers.find(x => x.id === vid);
                           return v ? (
                             <div key={vid} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs px-3 py-1.5 rounded-md flex flex-col gap-1 shadow-sm">
                               <span className="font-semibold">{v.firstName} {v.lastName}</span>
                               <span className="text-[10px] opacity-80 flex flex-wrap gap-2">
                                 {v.phone && <span>📞 {v.phone}</span>}
                                 {v.email && <span>📧 {v.email}</span>}
                                 {v.group && <span>👥 {v.group}</span>}
                               </span>
                             </div>
                           ) : <span key={vid} className="text-xs text-slate-500 italic">Bénévole supprimé</span>;
                         })
                      ) : (
                         <span className="text-xs text-amber-500/70 italic px-2 py-1 bg-amber-500/10 rounded border border-amber-500/20">Créneau vide</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
