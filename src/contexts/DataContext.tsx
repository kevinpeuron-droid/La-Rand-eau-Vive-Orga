import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, onSnapshot, query, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Volunteer, EventEntity, Child } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface DataContextType {
  volunteers: Volunteer[];
  events: EventEntity[];
  children: Child[];
  loading: boolean;
  addVolunteer: (vol: Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateVolunteer: (id: string, vol: Partial<Volunteer>) => Promise<void>;
  deleteVolunteer: (id: string) => Promise<void>;
  addEvent: (evt: Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEvent: (id: string, evt: Partial<EventEntity>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  addChild: (child: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateChild: (id: string, child: Partial<Child>) => Promise<void>;
  deleteChild: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children: childrenProp }: { children: ReactNode }) {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [events, setEvents] = useState<EventEntity[]>([]);
  const [childrenData, setChildrenData] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isSubscribed = true;

    // Volunteers
    const unsubVolunteers = onSnapshot(collection(db, 'volunteers'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Volunteer));
      setVolunteers(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'volunteers'));

    // Events
    const unsubEvents = onSnapshot(collection(db, 'events'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventEntity));
      setEvents(data);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'events'));

    // Children
    const unsubChildren = onSnapshot(collection(db, 'children'), (snapshot) => {
      if (!isSubscribed) return;
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildrenData(data);
      setLoading(false); // Assume if children is loaded, we are good. Wait actually, let's just use simple approach.
    }, (error) => handleFirestoreError(error, OperationType.GET, 'children'));

    return () => {
      isSubscribed = false;
      unsubVolunteers();
      unsubEvents();
      unsubChildren();
    };
  }, []);

  const addVolunteer = async (vol: Omit<Volunteer, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDoc = doc(collection(db, 'volunteers'));
      const now = Date.now();
      await setDoc(newDoc, { ...vol, createdAt: now, updatedAt: now });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'volunteers');
    }
  };

  const updateVolunteer = async (id: string, vol: Partial<Volunteer>) => {
    try {
      await updateDoc(doc(db, 'volunteers', id), { ...vol, updatedAt: Date.now() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `volunteers/${id}`);
    }
  };

  const deleteVolunteer = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'volunteers', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `volunteers/${id}`);
    }
  };

  const addEvent = async (evt: Omit<EventEntity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDoc = doc(collection(db, 'events'));
      const now = Date.now();
      await setDoc(newDoc, { ...evt, createdAt: now, updatedAt: now });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'events');
    }
  };

  const updateEvent = async (id: string, evt: Partial<EventEntity>) => {
    try {
      await updateDoc(doc(db, 'events', id), { ...evt, updatedAt: Date.now() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `events/${id}`);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'events', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `events/${id}`);
    }
  };

  const addChild = async (child: Omit<Child, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDoc = doc(collection(db, 'children'));
      const now = Date.now();
      await setDoc(newDoc, { ...child, createdAt: now, updatedAt: now });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'children');
    }
  };

  const updateChild = async (id: string, child: Partial<Child>) => {
    try {
      await updateDoc(doc(db, 'children', id), { ...child, updatedAt: Date.now() });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `children/${id}`);
    }
  };

  const deleteChild = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'children', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `children/${id}`);
    }
  };

  return (
    <DataContext.Provider value={{
      volunteers, events, children: childrenData, loading,
      addVolunteer, updateVolunteer, deleteVolunteer,
      addEvent, updateEvent, deleteEvent,
      addChild, updateChild, deleteChild
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
