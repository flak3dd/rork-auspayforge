import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Hammer, FileText, Landmark, Settings } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';

function TabIcon({ Icon, color, focused }: { Icon: typeof Hammer; color: string; focused: boolean }) {
  return (
    <View style={tabIconStyles.wrap}>
      <Icon size={22} color={color} />
      {focused && <View style={[tabIconStyles.dot, { backgroundColor: Colors.accent }]} />}
    </View>
  );
}

const tabIconStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 4, paddingTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web' ? 'rgba(10, 14, 26, 0.92)' : 'transparent',
          borderTopColor: Colors.border,
          borderTopWidth: 0.5,
          position: 'absolute' as const,
          elevation: 0,
        },
        tabBarBackground: () =>
          Platform.OS !== 'web' ? (
            <BlurView
              intensity={60}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Forge',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Hammer} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="payslips"
        options={{
          title: 'Payslips',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={FileText} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="statement"
        options={{
          title: 'Statement',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Landmark} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => <TabIcon Icon={Settings} color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
