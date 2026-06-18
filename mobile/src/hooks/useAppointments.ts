import { useState, useEffect } from 'react';
import { getTodaysAppointments } from '@/services/appointments';
import type { Appointment } from '@/types';

export function useAppointments(clinicianId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicianId) return;
    load();
  }, [clinicianId]);

  async function load() {
    try {
      setLoading(true);
      const data = await getTodaysAppointments(clinicianId!);
      setAppointments(data);
    } catch (e) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }

  return { appointments, loading, error, refresh: load };
}
