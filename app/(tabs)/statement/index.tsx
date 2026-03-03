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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  Settings2,
  Banknote,
  Activity,
  Wallet,
  CircleDollarSign,
  ArrowUpDown,
  Layers,
  Eye,
  EyeOff,
  MapPin,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import HTMLRenderer from '@/components/HTMLRenderer';
import { exportHTMLToPDF } from '@/utils/export';
import type { TransactionDensity } from '@/types/payroll';

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

const DENSITY_OPTIONS: { value: TransactionDensity; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: 'Fewer daily transactions' },
  { value: 'medium', label: 'Medium', desc: 'Standard activity' },
  { value: 'high', label: 'High', desc: 'Busy account' },
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
  const [showPeriodSettings, setShowPeriodSettings] = useState<boolean>(false);
  const [showBalanceSettings, setShowBalanceSettings] = useState<boolean>(false);
  const [showTxSettings, setShowTxSettings] = useState<boolean>(false);
  const [showAmountSettings, setShowAmountSettings] = useState<boolean>(false);

  const [startDateInput, setStartDateInput] = useState<string>(config.bankConfig.statementStartDate);
  const [selectedLength, setSelectedLength] = useState<StatementLength>(config.bankConfig.statementLength);
  const [openingBalance, setOpeningBalance] = useState<string>(String(config.bankConfig.openingBalance));
  const [closingBalance, setClosingBalance] = useState<string>(String(config.bankConfig.closingBalance));
  const [density, setDensity] = useState<TransactionDensity>(config.bankConfig.transactionDensity);
  const [includePension, setIncludePension] = useState<boolean>(config.bankConfig.includePension);
  const [includeATM, setIncludeATM] = useState<boolean>(config.bankConfig.includeATM);
  const [includeCardlessCash, setIncludeCardlessCash] = useState<boolean>(config.bankConfig.includeCardlessCash);
  const [includeTransfers, setIncludeTransfers] = useState<boolean>(config.bankConfig.includeTransfers);
  const [dailySpendMin, setDailySpendMin] = useState<string>(String(config.bankConfig.dailySpendMin));
  const [dailySpendMax, setDailySpendMax] = useState<string>(String(config.bankConfig.dailySpendMax));
  const [incomingTransferMin, setIncomingTransferMin] = useState<string>(String(config.bankConfig.incomingTransferMin));
  const [incomingTransferMax, setIncomingTransferMax] = useState<string>(String(config.bankConfig.incomingTransferMax));
  const [suburb1, setSuburb1] = useState<string>(config.bankConfig.suburbs[0]);
  const [suburb2, setSuburb2] = useState<string>(config.bankConfig.suburbs[1]);
  const [suburb3, setSuburb3] = useState<string>(config.bankConfig.suburbs[2]);
  const [debitCreditRatio, setDebitCreditRatio] = useState<number>(config.bankConfig.debitCreditRatio);
  const [showLocationSettings, setShowLocationSettings] = useState<boolean>(false);

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
      regenerateStatement(iso, selectedLength, {
        openingBalance: parseFloat(openingBalance) || 0,
        closingBalance: parseFloat(closingBalance) || 0,
        transactionDensity: density,
        includePension,
        includeATM,
        includeCardlessCash,
        includeTransfers,
        dailySpendMin: parseFloat(dailySpendMin) || 14,
        dailySpendMax: parseFloat(dailySpendMax) || 154,
        incomingTransferMin: parseFloat(incomingTransferMin) || 50,
        incomingTransferMax: parseFloat(incomingTransferMax) || 560,
        debitCreditRatio,
        suburbs: [suburb1.trim() || 'CABOOLTURE', suburb2.trim() || 'MORAYFIELD', suburb3.trim() || 'BURPENGARY'],
      });
      console.log('[Statement] Regenerated with all custom options');
    } finally {
      setIsRegenerating(false);
    }
  }, [
    startDateInput, selectedLength, openingBalance, closingBalance,
    density, includePension, includeATM, includeCardlessCash, includeTransfers,
    dailySpendMin, dailySpendMax, incomingTransferMin, incomingTransferMax,
    debitCreditRatio, suburb1, suburb2, suburb3, regenerateStatement,
  ]);

  const totalCredits = statement?.transactions.reduce((sum, tx) => sum + tx.credit, 0) ?? 0;
  const totalDebits = statement?.transactions.reduce((sum, tx) => sum + tx.debit, 0) ?? 0;
  const maxStat = Math.max(totalCredits, totalDebits, 1);

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
            style={styles.exportBtnFilled}
            onPress={handleExport}
            activeOpacity={0.8}
            disabled={isExporting}
          >
            <Download size={18} color="#fff" />
            <Text style={styles.exportBtnFilledText}>{isExporting ? 'Exporting...' : 'Export PDF'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderToggleRow = (
    label: string,
    value: boolean,
    onToggle: (v: boolean) => void,
    icon: React.ReactNode,
  ) => (
    <View style={styles.toggleRow}>
      <View style={styles.toggleRowLeft}>
        {icon}
        <Text style={styles.toggleRowLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          onToggle(v);
          Haptics.selectionAsync();
        }}
        trackColor={{ false: Colors.border, true: Colors.accent + '60' }}
        thumbColor={value ? Colors.accent : Colors.textMuted}
      />
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.accountCard}>
        <LinearGradient
          colors={['#1A2744', '#141A2E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accountGradientStripe}
        />
        <View style={styles.accountCardBody}>
          <View style={styles.accountCardHeader}>
            <View style={styles.bankBadge}>
              <Landmark size={18} color={Colors.gold} />
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
      </View>

      {/* Period Settings */}
      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => {
            setShowPeriodSettings(!showPeriodSettings);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingsHeaderLeft}>
            <View style={styles.settingsIconWrap}>
              <Clock size={16} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.settingsTitle}>Statement Period</Text>
              <Text style={styles.settingsSubtitle}>Start date & duration</Text>
            </View>
          </View>
          {showPeriodSettings ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {showPeriodSettings && (
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
          </View>
        )}
      </View>

      {/* Balance Settings */}
      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => {
            setShowBalanceSettings(!showBalanceSettings);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingsHeaderLeft}>
            <View style={[styles.settingsIconWrap, { backgroundColor: Colors.goldDim }]}>
              <Wallet size={16} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.settingsTitle}>Balances</Text>
              <Text style={styles.settingsSubtitle}>Opening & closing amounts</Text>
            </View>
          </View>
          {showBalanceSettings ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {showBalanceSettings && (
          <View style={styles.settingsBody}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Opening Balance</Text>
                </View>
                <View style={styles.currencyInputWrap}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.currencyInput}
                    value={openingBalance}
                    onChangeText={setOpeningBalance}
                    placeholder="200"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <View style={styles.fieldHalf}>
                <View style={styles.fieldLabelRow}>
                  <Text style={styles.fieldLabel}>Closing Balance</Text>
                </View>
                <View style={styles.currencyInputWrap}>
                  <Text style={styles.currencyPrefix}>$</Text>
                  <TextInput
                    style={styles.currencyInput}
                    value={closingBalance}
                    onChangeText={setClosingBalance}
                    placeholder="1000"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            </View>
            <Text style={styles.fieldHint}>
              The statement will adjust the final transaction to match your closing balance.
            </Text>
          </View>
        )}
      </View>

      {/* Transaction Type Toggles */}
      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => {
            setShowTxSettings(!showTxSettings);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingsHeaderLeft}>
            <View style={[styles.settingsIconWrap, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Layers size={16} color={Colors.blue} />
            </View>
            <View>
              <Text style={styles.settingsTitle}>Transaction Types</Text>
              <Text style={styles.settingsSubtitle}>Control what appears</Text>
            </View>
          </View>
          {showTxSettings ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {showTxSettings && (
          <View style={styles.settingsBody}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <Activity size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Transaction Density</Text>
              </View>
              <View style={styles.lengthPicker}>
                {DENSITY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.densityOption,
                      density === opt.value && styles.densityOptionActive,
                    ]}
                    onPress={() => {
                      setDensity(opt.value);
                      Haptics.selectionAsync();
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.densityOptionLabel,
                        density === opt.value && styles.densityOptionLabelActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={[
                        styles.densityOptionDesc,
                        density === opt.value && styles.densityOptionDescActive,
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <ArrowUpDown size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Debit / Credit Ratio</Text>
              </View>
              <View style={styles.ratioSliderContainer}>
                <View style={styles.ratioLabelsRow}>
                  <Text style={[styles.ratioEndLabel, debitCreditRatio < 0.4 && styles.ratioEndLabelActive]}>
                    More Debits
                  </Text>
                  <Text style={[styles.ratioEndLabel, debitCreditRatio > 0.6 && styles.ratioCreditLabelActive]}>
                    More Credits
                  </Text>
                </View>
                <View style={styles.ratioTrack}>
                  <View
                    style={[
                      styles.ratioFillLeft,
                      { width: `${(1 - debitCreditRatio) * 100}%` },
                    ]}
                  />
                  <View
                    style={[
                      styles.ratioFillRight,
                      { width: `${debitCreditRatio * 100}%` },
                    ]}
                  />
                </View>
                {Platform.OS === 'web' ? (
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(debitCreditRatio * 100)}
                    onChange={(e: any) => {
                      const val = parseInt(e.target.value, 10) / 100;
                      setDebitCreditRatio(val);
                    }}
                    style={{
                      width: '100%',
                      height: 40,
                      opacity: 0,
                      position: 'absolute' as const,
                      cursor: 'pointer',
                      zIndex: 10,
                      margin: 0,
                      top: 20,
                    }}
                  />
                ) : null}
                {Platform.OS !== 'web' ? (
                  <View
                    style={styles.ratioSliderTouchArea}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) => {
                      const touch = e.nativeEvent;
                      const layout = (e.target as any);
                      if (layout?.measure) {
                        layout.measure((_x: number, _y: number, width: number) => {
                          const val = Math.max(0, Math.min(1, touch.locationX / width));
                          setDebitCreditRatio(Math.round(val * 20) / 20);
                          Haptics.selectionAsync();
                        });
                      } else {
                        setDebitCreditRatio(Math.round(Math.max(0, Math.min(1, touch.locationX / 300)) * 20) / 20);
                        Haptics.selectionAsync();
                      }
                    }}
                    onResponderMove={(e) => {
                      const touch = e.nativeEvent;
                      const layout = (e.target as any);
                      if (layout?.measure) {
                        layout.measure((_x: number, _y: number, width: number) => {
                          const val = Math.max(0, Math.min(1, touch.locationX / width));
                          setDebitCreditRatio(Math.round(val * 20) / 20);
                        });
                      } else {
                        setDebitCreditRatio(Math.round(Math.max(0, Math.min(1, touch.locationX / 300)) * 20) / 20);
                      }
                    }}
                  />
                ) : null}
                <View
                  style={[
                    styles.ratioThumb,
                    { left: `${debitCreditRatio * 100}%` },
                  ]}
                  pointerEvents="none"
                />
                <View style={styles.ratioMarkers}>
                  <View style={styles.ratioMarker} />
                  <View style={styles.ratioMarker} />
                  <View style={[styles.ratioMarker, styles.ratioMarkerCenter]} />
                  <View style={styles.ratioMarker} />
                  <View style={styles.ratioMarker} />
                </View>
              </View>
              <View style={styles.ratioValueRow}>
                <TrendingDown size={12} color={Colors.error} />
                <Text style={styles.ratioValueText}>
                  {debitCreditRatio < 0.35
                    ? 'Heavy Debits'
                    : debitCreditRatio < 0.45
                    ? 'More Debits'
                    : debitCreditRatio <= 0.55
                    ? 'Balanced'
                    : debitCreditRatio <= 0.65
                    ? 'More Credits'
                    : 'Heavy Credits'}
                </Text>
                <TrendingUp size={12} color={Colors.success} />
              </View>
            </View>

            <View style={styles.divider} />

            {renderToggleRow(
              'Pension Payments',
              includePension,
              setIncludePension,
              <CircleDollarSign size={16} color={Colors.success} />,
            )}
            {renderToggleRow(
              'ATM Withdrawals',
              includeATM,
              setIncludeATM,
              <Banknote size={16} color={Colors.warning} />,
            )}
            {renderToggleRow(
              'P2P Transfers',
              includeTransfers,
              setIncludeTransfers,
              <ArrowUpDown size={16} color={Colors.blue} />,
            )}
            {renderToggleRow(
              'Cardless Cash',
              includeCardlessCash,
              setIncludeCardlessCash,
              <CreditCard size={16} color={Colors.teal} />,
            )}
          </View>
        )}
      </View>

      {/* Location / Suburbs */}
      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => {
            setShowLocationSettings(!showLocationSettings);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingsHeaderLeft}>
            <View style={[styles.settingsIconWrap, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
              <MapPin size={16} color="#A855F7" />
            </View>
            <View>
              <Text style={styles.settingsTitle}>Locations</Text>
              <Text style={styles.settingsSubtitle}>Suburbs used in transactions</Text>
            </View>
          </View>
          {showLocationSettings ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {showLocationSettings && (
          <View style={styles.settingsBody}>
            <Text style={styles.fieldHint}>
              These suburbs will appear in merchant names, ATM locations, and card transaction descriptions.
            </Text>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <MapPin size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Suburb 1 (Primary)</Text>
              </View>
              <TextInput
                style={styles.dateInput}
                value={suburb1}
                onChangeText={setSuburb1}
                placeholder="e.g. CABOOLTURE"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <MapPin size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Suburb 2</Text>
              </View>
              <TextInput
                style={styles.dateInput}
                value={suburb2}
                onChangeText={setSuburb2}
                placeholder="e.g. MORAYFIELD"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <MapPin size={13} color={Colors.textSecondary} />
                <Text style={styles.fieldLabel}>Suburb 3</Text>
              </View>
              <TextInput
                style={styles.dateInput}
                value={suburb3}
                onChangeText={setSuburb3}
                placeholder="e.g. BURPENGARY"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>
          </View>
        )}
      </View>

      {/* Amount Ranges */}
      <View style={styles.settingsCard}>
        <TouchableOpacity
          style={styles.settingsHeader}
          onPress={() => {
            setShowAmountSettings(!showAmountSettings);
            Haptics.selectionAsync();
          }}
          activeOpacity={0.7}
        >
          <View style={styles.settingsHeaderLeft}>
            <View style={[styles.settingsIconWrap, { backgroundColor: 'rgba(52,211,153,0.15)' }]}>
              <Settings2 size={16} color={Colors.success} />
            </View>
            <View>
              <Text style={styles.settingsTitle}>Amount Ranges</Text>
              <Text style={styles.settingsSubtitle}>Spending & incoming limits</Text>
            </View>
          </View>
          {showAmountSettings ? (
            <ChevronUp size={18} color={Colors.textMuted} />
          ) : (
            <ChevronDown size={18} color={Colors.textMuted} />
          )}
        </TouchableOpacity>

        {showAmountSettings && (
          <View style={styles.settingsBody}>
            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <TrendingDown size={13} color={Colors.error} />
                <Text style={styles.fieldLabel}>Daily Spend Range</Text>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <View style={styles.currencyInputWrap}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      style={styles.currencyInput}
                      value={dailySpendMin}
                      onChangeText={setDailySpendMin}
                      placeholder="14"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={styles.rangeLabel}>Min per item</Text>
                </View>
                <View style={styles.rangeDash}>
                  <Text style={styles.rangeDashText}>–</Text>
                </View>
                <View style={styles.fieldHalf}>
                  <View style={styles.currencyInputWrap}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      style={styles.currencyInput}
                      value={dailySpendMax}
                      onChangeText={setDailySpendMax}
                      placeholder="154"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={styles.rangeLabel}>Max per item</Text>
                </View>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldLabelRow}>
                <TrendingUp size={13} color={Colors.success} />
                <Text style={styles.fieldLabel}>Incoming Transfer Range</Text>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <View style={styles.currencyInputWrap}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      style={styles.currencyInput}
                      value={incomingTransferMin}
                      onChangeText={setIncomingTransferMin}
                      placeholder="50"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={styles.rangeLabel}>Min per transfer</Text>
                </View>
                <View style={styles.rangeDash}>
                  <Text style={styles.rangeDashText}>–</Text>
                </View>
                <View style={styles.fieldHalf}>
                  <View style={styles.currencyInputWrap}>
                    <Text style={styles.currencyPrefix}>$</Text>
                    <TextInput
                      style={styles.currencyInput}
                      value={incomingTransferMax}
                      onChangeText={setIncomingTransferMax}
                      placeholder="560"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={styles.rangeLabel}>Max per transfer</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Regenerate Button */}
      <TouchableOpacity
        style={[
          styles.regenerateBtn,
          (!parseInputToISO(startDateInput) || isRegenerating) && styles.regenerateBtnDisabled,
        ]}
        onPress={handleRegenerate}
        activeOpacity={0.8}
        disabled={!parseInputToISO(startDateInput) || isRegenerating}
      >
        <RefreshCw size={18} color="#fff" />
        <Text style={styles.regenerateBtnText}>
          {isRegenerating ? 'Regenerating...' : 'Regenerate Statement'}
        </Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(52, 211, 153, 0.12)' }]}>
            <TrendingUp size={16} color={Colors.success} />
          </View>
          <Text style={styles.statAmount}>${fmt(totalCredits)}</Text>
          <View style={styles.statBarTrack}>
            <View style={[styles.statBarFill, { width: `${(totalCredits / maxStat) * 100}%`, backgroundColor: Colors.success }]} />
          </View>
          <Text style={styles.statLabel}>Total In</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: 'rgba(244, 63, 94, 0.12)' }]}>
            <TrendingDown size={16} color={Colors.error} />
          </View>
          <Text style={styles.statAmount}>${fmt(totalDebits)}</Text>
          <View style={styles.statBarTrack}>
            <View style={[styles.statBarFill, { width: `${(totalDebits / maxStat) * 100}%`, backgroundColor: Colors.error }]} />
          </View>
          <Text style={styles.statLabel}>Total Out</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accentDim }]}>
            <CreditCard size={16} color={Colors.accent} />
          </View>
          <Text style={styles.statAmount}>{statement.transactions.length}</Text>
          <View style={styles.statBarTrack}>
            <View style={[styles.statBarFill, { width: '60%', backgroundColor: Colors.accent }]} />
          </View>
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
              <DollarSign size={16} color={Colors.gold} />
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
                  <View style={styles.timelineCol}>
                    <View style={styles.timelineDot} />
                    {i < payslips.length - 1 && <View style={styles.timelineLine} />}
                  </View>
                  <View style={styles.payDateContent}>
                    <View style={styles.payDateLeft}>
                      <Text style={styles.payDateLabel}>Period {i + 1}</Text>
                      <Text style={styles.payDateRange}>
                        {fmtDate(ps.period.startDate)} – {fmtDate(ps.period.endDate)}
                      </Text>
                    </View>
                    <View style={styles.payDateRight}>
                      <Text style={styles.payDateAmount}>${fmt(ps.netPay)}</Text>
                      <Text style={styles.payDatePaidOn}>Paid {fmtDate(ps.period.paymentDate)}</Text>
                    </View>
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
          <View style={styles.viewDocPagesBadge}>
            <Text style={styles.viewDocPages}>{statement.pages.length} pages</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportBtnFilled}
          onPress={handleExport}
          activeOpacity={0.7}
          disabled={isExporting}
        >
          <Download size={16} color="#fff" />
          <Text style={styles.exportBtnFilledText}>{isExporting ? 'Exporting...' : 'Export PDF'}</Text>
        </TouchableOpacity>
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
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  accountGradientStripe: {
    height: 6,
  },
  accountCardBody: {
    padding: 18,
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
    borderRadius: 13,
    backgroundColor: Colors.goldDim,
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
    alignItems: 'flex-end' as const,
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
    gap: 5,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAmount: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  statBarTrack: {
    width: '100%',
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  statBarFill: {
    height: 3,
    borderRadius: 1.5,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  payDatesSection: {
    backgroundColor: Colors.card,
    borderRadius: 18,
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
    minHeight: 60,
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gold,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.gold + '40',
    marginTop: 4,
  },
  payDateContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    paddingLeft: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  payDateLeft: {
    flex: 1,
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
    alignItems: 'flex-end' as const,
  },
  payDateAmount: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.gold,
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
  viewDocPagesBadge: {
    backgroundColor: Colors.cardElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewDocPages: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  exportBtnFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 26,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  exportBtnFilledText: {
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
    height: 90,
  },
  settingsCard: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
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
    backgroundColor: Colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  settingsSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  settingsBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
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
    backgroundColor: Colors.accentDim,
  },
  lengthOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  lengthOptionTextActive: {
    color: Colors.accent,
  },
  densityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: Colors.cardElevated,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  densityOptionActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentDim,
  },
  densityOptionLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textMuted,
  },
  densityOptionLabelActive: {
    color: Colors.accent,
  },
  densityOptionDesc: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center' as const,
  },
  densityOptionDescActive: {
    color: Colors.accent + 'AA',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  ratioSliderContainer: {
    marginTop: 4,
    position: 'relative' as const,
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ratioEndLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  ratioEndLabelActive: {
    color: Colors.error,
  },
  ratioCreditLabelActive: {
    color: Colors.success,
  },
  ratioTrack: {
    height: 6,
    borderRadius: 3,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: Colors.cardElevated,
  },
  ratioFillLeft: {
    height: 6,
    backgroundColor: Colors.error + '60',
  },
  ratioFillRight: {
    height: 6,
    backgroundColor: Colors.success + '60',
  },
  ratioSliderTouchArea: {
    position: 'absolute' as const,
    top: -14,
    left: 0,
    right: 0,
    height: 40,
    zIndex: 10,
  },
  ratioThumb: {
    position: 'absolute' as const,
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginLeft: -8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  ratioMarkers: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginTop: 8,
  },
  ratioMarker: {
    width: 1,
    height: 6,
    backgroundColor: Colors.border,
  },
  ratioMarkerCenter: {
    width: 2,
    backgroundColor: Colors.textMuted,
  },
  ratioValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: Colors.cardElevated,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ratioValueText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  toggleRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleRowLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  fieldHalf: {
    flex: 1,
  },
  currencyInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    overflow: 'hidden',
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    paddingLeft: 12,
    paddingRight: 2,
  },
  currencyInput: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  rangeDash: {
    justifyContent: 'center',
    paddingTop: 4,
  },
  rangeDashText: {
    fontSize: 18,
    color: Colors.textMuted,
    fontWeight: '600' as const,
  },
  rangeLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 24,
    backgroundColor: Colors.accent,
    marginBottom: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  regenerateBtnDisabled: {
    opacity: 0.5,
  },
  regenerateBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
