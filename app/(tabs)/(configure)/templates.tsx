import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Sparkles } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import { TEMPLATES, PayrollTemplate } from '@/mocks/templates';
import TemplateCard from '@/components/TemplateCard';

export default function TemplatesScreen() {
  const { setConfig } = usePayroll();
  const router = useRouter();

  const handleSelect = useCallback((template: PayrollTemplate) => {
    console.log('[Templates] Selected template:', template.id);
    Alert.alert(
      `Load "${template.name}"?`,
      'This will replace all current configuration fields with the template values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load Template',
          onPress: () => {
            setConfig(template.config);
            console.log('[Templates] Config loaded from template:', template.id);
            router.back();
          },
        },
      ]
    );
  }, [setConfig, router]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Templates',
          headerBackTitle: 'Configure',
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerIconRow}>
            <Sparkles size={18} color={Colors.accent} />
            <Text style={styles.headerTitle}>Quick Start Templates</Text>
          </View>
          <Text style={styles.headerSub}>
            Choose a preset to populate all fields instantly. You can edit any value after loading.
          </Text>
        </View>

        {TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onSelect={handleSelect} />
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
});
