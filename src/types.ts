export interface Association {
  id: string; // Firestore document ID
  name: string;
}

export interface Availability {
  day: string; // e.g. "Lundi", "Mardi", or "" for all days
  start?: number;
  end?: number;
  startLabel?: string;
  endLabel?: string;
}

export interface Volunteer {
  id: string; // Firestore document ID
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  license?: string;
  lastRole?: string;
  group?: string; // Association partenaire
  notes?: string;
  ideas?: string;
  isOrganizer: boolean;
  isReferent: boolean;
  availability: Availability[];
  childIds: string[];
  createdAt: number;
  updatedAt: number;
  viewedEvents?: Record<string, number>; // eventId -> timestamp
}

export interface TimeSlot {
  day: string;
  timeSlot: string; // e.g., "09h00-12h00"
  volunteer: string[] | null; // Array of Volunteer IDs or null if unassigned
}

export interface Position {
  name: string;
  responsableId?: string;
  details?: string;
  equipment?: string;
  timeSlots: TimeSlot[];
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Category {
  name: string;
  referentId?: string;
  positions: Position[];
  tasks?: Task[];
}

export interface EventEntity {
  id: string; // Firestore document ID
  name: string;
  priority: boolean;
  availableVolunteers: string[]; // Array of Volunteer IDs
  categories: Category[];
  carteUrl?: string; // Link to the map
  createdAt: number;
  updatedAt: number;
}

export interface Child {
  id: string; // Firestore document ID
  firstName: string;
  lastName: string;
  class: string;
  volunteerId?: string | null;
  createdAt: number;
  updatedAt: number;
}
