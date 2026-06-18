import { Stack } from 'expo-router';

export default function ClinicianLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Today's Schedule" }} />
      <Stack.Screen name="appointment/[id]" options={{ title: 'Appointment' }} />
    </Stack>
  );
}
