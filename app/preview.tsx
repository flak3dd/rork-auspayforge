import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Share as ShareIcon, Printer, Download } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
}

export default function PreviewScreen() {
  const { output, config } = usePayroll();

  const statement = output?.bankStatement;

  const handleExport = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Export',
      'Statement preview is ready. In production, this would generate a PDF via expo-print and share it.',
      [{ text: 'OK' }]
    );
  }, []);

  if (!statement) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Statement</Text>
        <Text style={styles.emptySubtitle}>Generate payslips first to view the bank statement</Text>
      </View>
    );
  }

  const visibleTxs = statement.transactions.slice(0, 80);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statementHeader}>
          <View style={styles.bankRow}>
            <View style={styles.diamond} />
            <View>
              <Text style={styles.bankName}>Commonwealth Bank</Text>
              <Text style={styles.bankSub}>ABN 48 123 123 124</Text>
            </View>
          </View>
          <Text style={styles.statementTitle}>Your Statement</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account Holder</Text>
            <Text style={styles.summaryValue}>{statement.accountHolder}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Account</Text>
            <Text style={styles.summaryValue}>{statement.bsb} {statement.accountNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Period</Text>
            <Text style={styles.summaryValue}>{statement.statementPeriod}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Opening Balance</Text>
            <Text style={[styles.summaryValue, styles.balanceText]}>${fmt(statement.openingBalance)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Closing Balance</Text>
            <Text style={[styles.summaryValue, styles.balanceAccent]}>${fmt(statement.closingBalance)}</Text>
          </View>
        </View>

        <View style={styles.txCountRow}>
          <Text style={styles.txCount}>{statement.transactions.length} transactions</Text>
          <Text style={styles.txPages}>{statement.pages.length} pages</Text>
        </View>

        <View style={styles.tableHeader}>
          <Text style={[styles.thText, styles.dateCol]}>Date</Text>
          <Text style={[styles.thText, styles.descCol]}>Transaction</Text>
          <Text style={[styles.thText, styles.numCol]}>Debit</Text>
          <Text style={[styles.thText, styles.numCol]}>Credit</Text>
          <Text style={[styles.thText, styles.balCol]}>Balance</Text>
        </View>

        {visibleTxs.map((tx, i) => (
          <View key={i} style={[styles.txRow, i % 2 === 0 && styles.txRowAlt]}>
            <Text style={[styles.txCell, styles.dateCol]} numberOfLines={1}>
              {fmtDate(tx.date)}
            </Text>
            <Text style={[styles.txCell, styles.descCol]} numberOfLines={2}>
              {tx.description.replace(/\n/g, ' ')}
            </Text>
            <Text style={[styles.txCell, styles.numCol, tx.debit > 0 && styles.debitText]}>
              {tx.debit > 0 ? fmt(tx.debit) : ''}
            </Text>
            <Text style={[styles.txCell, styles.numCol, tx.credit > 0 && styles.creditText]}>
              {tx.credit > 0 ? fmt(tx.credit) : ''}
            </Text>
            <Text style={[styles.txCell, styles.balCol]}>
              {fmt(tx.balance)}
            </Text>
          </View>
        ))}

        {statement.transactions.length > 80 && (
          <View style={styles.moreBox}>
            <Text style={styles.moreText}>
              + {statement.transactions.length - 80} more transactions
            </Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          activeOpacity={0.8}
        >
          <ShareIcon size={18} color={Colors.background} />
          <Text style={styles.exportButtonText}>Export Statement</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  statementHeader: {
    marginBottom: 16,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  diamond: {
    width: 24,
    height: 24,
    backgroundColor: '#FFCC00',
    transform: [{ rotate: '45deg' }],
  },
  bankName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  bankSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  statementTitle: {
    fontSize: 24,
    fontWeight: '300' as const,
    color: '#FFCC00',
    letterSpacing: -0.5,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  balanceText: {
    color: Colors.textSecondary,
  },
  balanceAccent: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 2,
  },
  txCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  txCount: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  txPages: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFCC00',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  thText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  dateCol: {
    width: 42,
  },
  descCol: {
    flex: 1,
    paddingHorizontal: 4,
  },
  numCol: {
    width: 52,
    textAlign: 'right' as const,
  },
  balCol: {
    width: 60,
    textAlign: 'right' as const,
  },
  txRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  txRowAlt: {
    backgroundColor: Colors.card + '40',
  },
  txCell: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  debitText: {
    color: Colors.error,
  },
  creditText: {
    color: Colors.success,
  },
  moreBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  moreText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
  },
  exportButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.background,
  },
  bottomPad: {
    height: 20,
  },
});
