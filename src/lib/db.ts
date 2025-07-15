import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';

// Define your data structure.
interface Tenant {
  id: string;
  name: string;
  flatId?: string; // New field to link to a Flat
  monthlyPayHistory: MonthlyPayEntry[];
  notes: Note[];
  rentAgreements: RentAgreement[];
}

interface RentAgreement {
  id: string;
  rent: number;
  startDate: string;
  endDate?: string;
}

interface MonthlyPayEntry {
  id: string;
  rent: number;
  heatingCost: number;
  additionalCost: number;
  startDate: string;
  endDate?: string;
}

interface Note {
  id: string;
  date: string;
  note: string;
}

interface Flat {
  id: string;
  name: string; // e.g., "Apartment 1A" or "Main Street 123, Apt 4"
  description: string;
  notes: Note[];
}

interface Expense {
  id: string;
  description: string;
  amountHistory: AmountHistoryEntry[];
  recurring: 'one_time' | 'monthly' | 'quarterly' | 'yearly' | 'certain_date';
  recurringDate?: string; // Only if recurring is 'date'
  paymentMethod: string;
  supplierId: string;
  customFields: { [key: string]: any };
}

interface AmountHistoryEntry {
  id: string;
  amount: number;
  startDate: string;
  endDate?: string; // Optional, for open-ended periods
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  communicationChannels: CommunicationChannel[];
  supplierContacts: SupplierContact[];
  supplierNotes: SupplierNote[];
}

interface CommunicationChannel {
  id: string;
  type: 'phone' | 'email' | 'website' | 'other';
  value: string;
}

interface SupplierContact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
}

interface SupplierNote {
  id: string;
  date: string;
  note: string;
}

interface Data {
  tenants: Tenant[];
  flats: Flat[];
  expenses: Expense[];
  suppliers: Supplier[];
  tenantFields: CustomField[];
  expenseFields: CustomField[];
  supplierFields: CustomField[];
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'date';
}

// Use a singleton pattern to ensure we only have one instance of the database.
let db: Low<Data> | null = null;

const dbPath = path.join(process.cwd(), 'db.json');
const adapter = new JSONFile<Data>(dbPath);

export const getDb = async () => {
  if (!db) {
    const instance = new Low<Data>(adapter, { tenants: [], flats: [], expenses: [], suppliers: [], tenantFields: [], expenseFields: [], supplierFields: [] });
    await instance.read();
    
    // Set default data if the file is empty
    instance.data = instance.data || { tenants: [], flats: [], expenses: [], suppliers: [], tenantFields: [], expenseFields: [], supplierFields: [] };
    
    await instance.write();
    db = instance;
  }
  return db;
};