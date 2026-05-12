import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Volunteer, EventEntity, Child, Association } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface DataContextType {
  volunteers: Volunteer[];
  events: EventEntity[];
  children: Child[];
  associations: Association[];
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
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children: childrenProp }: { children: ReactNode }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [childrenData, setChildrenData] = useState<Child[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingWrites, setPendingWrites] = useState(0);

  const syncing = pendingWrites > 0;

  useEffect(() => {
    let isSubscribed = true;
    let volsLoaded = false;
    let eventsLoaded = false;
    let childrenLoaded = false;
    let associationsLoaded = false;

    const checkLoaded = () => {
      if (volsLoaded && eventsLoaded && childrenLoaded && associationsLoaded) setLoading(false);
    };

    // Volunteers
    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Volunteer));
      setVolunteers(data);
      volsLoaded = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'volunteers'));

    // Events
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventEntity));
      setEvents(data);
      eventsLoaded = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'events'));

    // Children
    const unsubChildren = onSnapshot(collection(db, 'children'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildrenData(data);
      childrenLoaded = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));

    // Associations
    const unsubAssociations = onSnapshot(collection(db, 'associations'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Association));
      setAssociations(data);
      associationsLoaded = true; checkLoaded();
    }, (error) => handleFirestoreError(error, OperationType.GET, 'associations'));

    return () => {
      isSubscribed = false;
      unsubVolunteers();
      unsubEvents();
      unsubChildren();
      unsubAssociations();
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

  return (
    <DataContext.Provider value={{
      volunteers, events, children: childrenData, associations, loading, syncing,
      addVolunteer, updateVolunteer, deleteVolunteer,
      addEvent, updateEvent, deleteEvent,
      addChild, updateChild, deleteChild,
      addAssociation, updateAssociation, deleteAssociation
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
