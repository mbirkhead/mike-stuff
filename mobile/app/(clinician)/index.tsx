import { useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { AppointmentCard } from '@/components/AppointmentCard';
import { startLocationTracking, stopLocationTracking } from '@/services/location';
import { useAppStore } from '@/store';

export default function ScheduleScreen() {
  const { profile, signOut } = useAuth();
  const { appointments, loading, refresh } = useAppointments(profile?.id);
  const { isOnShift, setOnShift } = useAppStore();

  useEffect(() => {
    return () => { stopLocationTracking(); };
  }, []);

  async function toggleShift() {
    if (isOnShift) {
      await stopLocationTracking();
      setOnShift(false);
    } else {
      await startLocationTracking(profile!.id);
      setOnShift(true);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.shiftBtn, isOnShift && styles.shiftBtnActive]}
          onPress={toggleShift}
        >
          <Text style={styles.shiftBtnText}>
            {isOnShift ? '● On Shift' : 'Start Shift'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={appointments}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => <AppointmentCard appointment={item} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>No appointments today</Text>
          ) : null
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  shiftBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  shiftBtnActive: { backgroundColor: '#D1FAE5' },
  shiftBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  signOut: { fontSize: 14, color: '#6B7280' },
  list: { paddingVertical: 8 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 48, fontSize: 16 },
});
