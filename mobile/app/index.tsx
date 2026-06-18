import { View, ActivityIndicator } from 'react-native';

// Splash while _layout.tsx determines route
export default function Index() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#2563EB" />
    </View>
  );
}
