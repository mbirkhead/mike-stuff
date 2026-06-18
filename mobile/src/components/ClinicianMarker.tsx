import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { ClinicianLocation } from '@/types';

const STATUS_COLOR: Record<string, string> = {
  available: '#10B981',
  en_route:  '#3B82F6',
  on_site:   '#F59E0B',
  offline:   '#9CA3AF',
};

interface Props {
  loc: ClinicianLocation;
}

export function ClinicianMarker({ loc }: Props) {
  const color = STATUS_COLOR[loc.status] ?? '#9CA3AF';
  const initials = loc.clinician?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('') ?? '?';

  return (
    <Marker
      coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
      title={loc.clinician?.full_name}
      description={loc.status}
    >
      <View style={[styles.pin, { borderColor: color }]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 12, fontWeight: '700', color: '#111827' },
});
