import React, { useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
} from 'react-native';
import {
  Info,
  Shield,
  Calendar,
  DollarSign,
  HelpCircle,
  Trash2,
  ChevronRight,
  Zap,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';

function SettingRow({
  icon,
  label,
  value,
  onPress,
  destructive,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim, onPress]);

  const handlePressOut = useCallback(() => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim, onPress]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={onPress ? 0.85 : 1}
        disabled={!onPress}
      >
        <View style={[styles.rowIcon, destructive && styles.rowIconDestructive]}>
          {icon}
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
          {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        </View>
        {onPress ? <ChevronRight size={16} color={Colors.textMuted} /> : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const { resetConfig } = usePayroll();

  const handleReset = () => {
    Alert.alert('Reset Configuration', 'This will reset all payroll config to defaults.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetConfig();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  };

  const handleHelp = () => {
    Alert.alert(
      'ATO Reference Info',
      '2025-26 Tax Brackets:\n' +
      '\u2022 $0\u2013$18,200: Nil\n' +
      '\u2022 $18,201\u2013$45,000: 16c per $1 over $18,200\n' +
      '\u2022 $45,001\u2013$135,000: $4,288 + 30c per $1 over $45,000\n' +
      '\u2022 $135,001\u2013$190,000: $31,288 + 37c per $1 over $135,000\n' +
      '\u2022 $190,001+: $51,638 + 45c per $1 over $190,000\n\n' +
      'Medicare Levy: 2%\n' +
      'SG Rate: 12% of OTE\n' +
      'Annual Leave: 152 hrs/yr\n' +
      'Personal Leave: 76 hrs/yr',
      [{ text: 'Got it' }]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionAccent, { backgroundColor: Colors.accent }]} />
          <Text style={styles.sectionTitle}>TAX YEAR</Text>
        </View>
        <SettingRow
          icon={<Calendar size={18} color={Colors.accent} />}
          label="Financial Year"
          value="2025-26"
        />
        <SettingRow
          icon={<DollarSign size={18} color={Colors.success} />}
          label="SG Rate"
          value="12%"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionAccent, { backgroundColor: Colors.blue }]} />
          <Text style={styles.sectionTitle}>INFORMATION</Text>
        </View>
        <SettingRow
          icon={<HelpCircle size={18} color={Colors.blue} />}
          label="ATO Tax Brackets & Rates"
          onPress={handleHelp}
        />
        <SettingRow
          icon={<Shield size={18} color={Colors.success} />}
          label="Privacy"
          value="All data stays on device"
        />
        <SettingRow
          icon={<Info size={18} color={Colors.textSecondary} />}
          label="Version"
          value="1.0.0"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionAccent, { backgroundColor: Colors.error }]} />
          <Text style={[styles.sectionTitle, { color: Colors.error }]}>DANGER ZONE</Text>
        </View>
        <SettingRow
          icon={<Trash2 size={18} color={Colors.error} />}
          label="Reset All Configuration"
          onPress={handleReset}
          destructive
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLogoWrap}>
          <Zap size={20} color={Colors.accent} />
        </View>
        <Text style={styles.footerText}>AusPayForge</Text>
        <Text style={styles.footerSub}>Simulation tool for Australian payroll documents</Text>
        <Text style={styles.footerSub}>No real financial data is produced</Text>
      </View>
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
    paddingTop: 12,
    paddingBottom: 90,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  sectionAccent: {
    width: 3,
    height: 14,
    borderRadius: 1.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDestructive: {
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
  },
  rowBody: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rowLabelDestructive: {
    color: Colors.error,
  },
  rowValue: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 4,
  },
  footerLogoWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  footerSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
