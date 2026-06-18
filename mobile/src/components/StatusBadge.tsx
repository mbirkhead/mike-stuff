import { View, Text, StyleSheet } from 'react-native';
import type { ClinicianStatus, AppointmentStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  available:  { label: 'Available',  bg: '#D1FAE5', text: '#065F46' },
  en_route:   { label: 'En Route',   bg: '#DBEAFE', text: '#1E40AF' },
  on_site:    { label: 'On Site',    bg: '#FEF3C7', text: '#92400E' },
  offline:    { label: 'Offline',    bg: '#F3F4F6', text: '#6B7280' },
  scheduled:  { label: 'Scheduled',  bg: '#EDE9FE', text: '#5B21B6' },
  completed:  { label: 'Completed',  bg: '#D1FAE5', text: '#065F46' },
  cancelled:  { label: 'Cancelled',  bg: '#FEE2E2', text: '#991B1B' },
};

interface Props {
  status: ClinicianStatus | AppointmentStatus;
}

export function StatusBadge({ status }: Props) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  label: { fontSize: 12, fontWeight: '600' },
});
