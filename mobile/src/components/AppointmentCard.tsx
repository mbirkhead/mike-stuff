import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { Appointment } from '@/types';
import { StatusBadge } from './StatusBadge';

interface Props {
  appointment: Appointment;
}

export function AppointmentCard({ appointment }: Props) {
  const time = new Date(appointment.scheduled_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/appointment/${appointment.id}`)}
    >
      <View style={styles.row}>
        <Text style={styles.time}>{time}</Text>
        <StatusBadge status={appointment.status} />
      </View>
      <Text style={styles.name}>{appointment.patient?.full_name ?? '—'}</Text>
      <Text style={styles.address}>{appointment.address}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  time: { fontSize: 14, fontWeight: '700', color: '#374151' },
  name: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 },
  address: { fontSize: 13, color: '#6B7280' },
});
