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
  TextInput,
  Platform,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Shield,
  Sparkles,
  FileText,
  Landmark,
  Calendar,
  CalendarRange,
  DollarSign,
  TrendingDown,
  Wallet,
  Settings2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { TEMPLATES, PayrollTemplate } from '@/mocks/templates';
import TemplateCard from '@/components/TemplateCard';
import { usePayroll } from '@/providers/PayrollProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isSmall = SCREEN_WIDTH < 375;
const SIDE_PAD = isSmall ? 14 : 18;

type StatementLength = 30 | 60 | 90;

const LENGTH_OPTIONS: { value: StatementLength; label: string }[] = [
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

export default function HomeScreen() {
  const router = useRouter();
  const {
    config,
    setConfig,
    updateBankConfig,
    generate,
    generatePayslipsOnly,
    generateStatementOnly,
    isGenerating,
    isGeneratingStatement,
    output,
  } = usePayroll();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showStatementConfig, setShowStatementConfig] = useState<boolean>(false);
  const scalePayslip = useRef(new Animated.Value(1)).current;
  const scaleStatement = useRef(new Animated.Value(1)).current;

  const handleTemplateSelect = useCallback((template: PayrollTemplate) => {
    console.log('[Home] Template selected:', template.id);
    setSelectedTemplate(template.id);
    setConfig(template.config);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [setConfig]);

  const handleCustomize = useCallback(() => {
    router.push('/configure');
  }, [router]);

  const animatePress = useCallback((anim: Animated.Value, cb: () => void) => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    cb();
  }, []);

  const handleForgePayslips = useCallback(() => {
    if (!selectedTemplate) {
      Alert.alert('Select a Template', 'Choose a payroll template first, then tap Forge.');
      return;
    }
    console.log('[Home] Forge payslips triggered');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    animatePress(scalePayslip, () => {
      try {
        generatePayslipsOnly();
        router.push('/payslips' as never);
      } catch (e) {
        console.error('[Home] Payslip generation error:', e);
        Alert.alert('Error', 'Failed to generate payslips. Please check your config.');
      }
    });
  }, [selectedTemplate, generatePayslipsOnly, router, animatePress, scalePayslip]);

  const handleForgeStatement = useCallback(() => {
    console.log('[Home] Forge statement triggered');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    animatePress(scaleStatement, () => {
      try {
        if (!output?.payslips || output.payslips.length === 0) {
          generatePayslipsOnly();
        }
        generateStatementOnly();
        router.push('/statement' as never);
      } catch (e) {
        console.error('[Home] Statement generation error:', e);
        Alert.alert('Error', 'Failed to generate statement. Please check your config.');
      }
    });
  }, [output, generatePayslipsOnly, generateStatementOnly, router, animatePress, scaleStatement]);

  const hasPayslips = output !== null && output.payslips.length > 0;
  const hasStatement = output !== null && output.bankStatement.transactions.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#0D1525', '#111D35', '#0A0E1A']}
        style={styles.heroBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Zap size={28} color={Colors.accent} />
          </View>
          <Text style={styles.heroTitle}>AusPayForge</Text>
          <Text style={styles.heroSubtitle}>
            Generate realistic Australian payslips{'\n'}and bank statements
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: Colors.accent }]} />
          <View style={styles.statContent}>
            <Sparkles size={16} color={Colors.accent} />
            <Text style={styles.statValue}>{TEMPLATES.length}</Text>
            <Text style={styles.statLabel}>Templates</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: Colors.success }]} />
          <View style={styles.statContent}>
            <Shield size={16} color={Colors.success} />
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statLabel}>Offline</Text>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statAccent, { backgroundColor: Colors.gold }]} />
          <View style={styles.statContent}>
            <Zap size={16} color={Colors.gold} />
            <Text style={styles.statValue}>{config.payConfig.numberOfPayslips ?? 4}</Text>
            <Text style={styles.statLabel}>Periods</Text>
          </View>
        </View>
      </View>

      <View style={styles.templatesSection}>
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.sectionTitle}>CHOOSE A TEMPLATE</Text>
        </View>
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
        <Settings2 size={15} color={Colors.textMuted} />
        <Text style={styles.blankButtonText}>Start from scratch</Text>
        <ChevronRight size={16} color={Colors.textMuted} />
      </TouchableOpacity>

      {selectedTemplate && (
        <View style={styles.forgeArea}>
          <View style={styles.forgeDivider} />

          <View style={styles.forgeCard}>
            <View style={[styles.forgeCardEdge, { backgroundColor: Colors.accent }]} />
            <View style={styles.forgeCardInner}>
              <View style={styles.forgeCardHeader}>
                <View style={[styles.forgeCardIconWrap, { backgroundColor: Colors.accentDim }]}>
                  <FileText size={22} color={Colors.accent} />
                </View>
                <View style={styles.forgeCardHeaderText}>
                  <Text style={styles.forgeCardTitle}>Payslips</Text>
                  <Text style={styles.forgeCardDesc}>Generate {config.payConfig.numberOfPayslips ?? 4} consecutive pay period slips</Text>
                </View>
              </View>

              {hasPayslips && (
                <TouchableOpacity
                  style={styles.viewExistingRow}
                  onPress={() => router.push('/payslips' as never)}
                  activeOpacity={0.7}
                >
                  <FileText size={14} color={Colors.accent} />
                  <Text style={styles.viewExistingText}>{output.payslips.length} payslips generated</Text>
                  <ChevronRight size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.customizeRow}
                onPress={handleCustomize}
                activeOpacity={0.7}
              >
                <Text style={styles.customizeText}>Customize before forging</Text>
                <ChevronRight size={14} color={Colors.accent} />
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: scalePayslip }] }}>
                <TouchableOpacity
                  style={styles.forgeButton}
                  onPress={handleForgePayslips}
                  activeOpacity={0.8}
                  disabled={isGenerating}
                  testID="forge-payslips-button"
                >
                  {isGenerating ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Zap size={18} color="#fff" />
                      <Text style={styles.forgeButtonText}>Forge Payslips</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          <View style={styles.forgeCard}>
            <View style={[styles.forgeCardEdge, { backgroundColor: Colors.gold }]} />
            <View style={styles.forgeCardInner}>
              <View style={styles.forgeCardHeader}>
                <View style={[styles.forgeCardIconWrap, { backgroundColor: Colors.goldDim }]}>
                  <Landmark size={22} color={Colors.gold} />
                </View>
                <View style={styles.forgeCardHeaderText}>
                  <Text style={styles.forgeCardTitle}>Bank Statement</Text>
                  <Text style={styles.forgeCardDesc}>Statement with mapped transactions</Text>
                </View>
              </View>

              {hasStatement && (
                <TouchableOpacity
                  style={styles.viewExistingRow}
                  onPress={() => router.push('/statement' as never)}
                  activeOpacity={0.7}
                >
                  <Landmark size={14} color={Colors.gold} />
                  <Text style={styles.viewExistingText}>{output.bankStatement.transactions.length} transactions</Text>
                  <ChevronRight size={14} color={Colors.textMuted} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.configToggle}
                onPress={() => {
                  setShowStatementConfig(!showStatementConfig);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.configToggleLeft}>
                  <Calendar size={14} color={Colors.textSecondary} />
                  <Text style={styles.configToggleText}>Statement Options</Text>
                </View>
                {showStatementConfig ? (
                  <ChevronUp size={16} color={Colors.textMuted} />
                ) : (
                  <ChevronDown size={16} color={Colors.textMuted} />
                )}
              </TouchableOpacity>

              {showStatementConfig && (
                <View style={styles.configBody}>
                  <View style={styles.configField}>
                    <View style={styles.configFieldLabelRow}>
                      <Calendar size={12} color={Colors.textSecondary} />
                      <Text style={styles.configFieldLabel}>Start Date</Text>
                    </View>
                    <TextInput
                      style={styles.configInput}
                      value={config.bankConfig.statementStartDate}
                      onChangeText={(t) => updateBankConfig('statementStartDate', t)}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={Colors.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>

                  <View style={styles.configField}>
                    <View style={styles.configFieldLabelRow}>
                      <CalendarRange size={12} color={Colors.textSecondary} />
                      <Text style={styles.configFieldLabel}>Statement Length</Text>
                    </View>
                    <View style={styles.lengthPicker}>
                      {LENGTH_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          style={[
                            styles.lengthOption,
                            config.bankConfig.statementLength === opt.value && styles.lengthOptionActive,
                          ]}
                          onPress={() => {
                            updateBankConfig('statementLength', opt.value);
                            Haptics.selectionAsync();
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.lengthOptionText,
                              config.bankConfig.statementLength === opt.value && styles.lengthOptionTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.configFieldRow}>
                    <View style={[styles.configField, { flex: 1 }]}>
                      <View style={styles.configFieldLabelRow}>
                        <Wallet size={12} color={Colors.textSecondary} />
                        <Text style={styles.configFieldLabel}>Opening Balance</Text>
                      </View>
                      <TextInput
                        style={styles.configInput}
                        value={config.bankConfig.openingBalance > 0 ? String(config.bankConfig.openingBalance) : ''}
                        onChangeText={(t) => updateBankConfig('openingBalance', parseFloat(t) || 0)}
                        placeholder="200.00"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={[styles.configField, { flex: 1 }]}>
                      <View style={styles.configFieldLabelRow}>
                        <DollarSign size={12} color={Colors.textSecondary} />
                        <Text style={styles.configFieldLabel}>Closing Balance</Text>
                      </View>
                      <TextInput
                        style={styles.configInput}
                        value={config.bankConfig.closingBalance > 0 ? String(config.bankConfig.closingBalance) : ''}
                        onChangeText={(t) => updateBankConfig('closingBalance', parseFloat(t) || 0)}
                        placeholder="1000.00"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>

                  <View style={styles.configField}>
                    <View style={styles.configFieldLabelRow}>
                      <TrendingDown size={12} color={Colors.textSecondary} />
                      <Text style={styles.configFieldLabel}>Monthly Spend Target</Text>
                    </View>
                    <TextInput
                      style={styles.configInput}
                      value={config.bankConfig.monthlySpendTarget > 0 ? String(config.bankConfig.monthlySpendTarget) : ''}
                      onChangeText={(t) => updateBankConfig('monthlySpendTarget', parseFloat(t) || 0)}
                      placeholder="2500.00"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.configFieldHint}>
                      Rough monthly expenditure for generating realistic debits
                    </Text>
                  </View>
                </View>
              )}

              <Animated.View style={{ transform: [{ scale: scaleStatement }] }}>
                <TouchableOpacity
                  style={[styles.forgeButton, styles.forgeButtonGold]}
                  onPress={handleForgeStatement}
                  activeOpacity={0.8}
                  disabled={isGeneratingStatement}
                  testID="forge-statement-button"
                >
                  {isGeneratingStatement ? (
                    <ActivityIndicator color="#0A0E1A" size="small" />
                  ) : (
                    <>
                      <Landmark size={18} color="#0A0E1A" />
                      <Text style={[styles.forgeButtonText, styles.forgeButtonTextDark]}>Forge Statement</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      )}

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
    paddingBottom: 24,
  },
  heroBg: {
    paddingHorizontal: SIDE_PAD,
    paddingTop: 6,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    marginBottom: 18,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  heroIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: 'rgba(34,211,197,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(34,211,197,0.22)',
  },
  heroTitle: {
    fontSize: isSmall ? 26 : 32,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: isSmall ? 13 : 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: isSmall ? 8 : 10,
    marginBottom: 22,
    paddingHorizontal: SIDE_PAD,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statAccent: {
    width: 4,
  },
  statContent: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: isSmall ? 18 : 21,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: isSmall ? 9 : 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  templatesSection: {
    marginBottom: 18,
    paddingHorizontal: SIDE_PAD,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 1.2,
  },
  sectionSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
    marginLeft: 14,
  },
  templateWrap: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 2,
  },
  templateSelected: {
    borderColor: Colors.accent,
    borderRadius: 18,
  },
  blankButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    gap: 8,
    marginBottom: 10,
    marginHorizontal: SIDE_PAD,
  },
  blankButtonText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  forgeArea: {
    marginTop: 10,
    gap: 14,
    paddingHorizontal: SIDE_PAD,
  },
  forgeDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 6,
    marginHorizontal: 20,
  },
  forgeCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  forgeCardEdge: {
    width: 5,
  },
  forgeCardInner: {
    flex: 1,
    padding: 18,
    gap: 14,
  },
  forgeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  forgeCardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forgeCardHeaderText: {
    flex: 1,
  },
  forgeCardTitle: {
    fontSize: isSmall ? 17 : 19,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  forgeCardDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  viewExistingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardElevated,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    gap: 10,
  },
  viewExistingText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
    flex: 1,
  },
  customizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  customizeText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  configToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.cardElevated,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  configToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  configToggleText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  configBody: {
    gap: 14,
    paddingTop: 4,
  },
  configField: {
    gap: 7,
  },
  configFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  configFieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  configFieldLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  configInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  configFieldHint: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
  },
  lengthPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.inputBg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  lengthOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  lengthOptionText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  lengthOptionTextActive: {
    color: Colors.accent,
  },
  forgeButton: {
    backgroundColor: Colors.accent,
    borderRadius: 28,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  forgeButtonGold: {
    backgroundColor: Colors.gold,
    shadowColor: Colors.gold,
  },
  forgeButtonText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#fff',
    letterSpacing: 0.3,
  },
  forgeButtonTextDark: {
    color: '#0A0E1A',
  },
  bottomPad: {
    height: 100,
  },
});
