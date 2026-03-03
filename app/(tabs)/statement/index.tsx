import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import {
  Landmark,
  FileText,
  LayoutGrid,
  Download,
  ChevronDown,
  ChevronUp,
  DollarSign,
  CalendarRange,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Calendar,
  Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import HTMLRenderer from '@/components/HTMLRenderer';
import { exportHTMLToPDF } from '@/utils/export';

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

type StatementLength = 30 | 60 | 90;

const LENGTH_OPTIONS: { value: StatementLength; label: string }[] = [
  { value: 30, label: '30 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' },
];

function formatInputDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function parseInputToISO(input: string): string | null {
  const trimmed = input.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, dd, mm, yyyy] = slashMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  const dashMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, dd, mm, yyyy] = dashMatch;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }

  return null;
}

export default function StatementScreen() {
  const { output, statementHTML, config, regenerateStatement } = usePayroll();
  const [viewMode, setViewMode] = useState<'overview' | 'document'>('overview');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showPayDates, setShowPayDates] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [startDateInput, setStartDateInput] = useState<string>(config.bankConfig.statementStartDate);
  const [selectedLength, setSelectedLength] = useState<StatementLength>(config.bankConfig.statementLength);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const statement = output?.bankStatement;
  const payslips = output?.payslips;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleExport = useCallback(async () => {
    if (!statementHTML || isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await exportHTMLToPDF(statementHTML, 'Bank_Statement');
      console.log('[Statement] Exported statement');
    } finally {
      setIsExporting(false);
    }
  }, [statementHTML, isExporting]);

  const toggleView = useCallback(() => {
    Haptics.selectionAsync();
    setViewMode(prev => prev === 'overview' ? 'document' : 'overview');
  }, []);

  const handleRegenerate = useCallback(() => {
    const iso = parseInputToISO(startDateInput);
    if (!iso) {
      console.log('[Statement] Invalid date input:', startDateInput);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRegenerating(true);
    try {
      regenerateStatement(iso, selectedLength);
      console.log('[Statement] Regenerated with start:', iso, 'length:', selectedLength);
    } finally {
      setIsRegenerating(false);
    }
  }, [startDateInput, selectedLength, regenerateStatement]);

  const totalCredits = statement?.transactions.reduce((sum, tx) => sum + tx.credit, 0) ?? 0;
  const totalDebits = statement?.transactions.reduce((sum, tx) => sum + tx.debit, 0) ?? 0;

  if (!statement || !statementHTML) {
    return (
      <View style={styles.emptyContainer}>
        <Animated.View style={[styles.emptyContent, { opacity: fadeAnim }]}>
          <View style={styles.emptyIconWrap}>
            <Landmark size={44} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No Statement Yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate payslips from the Forge tab — the bank statement will be created automatically with your payslip dates and amounts mapped in.
          </Text>
        </Animated.View>
      </View>
    );
  }

  if (viewMode === 'document') {
    return (
      <View style={styles.container}>
        <View style={styles.docHeader}>
          <TouchableOpacity style={styles.backToOverview} onPress={toggleView} activeOpacity={0.7}>
            <LayoutGrid size={16} color={Colors.accent} />
            <Text style={styles.backToOverviewText}>Overview</Text>
          </TouchableOpacity>
          <Text style={styles.docHeaderTitle}>{statement.pages.length} pages</Text>
        </View>
        <HTMLRenderer html={statementHTML} style={styles.webviewContainer} />
        <View style={styles.docBottomBar}>
          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExport}
            activeOpacity={0.8}
            disabled={isExporting}
          >
            <Download size={18} color="#fff" />
            <Text style={styles.exportBtnText}>{isExporting ? 'Exporting...' : 'Export PDF'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.accountCard}>
        <View style={styles.accountCardHeader}>
          <View style={styles.bankBadge}>
            <Landmark size={18} color="#FFCC00" />
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountName}>{statement.accountHolder}</Text>
            <Text style={styles.accountNumber}>{statement.bsb} {statement.accountNumber}</Text>
          </View>
        </View>
        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Opening</Text>
            <Text style={styles.balanceValue}>${fmt(statement.openingBalance)}</Text>
          </View>
          <View style={styles.balanceArrow}>
            <ArrowRight size={16} color={Colors.textMuted} />
          </View>
          <View style={[styles.balanceItem, styles.balanceItemEnd]}>
            <Text style={styles.balanceLabel}>Closing</Text>
            <Text style={[styles.balanceValue, styles.closingValue]}>${fmt(statement.closingBalance)}</Text>
          </View>
        </View>
        <View style={styles.periodBar}>
          <CalendarRange size={14} color={Colors.textSecondary} />
          <Text style={styles.periodText}>{statement.statementPeriod}</Text>
        </View>
      </View>

      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => {
            setShowSettings(!showSettings);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingsHeaderLeft}>
            <View style={styles.settingsIconWrap}>
              <Clock size={16} color={Colors.accent} />
            </View>
            <Text style={styles.settingsTitle}>Statement Period</Text>
          </View>
          {showSettings ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {showSettings && (
          <View style={styles.settingsBody}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Calendar size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Start Date</Text>
              </View>
              <TextInput
                style={styles.dateInput}
                value={startDateInput}
                onChangeText={setStartDateInput}
                placeholder="YYYY-MM-DD or DD/MM/YYYY"
                placeholderTextColor={Colors.textMuted}
                keyboardType={Platform.OS === 'web' ? 'default' : 'default'}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.fieldHint}>
                {parseInputToISO(startDateInput)
                  ? formatInputDate(parseInputToISO(startDateInput)!)
                  : 'Invalid date format'}
              </Text>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <CalendarRange size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Statement Length</Text>
              </View>
              <View style={styles.lengthPicker}>
                {LENGTH_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.lengthOption,
                      selectedLength === opt.value && styles.lengthOptionActive,
                    ]}
                    onPress={() => {
                      setSelectedLength(opt.value);
                      Haptics.selectionAsync();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.lengthOptionText,
                        selectedLength === opt.value && styles.lengthOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.regenerateBtn,
                (!parseInputToISO(startDateInput) || isRegenerating) && styles.regenerateBtnDisabled,
              ]}
              onPress={handleRegenerate}
              activeOpacity={0.8}
              disabled={!parseInputToISO(startDateInput) || isRegenerating}
            >
              <RefreshCw size={16} color="#fff" />
              <Text style={styles.regenerateBtnText}>
                {isRegenerating ? 'Regenerating...' : 'Regenerate Statement'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#34C75920' }]}>
            <TrendingUp size={16} color={Colors.success} />
          </View>
          <Text style={styles.statAmount}>${fmt(totalCredits)}</Text>
          <Text style={styles.statLabel}>Total In</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FF3B3020' }]}>
            <TrendingDown size={16} color={Colors.error} />
          </View>
          <Text style={styles.statAmount}>${fmt(totalDebits)}</Text>
          <Text style={styles.statLabel}>Total Out</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accent + '20' }]}>
            <CreditCard size={16} color={Colors.accent} />
          </View>
          <Text style={styles.statAmount}>{statement.transactions.length}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>

      {payslips && payslips.length > 0 && (
        <View style={styles.payDatesSection}>
          <TouchableOpacity
            style={styles.payDatesSectionHeader}
            onPress={() => {
              setShowPayDates(!showPayDates);
              Haptics.selectionAsync();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.payDatesHeaderLeft}>
              <DollarSign size={16} color={Colors.accent} />
              <Text style={styles.payDatesSectionTitle}>Payslip Deposits</Text>
            </View>
            {showPayDates ? (
              <ChevronUp size={18} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={18} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
          {showPayDates && (
            <View style={styles.payDatesList}>
              {payslips.map((ps, i) => (
                <View key={i} style={styles.payDateRow}>
                  <View style={styles.payDateLeft}>
                    <View style={styles.payDateDot} />
                    <View>
                      <Text style={styles.payDateLabel}>Period {i + 1}</Text>
                      <Text style={styles.payDateRange}>
                        {fmtDate(ps.period.startDate)} – {fmtDate(ps.period.endDate)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.payDateRight}>
                    <Text style={styles.payDateAmount}>${fmt(ps.netPay)}</Text>
                    <Text style={styles.payDatePaidOn}>Paid {fmtDate(ps.period.paymentDate)}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.payDateNote}>
                <Text style={styles.payDateNoteText}>
                  These amounts appear as salary credits in the statement on their respective payment dates.
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.viewDocButton}
          onPress={toggleView}
          activeOpacity={0.8}
        >
          <FileText size={18} color={Colors.accent} />
          <Text style={styles.viewDocText}>View Full Document</Text>
          <Text style={styles.viewDocPages}>{statement.pages.length} pages</Text>
        </TouchableOpacity>

        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportSmallBtn}
            onPress={handleExport}
            activeOpacity={0.7}
            disabled={isExporting}
          >
            <Download size={16} color="#fff" />
            <Text style={styles.exportSmallText}>{isExporting ? 'Exporting...' : 'Export PDF'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyContent: {
    alignItems: 'center',
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
  accountCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
  },
  accountCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  bankBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFCC0018',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  accountNumber: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontVariant: ['tabular-nums'] as const,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  balanceItem: {
    flex: 1,
  },
  balanceItemEnd: {
    alignItems: 'flex-end',
  },
  balanceArrow: {
    paddingHorizontal: 8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  closingValue: {
    color: Colors.success,
  },
  periodBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  periodText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAmount: {
    fontSize: 15,
    fontWeight: '800' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  payDatesSection: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  payDatesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  payDatesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payDatesSectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  payDatesList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  payDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  payDateLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  payDateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  payDateLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  payDateRange: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  payDateRight: {
    alignItems: 'flex-end',
  },
  payDateAmount: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.success,
    fontVariant: ['tabular-nums'] as const,
  },
  payDatePaidOn: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  payDateNote: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  payDateNoteText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  actionsSection: {
    gap: 10,
    marginBottom: 8,
  },
  viewDocButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    gap: 10,
  },
  viewDocText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.accent,
    flex: 1,
  },
  viewDocPages: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exportRow: {
    flexDirection: 'row',
    gap: 10,
  },
  exportSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent,
  },
  exportSmallText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: Colors.accent,
  },
  exportBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backToOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  backToOverviewText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  docHeaderTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  webviewContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  docBottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
    flexDirection: 'row',
  },
  bottomPad: {
    height: 30,
  },
  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: Colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  settingsBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  dateInput: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  fieldHint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  lengthPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  lengthOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  lengthOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  lengthOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  lengthOptionTextActive: {
    color: Colors.accent,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  regenerateBtnDisabled: {
    opacity: 0.5,
  },
  regenerateBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
