import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, Position, TimeSlot } from '../types';

export default function PlanningView() {
  const { events, volunteers, updateEvent } = useData();
  const [selectedEventId, setSelectedEventId] = useState('');

  const event = events.find(e => e.id === selectedEventId);

  const addCategory = async () => {
    if (!event) return;
    const name = prompt('Nom de la catégorie :');
    if (!name || !name.trim()) return;
    const newCats = [...(event.categories || []), { name: name.trim(), positions: [] }];
    await updateEvent(event.id, { categories: newCats });
  };

  const addPosition = async (catIndex: number) => {
    if (!event) return;
    const newCats = [...event.categories];
    newCats[catIndex].positions.push({ name: 'Nouveau Poste', timeSlots: [] });
    await updateEvent(event.id, { categories: newCats });
  };

  const updatePositionName = async (catIndex: number, posIndex: number, newName: string) => {
    if (!event) return;
    const newCats = [...event.categories];
    newCats[catIndex].positions[posIndex].name = newName;
    await updateEvent(event.id, { categories: newCats });
  };

  const addTimeSlot = async (catIndex: number, posIndex: number) => {
    if (!event) return;
    const newCats = [...event.categories];
    newCats[catIndex].positions[posIndex].timeSlots.push({ day: '', timeSlot: '09h00-12h00', volunteer: [] });
    await updateEvent(event.id, { categories: newCats });
  };

  const updateTimeSlot = async (catIndex: number, posIndex: number, slotIndex: number, field: 'day' | 'timeSlot' | 'volunteer', val: any) => {
    if (!event) return;
    const newCats = [...event.categories];
    const slot = newCats[catIndex].positions[posIndex].timeSlots[slotIndex];
    if (field === 'volunteer') {
      if (!Array.isArray(slot.volunteer)) slot.volunteer = slot.volunteer ? [slot.volunteer as unknown as string] : [];
      if (val && !slot.volunteer.includes(val)) slot.volunteer.push(val);
    } else {
      (slot as any)[field] = val;
    }
    await updateEvent(event.id, { categories: newCats });
  };

  const removeVolunteerFromSlot = async (catIndex: number, posIndex: number, slotIndex: number, volId: string) => {
    if (!event) return;
    const newCats = [...event.categories];
    const slot = newCats[catIndex].positions[posIndex].timeSlots[slotIndex];
    if (Array.isArray(slot.volunteer)) {
      slot.volunteer = slot.volunteer.filter(id => id !== volId);
    }
    await updateEvent(event.id, { categories: newCats });
  };

  const deleteTimeSlot = async (catIndex: number, posIndex: number, slotIndex: number) => {
    if (!event) return;
    const newCats = [...event.categories];
    newCats[catIndex].positions[posIndex].timeSlots.splice(slotIndex, 1);
    await updateEvent(event.id, { categories: newCats });
  };

  const DAYS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-white m-0">🗓️ Planning & Pilotage</h2>
        <select 
          value={selectedEventId} 
          onChange={e => setSelectedEventId(e.target.value)}
          className="p-3 border border-white/10 bg-white/5 backdrop-blur-lg rounded-xl font-medium text-white min-w-[250px] outline-none focus:border-indigo-500 transition-colors appearance-none"
        >
          <option value="" className="bg-slate-800">-- Choisir un événement --</option>
          {events.map(e => <option key={e.id} value={e.id} className="bg-slate-800">{e.name}</option>)}
        </select>
      </div>

      {!event ? (
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-10 text-center text-slate-400 border border-white/10">
          Sélectionnez un événement pour afficher le planning.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex gap-4">
            <button onClick={addCategory} className="bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-500 transition-colors">
              ➕ Ajouter Catégorie
            </button>
          </div>

          {(event.categories || []).map((cat, ci) => (
            <div key={ci} className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 border-l-[4px] border-l-indigo-400 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-indigo-400 m-0">📋 {cat.name}</h3>
                <button onClick={() => addPosition(ci)} className="bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/10 hover:text-white transition-colors">
                  ➕ Créer un Poste
                </button>
              </div>

              <div className="space-y-4">
                {(cat.positions || []).map((pos, pi) => (
                  <div key={pi} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <input 
                        value={pos.name} 
                        onChange={e => updatePositionName(ci, pi, e.target.value)}
                        className="flex-1 font-semibold text-white bg-transparent outline-none border-b border-white/10 focus:border-indigo-500 px-2 py-1 transition-colors"
                      />
                      <button onClick={() => addTimeSlot(ci, pi)} className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 hover:text-white transition-colors font-semibold">
                        ➕ Créneau
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(pos.timeSlots || []).map((slot, si) => (
                        <div key={si} className="bg-white/5 p-3 rounded-xl border border-white/10 flex flex-wrap items-center gap-3">
                          <select value={slot.day} onChange={e => updateTimeSlot(ci, pi, si, 'day', e.target.value)} className="p-2 text-xs rounded-lg border border-white/10 bg-slate-800 text-white outline-none focus:border-indigo-500 transition-colors">
                            <option value="">-- Jour --</option>
                            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          
                          <input 
                            value={slot.timeSlot} 
                            onChange={e => updateTimeSlot(ci, pi, si, 'timeSlot', e.target.value)}
                            placeholder="Ex: 09h00-12h00"
                            className="p-2 text-xs rounded-lg border border-white/10 bg-slate-800 text-white w-28 outline-none focus:border-indigo-500 transition-colors"
                          />
                          
                          <span className="text-indigo-400 font-bold">→</span>
                          
                          <div className="flex-1 flex flex-wrap gap-2 items-center min-w-[200px]">
                            {Array.isArray(slot.volunteer) && slot.volunteer.map(vid => {
                              const v = volunteers.find(x => x.id === vid);
                              return v ? (
                                <span key={vid} className="bg-indigo-500 text-white text-[11px] px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium shadow-sm">
                                  {v.firstName} {v.lastName}
                                  <button onClick={() => removeVolunteerFromSlot(ci, pi, si, vid)} className="hover:text-rose-300 ml-1 transition-colors">✕</button>
                                </span>
                              ) : null;
                            })}
                            <select 
                              onChange={e => {
                                updateTimeSlot(ci, pi, si, 'volunteer', e.target.value);
                                e.target.value = "";
                              }} 
                              className="p-2 text-xs rounded-lg border border-white/10 bg-slate-800 text-slate-300 shadow-sm outline-none focus:border-indigo-500 transition-colors"
                            >
                              <option value="">+ Ajouter bénévole</option>
                              {volunteers.map(v => (
                                <option key={v.id} value={v.id}>{v.firstName} {v.lastName}</option>
                              ))}
                            </select>
                          </div>
                          
                          <button onClick={() => deleteTimeSlot(ci, pi, si)} className="text-rose-400 hover:bg-rose-500/20 p-2 rounded-lg transition-colors border border-transparent hover:border-rose-500/30" title="Supprimer créneau">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
