export interface StaffMember {
  id: number;
  name: string;
  role: string;
  department: string;
  qualification?: string;
  experience?: string;
  phone?: string;
  email?: string;
  status: string;
  shift?: string;
  consultationFee?: string;
}
