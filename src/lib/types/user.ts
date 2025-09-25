/**
 * 利用者関連の型定義
 */

export interface Address {
  postalCode: string;
  prefecture: string;
  city: string;
  street: string;
  building?: string;
}

export interface Contact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: Address;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface MedicalInfo {
  allergies: string[];
  medications: Medication[];
  conditions: string[];
  restrictions: string[];
  bloodType?: string;
  height?: number;
  weight?: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimaryContact: boolean;
  hasPortalAccess: boolean;
}

export interface Note {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  category: 'general' | 'medical' | 'behavioral' | 'family' | 'care-plan';
  isImportant: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  nameKana: string;
  birthDate: Date;
  gender: 'male' | 'female' | 'other';
  address: Address;
  emergencyContact: Contact;
  medicalInfo: MedicalInfo;
  careLevel: number; // 要介護度 1-5
  familyMembers: FamilyMember[];
  notes: Note[];
  profileImage?: string;
  admissionDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = 'active' | 'inactive' | 'discharged';

export interface UserFilter {
  searchTerm?: string;
  careLevel?: number[];
  gender?: ('male' | 'female' | 'other')[];
  status?: UserStatus[];
  ageRange?: { min: number; max: number };
}

export interface UserSortOption {
  field: keyof User;
  direction: 'asc' | 'desc';
}