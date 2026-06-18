import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from './supabase';

export const LOCATION_TASK = 'background-location-task';

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;
  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  return bg === 'granted';
}

export async function startLocationTracking(clinicianId: string) {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) throw new Error('Location permission denied');

  await Location.startLocationUpdatesAsync(LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30_000,   // 30 seconds
    distanceInterval: 50,   // or every 50 meters
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Clinical Assessment',
      notificationBody: 'Location is being shared with dispatch while on shift.',
    },
  });
}

export async function stopLocationTracking() {
  const isTracking = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (isTracking) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  }
}

// Registered outside component tree — runs in background
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[LocationTask]', error);
    return;
  }
  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations[0];
  if (!loc) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from('clinician_locations').upsert({
    clinician_id: user.id,
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    heading: loc.coords.heading,
    speed: loc.coords.speed,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'clinician_id' });
});
