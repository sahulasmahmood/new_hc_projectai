export interface Department {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  role: string;
}

export interface StaffMember {
  id: number;
  employeeId?: string;
  name: string;
  role: string;
  gender?: string;
  dateOfBirth?: string;
  dateOfHiring?: string;
  departmentId?: number;
  department?: Department;
  shiftId?: number;
  shiftTime?: Shift;
  qualification?: string;
  experience?: string;
  phone?: string;
  email?: string;
  status: string;
  shift?: string;
  weekOff?: string;
  consultationFee?: string;
  digitalSignature?: string;
  documents?: string[];
  createdAt: string;
  updatedAt: string;
}
