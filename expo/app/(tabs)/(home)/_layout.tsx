import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.headerBg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'AusPayForge' }}
      />
    </Stack>
  );
}
