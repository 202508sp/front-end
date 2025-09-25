/**
 * 職員関連の型定義
 */

export type StaffRole = 'admin' | 'manager' | 'caregiver' | 'nurse' | 'therapist' | 'support';

export type Permission = 
  | 'user.read' 
  | 'user.write' 
  | 'staff.read' 
  | 'staff.write' 
  | 'statistics.read' 
  | 'settings.write' 
  | 'reports.write' 
  | 'family.communicate';

export interface Qualification {
  id: string;
  name: string;
  issuer: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber?: string;
}

export interface WorkSchedule {
  id: string;
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  shiftType: 'day' | 'evening' | 'night' | 'on-call';
  isConfirmed: boolean;
  notes?: string;
}

export interface Staff {
  id: string;
  name: string;
  nameKana: string;
  email: string;
  phone: string;
  role: StaffRole;
  department: string;
  hireDate: Date;
  qualifications: Qualification[];
  schedule: WorkSchedule[];
  permissions: Permission[];
  profileImage?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffFilter {
  searchTerm?: string;
  role?: StaffRole[];
  department?: string[];
  isActive?: boolean;
}

export interface StaffSortOption {
  field: keyof Staff;
  direction: 'asc' | 'desc';
}

export type ShiftType = 'day' | 'evening' | 'night' | 'on-call';

export interface ShiftTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
  requiredStaff: number;
  requiredRoles: StaffRole[];
}