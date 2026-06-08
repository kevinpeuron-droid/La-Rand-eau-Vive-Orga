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
  lastSeenAssignments?: Record<string, string[]>; // eventId -> list of assignments strings
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

export interface ArchivedIdea {
  volunteerId: string;
  volunteerName: string;
  text: string;
}

export interface EventEntity {
  id: string; // Firestore document ID
  name: string;
  priority: boolean;
  availableVolunteers: string[]; // Array of Volunteer IDs
  categories: Category[];
  carteUrl?: string; // Link to the map
  archivedIdeas?: ArchivedIdea[];
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string; // Firestore document ID
  title?: string;
  description?: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'RECETTE' | 'DEPENSE' | 'INCOME' | 'EXPENSE';
  category?: string;
  budgetLineId?: string;
  eventId?: string;
  isBenevolat?: boolean;
  status?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface BudgetLine {
  id: string;
  category: string;
  label: string;
  section: string; // 'RECETTE' | 'DEPENSE' | 'VALORISATION'
  amountN?: number;
  amountNMinus1?: number;
  createdAt?: number;
}

export interface Contribution {
  id: string;
  beneficiary: string;
  description: string;
  quantity: number;
  unitValue: number;
  createdAt?: number;
}

export interface SponsorYearlyData {
  amountPaid: number;
  amountPromised: number;
  budgetLineId?: string;
  datePaid?: string;
  dateReminder?: string;
  dateSent?: string;
  notes?: string;
  status: string;
  transactionId?: string;
}

export interface Sponsor {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  notes?: string;
  status?: string;
  amountPromised?: number;
  dateSent?: string;
  dateReminder?: string;
  datePayment?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface BankLine {
  id: string;
  date: string;
  description: string;
  amount: number;
  pointed: boolean;
  transactionId?: string;
  createdAt?: number;
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
