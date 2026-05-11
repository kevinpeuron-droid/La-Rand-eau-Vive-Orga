import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Volunteer } from '../types';

export default function VolunteersView() {
  const { volunteers, children, addVolunteer, deleteVolunteer, updateVolunteer } = useData();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', license: '', lastRole: '' });

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName) return alert('Prénom et nom requis');
    await addVolunteer({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      license: form.license,
      lastRole: form.lastRole,
      isOrganizer: false,
      isReferent: false,
      availability: [],
      childIds: []
    });
    setForm({ firstName: '', lastName: '', email: '', phone: '', license: '', lastRole: '' });
  };

  const handleExportCSV = () => {
    const headers = ['firstName', 'lastName', 'email', 'phone', 'license', 'lastRole', 'isOrganizer', 'isReferent'];
    const csvContent = [
      headers.join(','),
      ...volunteers.map(v => [
        v.firstName, v.lastName, v.email || '', v.phone || '', v.license || '', v.lastRole || '', v.isOrganizer ? '1' : '0', v.isReferent ? '1' : '0'
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'benevoles.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values: string[] = [];
        let inQuotes = false;
        let currentValue = "";
        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"' && lines[i][j+1] === '"') {
                currentValue += '"'; j++;
            } else if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue);
                currentValue = "";
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue);

        const row = values;
        const vol: any = {};
        headers.forEach((h, index) => vol[h] = row[index] || '');
        
        if (vol.firstName && vol.lastName) {
           await addVolunteer({
              firstName: vol.firstName,
              lastName: vol.lastName,
              email: vol.email || '',
              phone: vol.phone || '',
              license: vol.license || '',
              lastRole: vol.lastRole || '',
              isOrganizer: vol.isOrganizer === '1',
              isReferent: vol.isReferent === '1',
              availability: [],
              childIds: []
           });
        }
      }
      e.target.value = ''; // reset
      alert('Import terminé !');
    };
    reader.readAsText(file);
  };

  const filtered = volunteers.filter(v => 
    v.firstName.toLowerCase().includes(search.toLowerCase()) || 
    v.lastName.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => a.lastName.localeCompare(b.lastName, 'fr'));

  const organizers = filtered.filter(v => v.isOrganizer);
  const referents = filtered.filter(v => v.isReferent && !v.isOrganizer);
  const regular = filtered.filter(v => !v.isOrganizer && !v.isReferent);


  const renderList = (title: string, list: Volunteer[], themeClass: string) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
        <div className={`${themeClass} text-white px-5 py-3 rounded-lg mb-4 font-bold flex justify-between items-center`}>
          <span>{title}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{list.length}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map(v => (
            <VolunteerCard key={v.id} volunteer={v} onUpdate={updateVolunteer} onDelete={deleteVolunteer} allChildren={children} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Ajouter un Bénévole</h2>
        <div className="bg-white/5 backdrop-blur-lg p-6 rounded-2xl border border-white/10 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Prénom *</label>
              <input value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Jean" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Nom *</label>
              <input value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Dupont" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Email</label>
              <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} type="email" className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="jean@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Téléphone</label>
              <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="06 12 34 56 78" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Dernier rôle</label>
              <input value={form.lastRole} onChange={e=>setForm({...form, lastRole: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Signaleur" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Permis / Licence</label>
              <input value={form.license} onChange={e=>setForm({...form, license: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="B / FFC 12345" />
            </div>
          </div>
          <div className="pt-2 flex flex-wrap gap-2">
            <button onClick={handleAdd} className="bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-500 transition-colors">➕ Ajouter</button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white">Liste des Bénévoles</h2>
          <div className="flex gap-2">
            <label className="bg-slate-800 text-slate-300 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 cursor-pointer transition-colors shadow-sm">
              📥 Import CSV
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
            </label>
            <button onClick={handleExportCSV} className="bg-slate-800 text-slate-300 border border-white/10 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors shadow-sm">
              📤 Export CSV
            </button>
          </div>
        </div>
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un bénévole..." 
          className="w-full p-4 mb-6 border border-white/10 rounded-2xl bg-white/5 text-white focus:border-indigo-500 outline-none shadow-sm transition-colors"
        />
        
        {renderList('👔 Organisateurs', organizers, 'bg-amber-500/20')}
        {renderList('⭐ Référents', referents, 'bg-rose-500/20')}
        {renderList('👥 Bénévoles', regular, 'bg-indigo-500/20')}
        
        {filtered.length === 0 && <p className="text-center text-slate-500 py-10 italic">Aucun résultat trouvé.</p>}
      </div>
    </div>
  );
}

function VolunteerCard({ volunteer: v, onUpdate, onDelete, allChildren }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(v);

  const isOrg = v.isOrganizer;
  const isRef = v.isReferent;
  
  const borderClass = isOrg ? 'border-amber-400' : isRef ? 'border-rose-400' : 'border-indigo-400';
  const titleClass = isOrg ? 'text-amber-400' : isRef ? 'text-rose-400' : 'text-indigo-400';

  const handleSave = () => {
    onUpdate(v.id, editForm);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`bg-slate-800 p-5 rounded-2xl border border-indigo-400 border-l-[4px] shadow-sm`}>
        <div className="space-y-3">
           <input value={editForm.firstName} onChange={e=>setEditForm({...editForm, firstName: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Prénom" />
           <input value={editForm.lastName} onChange={e=>setEditForm({...editForm, lastName: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Nom" />
           <input value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Email" />
           <input value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Téléphone" />
           <input value={editForm.license} onChange={e=>setEditForm({...editForm, license: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Permis / Licence" />
           <input value={editForm.lastRole} onChange={e=>setEditForm({...editForm, lastRole: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Dernier Rôle" />
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-semibold transition-colors">💾 Enregistrer</button>
          <button onClick={() => { setEditForm(v); setIsEditing(false); }} className="flex-1 bg-white/10 hover:bg-white/20 text-slate-300 py-2 rounded-xl text-xs font-semibold transition-colors">✕ Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-lg p-5 rounded-2xl border border-white/10 border-l-[4px] ${borderClass} hover:bg-white/10 transition-all group`}>
      <div className="flex justify-between items-start">
        <h3 className={`font-semibold text-lg mb-2 flex flex-wrap items-center gap-2 ${titleClass}`}>
          {v.firstName} {v.lastName}
          {isOrg && <span className="bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">👔</span>}
          {isRef && !isOrg && <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">⭐</span>}
        </h3>
        <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white p-1">📝</button>
      </div>
      {v.email && <p className="text-sm text-slate-300 mb-1">📧 {v.email}</p>}
      {v.phone && <p className="text-sm text-slate-300 mb-1">📱 {v.phone}</p>}
      {v.license && <p className="text-sm text-slate-300 mb-1">🪪 {v.license}</p>}
      {v.lastRole && <p className="text-sm text-slate-300 mb-2">🎯 {v.lastRole}</p>}
      
      <div className="flex gap-2 p-3 mt-4 bg-white/5 rounded-xl flex-wrap">
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
          <input type="checkbox" checked={v.isOrganizer} onChange={e => onUpdate(v.id, { isOrganizer: e.target.checked })} className="accent-indigo-500" />
          👔 Organisateur
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white">
          <input type="checkbox" checked={v.isReferent} onChange={e => onUpdate(v.id, { isReferent: e.target.checked })} className="accent-indigo-500" />
          ⭐ Référent
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => { if(confirm('Supprimer ?')) onDelete(v.id); }} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2 rounded-xl text-xs font-semibold transition-colors border border-rose-500/10 hover:border-rose-500/30">🗑️ Supprimer</button>
      </div>
    </div>
  );
}
