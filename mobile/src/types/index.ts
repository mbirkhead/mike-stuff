export type UserRole = 'clinician' | 'admin' | 'supervisor';

export type AppointmentStatus =
  | 'scheduled'
  | 'en_route'
  | 'on_site'
  | 'completed'
  | 'cancelled';

export type ClinicianStatus = 'available' | 'en_route' | 'on_site' | 'offline';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  clinical_notes: string | null;
  insurance_id: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  clinician_id: string;
  scheduled_at: string;
  estimated_duration_minutes: number;
  status: AppointmentStatus;
  check_in_at: string | null;
  check_out_at: string | null;
  address: string;
  latitude: number;
  longitude: number;
  notes: string | null;
  imported_from: string | null;
  created_at: string;
  // joined
  patient?: Patient;
  clinician?: Profile;
}

export interface ClinicianLocation {
  clinician_id: string;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  status: ClinicianStatus;
  updated_at: string;
  // joined
  clinician?: Profile;
}

export interface CheckIn {
  id: string;
  appointment_id: string;
  clinician_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  check_in_latitude: number;
  check_in_longitude: number;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
}
