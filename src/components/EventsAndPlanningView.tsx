import { useState, useEffect, KeyboardEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { Position } from '../types';

function DebouncedInput({ value, onChange, placeholder, className }: any) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) onChange(localValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
    <input 
      value={localValue} 
      onChange={e => setLocalValue(e.target.value)} 
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
}

export default function EventsAndPlanningView() {
  const { events, volunteers, addEvent, updateEvent, deleteEvent } = useData();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [newEventName, setNewEventName] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

  const handleCreateEvent = async () => {
    if (!newEventName.trim()) return alert("Nom d'événement requis");
    await addEvent({
      name: newEventName.trim(),
      priority: false,
      availableVolunteers: [],
      categories: []
    });
    setNewEventName('');
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const toggleEventPriority = async (evtId: string) => {
    const isCurrentlyPriority = events.find(x => x.id === evtId)?.priority;
    await updateEvent(evtId, { priority: !isCurrentlyPriority });
  };

  const toggleCategory = (catIndex: number) => {
    setExpandedCategories(prev => ({ ...prev, [catIndex]: !prev[catIndex] }));
  };

  const addCategory = async () => {
    if (!selectedEvent) return;
    const name = prompt('Nom de la catégorie :');
    if (!name || !name.trim()) return;
    const newCats = [...(selectedEvent.categories || []), { name: name.trim(), positions: [] }];
    await updateEvent(selectedEvent.id, { categories: newCats });
    setExpandedCategories(prev => ({ ...prev, [newCats.length - 1]: true }));
  };

  const removeCategory = async (catIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    newCats.splice(catIndex, 1);
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const addPosition = async (catIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    newCats[catIndex].positions.unshift({ name: 'Nouveau Poste', details: '', equipment: '', timeSlots: [] });
    await updateEvent(selectedEvent.id, { categories: newCats });
    setExpandedCategories(prev => ({ ...prev, [catIndex]: true }));
  };

  const duplicatePosition = async (catIndex: number, posIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    const posToCopy = newCats[catIndex].positions[posIndex];
    const duplicatedPos = {
      ...posToCopy,
      name: `${posToCopy.name} (copie)`,
      timeSlots: posToCopy.timeSlots.map(ts => ({ ...ts, volunteer: [] })) // clear volunteers
    };
    newCats[catIndex].positions.splice(posIndex + 1, 0, duplicatedPos);
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const removePosition = async (catIndex: number, posIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    newCats[catIndex].positions.splice(posIndex, 1);
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const updatePositionField = async (catIndex: number, posIndex: number, field: keyof Position, value: string) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    (newCats[catIndex].positions[posIndex] as any)[field] = value;
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const addTimeSlot = async (catIndex: number, posIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    newCats[catIndex].positions[posIndex].timeSlots.push({ day: '', timeSlot: '09h00-12h00', volunteer: [] });
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const updateTimeSlot = async (catIndex: number, posIndex: number, slotIndex: number, field: 'day' | 'timeSlot' | 'volunteer', val: any) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    const slot = newCats[catIndex].positions[posIndex].timeSlots[slotIndex];
    if (field === 'volunteer') {
      if (!Array.isArray(slot.volunteer)) slot.volunteer = slot.volunteer ? [slot.volunteer as unknown as string] : [];
      if (val && !slot.volunteer.includes(val)) slot.volunteer.push(val);
    } else {
      (slot as any)[field] = val;
    }
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const removeVolunteerFromSlot = async (catIndex: number, posIndex: number, slotIndex: number, volId: string) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    const slot = newCats[catIndex].positions[posIndex].timeSlots[slotIndex];
    if (Array.isArray(slot.volunteer)) {
      slot.volunteer = slot.volunteer.filter(id => id !== volId);
    }
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const deleteTimeSlot = async (catIndex: number, posIndex: number, slotIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    newCats[catIndex].positions[posIndex].timeSlots.splice(slotIndex, 1);
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const computeStats = () => {
    if (!selectedEvent) return null;
    let totalPositions = 0;
    let totalSlots = 0;
    let filledSlots = 0;
    const uniqueVolunteersAssigned = new Set<string>();

    selectedEvent.categories?.forEach(cat => {
      totalPositions += cat.positions.length;
      cat.positions.forEach(pos => {
        totalSlots += pos.timeSlots.length;
        pos.timeSlots.forEach(slot => {
          if (slot.volunteer && slot.volunteer.length > 0) {
            filledSlots++;
            slot.volunteer.forEach(vid => uniqueVolunteersAssigned.add(vid));
          }
        });
      });
    });

    return {
      totalPositions,
      totalSlots,
      filledSlots,
      missingSlots: totalSlots - filledSlots,
      uniqueVolunteersAssigned: uniqueVolunteersAssigned.size
    };
  };

  const stats = computeStats();

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[80vh] animate-in fade-in duration-500">
      
      {/* Sidebar: Events List */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-5 shadow-lg shrink-0">
          <h2 className="text-xl font-semibold text-white mb-4">Événements</h2>
          <div className="flex flex-col gap-3">
            <input 
              value={newEventName} 
              onChange={e => setNewEventName(e.target.value)} 
              className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors text-sm" 
              placeholder="Nouvel événement..."
              onKeyDown={e => e.key === 'Enter' && handleCreateEvent()}
            />
            <button 
              onClick={handleCreateEvent} 
              className="w-full bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-500 transition-colors"
            >
              ➕ Créer
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-4">
          {events.map(evt => (
            <div 
              key={evt.id} 
              onClick={() => setSelectedEventId(evt.id)}
              className={`p-4 rounded-2xl cursor-pointer transition-all border-l-[4px] ${selectedEventId === evt.id ? 'bg-white/10 border-indigo-500 ring-1 ring-white/10 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10 border-white/5'}`}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-semibold text-base ${evt.priority ? 'text-amber-400' : 'text-slate-200'}`}>
                  {evt.priority && <span className="mr-1">⭐</span>}
                  {evt.name}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">{(evt.categories || []).length} catégories</p>
            </div>
          ))}
          {events.length === 0 && <p className="text-slate-500 text-sm italic p-2">Aucun événement.</p>}
        </div>
      </div>

      {/* Main Area: Event Details & Planning */}
      <div className="flex-1 flex flex-col bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
        {!selectedEvent ? (
          <div className="h-full flex items-center justify-center text-slate-500 text-lg">
            Sélectionnez un événement pour voir et modifier son planning.
          </div>
        ) : (
          <div className="flex flex-col h-full z-10 relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
              <div>
                <h2 className={`text-3xl font-bold ${selectedEvent.priority ? 'text-amber-400' : 'text-white'}`}>
                  {selectedEvent.name}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <button 
                     onClick={() => toggleEventPriority(selectedEvent.id)}
                     className={`text-xs px-3 py-1 rounded-lg border transition-colors ${selectedEvent.priority ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-amber-400 hover:border-amber-500/50'}`}
                  >
                    ⭐ Priorité
                  </button>
                  <button onClick={() => { if(confirm('Supprimer cet événement ?')) { deleteEvent(selectedEvent.id); setSelectedEventId(''); } }} className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>

              {stats && (
                <div className="flex gap-4">
                  <div className="text-center px-4 border-r border-white/10">
                    <div className="text-2xl font-bold text-indigo-400">{stats.totalPositions}</div>
                    <div className="text-[10px] uppercase tracking-wider text-indigo-300/70 font-semibold">Postes</div>
                  </div>
                  <div className="text-center px-4 border-r border-white/10">
                    <div className="text-2xl font-bold text-amber-400">{stats.filledSlots}/{stats.totalSlots}</div>
                    <div className="text-[10px] uppercase tracking-wider text-amber-300/70 font-semibold">Créneaux</div>
                  </div>
                  <div className="text-center px-4">
                    <div className="text-2xl font-bold text-teal-400">{stats.uniqueVolunteersAssigned}</div>
                    <div className="text-[10px] uppercase tracking-wider text-teal-300/70 font-semibold">Bénévoles</div>
                  </div>
                </div>
              )}
            </header>

            <div className="mb-4">
              <button onClick={addCategory} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-500/30 hover:text-white transition-colors">
                ➕ Nouvelle Catégorie
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {(!selectedEvent.categories || selectedEvent.categories.length === 0) && (
                <div className="text-center py-10 text-slate-500 italic">Aucune catégorie. Commencez par en créer une.</div>
              )}
              {(selectedEvent.categories || []).map((cat, ci) => {
                const isExpanded = expandedCategories[ci] ?? true;
                return (
                  <div key={ci} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-sm transition-all">
                    {/* Category Header */}
                    <div className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors" onClick={() => toggleCategory(ci)}>
                      <div className="flex items-center gap-3">
                        <span className={`transform transition-transform text-slate-400 ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                        <h3 className="text-lg font-bold text-white m-0">📁 {cat.name}</h3>
                        <span className="text-xs bg-black/30 px-2 py-0.5 rounded-full text-slate-300">{cat.positions.length} postes</span>
                      </div>
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => addPosition(ci)} className="text-xs bg-indigo-500 shadow-sm shadow-indigo-500/20 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-400 transition-colors">
                          + Poste
                        </button>
                        <button onClick={() => { if(confirm('Supprimer cette catégorie ?')) removeCategory(ci); }} className="text-xs px-2 py-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors">
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Category Content: List of positions */}
                    {isExpanded && (
                      <div className="p-4 pt-2 space-y-3 border-t border-white/5 bg-black/20">
                        {cat.positions.length === 0 && <p className="text-xs text-slate-500 italic pl-6">Aucun poste dans cette catégorie.</p>}
                        
                        {(cat.positions || []).map((pos, pi) => (
                          <div key={pi} className="bg-white/5 border-l-[3px] border-l-indigo-500 rounded-r-xl border-y border-r border-white/10 mb-3 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)]">
                            <div className="flex flex-col xl:flex-row xl:items-center gap-3 p-3 bg-black/20">
                              <div className="flex-1 w-full flex flex-col md:flex-row gap-3">
                                <DebouncedInput 
                                  value={pos.name} 
                                  onChange={(val: string) => updatePositionField(ci, pi, 'name', val)}
                                  placeholder="Nom du Poste"
                                  className="flex-1 font-bold text-sm md:text-base text-indigo-300 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-indigo-500 px-1 transition-colors min-w-[150px]"
                                />
                                <div className="flex flex-1 gap-2 relative">
                                  <span className="absolute left-2.5 top-1.5 text-[10px] text-slate-500">📝</span>
                                  <DebouncedInput 
                                    value={pos.details || ''} 
                                    onChange={(val: string) => updatePositionField(ci, pi, 'details', val)}
                                    placeholder="Détails"
                                    className="w-1/2 pl-7 pr-2 py-1 text-xs text-slate-300 bg-black/40 rounded-md outline-none border border-white/5 focus:border-indigo-500/50 hover:bg-black/60 transition-colors"
                                  />
                                  <span className="absolute left-[calc(50%+10px)] top-1.5 text-[10px] text-amber-500/70">🦺</span>
                                  <DebouncedInput 
                                    value={pos.equipment || ''} 
                                    onChange={(val: string) => updatePositionField(ci, pi, 'equipment', val)}
                                    placeholder="Matériel"
                                    className="w-1/2 pl-7 pr-2 py-1 text-xs text-slate-300 bg-black/40 rounded-md outline-none border border-white/5 focus:border-amber-500/50 hover:bg-black/60 transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1 xl:ml-auto">
                                <button onClick={() => addTimeSlot(ci, pi)} className="text-[11px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1.5 rounded-md hover:bg-teal-500/30 hover:text-white transition-colors font-medium whitespace-nowrap">
                                  + Créneau
                                </button>
                                <button onClick={() => duplicatePosition(ci, pi)} className="text-[11px] px-2 py-1.5 text-indigo-400 hover:bg-indigo-500/20 rounded-md transition-colors" title="Dupliquer le poste">
                                  📄
                                </button>
                                <button onClick={() => { if(confirm('Supprimer ce poste ?')) removePosition(ci, pi); }} className="text-[11px] px-2 py-1.5 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors" title="Supprimer le poste">
                                  🗑️
                                </button>
                              </div>
                            </div>

                            <div className="p-2 space-y-1">
                              {pos.timeSlots.length === 0 && <p className="text-xs text-slate-500 italic px-2 pb-1">Aucun créneau affecté.</p>}
                              {(pos.timeSlots || []).map((slot, si) => (
                                <div key={si} className="bg-black/20 p-1.5 rounded-md border border-white/5 flex flex-wrap items-center gap-2 hover:border-white/10 transition-colors">
                                  <select value={slot.day} onChange={e => updateTimeSlot(ci, pi, si, 'day', e.target.value)} className="p-1 px-1.5 text-xs rounded border border-white/10 bg-slate-800 text-white outline-none focus:border-indigo-500 transition-colors hover:bg-slate-700 min-w-[90px]">
                                    <option value="">Jour</option>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                  
                                  <DebouncedInput 
                                    value={slot.timeSlot} 
                                    onChange={(val: string) => updateTimeSlot(ci, pi, si, 'timeSlot', val)}
                                    placeholder="09h00-12h00"
                                    className="p-1 px-1.5 text-xs rounded border border-white/10 bg-slate-800 text-white w-24 outline-none focus:border-indigo-500 transition-colors hover:bg-slate-700 text-center"
                                  />
                                  
                                  <div className="flex-1 flex flex-wrap gap-1 items-center min-w-[200px] sm:ml-2 sm:pl-2 sm:border-l border-white/10">
                                    {Array.isArray(slot.volunteer) && slot.volunteer.map(vid => {
                                      const v = volunteers.find(x => x.id === vid);
                                      return v ? (
                                        <span key={vid} className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                                          {v.firstName} {v.lastName}
                                          <button onClick={() => removeVolunteerFromSlot(ci, pi, si, vid)} className="text-indigo-400 hover:text-rose-400 ml-0.5 transition-colors">✕</button>
                                        </span>
                                      ) : null;
                                    })}
                                    <select 
                                      onChange={e => {
                                        updateTimeSlot(ci, pi, si, 'volunteer', e.target.value);
                                        e.target.value = "";
                                      }} 
                                      className="p-1 px-1.5 text-[10px] uppercase font-bold tracking-wider rounded border border-white/10 bg-slate-800/80 text-slate-400 outline-none hover:text-white hover:bg-slate-700 transition-colors"
                                    >
                                      <option value="">+ Bénévole</option>
                                      {volunteers.map(v => (
                                        <option key={v.id} value={v.id}>{v.firstName} {v.lastName}</option>
                                      ))}
                                    </select>
                                  </div>
                                  
                                  <button onClick={() => deleteTimeSlot(ci, pi, si)} className="text-rose-400/50 hover:text-rose-400 p-1 rounded transition-colors ml-auto text-xs" title="Supprimer créneau">
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
