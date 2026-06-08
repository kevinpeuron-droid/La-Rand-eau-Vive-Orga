import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Transaction, Contribution, Sponsor, BankLine, BudgetLine } from '../types';

export default function BudgetView() {
  const { 
    transactions = [], 
    budgetLines = [], 
    contributions = [], 
    sponsors = [], 
    bankLines = [], 
    addTransaction, 
    deleteTransaction, 
    updateTransaction,
    addContribution,
    updateContribution,
    deleteContribution,
    addSponsor,
    updateSponsor,
    deleteSponsor,
    addBankLine,
    updateBankLine,
    deleteBankLine,
    addBudgetLine,
    updateBudgetLine,
    deleteBudgetLine,
    seedBudgetData
  } = useData();

  const [activeTab, setActiveTab] = useState<'BILAN' | 'OPERATIONS' | 'POINTAGE' | 'VALORISATION' | 'SPONSORS'>('BILAN');

  // Operations state
  const [isAddingTx, setIsAddingTx] = useState(false);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [txForm, setTxForm] = useState<Partial<Transaction>>({ type: 'DEPENSE', date: new Date().toISOString().split('T')[0], status: 'REALIZED' });

  // Contributions state
  const [isAddingContrib, setIsAddingContrib] = useState(false);
  const [editingContribId, setEditingContribId] = useState<string | null>(null);
  const [contribForm, setContribForm] = useState<Partial<Contribution>>({});

  // Sponsors
  const [isAddingSponsor, setIsAddingSponsor] = useState(false);
  const [editingSponsorId, setEditingSponsorId] = useState<string | null>(null);
  const [sponsorForm, setSponsorForm] = useState<Partial<Sponsor>>({});

  // Budget Lines (Categories)
  const [isAddingBudgetLine, setIsAddingBudgetLine] = useState(false);
  const [editingBudgetLineId, setEditingBudgetLineId] = useState<string | null>(null);
  // We need to import BudgetLine in types.ts at top of file, we will do it next. 
  // Let's use any for now to avoid breaking or we can type it inline
  const [budgetLineForm, setBudgetLineForm] = useState<{section?: 'RECETTE' | 'DEPENSE', category?: string, label?: string}>({});

  // Pointage
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importTarget, setImportTarget] = useState<'OPERATIONS' | 'VALORISATION' | 'SPONSORS' | 'POINTAGE' | null>(null);

  // Summaries
  const { totalIncome, totalExpense, balance } = useMemo(() => {
    const inc = transactions.filter(t => t.type === 'RECETTE' || t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
    const exp = transactions.filter(t => t.type === 'DEPENSE' || t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
    return {
      totalIncome: inc,
      totalExpense: exp,
      balance: inc - exp
    };
  }, [transactions]);

  const { totalValorisation } = useMemo(() => {
    return {
      totalValorisation: contributions.reduce((acc, c) => acc + (c.quantity * c.unitValue), 0)
    };
  }, [contributions]);

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // === OPERATIONS FORM ===
  const resetTxForm = () => {
    setTxForm({ type: 'DEPENSE', date: new Date().toISOString().split('T')[0], status: 'REALIZED' });
    setIsAddingTx(false);
    setEditingTxId(null);
  };
  const saveTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.description && !txForm.title) return alert('Veuillez spécifier un intitulé');
    if (!txForm.amount) return alert('Montant requis');
    if (editingTxId) {
      await updateTransaction(editingTxId, txForm as unknown as Transaction);
    } else {
      await addTransaction({
        ...txForm, 
        amount: Number(txForm.amount),
        type: txForm.type as any,
        date: txForm.date || new Date().toISOString().split('T')[0],
      } as unknown as any);
    }
    resetTxForm();
  };

  // === CONTRIBUTIONS FORM ===
  const resetContribForm = () => {
    setContribForm({});
    setIsAddingContrib(false);
    setEditingContribId(null);
  };
  const saveContrib = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribForm.beneficiary || !contribForm.description || !contribForm.quantity || !contribForm.unitValue) return alert('Veuillez remplir tous les champs');
    if (editingContribId) {
      await updateContribution(editingContribId, contribForm as any);
    } else {
      await addContribution(contribForm as any);
    }
    resetContribForm();
  };

  // === SPONSOR FORM ===
  const resetSponsorForm = () => {
    setSponsorForm({});
    setIsAddingSponsor(false);
    setEditingSponsorId(null);
  };
  const saveSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sponsorForm.name) return alert('Le nom est requis');
    if (editingSponsorId) {
      await updateSponsor(editingSponsorId, sponsorForm as any);
    } else {
      await addSponsor(sponsorForm as any);
    }
    resetSponsorForm();
  };

  // === BUDGET LINE FORM ===
  const resetBudgetLineForm = () => {
    setBudgetLineForm({});
    setIsAddingBudgetLine(false);
    setEditingBudgetLineId(null);
  };
  const saveBudgetLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetLineForm.label || !budgetLineForm.category || !budgetLineForm.section) {
       return alert('Tous les champs sont requis (Section, Catégorie, Sous-catégorie)');
    }
    if (editingBudgetLineId) {
      await updateBudgetLine(editingBudgetLineId, budgetLineForm as Partial<BudgetLine>);
    } else {
      await addBudgetLine(budgetLineForm as Omit<BudgetLine, 'id'>);
    }
    resetBudgetLineForm();
  };

  // === CSV IMPORT FOR BANK LINES ===
  const handleImportCSV = async () => {
    if (!importText.trim()) return;
    const lines = importText.split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      // Simple parser: Date;Description;Amount
      const parts = line.split(';');
      if (parts.length >= 3) {
        await addBankLine({
          date: parts[0].trim(),
          description: parts[1].trim(),
          amount: parseFloat(parts[2].replace(',', '.')),
          pointed: false
        } as any);
      }
    }
    setImportText('');
    setIsImporting(false);
  };

  const startImport = (target: 'OPERATIONS' | 'VALORISATION' | 'SPONSORS' | 'POINTAGE') => {
    setImportTarget(target);
    if (importFileRef.current) {
      importFileRef.current.value = '';
      importFileRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) return alert("Fichier vide ou ne contient que les en-têtes.");
      
      const parsedLines = lines.slice(1).map(l => {
          let row = l.split(';');
          return row.map(cell => {
            let c = cell.trim();
            if (c.startsWith('"') && c.endsWith('"')) return c.substring(1, c.length - 1);
            return c;
          });
      });

      if (importTarget === 'OPERATIONS') {
         for (const parts of parsedLines) {
             if (parts.length >= 5) {
                 await addTransaction({
                     date: parts[0] || new Date().toISOString().split('T')[0],
                     title: parts[1] || '',
                     description: parts[1] || '',
                     amount: parseFloat(parts[2].replace(',', '.') || '0'),
                     type: (parts[3] as any) || 'DEPENSE',
                     category: parts[4] || '',
                     status: (parts[5] as any) || 'REALIZED'
                 } as any);
             }
         }
      } else if (importTarget === 'VALORISATION') {
         for (const parts of parsedLines) {
             if (parts.length >= 4) {
                 await addContribution({
                     beneficiary: parts[0] || '',
                     description: parts[1] || '',
                     quantity: parseFloat(parts[2].replace(',', '.') || '0'),
                     unitValue: parseFloat(parts[3].replace(',', '.') || '0')
                 } as any);
             }
         }
      } else if (importTarget === 'SPONSORS') {
         for (const parts of parsedLines) {
             if (parts.length >= 10) {
                 await addSponsor({
                     name: parts[0] || '',
                     contact: parts[1] || '',
                     email: parts[2] || '',
                     phone: parts[3] || '',
                     dateSent: parts[4] || '',
                     dateReminder: parts[5] || '',
                     amountPromised: parseFloat(parts[7].replace(/[^0-9,.-]/g, '').replace(',', '.') || '0'),
                     status: parts[8] || '',
                     datePayment: parts[9] || '',
                     notes: parts[10] || ''
                 } as any);
             } else if (parts.length >= 1) {
                 await addSponsor({
                     name: parts[0] || '',
                     contact: parts[1] || '',
                     email: parts[2] || '',
                     phone: parts[3] || '',
                     notes: parts[4] || ''
                 } as any);
             }
         }
      } else if (importTarget === 'POINTAGE') {
         for (const parts of parsedLines) {
             if (parts.length >= 3) {
                 await addBankLine({
                     date: parts[0],
                     description: parts[1],
                     amount: parseFloat(parts[2].replace(',', '.') || '0'),
                     pointed: false
                 } as any);
             }
         }
      }
      alert("Importation terminée !");
    };
    reader.readAsText(file);
  };

  const exportCSV = (filename: string, rows: (string | number)[][]) => {
    const csvContent = rows.map(e => e.map(cell => {
      if (cell === null || cell === undefined) return '""';
      let str = String(cell);
      if (str.includes(';') || str.includes('\n') || str.includes('"')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recettesByCat = useMemo(() => {
    const grouped: Record<string, typeof budgetLines> = {};
    for(const b of budgetLines.filter(x => x.section === 'RECETTE')) {
       if(!grouped[b.category]) grouped[b.category] = [];
       grouped[b.category].push(b);
    }
    return grouped;
  }, [budgetLines]);

  const depensesByCat = useMemo(() => {
    const grouped: Record<string, typeof budgetLines> = {};
    for(const b of budgetLines.filter(x => x.section === 'DEPENSE')) {
       if(!grouped[b.category]) grouped[b.category] = [];
       grouped[b.category].push(b);
    }
    return grouped;
  }, [budgetLines]);

  const exportBilanCSV = () => {
     const rows = [
        ["FICHE BUDGÉTAIRE"],
        [],
        ["PRODUITS (RECETTES)", "RÉALISÉ"]
     ];

     for(const [cat, lines] of Object.entries(recettesByCat)) {
         rows.push([cat.toUpperCase()]);
         let catTotal = 0;
         for(const bl of lines) {
            const amount = transactions.filter(t => t.budgetLineId === bl.id && (t.type === 'RECETTE' || t.type === 'INCOME')).reduce((acc, t) => acc + t.amount, 0);
            rows.push([bl.label, amount.toFixed(2).replace('.', ',') + " €"]);
            catTotal += amount;
         }
         rows.push(["TOTAL " + cat.toUpperCase(), catTotal.toFixed(2).replace('.', ',') + " €"]);
     }
     rows.push(["TOTAL DES PRODUITS", totalIncome.toFixed(2).replace('.', ',') + " €"]);
     rows.push([]);

     rows.push(["CHARGES (DÉPENSES)", "RÉALISÉ"]);
     for(const [cat, lines] of Object.entries(depensesByCat)) {
         rows.push([cat.toUpperCase()]);
         let catTotal = 0;
         for(const bl of lines) {
            const amount = transactions.filter(t => t.budgetLineId === bl.id && (t.type === 'DEPENSE' || t.type === 'EXPENSE')).reduce((acc, t) => acc + t.amount, 0);
            rows.push([bl.label, amount.toFixed(2).replace('.', ',') + " €"]);
            catTotal += amount;
         }
         rows.push(["TOTAL " + cat.toUpperCase(), catTotal.toFixed(2).replace('.', ',') + " €"]);
     }
     rows.push(["TOTAL DES CHARGES", totalExpense.toFixed(2).replace('.', ',') + " €"]);
     rows.push([]);

     rows.push(["VALORISATION", "MONTANT"]);
     for(const c of contributions) {
         rows.push([c.beneficiary + ' - ' + c.description, (c.quantity * c.unitValue).toFixed(2).replace('.', ',') + " €"]);
     }
     rows.push(["TOTAL VALORISATION", totalValorisation.toFixed(2).replace('.', ',') + " €"]);

     exportCSV("bilan_financier.csv", rows);
  };

  return (
    <div className="flex flex-col h-full gap-6 w-full max-w-7xl mx-auto">
      <input type="file" accept=".csv" className="hidden" ref={importFileRef} onChange={handleFileUpload} />
      <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-6 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">🪙 Gestion du Budget</h1>
          <p className="text-slate-400">Suivi financier, Sponsors, Valorisation & Opérations en direct</p>
        </div>
      </header>

      <div className="flex bg-black/40 p-1.5 rounded-xl border border-white/5 w-fit">
        {(['BILAN', 'OPERATIONS', 'POINTAGE', 'VALORISATION', 'SPONSORS'] as const).map(tab => (
           <button
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
           >
              {tab === 'BILAN' && '📊 Bilan Financier'}
              {tab === 'OPERATIONS' && '💳 Opérations en Direct'}
              {tab === 'POINTAGE' && '🏦 Pointage Bancaire'}
              {tab === 'VALORISATION' && '🤝 Valorisation'}
              {tab === 'SPONSORS' && '🏅 Sponsors'}
           </button>
        ))}
      </div>

      {activeTab === 'BILAN' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <p className="text-sm text-slate-400">Synthèse et suivi financier structuré Fiche Budgétaire.</p>
               <button onClick={exportBilanCSV} className="bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors border border-white/10 flex gap-2 items-center">
                  <span>📄</span> Exporter Bilan Complet (CSV)
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <p className="text-sm font-semibold tracking-wider uppercase text-teal-300/80 relative z-10 mb-2">Recettes</p>
                <h2 className="text-4xl font-bold text-teal-400 relative z-10">{totalIncome.toFixed(2)} €</h2>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <p className="text-sm font-semibold tracking-wider uppercase text-rose-300/80 relative z-10 mb-2">Dépenses</p>
                <h2 className="text-4xl font-bold text-rose-400 relative z-10">{totalExpense.toFixed(2)} €</h2>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <p className="text-sm font-semibold tracking-wider uppercase text-slate-300/80 relative z-10 mb-2">Résultat Opérationnel</p>
                <h2 className={`text-4xl font-bold relative z-10 ${balance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {balance >= 0 ? '+' : ''}{balance.toFixed(2)} €
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-teal-400 flex items-center gap-2">↑ Produits (Recettes)</h3>
                     <button onClick={() => { setBudgetLineForm({ section: 'RECETTE' }); setIsAddingBudgetLine(true); }} className="text-xs bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 px-3 py-1.5 rounded-lg border border-teal-500/20 transition-colors">
                        + Ajouter Catégorie
                     </button>
                  </div>
                  <div className="space-y-6">
                     {Object.entries(recettesByCat).map(([cat, lines]) => {
                        let catTotal = 0;
                        const renderedLines = lines.map(bl => {
                           const amount = transactions.filter(t => t.budgetLineId === bl.id && (t.type === 'RECETTE' || t.type === 'INCOME')).reduce((acc, t) => acc + t.amount, 0);
                           catTotal += amount;
                           return (
                              <div key={bl.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 group">
                                 <span className="text-slate-300 ml-4 flex items-center gap-2"><span className="text-teal-400/30">■</span>{bl.label}</span>
                                 <div className="flex items-center gap-2">
                                    <span className={`font-medium ${amount > 0 ? 'text-teal-400' : 'text-slate-500'}`}>+{amount.toFixed(2)} €</span>
                                    <button onClick={() => { setBudgetLineForm(bl as any); setEditingBudgetLineId(bl.id); setIsAddingBudgetLine(true); }} className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-indigo-400 transition-opacity">✏️</button>
                                    <button onClick={() => deleteBudgetLine(bl.id)} className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-rose-400 transition-opacity">🗑️</button>
                                 </div>
                              </div>
                           );
                        });
                        
                        return (
                           <div key={cat} className="space-y-3">
                              <div className="flex justify-between items-center text-sm font-bold text-teal-300 border-b border-teal-500/20 pb-2 group/cat">
                                 <div className="flex items-center gap-2">
                                     <span className="tracking-wide">{cat}</span>
                                     <button onClick={() => { setBudgetLineForm({ section: 'RECETTE', category: cat }); setIsAddingBudgetLine(true); }} className="opacity-0 group-hover/cat:opacity-100 text-xs bg-teal-500/10 text-teal-300 px-2 py-1 rounded transition-opacity" title="Ajouter une sous-catégorie">+ Sous-catégorie</button>
                                 </div>
                                 <span>{catTotal.toFixed(2)} €</span>
                              </div>
                              <div className="space-y-2 pt-1">
                                 {renderedLines}
                              </div>
                           </div>
                        );
                     })}
                     {Object.keys(recettesByCat).length === 0 && <p className="text-sm text-slate-500 pt-2">Aucune donnée de recette</p>}
                  </div>
               </div>

               <div className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl relative">
                  <div className="flex justify-between items-center mb-6">
                     <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2">↓ Charges (Dépenses)</h3>
                     <button onClick={() => { setBudgetLineForm({ section: 'DEPENSE' }); setIsAddingBudgetLine(true); }} className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-3 py-1.5 rounded-lg border border-rose-500/20 transition-colors">
                        + Ajouter Catégorie
                     </button>
                  </div>
                  <div className="space-y-6">
                     {Object.entries(depensesByCat).map(([cat, lines]) => {
                        let catTotal = 0;
                        const renderedLines = lines.map(bl => {
                           const amount = transactions.filter(t => t.budgetLineId === bl.id && (t.type === 'DEPENSE' || t.type === 'EXPENSE')).reduce((acc, t) => acc + t.amount, 0);
                           catTotal += amount;
                           return (
                              <div key={bl.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2 group">
                                 <span className="text-slate-300 ml-4 flex items-center gap-2"><span className="text-rose-400/30">■</span>{bl.label}</span>
                                 <div className="flex items-center gap-2">
                                    <span className={`font-medium ${amount > 0 ? 'text-rose-400' : 'text-slate-500'}`}>-{amount.toFixed(2)} €</span>
                                    <button onClick={() => { setBudgetLineForm(bl as any); setEditingBudgetLineId(bl.id); setIsAddingBudgetLine(true); }} className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-indigo-400 transition-opacity">✏️</button>
                                    <button onClick={() => deleteBudgetLine(bl.id)} className="opacity-0 group-hover:opacity-100 text-xs text-slate-500 hover:text-rose-400 transition-opacity">🗑️</button>
                                 </div>
                              </div>
                           );
                        });
                        
                        return (
                           <div key={cat} className="space-y-3">
                              <div className="flex justify-between items-center text-sm font-bold text-rose-300 border-b border-rose-500/20 pb-2 group/cat">
                                 <div className="flex items-center gap-2">
                                     <span className="tracking-wide">{cat}</span>
                                     <button onClick={() => { setBudgetLineForm({ section: 'DEPENSE', category: cat }); setIsAddingBudgetLine(true); }} className="opacity-0 group-hover/cat:opacity-100 text-xs bg-rose-500/10 text-rose-300 px-2 py-1 rounded transition-opacity" title="Ajouter une sous-catégorie">+ Sous-catégorie</button>
                                 </div>
                                 <span>{catTotal.toFixed(2)} €</span>
                              </div>
                              <div className="space-y-2 pt-1">
                                 {renderedLines}
                              </div>
                           </div>
                        );
                     })}
                     {Object.keys(depensesByCat).length === 0 && <p className="text-sm text-slate-500 pt-2">Aucune donnée de dépense</p>}
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'OPERATIONS' && (
         <div className="space-y-6">
           <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">Historique complet des transactions.</p>
              <div className="flex gap-2">
                 <button onClick={() => exportCSV("operations.csv", [
                    ["Date", "Intitule", "Montant", "Type", "Categorie", "Statut"],
                    ...sortedTransactions.map(t => [t.date, t.title || t.description || '', t.amount, t.type, t.category || '', t.status])
                 ])} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Export CSV</button>
                 <button onClick={() => startImport('OPERATIONS')} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Import CSV</button>
                 <button 
                    onClick={() => setIsAddingTx(true)} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors"
                 >
                    ➕ Saisie d'Opération
                 </button>
              </div>
           </div>

           <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/20 border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-semibold">Date</th>
                      <th className="p-4 font-semibold">Intitulé</th>
                      <th className="p-4 font-semibold">Catégorie Budgétaire</th>
                      <th className="p-4 font-semibold">Statut</th>
                      <th className="p-4 font-semibold text-right">Montant</th>
                      <th className="p-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {sortedTransactions.length === 0 && (
                       <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune opération enregistrée.</td></tr>
                    )}
                    {sortedTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 text-slate-300 text-sm whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="p-4 text-white font-medium">{tx.title || tx.description}</td>
                        <td className="p-4">
                           <span className="bg-black/40 border border-white/5 text-slate-300 px-2 py-1 rounded text-xs truncate max-w-[200px] block">
                             {tx.budgetLineId ? budgetLines.find(b => b.id === tx.budgetLineId)?.label || tx.category : tx.category || 'Non catégorisé'}
                           </span>
                        </td>
                        <td className="p-4">
                           <span className={`text-xs px-2 py-1 rounded-md border ${tx.status === 'REALIZED' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                             {tx.status === 'REALIZED' ? 'Réalisée' : 'En attente'}
                           </span>
                        </td>
                        <td className={`p-4 text-right font-bold whitespace-nowrap ${(tx.type === 'INCOME' || tx.type === 'RECETTE') ? 'text-teal-400' : 'text-rose-400'}`}>
                          {(tx.type === 'INCOME' || tx.type === 'RECETTE') ? '+' : '-'}{tx.amount.toFixed(2)} €
                        </td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setTxForm(tx as any); setEditingTxId(tx.id); setIsAddingTx(true); }}
                              className="text-xs hover:text-indigo-400 p-1"
                            >✏️</button>
                            <button 
                              onClick={() => { if(confirm("Supprimer ?")) deleteTransaction(tx.id); }}
                              className="text-xs hover:text-rose-400 p-1"
                            >🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
         </div>
      )}

      {activeTab === 'VALORISATION' && (
         <div className="space-y-6">
           <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl">
              <div>
                 <h2 className="text-2xl font-bold text-white mb-1">Total Valorisation en Nature</h2>
                 <p className="text-emerald-200/60 text-sm">Prêts, dons en nature et heures de bénévolat</p>
              </div>
              <div className="text-4xl font-black text-emerald-400">{totalValorisation.toFixed(2)} €</div>
           </div>

           <div className="flex justify-end gap-2">
              <button onClick={() => exportCSV("valorisations.csv", [
                 ["Beneficiaire", "Description", "Quantite", "Valeur Unitaire"],
                 ...contributions.map(c => [c.beneficiary, c.description, c.quantity, c.unitValue])
              ])} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Export CSV</button>
              <button onClick={() => startImport('VALORISATION')} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Import CSV</button>
              <button 
                onClick={() => setIsAddingContrib(true)} 
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors"
              >
                 ➕ Ajouter une valorisation
              </button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contributions.map(c => (
                 <div key={c.id} className="bg-white/5 border border-emerald-500/20 rounded-2xl p-5 hover:bg-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-3">
                       <h3 className="text-lg font-bold text-emerald-300">{c.beneficiary}</h3>
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => { setContribForm(c); setEditingContribId(c.id); setIsAddingContrib(true); }} className="text-xs p-1 hover:text-indigo-400">✏️</button>
                          <button onClick={() => deleteContribution(c.id)} className="text-xs p-1 hover:text-rose-400">🗑️</button>
                       </div>
                    </div>
                    <p className="text-white text-sm mb-4">{c.description}</p>
                    <div className="flex justify-between items-end border-t border-white/10 pt-4 mt-auto">
                       <div className="text-xs text-slate-400">
                          <span className="font-medium text-white">{c.quantity}</span> × {c.unitValue}€
                       </div>
                       <div className="font-bold text-emerald-400 text-lg">{(c.quantity * c.unitValue).toFixed(2)} €</div>
                    </div>
                 </div>
              ))}
              {contributions.length === 0 && <p className="text-slate-500 italic p-4">Aucune contribution en nature.</p>}
           </div>
         </div>
      )}

      {activeTab === 'SPONSORS' && (
         <div className="space-y-6">
           <div className="flex justify-between items-center">
              <p className="text-sm text-slate-400">Carnet d'adresses et gestion des partenaires Mécénat / Sponsoring.</p>
              <div className="flex gap-2">
                 <button onClick={() => exportCSV("sponsors.csv", [
                    ["Nom de l'entreprise", "Contact", "Email", "Téléphone", "Date d'envoi du dossier", "Date de la dernière relance", "Suivi financier", "Montant promis", "Statut", "Date de l'encaissement réel", "Notes et commentaires"],
                    ...sponsors.map(s => [s.name, s.contact || '', s.email || '', s.phone || '', s.dateSent || '', s.dateReminder || '', '', s.amountPromised || 0, s.status || '', s.datePayment || '', s.notes || ''])
                 ])} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Export CSV</button>
                 <button onClick={() => startImport('SPONSORS')} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Import CSV</button>
                 <button 
                    onClick={() => setIsAddingSponsor(true)} 
                    className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors"
                 >
                    ➕ Nouveau Sponsor
                 </button>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map(s => (
                 <div key={s.id} className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-6 flex flex-col group relative hover:border-amber-500/30 transition-all">
                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setSponsorForm(s); setEditingSponsorId(s.id); setIsAddingSponsor(true); }} className="text-xs p-1 hover:text-indigo-400">✏️</button>
                        <button onClick={() => deleteSponsor(s.id)} className="text-xs p-1 hover:text-rose-400">🗑️</button>
                    </div>

                    <h3 className="text-xl font-bold text-amber-400 mb-1 pr-12">{s.name}</h3>
                    <p className="text-sm text-slate-300 font-medium mb-4">{s.contact || 'Aucun contact principal'}</p>
                    
                    <div className="space-y-2 flex-grow">
                       {s.email && <div className="flex items-center gap-2 text-sm text-slate-400"><span className="text-slate-500">@</span> <a href={`mailto:${s.email}`} className="hover:text-indigo-300">{s.email}</a></div>}
                       {s.phone && <div className="flex items-center gap-2 text-sm text-slate-400"><span className="text-slate-500">📞</span> <a href={`tel:${s.phone}`} className="hover:text-indigo-300">{s.phone}</a></div>}
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-x-2 gap-y-3 text-xs">
                       {s.status && <div><span className="text-slate-500 block mb-0.5">Statut</span><span className={`font-medium px-2 py-0.5 rounded-md ${s.status.toLowerCase().includes('accept') ? 'bg-emerald-500/10 text-emerald-400' : s.status.toLowerCase().includes('refus') ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>{s.status}</span></div>}
                       {(s.amountPromised !== undefined && s.amountPromised > 0) ? <div><span className="text-slate-500 block mb-0.5">Montant Promis</span><span className="text-white font-medium">{s.amountPromised} €</span></div> : <div></div>}
                       {s.dateSent && <div><span className="text-slate-500 block mb-0.5">Envoi Dossier</span><span className="text-slate-300">{s.dateSent}</span></div>}
                       {s.datePayment && <div><span className="text-slate-500 block mb-0.5">Encaissement</span><span className="text-slate-300">{s.datePayment}</span></div>}
                    </div>

                    {s.notes && (
                       <div className="mt-6 p-4 bg-black/40 rounded-xl text-xs text-slate-300 border border-white/5">
                          {s.notes}
                       </div>
                    )}
                 </div>
              ))}
              {sponsors.length === 0 && <p className="text-slate-500 italic p-4">Aucun sponsor enregistré.</p>}
           </div>
         </div>
      )}

      {activeTab === 'POINTAGE' && (
         <div className="space-y-6">
             <div className="flex justify-between items-end">
                 <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
                       <span>🏦</span> Pointage Bancaire
                    </h2>
                    <p className="text-sm text-slate-400">Importez un relevé bancaire CSV (Date;Libellé;Montant) pour rapprochement.</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => exportCSV("releve-complet.csv", [
                       ["Date bancaire", "Libelle releve", "Montant", "Pointe", "Transaction assignee"],
                       ...bankLines.map(bl => [
                         bl.date, bl.description, bl.amount, bl.pointed ? 'Oui' : 'Non',
                         bl.transactionId ? (transactions.find(t => t.id === bl.transactionId)?.title || bl.transactionId) : ''
                       ])
                    ])} className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/10">Export CSV</button>
                    <button onClick={() => startImport('POINTAGE')} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg transition-colors">Import CSV (Relevé)</button>
                 </div>
             </div>

             <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-black/20 border-b border-white/10 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="p-4 font-semibold w-12 text-center">✓</th>
                          <th className="p-4 font-semibold">Date bancaire</th>
                          <th className="p-4 font-semibold">Libellé relevé</th>
                          <th className="p-4 font-semibold text-right">Montant</th>
                          <th className="p-4 font-semibold text-right">Rapprochement logiciel</th>
                          <th className="p-4 font-semibold text-center w-12">Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {bankLines.map(bl => {
                          const expectedTypes = bl.amount >= 0 ? ['RECETTE', 'INCOME'] : ['DEPENSE', 'EXPENSE'];
                          const hasMatch = transactions.some(t => t.amount === Math.abs(bl.amount) && t.date === bl.date && expectedTypes.includes(t.type));
                          
                          return (
                          <tr key={bl.id} className={`group transition-colors ${bl.pointed ? 'bg-teal-500/5' : 'hover:bg-white/5'}`}>
                             <td className="p-4 text-center">
                                <input type="checkbox" checked={bl.pointed} onChange={(e) => updateBankLine(bl.id, { pointed: e.target.checked })} className="accent-teal-500 w-4 h-4 cursor-pointer" />
                             </td>
                             <td className="p-4 text-slate-300 text-sm whitespace-nowrap">{bl.date}</td>
                             <td className="p-4 text-white text-sm font-medium flex items-center gap-2">
                                {!bl.pointed && hasMatch && (
                                   <span title="Une opération avec les mêmes informations (date, montant) existe dans le bilan" className="text-amber-500 hover:text-amber-400 cursor-help">⚠️</span>
                                )}
                                {bl.description}
                             </td>
                             <td className={`p-4 text-right font-bold text-sm whitespace-nowrap ${bl.amount >= 0 ? 'text-teal-400' : 'text-rose-400'}`}>{bl.amount >= 0 ? '+' : ''}{bl.amount.toFixed(2)} €</td>
                             <td className="p-4 text-right">
                                <select 
                                   value={bl.transactionId || ""}
                                   onChange={(e) => updateBankLine(bl.id, { transactionId: e.target.value, pointed: !!e.target.value })}
                                   className="bg-black/40 border border-white/10 rounded-lg text-xs text-slate-300 px-2 py-1 max-w-[200px] outline-none w-full"
                                >
                                   <option value="">-- Assigner --</option>
                                   {transactions.filter(t => (bl.amount >= 0 && (t.type === 'RECETTE' || t.type === 'INCOME')) || (bl.amount < 0 && (t.type === 'DEPENSE' || t.type === 'EXPENSE'))).map(t => (
                                      <option key={t.id} value={t.id}>{t.title || t.description} ({t.amount}€)</option>
                                   ))}
                                </select>
                             </td>
                             <td className="p-4 text-center">
                                <button onClick={() => deleteBankLine(bl.id)} className="text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100" title="Supprimer la ligne bancaire">🗑️</button>
                             </td>
                          </tr>
                          );
                       })}
                       {bankLines.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune ligne bancaire à pointer. Préparez un CSV.</td></tr>}
                    </tbody>
                 </table>
             </div>
         </div>
      )}


      {isAddingBudgetLine && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
               <button onClick={resetBudgetLineForm} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-2 leading-none">✕</button>
               <h2 className="text-2xl font-bold text-white mb-6">{editingBudgetLineId ? 'Modifier la Catégorie Budgétaire' : 'Nouvelle Catégorie Budgétaire'}</h2>
               <form onSubmit={saveBudgetLine} className="space-y-4">
                  <div className="flex gap-4">
                     <label className="flex items-center justify-center gap-2 text-sm text-slate-300 cursor-pointer p-3 border border-white/10 rounded-xl bg-black/40 flex-1 hover:bg-black/60 transition-colors">
                        <input type="radio" checked={budgetLineForm.section === 'RECETTE'} onChange={() => setBudgetLineForm({...budgetLineForm, section: 'RECETTE'})} className="accent-teal-500" />
                        ↑ Produits (Recette)
                     </label>
                     <label className="flex items-center justify-center gap-2 text-sm text-slate-300 cursor-pointer p-3 border border-white/10 rounded-xl bg-black/40 flex-1 hover:bg-black/60 transition-colors">
                        <input type="radio" checked={budgetLineForm.section === 'DEPENSE'} onChange={() => setBudgetLineForm({...budgetLineForm, section: 'DEPENSE'})} className="accent-rose-500" />
                        ↓ Charges (Dépense)
                     </label>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Catégorie Principale</label>
                     <input type="text" value={budgetLineForm.category || ''} onChange={e=>setBudgetLineForm({...budgetLineForm, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" required placeholder="Ex: LOGISTIQUE, MATÉRIEL SPORTIF..." />
                     <p className="text-xs text-slate-500 mt-1">Saisir le nom du groupe (ex: MATÉRIEL SPORTIF)</p>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Sous-catégorie / Intitulé</label>
                     <input type="text" value={budgetLineForm.label || ''} onChange={e=>setBudgetLineForm({...budgetLineForm, label: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-indigo-500" required placeholder="Ex: Location/Achat" />
                     <p className="text-xs text-slate-500 mt-1">Saisir le nom de la ligne spécifique (ex: Location site)</p>
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                     <button type="button" onClick={resetBudgetLineForm} className="px-5 py-2.5 rounded-xl font-medium text-slate-300">Annuler</button>
                     <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold">Enregistrer</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* MODALS */}
      {isAddingTx && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
               <button onClick={resetTxForm} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-2 leading-none">✕</button>
               <h2 className="text-2xl font-bold text-white mb-6">{editingTxId ? 'Modifier l\'opération' : 'Nouvelle opération'}</h2>
               <form onSubmit={saveTx} className="space-y-4">
                  <div className="flex gap-4">
                     <label className="flex items-center justify-center gap-2 text-sm text-slate-300 cursor-pointer p-3 border border-white/10 rounded-xl bg-black/40 flex-1 hover:bg-black/60 transition-colors">
                        <input type="radio" checked={txForm.type === 'RECETTE' || txForm.type === 'INCOME'} onChange={() => setTxForm({...txForm, type: 'RECETTE'})} className="accent-teal-500" />
                        ↑ Recette
                     </label>
                     <label className="flex items-center justify-center gap-2 text-sm text-slate-300 cursor-pointer p-3 border border-white/10 rounded-xl bg-black/40 flex-1 hover:bg-black/60 transition-colors">
                        <input type="radio" checked={txForm.type === 'DEPENSE' || txForm.type === 'EXPENSE'} onChange={() => setTxForm({...txForm, type: 'DEPENSE'})} className="accent-rose-500" />
                        ↓ Dépense
                     </label>
                  </div>
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Date</label><input type="date" value={txForm.date || ''} onChange={e=>setTxForm({...txForm, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none" required /></div>
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Montant (€)</label><input type="number" step="0.01" value={txForm.amount || ''} onChange={e=>setTxForm({...txForm, amount: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none" required /></div>
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Intitulé</label><input type="text" value={txForm.description || txForm.title || ''} onChange={e=>setTxForm({...txForm, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none" required placeholder="Ex: Matériel..." /></div>
                  <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Ligne de budget</label>
                     <select value={txForm.budgetLineId || ''} onChange={e=>setTxForm({...txForm, budgetLineId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none">
                        <option value="">-- Sans ligne spécifique --</option>
                        {budgetLines.filter(b => b.section === (txForm.type === 'RECETTE' || txForm.type === 'INCOME' ? 'RECETTE' : 'DEPENSE')).map(b => (
                           <option key={b.id} value={b.id}>{b.category} - {b.label}</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-400 mb-1">Statut d'avancement</label>
                     <select value={txForm.status || 'REALIZED'} onChange={e=>setTxForm({...txForm, status: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none">
                        <option value="REALIZED">✅ Réalisée (Payée/Encaissée)</option>
                        <option value="PENDING">⚠️ En attente / Prévue</option>
                     </select>
                  </div>
                  <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={resetTxForm} className="px-5 py-2.5 rounded-xl font-medium text-slate-300">Annuler</button><button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold">Enregistrer</button></div>
               </form>
            </div>
         </div>
      )}

      {isAddingContrib && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
               <button onClick={resetContribForm} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-2 leading-none">✕</button>
               <h2 className="text-2xl font-bold text-white mb-6">{editingContribId ? 'Modifier la valorisation' : 'Nouvelle valorisation'}</h2>
               <form onSubmit={saveContrib} className="space-y-4">
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Bénéficiaire / Acteur</label><input type="text" value={contribForm.beneficiary || ''} onChange={e=>setContribForm({...contribForm, beneficiary: e.target.value})} className="w-full bg-black/40 border border-emerald-500/30 rounded-xl p-3 text-white outline-none focus:border-emerald-500" required placeholder="Ex: Kévin PEURON" /></div>
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Description (Matériel, service...)</label><input type="text" value={contribForm.description || ''} onChange={e=>setContribForm({...contribForm, description: e.target.value})} className="w-full bg-black/40 border border-emerald-500/30 rounded-xl p-3 text-white outline-none focus:border-emerald-500" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-medium text-slate-400 mb-1">Quantité / Heures</label><input type="number" step="0.1" value={contribForm.quantity || ''} onChange={e=>setContribForm({...contribForm, quantity: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-emerald-500/30 rounded-xl p-3 text-white outline-none focus:border-emerald-500" required /></div>
                     <div><label className="block text-xs font-medium text-slate-400 mb-1">Valeur Unitaire (€)</label><input type="number" step="0.01" value={contribForm.unitValue || ''} onChange={e=>setContribForm({...contribForm, unitValue: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-emerald-500/30 rounded-xl p-3 text-white outline-none focus:border-emerald-500" required /></div>
                  </div>
                  <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={resetContribForm} className="px-5 py-2.5 rounded-xl font-medium text-slate-300">Annuler</button><button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold">Enregistrer</button></div>
               </form>
            </div>
         </div>
      )}

      {isAddingSponsor && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
               <button onClick={resetSponsorForm} className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-2 leading-none">✕</button>
               <h2 className="text-2xl font-bold text-white mb-6">{editingSponsorId ? 'Modifier Sponsor' : 'Nouveau Sponsor'}</h2>
               <form onSubmit={saveSponsor} className="space-y-4">
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Nom de l'entreprise / Partenaire</label><input type="text" value={sponsorForm.name || ''} onChange={e=>setSponsorForm({...sponsorForm, name: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" required /></div>
                  <div className="grid grid-cols-2 gap-4">
                     <div><label className="block text-xs font-medium text-slate-400 mb-1">Contact (Nom/Prénom)</label><input type="text" value={sponsorForm.contact || ''} onChange={e=>setSponsorForm({...sponsorForm, contact: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                     <div><label className="block text-xs font-medium text-slate-400 mb-1">Téléphone</label><input type="text" value={sponsorForm.phone || ''} onChange={e=>setSponsorForm({...sponsorForm, phone: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                  </div>
                  <div><label className="block text-xs font-medium text-slate-400 mb-1">Email</label><input type="email" value={sponsorForm.email || ''} onChange={e=>setSponsorForm({...sponsorForm, email: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                  <div className="border-t border-white/10 pt-4 mt-4">
                     <h3 className="text-sm font-bold text-amber-500 mb-4">Suivi Financier & Mécénat</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                           <label className="block text-xs font-medium text-slate-400 mb-1">Statut</label>
                           <select value={sponsorForm.status || ''} onChange={e=>setSponsorForm({...sponsorForm, status: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500">
                              <option value="">-- Non défini --</option>
                              <option value="Accepté">Accepté</option>
                              <option value="En attente">En attente</option>
                              <option value="Refusé">Refusé</option>
                           </select>
                        </div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Montant Promis (€)</label><input type="number" step="0.01" value={sponsorForm.amountPromised || ''} onChange={e=>setSponsorForm({...sponsorForm, amountPromised: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Date d'envoi dossier</label><input type="text" placeholder="Ex: 01/03/2026" value={sponsorForm.dateSent || ''} onChange={e=>setSponsorForm({...sponsorForm, dateSent: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Dernière relance</label><input type="text" placeholder="Ex: 15/03/2026" value={sponsorForm.dateReminder || ''} onChange={e=>setSponsorForm({...sponsorForm, dateReminder: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1">Encaissement réel</label><input type="text" placeholder="Ex: 10/04/2026" value={sponsorForm.datePayment || ''} onChange={e=>setSponsorForm({...sponsorForm, datePayment: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
                     </div>
                  </div>
                  <div className="border-t border-white/10 pt-4"><label className="block text-xs font-medium text-slate-400 mb-1">Notes / Infos de suivi</label><textarea value={sponsorForm.notes || ''} onChange={e=>setSponsorForm({...sponsorForm, notes: e.target.value})} className="w-full bg-black/40 border border-amber-500/30 rounded-xl p-3 text-white outline-none focus:border-amber-500 h-24 resize-none" placeholder="Ex: Rappeler le 15 mars..."></textarea></div>
                  <div className="pt-4 flex justify-end gap-3"><button type="button" onClick={resetSponsorForm} className="px-5 py-2.5 rounded-xl font-medium text-slate-300">Annuler</button><button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold">Enregistrer</button></div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
}
