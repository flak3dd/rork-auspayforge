import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Hammer, ChevronLeft, ChevronRight, FileText, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import PayslipCard from '@/components/PayslipCard';
import { BankTransaction } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
}

type ViewMode = 'payslips' | 'statement';

export default function ForgeScreen() {
  const { output, isGenerating, validation, generate } = usePayroll();
  const [currentSlip, setCurrentSlip] = useState(0);
  const [statementPage, setStatementPage] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('payslips');
  const [error, setError] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const forgeGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleForge = useCallback(() => {
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    setError(null);
    try {
      generate();
      console.log('[ForgeScreen] Generation complete');

      Animated.sequence([
        Animated.timing(forgeGlow, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(forgeGlow, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) {
      console.error('[ForgeScreen] Error:', e);
      setError('Generation failed. Check your configuration.');
    }
  }, [validation, generate, forgeGlow]);

  const navigateSlip = useCallback((dir: -1 | 1) => {
    if (!output) return;
    const next = currentSlip + dir;
    if (next >= 0 && next < output.payslips.length) {
      setCurrentSlip(next);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  }, [currentSlip, output]);

  const navigateStatementPage = useCallback((dir: -1 | 1) => {
    if (!output) return;
    const next = statementPage + dir;
    if (next >= 0 && next < output.bankStatement.pages.length) {
      setStatementPage(next);
    }
  }, [statementPage, output]);

  if (!output) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.forgeIconContainer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <View style={styles.forgeIconCircle}>
                <Hammer size={48} color={Colors.accent} />
              </View>
            </Animated.View>
          </View>

          <Text style={styles.emptyTitle}>Ready to Forge</Text>
          <Text style={styles.emptySubtitle}>
            Configure your payroll vectors in the Configure tab, then hit the button below to generate 4 payslips and a bank statement.
          </Text>

          {!validation.valid && (
            <View style={styles.validationBox}>
              <AlertCircle size={16} color={Colors.warning} />
              <Text style={styles.validationText}>
                {validation.errors.length} validation {validation.errors.length === 1 ? 'error' : 'errors'} — fix in Configure tab
              </Text>
            </View>
          )}

          {error && (
            <View style={[styles.validationBox, { borderColor: Colors.error + '44' }]}>
              <AlertCircle size={16} color={Colors.error} />
              <Text style={[styles.validationText, { color: Colors.error }]}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.forgeButton, !validation.valid && styles.forgeButtonDisabled]}
            onPress={handleForge}
            disabled={!validation.valid || isGenerating}
            activeOpacity={0.8}
            testID="forge-button"
          >
            {isGenerating ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Hammer size={20} color={Colors.background} />
                <Text style={styles.forgeButtonText}>Forge Outputs</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentPayslip = output.payslips[currentSlip];
  const currentStatementPage = output.bankStatement.pages[statementPage];

  return (
    <View style={styles.container}>
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'payslips' && styles.modeBtnActive]}
          onPress={() => setViewMode('payslips')}
        >
          <FileText size={14} color={viewMode === 'payslips' ? Colors.background : Colors.textSecondary} />
          <Text style={[styles.modeBtnText, viewMode === 'payslips' && styles.modeBtnTextActive]}>
            Payslips
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, viewMode === 'statement' && styles.modeBtnActive]}
          onPress={() => setViewMode('statement')}
        >
          <FileText size={14} color={viewMode === 'statement' ? Colors.background : Colors.textSecondary} />
          <Text style={[styles.modeBtnText, viewMode === 'statement' && styles.modeBtnTextActive]}>
            Statement
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'payslips' && (
        <>
          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => navigateSlip(-1)}
              disabled={currentSlip === 0}
              style={[styles.navBtn, currentSlip === 0 && styles.navBtnDisabled]}
            >
              <ChevronLeft size={20} color={currentSlip === 0 ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navLabel}>
              Period {currentSlip + 1} of {output.payslips.length}
            </Text>
            <TouchableOpacity
              onPress={() => navigateSlip(1)}
              disabled={currentSlip === output.payslips.length - 1}
              style={[styles.navBtn, currentSlip === output.payslips.length - 1 && styles.navBtnDisabled]}
            >
              <ChevronRight size={20} color={currentSlip === output.payslips.length - 1 ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.cardContainer}>
            <PayslipCard payslip={currentPayslip} index={currentSlip} />
          </View>
        </>
      )}

      {viewMode === 'statement' && (
        <>
          <View style={styles.statementHeader}>
            <Text style={styles.bankName}>{output.bankStatement.bankName}</Text>
            <Text style={styles.statementPeriod}>{output.bankStatement.statementPeriod}</Text>
            <View style={styles.statementMeta}>
              <Text style={styles.metaText}>BSB: {output.bankStatement.bsb}</Text>
              <Text style={styles.metaText}>Acc: {output.bankStatement.accountNumber}</Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => navigateStatementPage(-1)}
              disabled={statementPage === 0}
              style={[styles.navBtn, statementPage === 0 && styles.navBtnDisabled]}
            >
              <ChevronLeft size={20} color={statementPage === 0 ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
            <Text style={styles.navLabel}>
              Page {statementPage + 1} of {output.bankStatement.pages.length}
            </Text>
            <TouchableOpacity
              onPress={() => navigateStatementPage(1)}
              disabled={statementPage === output.bankStatement.pages.length - 1}
              style={[styles.navBtn, statementPage === output.bankStatement.pages.length - 1 && styles.navBtnDisabled]}
            >
              <ChevronRight size={20} color={statementPage === output.bankStatement.pages.length - 1 ? Colors.textMuted : Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.statementBody} showsVerticalScrollIndicator={false}>
            <View style={styles.txHeader}>
              <Text style={[styles.txHeaderText, styles.txDateCol]}>Date</Text>
              <Text style={[styles.txHeaderText, styles.txDescCol]}>Description</Text>
              <Text style={[styles.txHeaderText, styles.txAmountCol]}>Debit</Text>
              <Text style={[styles.txHeaderText, styles.txAmountCol]}>Credit</Text>
              <Text style={[styles.txHeaderText, styles.txBalCol]}>Balance</Text>
            </View>
            {currentStatementPage?.map((tx: BankTransaction, i: number) => (
              <View key={i} style={[styles.txRow, i % 2 === 0 && styles.txRowAlt]}>
                <Text style={[styles.txCell, styles.txDateCol]}>{fmtDate(tx.date)}</Text>
                <Text style={[styles.txCell, styles.txDescCol]} numberOfLines={2}>{tx.description}</Text>
                <Text style={[styles.txCell, styles.txAmountCol, tx.debit > 0 && styles.txDebit]}>
                  {tx.debit > 0 ? fmt(tx.debit) : '-'}
                </Text>
                <Text style={[styles.txCell, styles.txAmountCol, tx.credit > 0 && styles.txCredit]}>
                  {tx.credit > 0 ? fmt(tx.credit) : '-'}
                </Text>
                <Text style={[styles.txCell, styles.txBalCol]}>{fmt(tx.balance)}</Text>
              </View>
            ))}
          </ScrollView>
        </>
      )}

      <TouchableOpacity
        style={styles.reforgeButton}
        onPress={handleForge}
        activeOpacity={0.8}
      >
        <Hammer size={16} color={Colors.accent} />
        <Text style={styles.reforgeText}>Re-forge</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  forgeIconContainer: {
    marginBottom: 24,
  },
  forgeIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.accent + '44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 320,
  },
  validationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.warning + '14',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.warning + '44',
    width: '100%',
    maxWidth: 320,
  },
  validationText: {
    fontSize: 13,
    color: Colors.warning,
    flex: 1,
  },
  forgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 320,
  },
  forgeButtonDisabled: {
    backgroundColor: Colors.textMuted,
    opacity: 0.5,
  },
  forgeButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.background,
  },
  modeToggle: {
    flexDirection: 'row',
    margin: 16,
    marginBottom: 8,
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modeBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  modeBtnTextActive: {
    color: Colors.background,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statementHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statementPeriod: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statementMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statementBody: {
    flex: 1,
    marginHorizontal: 8,
  },
  txHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txHeaderText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  txDateCol: {
    width: 52,
  },
  txDescCol: {
    flex: 1,
    paddingRight: 4,
  },
  txAmountCol: {
    width: 58,
    textAlign: 'right' as const,
  },
  txBalCol: {
    width: 68,
    textAlign: 'right' as const,
  },
  txRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  txRowAlt: {
    backgroundColor: Colors.card + '66',
  },
  txCell: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  txDebit: {
    color: Colors.error,
  },
  txCredit: {
    color: Colors.success,
  },
  reforgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
  },
  reforgeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
});
