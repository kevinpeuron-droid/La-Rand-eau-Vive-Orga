import { useState } from 'react';
import { useData } from '../contexts/DataContext';

function ChildCard({ child: c, volunteers, onUpdate, onDelete }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: c.firstName, lastName: c.lastName, class: c.class, volunteerId: c.volunteerId });

  const assignedVol = c.volunteerId ? volunteers.find((v: any) => v.id === c.volunteerId) : null;

  const handleSave = () => {
    onUpdate(c.id, editForm);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-slate-800 p-5 rounded-2xl border border-blue-400 border-l-[4px] shadow-sm flex flex-col">
        <div className="space-y-3">
          <input value={editForm.firstName} onChange={e=>setEditForm({...editForm, firstName: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-blue-500" placeholder="Prénom" />
          <input value={editForm.lastName} onChange={e=>setEditForm({...editForm, lastName: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-blue-500" placeholder="Nom" />
          <select value={editForm.class} onChange={e=>setEditForm({...editForm, class: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-blue-500 appearance-none">
            <option value="" className="bg-slate-800">-- Classe --</option>
            {['TPS','PS','MS','GS','CP','CE1','CE2','CM1','CM2'].map(cls => <option key={cls} value={cls} className="bg-slate-800">{cls}</option>)}
          </select>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors">💾 Enregistrer</button>
          <button onClick={() => { setEditForm({ firstName: c.firstName, lastName: c.lastName, class: c.class, volunteerId: c.volunteerId }); setIsEditing(false); }} className="flex-1 bg-white/10 hover:bg-white/20 text-slate-300 py-2 rounded-xl text-xs font-semibold transition-colors">✕ Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 border-l-[4px] border-l-blue-400 hover:bg-white/10 transition-all flex flex-col group">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-lg text-blue-400 mb-1">{c.firstName} {c.lastName}</h3>
        <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white p-1">📝</button>
      </div>
      {c.class && <p className="text-sm text-slate-300 mb-3">🏫 {c.class}</p>}
      
      <div className="mt-auto pt-4 border-t border-white/10">
        <label className="block text-xs font-semibold text-slate-400 mb-2">👤 Bénévole rattaché :</label>
        <select 
          value={c.volunteerId || ''} 
          onChange={e => onUpdate(c.id, { volunteerId: e.target.value || null })}
          className="w-full p-2 text-sm border border-white/10 rounded-xl bg-white/5 text-white outline-none focus:border-indigo-500 transition-colors appearance-none"
        >
          <option value="" className="bg-slate-800">Aucun</option>
          {volunteers.map((v: any) => <option key={v.id} value={v.id} className="bg-slate-800">{v.firstName} {v.lastName}</option>)}
        </select>
        {assignedVol && (
          <p className="text-xs text-green-400 font-medium mt-2">✅ {assignedVol.firstName} {assignedVol.lastName}</p>
        )}
      </div>
      
      <button onClick={() => { if(confirm('Supprimer ?')) onDelete(c.id); }} className="mt-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2 rounded-xl text-xs font-semibold transition-colors border border-rose-500/10 hover:border-rose-500/30">
        🗑️ Supprimer
      </button>
    </div>
  );
}

export default function ChildrenView() {
  const { children, volunteers, addChild, updateChild, deleteChild } = useData();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', class: '', volunteerId: '' });

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName) return alert('Prénom et nom requis');
    await addChild({
      firstName: form.firstName,
      lastName: form.lastName,
      class: form.class,
      volunteerId: form.volunteerId || null
    });
    setForm({ firstName: '', lastName: '', class: '', volunteerId: '' });
  };

  const filtered = children.filter(c => 
    c.firstName.toLowerCase().includes(search.toLowerCase()) || 
    c.lastName.toLowerCase().includes(search.toLowerCase()) ||
    c.class.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => a.lastName.localeCompare(b.lastName, 'fr'));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Ajouter un Élève</h2>
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Prénom *</label>
              <input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Emma" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Nom *</label>
              <input value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Martin" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Classe</label>
              <select value={form.class} onChange={e=>setForm({...form, class: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors appearance-none">
                <option value="" className="bg-slate-800">-- Choisir --</option>
                {['TPS','PS','MS','GS','CP','CE1','CE2','CM1','CM2'].map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Bénévole associé (Optionnel)</label>
              <select value={form.volunteerId} onChange={e=>setForm({...form, volunteerId: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors appearance-none">
                <option value="" className="bg-slate-800">-- Aucun --</option>
                {volunteers.map(v => <option key={v.id} value={v.id} className="bg-slate-800">{v.firstName} {v.lastName}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-2">
            <button onClick={handleAdd} className="bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-500 transition-colors">➕ Ajouter</button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Liste des Élèves</h2>
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un élève..." 
          className="w-full p-4 mb-6 border border-white/10 rounded-2xl bg-white/5 text-white focus:border-indigo-500 outline-none shadow-sm transition-colors"
        />

        {filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-10 italic">Aucun élève trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(c => (
              <ChildCard key={c.id} child={c} volunteers={volunteers} onUpdate={updateChild} onDelete={deleteChild} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
