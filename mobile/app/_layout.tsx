import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
  const { session, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace('/(auth)/login');
    } else if (profile?.role === 'clinician') {
      router.replace('/(clinician)');
    } else {
      router.replace('/(admin)');
    }
  }, [session, profile, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(clinician)" />
      <Stack.Screen name="(admin)" />
    </Stack>
  );
}
