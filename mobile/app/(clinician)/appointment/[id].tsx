import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Linking, Alert, ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getAppointment, checkIn, checkOut } from '@/services/appointments';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { StatusBadge } from '@/components/StatusBadge';
import type { Appointment } from '@/types';

export default function AppointmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const { getCurrentLocation } = useLocation();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    try {
      const data = await getAppointment(id);
      setAppointment(data);
    } finally {
      setLoading(false);
    }
  }

  function openNavigation() {
    if (!appointment) return;
    const { latitude, longitude, address } = appointment;
    const encoded = encodeURIComponent(address);
    const url = Platform.OS === 'ios'
      ? `maps://maps.apple.com/?daddr=${encoded}`
      : `google.navigation:q=${latitude},${longitude}`;
    Linking.openURL(url);
  }

  async function handleCheckIn() {
    setActionLoading(true);
    try {
      const loc = await getCurrentLocation();
      if (!loc) throw new Error('Could not get location');
      await checkIn(id, profile!.id, loc.coords.latitude, loc.coords.longitude);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionLoading(true);
    try {
      const loc = await getCurrentLocation();
      if (!loc) throw new Error('Could not get location');
      await checkOut(id, profile!.id, loc.coords.latitude, loc.coords.longitude);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading || !appointment) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#2563EB" />;
  }

  const patient = appointment.patient;
  const checkedIn = !!appointment.check_in_at;
  const checkedOut = !!appointment.check_out_at;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statusRow}>
        <StatusBadge status={appointment.status} />
        <Text style={styles.time}>
          {new Date(appointment.scheduled_at).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>

      {patient && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>PATIENT</Text>
          <Text style={styles.patientName}>{patient.full_name}</Text>
          <Text style={styles.detail}>DOB: {patient.date_of_birth}</Text>
          <Text style={styles.detail}>Phone: {patient.phone}</Text>
          {patient.insurance_id && (
            <Text style={styles.detail}>Insurance ID: {patient.insurance_id}</Text>
          )}
          {patient.clinical_notes && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>CLINICAL NOTES</Text>
              <Text style={styles.notes}>{patient.clinical_notes}</Text>
            </>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionLabel}>LOCATION</Text>
        <Text style={styles.address}>{appointment.address}</Text>
        {appointment.notes && <Text style={styles.notes}>{appointment.notes}</Text>}
      </View>

      <TouchableOpacity style={styles.navButton} onPress={openNavigation}>
        <Text style={styles.navButtonText}>Navigate</Text>
      </TouchableOpacity>

      {!checkedIn && (
        <TouchableOpacity
          style={[styles.actionButton, actionLoading && styles.disabled]}
          onPress={handleCheckIn}
          disabled={actionLoading}
        >
          <Text style={styles.actionButtonText}>Check In</Text>
        </TouchableOpacity>
      )}

      {checkedIn && !checkedOut && (
        <TouchableOpacity
          style={[styles.actionButton, styles.checkOutButton, actionLoading && styles.disabled]}
          onPress={handleCheckOut}
          disabled={actionLoading}
        >
          <Text style={styles.actionButtonText}>Check Out</Text>
        </TouchableOpacity>
      )}

      {checkedOut && (
        <View style={styles.completedBanner}>
          <Text style={styles.completedText}>Visit complete</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  time: { fontSize: 18, fontWeight: '700', color: '#374151' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.8, marginBottom: 6 },
  patientName: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 4 },
  detail: { fontSize: 14, color: '#374151', marginBottom: 2 },
  notes: { fontSize: 14, color: '#374151', lineHeight: 20 },
  address: { fontSize: 15, color: '#374151' },
  navButton: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  navButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  actionButton: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkOutButton: { backgroundColor: '#F59E0B' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  completedBanner: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  completedText: { color: '#065F46', fontSize: 16, fontWeight: '600' },
});
