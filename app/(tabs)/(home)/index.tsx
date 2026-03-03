import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, ChevronRight, Sparkles, Shield } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { TEMPLATES, PayrollTemplate } from '@/mocks/templates';
import TemplateCard from '@/components/TemplateCard';
import { usePayroll } from '@/providers/PayrollProvider';

export default function HomeScreen() {
  const router = useRouter();
  const { setConfig, generate, isGenerating, output } = usePayroll();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleTemplateSelect = useCallback((template: PayrollTemplate) => {
    console.log('[Home] Template selected:', template.id);
    setSelectedTemplate(template.id);
    setConfig(template.config);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [setConfig]);

  const handleCustomize = useCallback(() => {
    router.push('/configure');
  }, [router]);

  const handleQuickForge = useCallback(() => {
    if (!selectedTemplate) {
      Alert.alert('Select a Template', 'Choose a payroll template first, then tap Forge.');
      return;
    }
    console.log('[Home] Quick forge triggered');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      generate();
      router.push('/payslips' as never);
    } catch (e) {
      console.error('[Home] Generation error:', e);
      Alert.alert('Error', 'Failed to generate payslips. Please check your config.');
    }
  }, [selectedTemplate, generate, router]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIconWrap}>
          <View style={styles.heroIconInner}>
            <Zap size={28} color={Colors.accent} />
          </View>
        </View>
        <Text style={styles.heroTitle}>AusPayForge</Text>
        <Text style={styles.heroSubtitle}>
          Generate realistic Australian payslips and bank statements in seconds
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Sparkles size={16} color={Colors.accent} />
          <Text style={styles.statValue}>{TEMPLATES.length}</Text>
          <Text style={styles.statLabel}>Templates</Text>
        </View>
        <View style={styles.statCard}>
          <Shield size={16} color={Colors.success} />
          <Text style={styles.statValue}>100%</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
        <View style={styles.statCard}>
          <Zap size={16} color={Colors.warning} />
          <Text style={styles.statValue}>4</Text>
          <Text style={styles.statLabel}>Pay Periods</Text>
        </View>
      </View>

      {selectedTemplate && (
        <Animated.View style={[styles.forgeSection, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={styles.forgeButton}
            onPress={handleQuickForge}
            activeOpacity={0.8}
            disabled={isGenerating}
            testID="forge-button"
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.background} size="small" />
            ) : (
              <>
                <Zap size={20} color={Colors.background} />
                <Text style={styles.forgeButtonText}>Forge Payslips</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}

      {selectedTemplate && (
        <TouchableOpacity
          style={styles.customizeRow}
          onPress={handleCustomize}
          activeOpacity={0.7}
        >
          <Text style={styles.customizeText}>Customize before forging</Text>
          <ChevronRight size={16} color={Colors.accent} />
        </TouchableOpacity>
      )}

      <View style={styles.templatesSection}>
        <Text style={styles.sectionTitle}>CHOOSE A TEMPLATE</Text>
        <Text style={styles.sectionSub}>
          Select a preset to auto-fill all payroll fields
        </Text>
        {TEMPLATES.map((t) => (
          <View
            key={t.id}
            style={[
              styles.templateWrap,
              selectedTemplate === t.id && styles.templateSelected,
            ]}
          >
            <TemplateCard template={t} onSelect={handleTemplateSelect} />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.blankButton}
        onPress={handleCustomize}
        activeOpacity={0.7}
      >
        <Text style={styles.blankButtonText}>Start from scratch</Text>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroIconInner: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.accent + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  forgeSection: {
    marginBottom: 8,
  },
  forgeButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  forgeButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.background,
    letterSpacing: 0.3,
  },
  customizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 12,
    gap: 4,
  },
  customizeText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  templatesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 14,
  },
  templateWrap: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 2,
  },
  templateSelected: {
    borderColor: Colors.accent,
    borderRadius: 16,
  },
  blankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 6,
    marginBottom: 8,
  },
  blankButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  bottomPad: {
    height: 40,
  },
});
