import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Volunteer } from '../types';

export default function PublicVolunteerView() {
  const { eventId } = useParams();
  const { events, volunteers, loading } = useData();
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');

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
        <p className="text-slate-400">L'événement a été supprimé ou le lien est invalide.</p>
      </div>
    );
  }

  // Find all assignments for the currently selected volunteer
  const assignments: {
    categoryName: string;
    categoryReferentId?: string;
    positionName: string;
    positionResponsableId?: string;
    details: string;
    equipment: string;
    day: string;
    timeSlot: string;
  }[] = [];

  if (selectedEvent && selectedVolunteerId) {
    selectedEvent.categories?.forEach(cat => {
      cat.positions?.forEach(pos => {
        pos.timeSlots?.forEach(ts => {
          if (Array.isArray(ts.volunteer) && ts.volunteer.includes(selectedVolunteerId)) {
            assignments.push({
              categoryName: cat.name,
              categoryReferentId: cat.referentId,
              positionName: pos.name,
              positionResponsableId: pos.responsableId,
              details: pos.details || '',
              equipment: pos.equipment || '',
              day: ts.day,
              timeSlot: ts.timeSlot
            });
          }
        });
      });
    });
  }

  // Only show volunteers that are assigned to this event
  const assignedVolunteerIds = new Set<string>();
  selectedEvent.categories?.forEach(cat => {
    cat.positions?.forEach(pos => {
      pos.timeSlots?.forEach(ts => {
        if (Array.isArray(ts.volunteer)) {
          ts.volunteer.forEach(vid => assignedVolunteerIds.add(vid));
        }
      });
    });
  });

  const eventVolunteers = volunteers.filter(v => assignedVolunteerIds.has(v.id)).sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
  const organizers = volunteers.filter(v => v.isOrganizer);
  const referents = volunteers.filter(v => v.isReferent && !v.isOrganizer);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 font-sans relative flex flex-col p-4 md:p-8">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-teal-500/10 blur-[120px]"></div>
      </div>
      
      <div className="z-10 w-full max-w-3xl mx-auto flex flex-col h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl">
        <header className="mb-8 border-b border-white/10 pb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">{selectedEvent.name}</h1>
          <p className="text-slate-400">Consultez vos fiches de poste pour cet événement</p>
          {selectedEvent.carteUrl && (
            <div className="mt-4">
              <a 
                href={selectedEvent.carteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                🗺️ Accéder à la carte
              </a>
            </div>
          )}
        </header>

        <div className="mb-8 max-w-md mx-auto w-full">
          <label className="block text-sm font-semibold text-slate-300 mb-2 text-center">Sélectionnez votre nom</label>
          <select 
            value={selectedVolunteerId}
            onChange={(e) => setSelectedVolunteerId(e.target.value)}
            className="w-full p-3 border border-white/10 rounded-xl bg-black/40 text-white focus:border-indigo-500 outline-none transition-colors shadow-inner"
          >
            <option value="">-- Choisissez un bénévole --</option>
            {eventVolunteers.map(v => (
              <option key={v.id} value={v.id}>{v.lastName} {v.firstName}</option>
            ))}
          </select>
        </div>

        {selectedVolunteerId && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-indigo-300 text-center mb-6">Vos affections ({assignments.length})</h2>
            
            {assignments.length === 0 ? (
              <p className="text-center text-slate-500 italic p-6 bg-black/20 rounded-xl border border-white/5">
                Aucun créneau ne vous a été affecté pour le moment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((assignment, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        {assignment.categoryName}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white leading-tight">{assignment.positionName}</h3>
                    
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-medium border border-white/5">
                        📅 {assignment.day || 'Jour non défini'}
                      </span>
                      <span className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg text-sm font-mono border border-white/5">
                        ⏰ {assignment.timeSlot || 'Horaire non défini'}
                      </span>
                    </div>

                    {(assignment.categoryReferentId || assignment.positionResponsableId) && (
                      <div className="mt-2 space-y-2 pt-3 border-t border-white/5">
                        {assignment.categoryReferentId && (() => {
                          const ref = volunteers.find(v => v.id === assignment.categoryReferentId);
                          return ref ? (
                            <div className="text-sm text-rose-300 flex items-start gap-2 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                              <span className="mt-0.5">⭐</span>
                              <p>Référent catégorie: <strong>{ref.firstName} {ref.lastName}</strong> {ref.phone && `(${ref.phone})`}</p>
                            </div>
                          ) : null;
                        })()}
                        {assignment.positionResponsableId && (() => {
                          const resp = volunteers.find(v => v.id === assignment.positionResponsableId);
                          return resp ? (
                            <div className="text-sm text-amber-300 flex items-start gap-2 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                              <span className="mt-0.5">⭐</span>
                              <p>Responsable du poste: <strong>{resp.firstName} {resp.lastName}</strong> {resp.phone && `(${resp.phone})`}</p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {(assignment.details || assignment.equipment) && (
                      <div className="mt-2 space-y-2 pt-3 border-t border-white/5">
                        {assignment.details && (
                          <div className="text-sm text-slate-400 flex items-start gap-2 bg-black/20 p-2 rounded-lg">
                            <span className="text-slate-500 mt-0.5">📝</span>
                            <p>{assignment.details}</p>
                          </div>
                        )}
                        {assignment.equipment && (
                          <div className="text-sm text-slate-400 flex items-start gap-2 bg-black/20 p-2 rounded-lg">
                            <span className="text-slate-500 mt-0.5">🦺</span>
                            <p>{assignment.equipment}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {(organizers.length > 0 || referents.length > 0) && (
              <div className="mt-12 bg-black/20 border border-white/5 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Contacts / Responsables</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {organizers.length > 0 && (
                    <div>
                      <h4 className="text-sm text-slate-400 mb-2">👔 Organisateurs</h4>
                      <div className="space-y-2">
                        {organizers.map(o => (
                          <div key={o.id} className="text-sm text-slate-300">
                            {o.firstName} {o.lastName} {o.phone ? `(📞 ${o.phone})` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {referents.length > 0 && (
                    <div>
                      <h4 className="text-sm text-slate-400 mb-2">⭐ Référents</h4>
                      <div className="space-y-2">
                        {referents.map(r => (
                          <div key={r.id} className="text-sm text-slate-300">
                            {r.firstName} {r.lastName} {r.phone ? `(📞 ${r.phone})` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
