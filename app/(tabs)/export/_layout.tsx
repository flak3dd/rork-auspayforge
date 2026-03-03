import { Stack } from 'expo-router';
import React from 'react';
import Colors from '@/constants/colors';

export default function ExportLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.headerBg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Export' }} />
    </Stack>
  );
}
