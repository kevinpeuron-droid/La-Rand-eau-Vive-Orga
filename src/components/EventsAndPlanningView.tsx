import React, { useState, useEffect, KeyboardEvent } from 'react';
import Papa from 'papaparse';
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

function VolunteerCombobox({ volunteers, currentSlot, onSelect, eventDetails }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Find all volunteers already assigned to the same day and time across the whole event
  const busyVolunteerIds = new Set<string>();
  if (currentSlot.day && currentSlot.timeSlot) {
    eventDetails.categories?.forEach((cat: any) => {
      cat.positions?.forEach((pos: any) => {
        pos.timeSlots?.forEach((ts: any) => {
          if (ts.day === currentSlot.day && ts.timeSlot === currentSlot.timeSlot) {
            if (Array.isArray(ts.volunteer)) {
              ts.volunteer.forEach((vid: string) => busyVolunteerIds.add(vid));
            }
          }
        });
      });
    });
  }

  // Also ensuring we hide the ones already locally assigned to THIS slot even if time/day is empty
  if (Array.isArray(currentSlot.volunteer)) {
    currentSlot.volunteer.forEach((vid: string) => busyVolunteerIds.add(vid));
  }

  const availableVolunteers = volunteers.filter((v: any) => !busyVolunteerIds.has(v.id));

  const filtered = availableVolunteers.filter((v: any) => 
    `${v.firstName} ${v.lastName}`.toLowerCase().includes(search.toLowerCase())
  ).sort((a: any, b: any) => a.lastName.localeCompare(b.lastName, 'fr'));

  return (
    <div className="relative inline-block w-48">
      <input
        type="text"
        placeholder="+ BÉNÉVOLE..."
        value={search}
        onChange={e => { setSearch(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="p-1 px-1.5 w-full text-[10px] uppercase font-bold tracking-wider rounded-sm border border-dashed border-white/20 bg-transparent text-slate-300 outline-none focus:bg-slate-800 transition-colors"
      />
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full sm:w-64 bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-2 text-xs text-slate-400 italic">Aucun bénévole dispo</div>
          ) : (
            filtered.map((v: any) => (
              <div
                key={v.id}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  onSelect(v.id);
                  setSearch('');
                  setIsOpen(false);
                }}
                className="p-1.5 px-2 hover:bg-indigo-500 hover:text-white cursor-pointer text-xs text-slate-200"
              >
                {v.firstName} {v.lastName} {v.group ? `(${v.group})` : ''}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function EventsAndPlanningView() {
  const { events, volunteers, addEvent, updateEvent, deleteEvent, updateVolunteer } = useData();
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

  const addTask = async (catIndex: number) => {
    if (!selectedEvent) return;
    const title = prompt('Nouvelle tâche TdL :');
    if (!title || !title.trim()) return;
    
    const newCats = [...selectedEvent.categories];
    if (!newCats[catIndex].tasks) {
      newCats[catIndex].tasks = [];
    }
    // We add an id using a simple random string
    newCats[catIndex].tasks!.push({ id: Math.random().toString(36).substring(2, 9), title: title.trim(), completed: false });
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const toggleTaskLocal = async (catIndex: number, taskId: string) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    const task = newCats[catIndex].tasks?.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      await updateEvent(selectedEvent.id, { categories: newCats });
    }
  };

  const removeTask = async (catIndex: number, taskId: string) => {
    if (!selectedEvent || !confirm('Supprimer cette tâche ?')) return;
    const newCats = [...selectedEvent.categories];
    if (newCats[catIndex].tasks) {
      newCats[catIndex].tasks = newCats[catIndex].tasks!.filter(t => t.id !== taskId);
      await updateEvent(selectedEvent.id, { categories: newCats });
    }
  };

  const removeCategory = async (catIndex: number) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    newCats.splice(catIndex, 1);
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const updateCategoryReferent = async (catIndex: number, volunteerId: string) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    const oldReferentId = newCats[catIndex].referentId;
    newCats[catIndex].referentId = volunteerId;
    await updateEvent(selectedEvent.id, { categories: newCats });
    // Also try to helpfully check the 'isReferent' flag on that volunteer
    if (volunteerId) {
       const v = volunteers.find(x => x.id === volunteerId);
       if (v && !v.isReferent) {
           await updateVolunteer(volunteerId, { isReferent: true });
       }
    }
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

  const moveCategoryUp = async (catIndex: number) => {
    if (!selectedEvent || !selectedEvent.categories || catIndex === 0) return;
    const newCats = [...selectedEvent.categories];
    [newCats[catIndex - 1], newCats[catIndex]] = [newCats[catIndex], newCats[catIndex - 1]];
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const moveCategoryDown = async (catIndex: number) => {
    if (!selectedEvent || !selectedEvent.categories || catIndex === selectedEvent.categories.length - 1) return;
    const newCats = [...selectedEvent.categories];
    [newCats[catIndex], newCats[catIndex + 1]] = [newCats[catIndex + 1], newCats[catIndex]];
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const movePositionUp = async (catIndex: number, posIndex: number) => {
    if (!selectedEvent || !selectedEvent.categories || posIndex === 0) return;
    const newCats = [...selectedEvent.categories];
    [newCats[catIndex].positions[posIndex - 1], newCats[catIndex].positions[posIndex]] = [newCats[catIndex].positions[posIndex], newCats[catIndex].positions[posIndex - 1]];
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const movePositionDown = async (catIndex: number, posIndex: number) => {
    if (!selectedEvent || !selectedEvent.categories || posIndex === selectedEvent.categories[catIndex].positions.length - 1) return;
    const newCats = [...selectedEvent.categories];
    [newCats[catIndex].positions[posIndex], newCats[catIndex].positions[posIndex + 1]] = [newCats[catIndex].positions[posIndex + 1], newCats[catIndex].positions[posIndex]];
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const updatePositionField = async (catIndex: number, posIndex: number, field: keyof Position, value: string) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    (newCats[catIndex].positions[posIndex] as any)[field] = value;
    await updateEvent(selectedEvent.id, { categories: newCats });
  };

  const togglePositionResponsable = async (catIndex: number, posIndex: number, volunteerId: string) => {
    if (!selectedEvent) return;
    const newCats = [...selectedEvent.categories];
    const pos = newCats[catIndex].positions[posIndex];
    pos.responsableId = pos.responsableId === volunteerId ? undefined : volunteerId;
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

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedEvent) return;
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        const newCats = [...(selectedEvent.categories || [])];

        for (const row of data) {
          let catName = row['Catégorie']?.trim() || row['Categorie']?.trim() || row['category']?.trim();
          let posName = row['Poste']?.trim() || row['poste']?.trim();
          let timeSlotStr = row['Créneau']?.trim() || row['Creneau']?.trim() || row['timeSlot']?.trim() || '';

          if (!catName || !posName) continue;

          let cat = newCats.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (!cat) {
            cat = { name: catName, expanded: true, positions: [] };
            newCats.push(cat);
          }

          let pos = cat.positions.find(p => p.name.toLowerCase() === posName.toLowerCase());
          if (!pos) {
            pos = { name: posName, details: '', equipment: '', timeSlots: [] };
            cat.positions.push(pos);
          }

          pos.timeSlots.push({ day: '', timeSlot: timeSlotStr, volunteer: [] });
        }

        try {
          await updateEvent(selectedEvent.id, { categories: newCats });
          alert('Planning importé avec succès !');
        } catch(err) {
          console.error(err);
          alert('Erreur lors de la sauvegarde.');
        } finally {
          e.target.value = '';
        }
      },
      error: (error) => {
          console.error("Erreur de parsing CSV:", error);
          alert("Le format du fichier n'a pas pu être lu.");
          e.target.value = '';
      }
    });
  };

  const handleExportCSV = () => {
    if (!selectedEvent) return;

    const exportData: any[] = [];
    selectedEvent.categories?.forEach(cat => {
      cat.positions?.forEach(pos => {
        if (pos.timeSlots && pos.timeSlots.length > 0) {
          pos.timeSlots.forEach(slot => {
            if (slot.volunteer && slot.volunteer.length > 0) {
                slot.volunteer.forEach(vid => {
                    const v = volunteers.find(x => x.id === vid);
                    exportData.push({
                        'Catégorie': cat.name,
                        'Poste': pos.name,
                        'Détails': pos.details || '',
                        'Jour': slot.day || '',
                        'Créneau': slot.timeSlot || '',
                        'Bénévole': v ? `${v.firstName} ${v.lastName}` : '',
                        'Contact': v ? (v.phone || v.email || '') : ''
                    });
                });
            } else {
                exportData.push({
                    'Catégorie': cat.name,
                    'Poste': pos.name,
                    'Détails': pos.details || '',
                    'Jour': slot.day || '',
                    'Créneau': slot.timeSlot || '',
                    'Bénévole': '',
                    'Contact': ''
                });
            }
          });
        } else {
            exportData.push({
                'Catégorie': cat.name,
                'Poste': pos.name,
                'Détails': pos.details || '',
                'Jour': '',
                'Créneau': '',
                'Bénévole': '',
                'Contact': ''
            });
        }
      });
    });

    const csvData = Papa.unparse(exportData, { delimiter: ';' });
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvData], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_${selectedEvent.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
                  <button onClick={() => {
                    const url = `${window.location.origin}/p/${selectedEvent.id}`;
                    navigator.clipboard.writeText(url);
                    alert('Lien pour les bénévoles copié: ' + url);
                  }} className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500/40 transition-colors">
                    🔗 Lien Bénévoles
                  </button>
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
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-slate-400">🗺️ Carte de l'événement:</span>
                  <input
                    type="url"
                    value={selectedEvent.carteUrl || ''}
                    onChange={(e) => updateEvent(selectedEvent.id, { carteUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="flex-1 p-1.5 text-xs bg-black/20 border border-white/10 rounded-lg text-white outline-none focus:border-indigo-500"
                  />
                  {!selectedEvent.carteUrl && localStorage.getItem('mymap_url') && (
                    <button 
                      onClick={() => updateEvent(selectedEvent.id, { carteUrl: localStorage.getItem('mymap_url') || '' })}
                      className="text-xs px-2 py-1 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 rounded-md transition-colors"
                      title="Utiliser la carte MyMaps globale"
                    >
                      Utiliser MyMaps global
                    </button>
                  )}
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

            <div className="mb-4 flex flex-wrap gap-3 items-center">
              <button onClick={addCategory} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-500/30 hover:text-white transition-colors">
                ➕ Nouvelle Catégorie
              </button>
              
              <label className="cursor-pointer bg-slate-800 text-slate-300 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm mb-0">
                📥 Importer Modèle CSV
                <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              </label>

              <button onClick={handleExportCSV} className="bg-slate-800 text-slate-300 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm sm:ml-auto">
                📤 Exporter CSV
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
                        {ci > 0 && (
                          <button onClick={() => moveCategoryUp(ci)} className="text-xs px-2 py-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Monter">
                            ↑
                          </button>
                        )}
                        {ci < (selectedEvent.categories.length - 1) && (
                          <button onClick={() => moveCategoryDown(ci)} className="text-xs px-2 py-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Descendre">
                            ↓
                          </button>
                        )}
                        <button onClick={() => {
                          const url = `${window.location.origin}/share/event/${selectedEvent.id}/category/${encodeURIComponent(cat.name)}`;
                          navigator.clipboard.writeText(url);
                          alert('Lien copié: ' + url);
                        }} className="text-xs text-teal-400 bg-teal-500/10 px-2 py-1.5 rounded-lg hover:bg-teal-500/20 transition-colors">
                          🔗 Partager
                        </button>
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
                      <div className="p-4 pt-4 border-t border-white/5 bg-black/20 space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-300">⭐ Référent de catégorie :</span>
                          <select
                            value={cat.referentId || ''}
                            onChange={e => updateCategoryReferent(ci, e.target.value)}
                            className="text-sm p-1.5 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 min-w-[200px]"
                          >
                            <option value="">-- Aucun --</option>
                            {volunteers
                              .filter((v: any) => v.isOrganizer || v.isReferent)
                              .sort((a: any, b: any) => a.lastName.localeCompare(b.lastName, 'fr'))
                              .map((v: any) => (
                              <option key={v.id} value={v.id}>{v.lastName} {v.firstName}</option>
                            ))}
                          </select>
                        </div>

                        {/* Category Tasks (TdL) */}
                        <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-sm font-semibold text-teal-300 flex items-center gap-2">
                              <span>✅</span> To-Do List ({cat.tasks?.filter(t => t.completed).length || 0}/{cat.tasks?.length || 0})
                            </h4>
                            <button onClick={() => addTask(ci)} className="text-xs text-teal-200 bg-teal-500/20 hover:bg-teal-500/30 px-2 py-1 rounded-lg transition-colors border border-teal-500/30">
                              + Tâche
                            </button>
                          </div>
                          
                          {(!cat.tasks || cat.tasks.length === 0) ? (
                            <p className="text-xs text-slate-500 italic">Aucune tâche pour cette catégorie.</p>
                          ) : (
                            <div className="space-y-1.5 mt-2">
                              {cat.tasks.map(task => (
                                <div key={task.id} className={`flex items-center justify-between gap-2 p-2 rounded-lg border ${task.completed ? 'bg-teal-500/5 border-teal-500/20' : 'bg-white/5 border-white/5'} transition-colors`}>
                                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleTaskLocal(ci, task.id)}>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${task.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-slate-500'}`}>
                                      {task.completed && <span className="text-[10px]">✓</span>}
                                    </div>
                                    <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                      {task.title}
                                    </span>
                                  </div>
                                  <button onClick={() => removeTask(ci, task.id)} className="text-xs text-slate-500 hover:text-rose-400 px-2 py-1">
                                    🗑️
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                        {cat.positions.length === 0 && <p className="text-xs text-slate-500 italic pl-6">Aucun poste dans cette catégorie.</p>}
                        
                        {(cat.positions || []).map((pos, pi) => (
                          <div key={pi} className="bg-white/5 border-l-[3px] border-l-indigo-500 rounded-r-md border-y border-r border-white/10 mb-2 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-2 p-2 bg-black/20">
                              <div className="flex-1 w-full flex flex-col sm:flex-row gap-2">
                                <DebouncedInput 
                                  value={pos.name} 
                                  onChange={(val: string) => updatePositionField(ci, pi, 'name', val)}
                                  placeholder="Nom du Poste"
                                  className="flex-1 font-bold text-sm text-indigo-300 bg-transparent outline-none border-b border-transparent hover:border-white/10 focus:border-indigo-500 transition-colors min-w-[120px]"
                                />
                                <div className="flex flex-1 gap-1 relative">
                                  <DebouncedInput 
                                    value={pos.details || ''} 
                                    onChange={(val: string) => updatePositionField(ci, pi, 'details', val)}
                                    placeholder="📝 Détails..."
                                    className="w-1/2 px-2 py-0.5 text-[11px] text-slate-300 bg-black/40 rounded outline-none border border-white/5 focus:border-indigo-500/50 hover:bg-black/60 transition-colors"
                                  />
                                  <DebouncedInput 
                                    value={pos.equipment || ''} 
                                    onChange={(val: string) => updatePositionField(ci, pi, 'equipment', val)}
                                    placeholder="🦺 Matériel..."
                                    className="w-1/2 px-2 py-0.5 text-[11px] text-slate-300 bg-black/40 rounded outline-none border border-white/5 focus:border-amber-500/50 hover:bg-black/60 transition-colors"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1 lg:ml-auto shrink-0">
                                {pi > 0 && (
                                  <button onClick={() => movePositionUp(ci, pi)} className="text-[10px] px-1.5 py-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Monter">
                                    ↑
                                  </button>
                                )}
                                {pi < (cat.positions.length - 1) && (
                                  <button onClick={() => movePositionDown(ci, pi)} className="text-[10px] px-1.5 py-1 text-slate-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Descendre">
                                    ↓
                                  </button>
                                )}
                                <button onClick={() => addTimeSlot(ci, pi)} className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-1 rounded hover:bg-teal-500/30 hover:text-white transition-colors font-medium whitespace-nowrap">
                                  + Créneau
                                </button>
                                <button onClick={() => duplicatePosition(ci, pi)} className="text-[10px] px-1.5 py-1 text-indigo-400 hover:bg-indigo-500/20 rounded transition-colors" title="Dupliquer">
                                  📄
                                </button>
                                <button onClick={() => { if(confirm('Supprimer ce poste ?')) removePosition(ci, pi); }} className="text-[10px] px-1.5 py-1 text-rose-400 hover:bg-rose-500/20 rounded transition-colors" title="Supprimer">
                                  🗑️
                                </button>
                              </div>
                            </div>

                            <div className="p-1.5 space-y-1 bg-black/10">
                              {pos.timeSlots.length === 0 && <p className="text-[10px] text-slate-500 italic px-1">Aucun bénévole affecté.</p>}
                              {(pos.timeSlots || []).map((slot, si) => (
                                <div key={si} className="bg-black/20 p-1 rounded-sm border border-white/5 flex flex-wrap items-center gap-1.5 hover:border-white/10 transition-colors">
                                  <div className="flex-1 flex flex-wrap gap-1 items-center min-w-[150px] sm:mr-1 sm:pr-1 sm:border-r border-white/10">
                                    {Array.isArray(slot.volunteer) && slot.volunteer.map(vid => {
                                      const v = volunteers.find(x => x.id === vid);
                                      const isResp = pos.responsableId === vid;
                                      return v ? (
                                        <span key={vid} className={`border text-[10px] px-1 py-0.5 rounded-sm flex items-center gap-1 font-medium transition-colors ${isResp ? 'bg-amber-500/20 border-amber-500/40 text-amber-200' : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200'}`}>
                                          <button 
                                            onClick={() => togglePositionResponsable(ci, pi, vid)} 
                                            className={`transition-opacity hover:opacity-100 leading-none ${isResp ? 'opacity-100 text-amber-400' : 'opacity-40 grayscale'}`}
                                            title="Responsable du poste"
                                          >
                                            ⭐
                                          </button>
                                          {v.firstName} {v.lastName}
                                          <button onClick={() => removeVolunteerFromSlot(ci, pi, si, vid)} className="hover:text-rose-400 ml-0.5 transition-colors leading-none">✕</button>
                                        </span>
                                      ) : null;
                                    })}
                                    <VolunteerCombobox 
                                      volunteers={volunteers}
                                      currentSlot={slot}
                                      eventDetails={selectedEvent}
                                      onSelect={(val: string) => updateTimeSlot(ci, pi, si, 'volunteer', val)}
                                    />
                                  </div>

                                  <select value={slot.day} onChange={e => updateTimeSlot(ci, pi, si, 'day', e.target.value)} className="p-0.5 px-1 text-[11px] rounded-sm border border-white/10 bg-slate-800 text-white outline-none focus:border-indigo-500 transition-colors w-[80px]">
                                    <option value="">Jour</option>
                                    {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                                  
                                  <DebouncedInput 
                                    value={slot.timeSlot} 
                                    onChange={(val: string) => updateTimeSlot(ci, pi, si, 'timeSlot', val)}
                                    placeholder="09h00-12h00"
                                    className="p-0.5 px-1 text-[11px] rounded-sm border border-white/10 bg-slate-800 text-white w-[80px] outline-none focus:border-indigo-500 transition-colors text-center"
                                  />
                                  
                                  <button onClick={() => deleteTimeSlot(ci, pi, si)} className="text-rose-400/50 hover:text-rose-400 px-1 rounded transition-colors ml-auto text-xs" title="Supprimer créneau">
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
