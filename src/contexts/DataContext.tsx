import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Volunteer, EventEntity, Child, Association, Transaction, BudgetLine, Contribution, Sponsor, BankLine } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface DataContextType {
  volunteers: Volunteer[];
  events: EventEntity[];
  children: Child[];
  associations: Association[];
  transactions: Transaction[];
  budgetLines: BudgetLine[];
  contributions: Contribution[];
  sponsors: Sponsor[];
  bankLines: BankLine[];
  loading: boolean;
  syncing: boolean;
  addVolunteer: (vol: Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVolunteer: (id: string, vol: Partial<Volunteer>) => Promise<void>;
  deleteVolunteer: (id: string) => Promise<void>;
  addEvent: (evt: Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, evt: Partial<EventEntity>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addChild: (child: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateChild: (id: string, child: Partial<Child>) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
  addAssociation: (assoc: Omit<Association, 'id'>) => Promise<void>;
  updateAssociation: (id: string, assoc: Partial<Association>) => Promise<void>;
  deleteAssociation: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addBudgetLine: (line: Omit<BudgetLine, 'id'>) => Promise<void>;
  updateBudgetLine: (id: string, line: Partial<BudgetLine>) => Promise<void>;
  deleteBudgetLine: (id: string) => Promise<void>;
  addContribution: (contrib: Omit<Contribution, 'id'>) => Promise<void>;
  updateContribution: (id: string, contrib: Partial<Contribution>) => Promise<void>;
  deleteContribution: (id: string) => Promise<void>;
  addSponsor: (sponsor: Omit<Sponsor, 'id'>) => Promise<void>;
  updateSponsor: (id: string, sponsor: Partial<Sponsor>) => Promise<void>;
  deleteSponsor: (id: string) => Promise<void>;
  addBankLine: (line: Omit<BankLine, 'id'>) => Promise<void>;
  updateBankLine: (id: string, line: Partial<BankLine>) => Promise<void>;
  deleteBankLine: (id: string) => Promise<void>;
  seedBudgetData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children: childrenProp }: { children: ReactNode }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [childrenData, setChildrenData] = useState<Child[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [bankLines, setBankLines] = useState<BankLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingWrites, setPendingWrites] = useState(0);

  const syncing = pendingWrites > 0;

  useEffect(() => {
    let isSubscribed = true;
    let colsLoaded = { vols: false, events: false, children: false, associations: false, transactions: false, budgetLines: false, contributions: false, sponsors: false, bankLines: false };

    const checkLoaded = () => {
      if (Object.values(colsLoaded).every(Boolean)) setLoading(false);
    };

    // Volunteers
    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Volunteer));
      setVolunteers(data);
      colsLoaded.vols = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'volunteers'));

    // Events
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventEntity));
      setEvents(data);
      colsLoaded.events = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'events'));

    // Children
    const unsubChildren = onSnapshot(collection(db, 'children'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildrenData(data);
      colsLoaded.children = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));

    // Associations
    const unsubAssociations = onSnapshot(collection(db, 'associations'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Association));
      setAssociations(data);
      colsLoaded.associations = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'associations'));
    
    // Transactions
    const unsubTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(data);
      colsLoaded.transactions = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'transactions'));

    const unsubBudgetLines = onSnapshot(collection(db, 'budgetLines'), (snapshot) => {
      if (!isSubscribed) return;
      setBudgetLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BudgetLine)));
      colsLoaded.budgetLines = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'budgetLines'));

    const unsubContributions = onSnapshot(collection(db, 'contributions'), (snapshot) => {
      if (!isSubscribed) return;
      setContributions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contribution)));
      colsLoaded.contributions = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'contributions'));

    const unsubSponsors = onSnapshot(collection(db, 'sponsors'), (snapshot) => {
      if (!isSubscribed) return;
      setSponsors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsor)));
      colsLoaded.sponsors = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'sponsors'));

    const unsubBankLines = onSnapshot(collection(db, 'bankLines'), (snapshot) => {
      if (!isSubscribed) return;
      setBankLines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankLine)));
      colsLoaded.bankLines = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'bankLines'));

    return () => {
      isSubscribed = false;
      unsubVolunteers();
      unsubEvents();
      unsubChildren();
      unsubAssociations();
      unsubTransactions();
      unsubBudgetLines();
      unsubContributions();
      unsubSponsors();
      unsubBankLines();
    };
  }, []);

  const wrapWrite = async (op: () => Promise<void>) => {
    setPendingWrites(prev => prev + 1);
    try {
      await op();
    } finally {
      setPendingWrites(prev => Math.max(0, prev - 1));
    }
  };

  const addVolunteer = async (vol: Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>) => {
    await wrapWrite(async () => {
      try {
        const newDoc = doc(collection(db, 'volunteers'));
        const now = Date.now();
        await setDoc(newDoc, { ...vol, createdAt: now, updatedAt: now });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'volunteers');
      }
    });
  };

  const updateVolunteer = async (id: string, vol: Partial<Volunteer>) => {
    await wrapWrite(async () => {
      try {
        await updateDoc(doc(db, 'volunteers', id), { ...vol, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `volunteers/${id}`);
      }
    });
  };

  const deleteVolunteer = async (id: string) => {
    await wrapWrite(async () => {
      try {
        await deleteDoc(doc(db, 'volunteers', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `volunteers/${id}`);
      }
    });
  };

  const addEvent = async (evt: Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt'>) => {
    await wrapWrite(async () => {
      try {
        const newDoc = doc(collection(db, 'events'));
        const now = Date.now();
        await setDoc(newDoc, { ...evt, createdAt: now, updatedAt: now });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'events');
      }
    });
  };

  const updateEvent = async (id: string, evt: Partial<EventEntity>) => {
    await wrapWrite(async () => {
      try {
        await updateDoc(doc(db, 'events', id), { ...evt, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `events/${id}`);
      }
    });
  };

  const deleteEvent = async (id: string) => {
    await wrapWrite(async () => {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `events/${id}`);
      }
    });
  };

  const addChild = async (child: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => {
    await wrapWrite(async () => {
      try {
        const newDoc = doc(collection(db, 'children'));
        const now = Date.now();
        await setDoc(newDoc, { ...child, createdAt: now, updatedAt: now });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'children');
      }
    });
  };

  const updateChild = async (id: string, child: Partial<Child>) => {
    await wrapWrite(async () => {
      try {
        await updateDoc(doc(db, 'children', id), { ...child, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `children/${id}`);
      }
    });
  };

  const deleteChild = async (id: string) => {
    await wrapWrite(async () => {
      try {
        await deleteDoc(doc(db, 'children', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `children/${id}`);
      }
    });
  };

  const addAssociation = async (assoc: Omit<Association, 'id'>) => {
    await wrapWrite(async () => {
      try {
        const newDoc = doc(collection(db, 'associations'));
        await setDoc(newDoc, assoc);
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'associations');
      }
    });
  };

  const updateAssociation = async (id: string, assoc: Partial<Association>) => {
    await wrapWrite(async () => {
      try {
        await updateDoc(doc(db, 'associations', id), assoc);
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `associations/${id}`);
      }
    });
  };

  const deleteAssociation = async (id: string) => {
    await wrapWrite(async () => {
      try {
        await deleteDoc(doc(db, 'associations', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `associations/${id}`);
      }
    });
  };

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await wrapWrite(async () => {
      try {
        const id = crypto.randomUUID();
        await setDoc(doc(db, 'transactions', id), {
          ...tx,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } catch (e) {
        handleFirestoreError(e, OperationType.CREATE, 'transactions');
      }
    });
  };

  const updateTransaction = async (id: string, tx: Partial<Transaction>) => {
    await wrapWrite(async () => {
      try {
        await updateDoc(doc(db, 'transactions', id), { ...tx, updatedAt: Date.now() });
      } catch (e) {
        handleFirestoreError(e, OperationType.UPDATE, `transactions/${id}`);
      }
    });
  };

  const deleteTransaction = async (id: string) => {
    await wrapWrite(async () => {
      try {
        await deleteDoc(doc(db, 'transactions', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `transactions/${id}`);
      }
    });
  };

  const addBudgetLine = async (line: Omit<BudgetLine, 'id'>) => {
    await wrapWrite(async () => {
      const newDoc = doc(collection(db, 'budgetLines'));
      await setDoc(newDoc, { ...line, createdAt: Date.now() });
    });
  };
  const updateBudgetLine = async (id: string, line: Partial<BudgetLine>) => {
    await wrapWrite(async () => await updateDoc(doc(db, 'budgetLines', id), line));
  };
  const deleteBudgetLine = async (id: string) => {
    await wrapWrite(async () => await deleteDoc(doc(db, 'budgetLines', id)));
  };

  const addContribution = async (contrib: Omit<Contribution, 'id'>) => {
    await wrapWrite(async () => {
      const newDoc = doc(collection(db, 'contributions'));
      await setDoc(newDoc, { ...contrib, createdAt: Date.now() });
    });
  };
  const updateContribution = async (id: string, contrib: Partial<Contribution>) => {
    await wrapWrite(async () => await updateDoc(doc(db, 'contributions', id), contrib));
  };
  const deleteContribution = async (id: string) => {
    await wrapWrite(async () => await deleteDoc(doc(db, 'contributions', id)));
  };

  const addSponsor = async (sponsor: Omit<Sponsor, 'id'>) => {
    await wrapWrite(async () => {
      const newDoc = doc(collection(db, 'sponsors'));
      await setDoc(newDoc, { ...sponsor, createdAt: Date.now() });
    });
  };
  const updateSponsor = async (id: string, sponsor: Partial<Sponsor>) => {
    await wrapWrite(async () => await updateDoc(doc(db, 'sponsors', id), sponsor));
  };
  const deleteSponsor = async (id: string) => {
    await wrapWrite(async () => await deleteDoc(doc(db, 'sponsors', id)));
  };

  const addBankLine = async (line: Omit<BankLine, 'id'>) => {
    await wrapWrite(async () => {
      const newDoc = doc(collection(db, 'bankLines'));
      await setDoc(newDoc, { ...line, createdAt: Date.now() });
    });
  };
  const updateBankLine = async (id: string, line: Partial<BankLine>) => {
    await wrapWrite(async () => await updateDoc(doc(db, 'bankLines', id), line));
  };
  const deleteBankLine = async (id: string) => {
    await wrapWrite(async () => await deleteDoc(doc(db, 'bankLines', id)));
  };

  const seedBudgetData = async () => {
    // Generate dummy budget lines if none exist
    if (budgetLines.length === 0) {
       await addBudgetLine({ section: 'RECETTE', category: 'Subventions', label: 'Mairie' });
       await addBudgetLine({ section: 'RECETTE', category: 'Sponsoring', label: 'Partenariat OGEK' });
       await addBudgetLine({ section: 'DEPENSE', category: 'Achats', label: 'Alimentation / Boissons' });
       await addBudgetLine({ section: 'DEPENSE', category: 'Equipement', label: 'Location matériel' });
    }
    if (sponsors.length === 0) {
      await addSponsor({ name: 'CKB', contact: 'Marianne Hellouvry', email: 'bureau@constructions-kreiz-breizh.fr', phone: '07 88 89 47 70', notes: 'chèque à récupérer jeudi prochain 17h\nAccepté 300,00 €' });
      await addSponsor({ name: 'Prop\'Vapo', email: 'info@propvapo.fr', phone: '0683420873', notes: 'Refusé' });
      await addSponsor({ name: 'Aeronet', contact: 'Robin Coatmellec', email: 'robin.coatmellec@aero-net.com', phone: '+33 (0) 2 96 57 44 44', notes: 'demain 10h30?\nAccepté 150,00 €\nVersé: 150,00 € le 10/04/2026' });
      await addTransaction({ title: "Sponsor Aeronet", description: "Virement sponsor", amount: 150, date: "2026-04-10", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Combustible D\'arvor', contact: 'Michel AUFFRET', email: 'combustiblesdarvor@wanadoo.fr', phone: '0296290020', notes: 'Accepté 100,00 €\nVersé: 100,00 € le 09/04/2026' });
      await addTransaction({ title: "Sponsor Combustible D'arvor", description: "Virement sponsor", amount: 100, date: "2026-04-09", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Calipage', email: 'magasin@bm-calipage.fr', phone: '0298930410', notes: 'Accepté 50,00 €' });
      await addSponsor({ name: 'Crédit Agricole', contact: 'Malo Dornemin', email: 'malo.dornemin@ca-cotesdarmor.fr', phone: '0296578054', notes: 'vainqueur des trophées de la vie locale (300€)\nAccepté 400,00 €\nVersé 400,00 € le 10/04/2026' });
      await addTransaction({ title: "Sponsor Crédit Agricole (Trophées de la vie locale)", description: "Virement sponsor", amount: 400, date: "2026-04-10", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'autosur carhaix', contact: 'Anthony', email: 'contact@cplp.fr', phone: '0298990606 / 0678314619', notes: 'Accepté 50,00 €' });
      await addSponsor({ name: 'Ovotrade', contact: 'adeline Gueltas', email: 'adeline.gueltas@ovotrade.com', notes: 'message envoyé à Adeline\nAccepté 50,00 €\nVersé 50,00 € le 17/04/2026' });
      await addTransaction({ title: "Sponsor Ovotrade", description: "Virement sponsor", amount: 50, date: "2026-04-17", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Collectif des lunetiers', email: 'carhaix@leslunetiers.fr', notes: 'rappeler demain\nAccepté 100,00 €' });
      await addSponsor({ name: 'Weldom', contact: 'Konan Le Coz', email: 'konan.lecoz@weldom.fr', notes: 'Accepté 100,00 €\nVersé 100,00 € le 01/06/2026' });
      await addTransaction({ title: "Sponsor Weldom", description: "Virement sponsor", amount: 100, date: "2026-06-01", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Gamm Vert', notes: 'En attente' });
      await addSponsor({ name: 'Charlotte Coiffure', contact: 'Charlotte', email: 'charlottecoiffure@orange.fr', phone: '0298811103', notes: 'rappeler mardi\nAccepté 150,00 €\nVersé 150,00 € le 13/03/2026' });
      await addTransaction({ title: "Sponsor Charlotte Coiffure", description: "Virement sponsor", amount: 150, date: "2026-03-13", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Proxi', contact: 'William', email: 'glomel@proxi.bzh', notes: 'Refusé' });
      await addSponsor({ name: 'ABC', contact: 'Mathieu, Yoann', email: 'contact@abc.bzh', phone: '0298930419', notes: 'mail envoyé\nAccepté 150,00 €\nVersé 150,00 € le 15/03/2026' });
      await addTransaction({ title: "Sponsor ABC", description: "Virement sponsor", amount: 150, date: "2026-03-15", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Garage Corvest', email: 'garagecorvest22@orange.fr', phone: '0296296166', notes: 'Rib et reçu envoyé, en attente du virement\nAccepté 100,00 €\nVersé 100,00 € le 10/04/2026' });
      await addTransaction({ title: "Sponsor Garage Corvest", description: "Virement sponsor", amount: 100, date: "2026-04-10", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'miloco', email: 'info-miloco@milocogroup.com', phone: '02 96 57 70 70', notes: 'passer demain à 11h\nAccepté 500,00 €\nVersé 500,00 € le 10/04/2026' });
      await addTransaction({ title: "Sponsor miloco", description: "Virement sponsor", amount: 500, date: "2026-04-10", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);

      await addSponsor({ name: 'Les Ramoneurs du Kreiz Breizh', contact: 'Christophe Jégou', email: 'ramoneurdukb@gmail.com', phone: '07 70 28 71 74', notes: 'chèque remis à Barbara qui le dépose en mairie\nAccepté 50,00 €\nVersé 50,00 € le 05/05/2026' });
      await addTransaction({ title: "Sponsor Les Ramoneurs du Kreiz Breizh", description: "Virement sponsor", amount: 50, date: "2026-05-05", type: "RECETTE", category: "Sponsoring", status: "REALIZED" } as any);
    }
    if (contributions.length === 0) {
      await addContribution({ beneficiary: 'Conseil départemental', description: 'Prêt de kayak', quantity: 120, unitValue: 20 });
      await addContribution({ beneficiary: 'Kévin PEURON', description: 'Prêt de tracteur', quantity: 8, unitValue: 40 });
      await addContribution({ beneficiary: 'Gaec de Kerangall', description: 'Groupe électrogène', quantity: 6, unitValue: 70 });
      await addContribution({ beneficiary: 'Mickaël Réminiac', description: 'Intervention électricien', quantity: 1, unitValue: 60 });
      await addContribution({ beneficiary: 'Bénévoles', description: 'Bénévolat', quantity: 2020, unitValue: 12.02 });
      await addContribution({ beneficiary: 'UNSS 22', description: 'Doigts électroniques', quantity: 1, unitValue: 400 });
      await addContribution({ beneficiary: 'Commune de Glomel', description: 'Base nautique', quantity: 1, unitValue: 250 });
      await addContribution({ beneficiary: 'Kévin PEURON', description: 'Chronométrage du trail des lucioles', quantity: 1, unitValue: 500 });
      await addContribution({ beneficiary: 'Intermarché', description: 'Fourniture', quantity: 1, unitValue: 300 });
    }
  };

  return (
    <DataContext.Provider value={{
      volunteers, events, children: childrenData, associations, transactions,
      budgetLines, contributions, sponsors, bankLines,
      loading, syncing,
      addVolunteer, updateVolunteer, deleteVolunteer,
      addEvent, updateEvent, deleteEvent,
      addChild, updateChild, deleteChild,
      addAssociation, updateAssociation, deleteAssociation,
      addTransaction, updateTransaction, deleteTransaction,
      addBudgetLine, updateBudgetLine, deleteBudgetLine,
      addContribution, updateContribution, deleteContribution,
      addSponsor, updateSponsor, deleteSponsor,
      addBankLine, updateBankLine, deleteBankLine,
      seedBudgetData
    }}>
      {childrenProp}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};
