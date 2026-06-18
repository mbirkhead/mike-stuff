import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '@/services/supabase';
import { ClinicianMarker } from '@/components/ClinicianMarker';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import type { ClinicianLocation, Appointment } from '@/types';

export default function AdminMapScreen() {
  const { signOut } = useAuth();
  const [clinicianLocations, setClinicianLocations] = useState<ClinicianLocation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    loadInitialData();
    subscribeToLocations();
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  async function loadInitialData() {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const [locResult, apptResult] = await Promise.all([
      supabase
        .from('clinician_locations')
        .select('*, clinician:profiles(full_name, id)')
        .neq('status', 'offline'),
      supabase
        .from('appointments')
        .select('*, patient:patients(full_name)')
        .gte('scheduled_at', start)
        .lte('scheduled_at', end)
        .neq('status', 'cancelled'),
    ]);

    if (locResult.data) setClinicianLocations(locResult.data as ClinicianLocation[]);
    if (apptResult.data) setAppointments(apptResult.data as Appointment[]);
  }

  function subscribeToLocations() {
    channelRef.current = supabase
      .channel('clinician-locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clinician_locations' },
        (payload) => {
          setClinicianLocations((prev) => {
            const updated = payload.new as ClinicianLocation;
            const idx = prev.findIndex((l) => l.clinician_id === updated.clinician_id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = { ...next[idx], ...updated };
              return next;
            }
            return [...prev, updated];
          });
        },
      )
      .subscribe();
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: 39.8283,
          longitude: -98.5795,
          latitudeDelta: 10,
          longitudeDelta: 10,
        }}
      >
        {clinicianLocations.map((loc) => (
          <ClinicianMarker key={loc.clinician_id} loc={loc} />
        ))}

        {appointments
          .filter((a) => a.status !== 'completed')
          .map((a) => (
            <Marker
              key={a.id}
              coordinate={{ latitude: a.latitude, longitude: a.longitude }}
              title={a.patient?.full_name}
              description={`${new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${a.status}`}
              pinColor="#6366F1"
            />
          ))}
      </MapView>

      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Active Clinicians</Text>
        {clinicianLocations.map((loc) => (
          <View key={loc.clinician_id} style={styles.legendRow}>
            <Text style={styles.legendName}>{loc.clinician?.full_name ?? '—'}</Text>
            <StatusBadge status={loc.status} />
          </View>
        ))}
        {clinicianLocations.length === 0 && (
          <Text style={styles.legendEmpty}>No clinicians on shift</Text>
        )}
      </View>

      <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  legend: {
    position: 'absolute',
    top: 60,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendTitle: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 8, letterSpacing: 0.5 },
  legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  legendName: { fontSize: 13, color: '#111827', marginRight: 8, flex: 1 },
  legendEmpty: { fontSize: 13, color: '#9CA3AF' },
  signOutBtn: {
    position: 'absolute',
    top: 60,
    left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutText: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
});
