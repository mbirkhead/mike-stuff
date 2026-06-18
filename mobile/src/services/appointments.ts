import { supabase } from './supabase';
import type { Appointment, AppointmentStatus } from '../types';

export async function getTodaysAppointments(clinicianId: string): Promise<Appointment[]> {
  const today = new Date();
  const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const { data, error } = await supabase
    .from('appointments')
    .select('*, patient:patients(*)')
    .eq('clinician_id', clinicianId)
    .gte('scheduled_at', start)
    .lte('scheduled_at', end)
    .order('scheduled_at');

  if (error) throw error;
  return data as Appointment[];
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*, patient:patients(*), clinician:profiles(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Appointment;
}

export async function checkIn(
  appointmentId: string,
  clinicianId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const now = new Date().toISOString();

  await Promise.all([
    supabase.from('check_ins').insert({
      appointment_id: appointmentId,
      clinician_id: clinicianId,
      checked_in_at: now,
      check_in_latitude: latitude,
      check_in_longitude: longitude,
    }),
    supabase
      .from('appointments')
      .update({ status: 'on_site' as AppointmentStatus, check_in_at: now })
      .eq('id', appointmentId),
    supabase.from('clinician_locations').upsert({
      clinician_id: clinicianId,
      status: 'on_site',
      updated_at: now,
    }, { onConflict: 'clinician_id' }),
  ]);
}

export async function checkOut(
  appointmentId: string,
  clinicianId: string,
  latitude: number,
  longitude: number,
): Promise<void> {
  const now = new Date().toISOString();

  await Promise.all([
    supabase
      .from('check_ins')
      .update({
        checked_out_at: now,
        check_out_latitude: latitude,
        check_out_longitude: longitude,
      })
      .eq('appointment_id', appointmentId)
      .is('checked_out_at', null),
    supabase
      .from('appointments')
      .update({ status: 'completed' as AppointmentStatus, check_out_at: now })
      .eq('id', appointmentId),
    supabase.from('clinician_locations').upsert({
      clinician_id: clinicianId,
      status: 'available',
      updated_at: now,
    }, { onConflict: 'clinician_id' }),
  ]);
}
