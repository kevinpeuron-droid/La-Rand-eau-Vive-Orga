import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { Volunteer } from '../types';

export default function PublicVolunteerView() {
  const { eventId } = useParams();
  const { events, volunteers, loading, updateVolunteer } = useData();
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>('');
  const [ideasDraft, setIdeasDraft] = useState<string>('');
  const [equipmentNeedsDraft, setEquipmentNeedsDraft] = useState<string>('');

  const [modifications, setModifications] = useState<{ added: string[]; removed: string[] } | null>(null);

  useEffect(() => {
    if (selectedVolunteerId && eventId) {
      const vol = volunteers.find(v => v.id === selectedVolunteerId);
      const ev = events.find(e => e.id === eventId);
      if (vol && ev) {
        const summary: string[] = [];
        ev.categories?.forEach((cat: any) => {
          const isCatRef = cat.referentId === selectedVolunteerId;
          if (isCatRef) {
            summary.push(`Référent: ${cat.name}`);
          }
          cat.positions?.forEach((pos: any) => {
            const isPosResp = pos.responsableId === selectedVolunteerId;
            if (isPosResp && !isCatRef) {
              summary.push(`Responsable: ${pos.name} (${cat.name})`);
            }
            pos.timeSlots?.forEach((ts: any) => {
              if (Array.isArray(ts.volunteer) && ts.volunteer.includes(selectedVolunteerId)) {
                summary.push(`Créneau: ${cat.name} - ${pos.name} - ${ts.day} ${ts.timeSlot} (Détails: ${pos.details || ''}, Matériel: ${pos.equipment || ''})`);
              }
            });
          });
        });

        const lastSeen = vol.lastSeenAssignments?.[eventId] || [];
        const isDifferent = JSON.stringify(summary) !== JSON.stringify(lastSeen);

        if (vol.lastSeenAssignments?.[eventId] !== undefined && isDifferent) { // Only show changes if they had viewed before
          const added = summary.filter(s => !lastSeen.includes(s));
          const removed = lastSeen.filter(s => !summary.includes(s));
          if (added.length > 0 || removed.length > 0) {
            setModifications({ added, removed });
          } else {
            setModifications({ added: [], removed: [] }); // different order or something, won't show alert
          }
        } else if (vol.lastSeenAssignments?.[eventId] !== undefined && !isDifferent) {
           setModifications({ added: [], removed: [] });
        }

        if (isDifferent) {
           const timeout = setTimeout(() => {
              updateVolunteer(selectedVolunteerId, {
                viewedEvents: {
                  ...(vol.viewedEvents || {}),
                  [eventId]: Date.now()
                },
                lastSeenAssignments: {
                  ...(vol.lastSeenAssignments || {}),
                  [eventId]: summary
                }
              });
           }, 5000); // Wait 5 seconds before updating to ensure they actually looked at it
           return () => clearTimeout(timeout);
        }
      }
    }
  }, [selectedVolunteerId, eventId, events, volunteers, updateVolunteer]);

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

  const managedCategories = [];
  const managedPositions = [];

  if (selectedEvent && selectedVolunteerId) {
    selectedEvent.categories?.forEach(cat => {
      let isCategoryReferent = cat.referentId === selectedVolunteerId;
      
      if (isCategoryReferent) {
        managedCategories.push(cat);
      }

      cat.positions?.forEach(pos => {
        if (!isCategoryReferent && pos.responsableId === selectedVolunteerId) {
          managedPositions.push({ categoryName: cat.name, position: pos });
        }
        
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

  const eventVolunteers = volunteers.sort((a, b) => a.lastName.localeCompare(b.lastName, 'fr'));
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
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedVolunteerId(newId);
              const vol = volunteers.find(v => v.id === newId);
              setIdeasDraft(vol?.ideas || '');
              setEquipmentNeedsDraft(vol?.equipmentNeeds || '');
            }}
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
            
            {modifications && (
              <div className={`mt-2 p-4 rounded-xl border ${modifications.added.length === 0 && modifications.removed.length === 0 ? 'bg-teal-500/10 border-teal-500/20 text-teal-200' : 'bg-amber-500/10 border-amber-500/20 text-amber-200'}`}>
                {modifications.added.length === 0 && modifications.removed.length === 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✅</span>
                    <p className="font-medium text-sm">Pas de modification sur votre poste depuis votre dernière visite</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xl">⚠️</span>
                      <p className="font-bold text-sm">Attention, modification depuis votre dernière visite :</p>
                    </div>
                    <div className="space-y-2 text-sm pl-8">
                      {modifications.added.map((add, i) => (
                         <p key={`added-${i}`} className="text-teal-300">➕ Ajouté: {add.replace(/Créneau: |Détails: |Matériel: /g, '')}</p>
                      ))}
                      {modifications.removed.map((rem, i) => (
                         <p key={`rem-${i}`} className="text-rose-300 line-through">➖ Retiré: {rem.replace(/Créneau: |Détails: |Matériel: /g, '')}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <h2 className="text-xl font-semibold text-indigo-300 text-center mb-6 mt-6">Vos affectations ({assignments.length})</h2>
            
            {(selectedEvent?.carteUrl || localStorage.getItem('mymap_url')) && (
               <div className="flex justify-center mb-8">
                 <a 
                   href={selectedEvent?.carteUrl || localStorage.getItem('mymap_url') || "#"}
                   target="_blank" 
                   rel="noreferrer"
                   className="inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/30 w-full md:w-auto justify-center hover:-translate-y-1 text-lg"
                 >
                   🗺️ Consulter le plan de l'événement
                 </a>
               </div>
            )}
            
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
                    
                    {selectedEvent?.carteUrl && (
                      <a 
                        href={selectedEvent.carteUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 mt-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/30 w-fit hover:-translate-y-0.5"
                      >
                        🗺️ Voir sur la carte
                      </a>
                    )}
                    
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

                    {/* Équipe du poste */}
                    {(() => {
                      const cat = selectedEvent.categories?.find(c => c.name === assignment.categoryName);
                      if (!cat) return null;
                      const p = cat.positions.find(pos => pos.name === assignment.positionName);
                      if (!p) return null;
                      
                      let coVolunteersFound = false;
                      const slots = p.timeSlots.filter(ts => Array.isArray(ts.volunteer) && ts.volunteer.length > 0);
                      if (slots.length === 0) return null;
                      
                      const slotElements = slots.map((ts, ti) => {
                        const others = ts.volunteer!.filter(vid => vid !== selectedVolunteerId);
                        if (others.length === 0) return null;
                        coVolunteersFound = true;
                        
                        return (
                          <div key={ti} className="flex flex-col gap-1 mt-2">
                            <span className="text-xs font-mono text-slate-400">📅 {ts.day} • ⏰ {ts.timeSlot}</span>
                            <div className="flex flex-wrap gap-1">
                              {others.map(vid => {
                                const v = volunteers.find(vol => vol.id === vid);
                                return v ? (
                                  <span key={vid} className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-300">
                                    {v.firstName} {v.lastName}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          </div>
                        );
                      });

                      if (!coVolunteersFound) return null;

                      return (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <details className="group cursor-pointer">
                            <summary className="text-sm font-medium text-slate-300 hover:text-white transition-colors flex items-center justify-between outline-none">
                              <span>👥 Équipe du poste</span>
                              <span className="opacity-60 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-2 space-y-1 block pb-2">
                              {slotElements}
                            </div>
                          </details>
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>
            )}
            
            {(managedCategories.length > 0 || managedPositions.length > 0) && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-semibold text-rose-300 text-center mb-6">Vos Postes à Responsabilité</h2>
                
                {managedCategories.map((cat, idx) => (
                  <div key={`cat-${idx}`} className="bg-rose-500/10 border border-rose-500/20 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⭐</span>
                      <h3 className="text-lg font-bold text-rose-200">Référent Stand : {cat.name}</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {cat.positions.map((pos, pi) => (
                        <div key={pi} className="bg-black/20 p-4 rounded-xl border border-white/5">
                          <h4 className="font-semibold text-white mb-2">{pos.name}</h4>
                          {(pos.details || pos.equipment) && (
                            <div className="text-sm text-slate-400 mb-3 space-y-1">
                              {pos.details && <p>📝 {pos.details}</p>}
                              {pos.equipment && <p>🦺 {pos.equipment}</p>}
                            </div>
                          )}
                          <div className="space-y-2">
                            {pos.timeSlots.map((ts, ti) => (
                              <div key={ti} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm bg-white/5 p-2 rounded-lg">
                                <span className="font-mono text-slate-300 whitespace-nowrap">📅 {ts.day} • ⏰ {ts.timeSlot}</span>
                                <div className="flex flex-wrap gap-1">
                                  {ts.volunteer && ts.volunteer.length > 0 ? (
                                    ts.volunteer.map(vid => {
                                      const v = volunteers.find(v => v.id === vid);
                                      return v ? <span key={vid} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded text-xs">{v.firstName} {v.lastName} {v.phone && `(${v.phone})`}</span> : null;
                                    })
                                  ) : (
                                    <span className="text-rose-400/50 text-xs italic">Aucun inscrit</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {managedPositions.map((mp, idx) => (
                  <div key={`pos-${idx}`} className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-2xl shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        {mp.categoryName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⭐</span>
                      <h3 className="text-lg font-bold text-amber-200">Responsable Poste : {mp.position.name}</h3>
                    </div>
                    
                    {(mp.position.details || mp.position.equipment) && (
                      <div className="text-sm text-slate-400 mb-2 space-y-1">
                        {mp.position.details && <p>📝 {mp.position.details}</p>}
                        {mp.position.equipment && <p>🦺 {mp.position.equipment}</p>}
                      </div>
                    )}
                    
                    <div className="space-y-2 mt-2">
                      {mp.position.timeSlots.map((ts, ti) => (
                        <div key={ti} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm bg-black/20 border border-white/5 p-3 rounded-lg">
                          <span className="font-mono text-slate-300 whitespace-nowrap">📅 {ts.day} • ⏰ {ts.timeSlot}</span>
                          <div className="flex flex-wrap gap-1">
                            {ts.volunteer && ts.volunteer.length > 0 ? (
                              ts.volunteer.map(vid => {
                                const v = volunteers.find(v => v.id === vid);
                                return v ? <span key={vid} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded text-xs">{v.firstName} {v.lastName} {v.phone && `(${v.phone})`}</span> : null;
                              })
                            ) : (
                              <span className="text-rose-400/50 text-xs italic">Aucun inscrit</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 bg-black/20 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">💡 Boîte à idées</h3>

              <p className="text-sm text-slate-400 mb-4">Une idée pour améliorer l'événement ou le poste ? Notez-la ici, elle sera transmise à l'équipe organisatrice !</p>
              <textarea
                value={ideasDraft}
                onChange={(e) => setIdeasDraft(e.target.value)}
                onBlur={() => selectedVolunteerId && updateVolunteer(selectedVolunteerId, { ideas: ideasDraft })}
                placeholder="Ex : Proposer des talkies-walkies pour ce poste, ajouter plus de signalisation..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-y min-h-[120px] transition-colors"
              />
              <p className="text-xs text-slate-500 mt-2">Enregistrement automatique lorsque vous quittez la zone de texte.</p>
            </div>

            {(() => {
              const vol = volunteers.find(v => v.id === selectedVolunteerId);
              if (vol && (vol.isOrganizer || vol.isReferent)) {
                return (
                  <div className="mt-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-amber-300 mb-2">🛒 Liste de courses / Besoins matériel</h3>
                    <p className="text-sm text-amber-500/80 mb-4">En tant que responsable/référent, listez ici les besoins en matériel ou courses de votre poste. Cette liste sera automatiquement remontée dans les tâches de l'événement.</p>
                    <textarea
                      value={equipmentNeedsDraft}
                      onChange={(e) => setEquipmentNeedsDraft(e.target.value)}
                      onBlur={() => selectedVolunteerId && updateVolunteer(selectedVolunteerId, { equipmentNeeds: equipmentNeedsDraft })}
                      placeholder="Ex : 2 rouleaux de scotch, 1 pack d'eau, barnum supplémentaire..."
                      className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-4 text-amber-100 placeholder-amber-500/50 focus:border-amber-400 outline-none resize-y min-h-[120px] transition-colors"
                    />
                    <p className="text-xs text-amber-500/60 mt-2">Enregistrement automatique lorsque vous quittez la zone de texte.</p>
                  </div>
                );
              }
              return null;
            })()}

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
