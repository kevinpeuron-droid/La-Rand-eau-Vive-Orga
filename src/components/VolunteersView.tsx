import React, { useState } from 'react';
import Papa from 'papaparse';
import { useData } from '../contexts/DataContext';
import { Volunteer } from '../types';

export default function VolunteersView() {
  const { volunteers, associations, addVolunteer, deleteVolunteer, updateVolunteer, addAssociation, deleteAssociation } = useData();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', license: '', lastRole: '', group: '' });
  const [showAssociationsManager, setShowAssociationsManager] = useState(false);
  const [newAssocName, setNewAssocName] = useState('');

  const handleAddAssociation = async () => {
    if (!newAssocName.trim()) return;
    await addAssociation({ name: newAssocName.trim() });
    setNewAssocName('');
  };

  const handleAdd = async () => {
    if (!form.firstName || !form.lastName) return alert('Prénom et nom requis');
    await addVolunteer({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      license: form.license,
      lastRole: form.lastRole,
      group: form.group,
      isOrganizer: false,
      isReferent: false,
      availability: [],
      childIds: []
    });
    setForm({ firstName: '', lastName: '', email: '', phone: '', license: '', lastRole: '', group: '' });
  };

  const handleExportCSV = () => {
    const headers = ['firstName', 'lastName', 'email', 'phone', 'license', 'lastRole', 'group', 'isOrganizer', 'isReferent'];
    const csvContent = [
      headers.join(','),
      ...volunteers.map(v => [
        v.firstName, v.lastName, v.email || '', v.phone || '', v.license || '', v.lastRole || '', v.group || '', v.isOrganizer ? '1' : '0', v.isReferent ? '1' : '0'
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

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const importPromises = [];
        for (const row of results.data as any[]) {
          if (row.firstName && row.lastName) {
            importPromises.push(
              addVolunteer({
                firstName: row.firstName.trim(),
                lastName: row.lastName.trim(),
                email: row.email?.trim() || '',
                phone: row.phone?.trim() || '',
                license: row.license?.trim() || '',
                lastRole: row.lastRole?.trim() || '',
                group: row.group?.trim() || row.groupe?.trim() || row.association?.trim() || '',
                isOrganizer: row.isOrganizer === '1' || row.isOrganizer?.toString().toLowerCase() === 'true',
                isReferent: row.isReferent === '1' || row.isReferent?.toString().toLowerCase() === 'true',
                availability: [],
                childIds: [],
              })
            );
          }
        }
        try {
          await Promise.all(importPromises);
          alert('Import terminé !');
        } catch (error) {
          console.error("Erreur lors de l'import:", error);
          alert("Erreur lors de l'import des données. Veuillez vérifier le format de votre fichier.");
        } finally {
          e.target.value = ''; // reset
        }
      },
      error: (error) => {
        console.error("Erreur de parsing CSV:", error);
        alert("Le format du fichier n'a pas pu être lu.");
        e.target.value = '';
      }
    });
  };

  const [viewMode, setViewMode] = useState<'alphabetical' | 'grouped'>('grouped');

  const filtered = volunteers.filter(v => 
    v.firstName.toLowerCase().includes(search.toLowerCase()) || 
    v.lastName.toLowerCase().includes(search.toLowerCase())
  ).sort((a,b) => a.lastName.localeCompare(b.lastName, 'fr'));

  const organizers = filtered.filter(v => v.isOrganizer);
  const referents = filtered.filter(v => v.isReferent && !v.isOrganizer);
  const regular = filtered.filter(v => !v.isOrganizer && !v.isReferent);
  
  const allGroupsSet = new Set([
    ...associations.map(a => a.name.trim()),
    ...volunteers.map(v => (v.group || '').trim())
  ].filter(Boolean));
  const allGroups = Array.from(allGroupsSet).sort((a, b) => a.localeCompare(b, 'fr'));


  const renderList = (title: string, list: Volunteer[], themeClass: string) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
        <div className={`${themeClass} text-white px-5 py-3 rounded-lg mb-4 font-bold flex justify-between items-center`}>
          <span>{title}</span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm">{list.length}</span>
        </div>
        <div className="flex flex-col gap-2">
          {list.map(v => (
            <VolunteerCard key={v.id} volunteer={v} onUpdate={updateVolunteer} onDelete={deleteVolunteer} allGroups={allGroups} />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Email</label>
              <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} type="email" className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="jean@email.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Téléphone</label>
              <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="06 12 34 56 78" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Permis / Licence</label>
              <input value={form.license} onChange={e=>setForm({...form, license: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="B / FFC 12345" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Dernier rôle</label>
              <input value={form.lastRole} onChange={e=>setForm({...form, lastRole: e.target.value})} className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors" placeholder="Signaleur" />
            </div>
            <div>
              <div className="flex justify-between items-end mb-1">
                <label className="block text-sm font-semibold text-slate-300">Association / Groupe</label>
                <button 
                  onClick={() => setShowAssociationsManager(!showAssociationsManager)} 
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {showAssociationsManager ? 'Fermer' : 'Gérer les asso...'}
                </button>
              </div>
              <select 
                value={form.group} 
                onChange={e=>setForm({...form, group: e.target.value})} 
                className="w-full p-2.5 border border-white/10 rounded-xl bg-white/5 text-white focus:border-indigo-500 outline-none transition-colors"
              >
                <option value="">-- Aucune --</option>
                {associations.map(a => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          {showAssociationsManager && (
            <div className="bg-black/20 p-4 rounded-xl border border-white/10 mt-2 slide-in-from-top-1 animate-in fade-in">
              <h3 className="text-sm font-semibold text-white mb-3">Gestion des Associations / Groupes</h3>
              <div className="flex gap-2 mb-3">
                <input 
                  value={newAssocName} 
                  onChange={e => setNewAssocName(e.target.value)}
                  placeholder="Nouvelle association..." 
                  className="flex-1 p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm focus:border-indigo-500 outline-none"
                />
                <button onClick={handleAddAssociation} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">Ajouter</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {associations.length === 0 && <span className="text-xs text-slate-400 italic">Aucune association définie</span>}
                {associations.map(a => (
                  <div key={a.id} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-md text-xs text-white">
                    {a.name}
                    <button onClick={() => { if(confirm('Supprimer cette association ?')) deleteAssociation(a.id); }} className="text-slate-400 hover:text-rose-400 ml-1 text-[10px]">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="pt-2 flex flex-wrap gap-2">
            <button onClick={handleAdd} className="bg-indigo-600 shadow-lg shadow-indigo-600/20 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-500 transition-colors">➕ Ajouter le bénévole</button>
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
        <div className="flex gap-2">
          <button onClick={() => setViewMode('alphabetical')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm border ${viewMode === 'alphabetical' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'}`}>
            🔤 Alphabétique
          </button>
          <button onClick={() => setViewMode('grouped')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm border ${viewMode === 'grouped' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'}`}>
            👥 Par Association
          </button>
        </div>
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Rechercher un bénévole..." 
          className="w-full mt-4 p-4 mb-6 border border-white/10 rounded-2xl bg-white/5 text-white focus:border-indigo-500 outline-none shadow-sm transition-colors"
        />
        
        {viewMode === 'alphabetical' ? (
          renderList('Tous les Bénévoles', filtered, 'bg-indigo-500/20')
        ) : (
          <>
            {renderList('👔 Organisateurs', organizers, 'bg-amber-500/20')}
            {renderList('⭐ Référents', referents, 'bg-rose-500/20')}
            {/* Render grouped volunteers for regular ones */}
            {(() => {
              const grouped: Record<string, Volunteer[]> = {};
              const withoutGroup: Volunteer[] = [];
              regular.forEach(v => {
                const g = (v.group || '').trim();
                if (g) {
                  if (!grouped[g]) grouped[g] = [];
                  grouped[g].push(v);
                } else {
                  withoutGroup.push(v);
                }
              });
              const allElements = [];
              for (const [gName, list] of Object.entries(grouped)) {
                allElements.push(renderList(`👥 Groupe: ${gName}`, list, 'bg-teal-500/20'));
              }
              if (withoutGroup.length > 0 || regular.length === 0) {
                allElements.push(renderList('👥 Bénévoles (sans groupe)', withoutGroup, 'bg-indigo-500/20'));
              }
              return allElements;
            })()}
          </>
        )}
        
        {filtered.length === 0 && <p className="text-center text-slate-500 py-10 italic">Aucun résultat trouvé.</p>}
      </div>
    </div>
  );
}

function VolunteerCard({ volunteer: v, onUpdate, onDelete, allGroups }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
      <div className={`bg-slate-800 p-4 rounded-xl border border-indigo-400 border-l-[4px] shadow-sm`}>
        <div className="space-y-2">
           <input value={editForm.firstName} onChange={e=>setEditForm({...editForm, firstName: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Prénom" />
           <input value={editForm.lastName} onChange={e=>setEditForm({...editForm, lastName: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Nom" />
           <input value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Email" />
           <input value={editForm.phone} onChange={e=>setEditForm({...editForm, phone: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Téléphone" />
           <input value={editForm.license} onChange={e=>setEditForm({...editForm, license: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Permis / Licence" />
           <input value={editForm.lastRole} onChange={e=>setEditForm({...editForm, lastRole: e.target.value})} className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500" placeholder="Dernier Rôle" />
           <select 
             value={editForm.group} 
             onChange={e=>setEditForm({...editForm, group: e.target.value})} 
             className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500"
           >
             <option value="">-- Sans groupe --</option>
             {allGroups.map((g: string) => (
               <option key={g} value={g}>{g}</option>
             ))}
           </select>
           <textarea 
             value={editForm.ideas || ''} 
             onChange={e=>setEditForm({...editForm, ideas: e.target.value})} 
             className="w-full p-2 border border-white/10 rounded-lg bg-white/5 text-white text-sm outline-none focus:border-indigo-500 min-h-[80px]" 
             placeholder="Idées / Suggestions" 
           />
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={handleSave} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded-lg text-xs font-semibold transition-colors">💾 Enregistrer</button>
          <button onClick={() => { setEditForm(v); setIsEditing(false); }} className="flex-1 bg-white/10 hover:bg-white/20 text-slate-300 py-1.5 rounded-lg text-xs font-semibold transition-colors">✕ Annuler</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-lg p-3 rounded-xl border border-white/10 border-l-[4px] ${borderClass} hover:bg-white/10 transition-all group`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div 
          className="flex-1 cursor-pointer flex items-center gap-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h3 className={`font-semibold text-base ${titleClass} flex items-center gap-1.5`}>
            {v.firstName} {v.lastName}
            {isOrg && <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded text-[10px] font-bold">👔</span>}
            {isRef && !isOrg && <span className="bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold">⭐</span>}
          </h3>
          <span className="text-slate-500 text-xs">{isExpanded ? '▼' : '▶'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={v.group || ''}
            onChange={e => onUpdate(v.id, { group: e.target.value })}
            className="p-1 px-2 text-xs rounded-md border border-white/10 bg-black/30 text-white outline-none focus:border-indigo-500 transition-colors w-[120px]"
          >
            <option value="">-- Sans groupe --</option>
            {allGroups.map((g: string) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button onClick={() => { setEditForm(v); setIsEditing(true); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white p-1 text-sm bg-white/5 rounded-md">📝</button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-white/10 animate-in slide-in-from-top-1 fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
            {v.email && <p className="text-xs text-slate-300">📧 {v.email}</p>}
            {v.phone && <p className="text-xs text-slate-300">📱 {v.phone}</p>}
            {v.license && <p className="text-xs text-slate-300">🪪 {v.license}</p>}
            {v.lastRole && <p className="text-xs text-slate-300">🎯 {v.lastRole}</p>}
            {localStorage.getItem('mymap_url') && (
              <a href={localStorage.getItem('mymap_url') || '#'} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                🗺️ Voir sur la carte
              </a>
            )}
          </div>
          
          {v.ideas && (
            <div className="mb-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                💡 Idées / Suggestions
              </h4>
              <p className="text-xs text-slate-300 whitespace-pre-wrap">{v.ideas}</p>
            </div>
          )}

          <div className="flex gap-3 p-2 bg-black/20 rounded-lg flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white">
              <input type="checkbox" checked={v.isOrganizer} onChange={e => onUpdate(v.id, { isOrganizer: e.target.checked })} className="accent-indigo-500" />
              👔 Organisateur
            </label>
            <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer hover:text-white">
              <input type="checkbox" checked={v.isReferent} onChange={e => onUpdate(v.id, { isReferent: e.target.checked })} className="accent-indigo-500" />
              ⭐ Référent
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={() => { if(confirm('Supprimer ?')) onDelete(v.id); }} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-rose-500/10 hover:border-rose-500/30">🗑️ Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}
