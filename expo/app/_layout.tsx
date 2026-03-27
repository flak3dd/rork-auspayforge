import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PayrollProvider } from '@/providers/PayrollProvider';
import Colors from '@/constants/colors';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <PayrollProvider>
        <StatusBar style="light" />
        <RootLayoutNav />
      </PayrollProvider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="configure"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Configure Payroll',
          headerStyle: { backgroundColor: Colors.headerBg },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
      <Stack.Screen
        name="preview"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Statement Preview',
          headerStyle: { backgroundColor: Colors.headerBg },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700' },
        }}
      />
    </Stack>
  );
}
