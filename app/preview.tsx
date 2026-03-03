import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Download, FileText, LayoutGrid } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import HTMLRenderer from '@/components/HTMLRenderer';
import { exportHTMLToPDF } from '@/utils/export';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function PreviewScreen() {
  const { output, statementHTML } = usePayroll();
  const [viewMode, setViewMode] = useState<'html' | 'summary'>('html');

  const statement = output?.bankStatement;

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExport = useCallback(async () => {
    if (!statementHTML || isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await exportHTMLToPDF(statementHTML, 'Bank_Statement');
      console.log('[Preview] Statement exported');
    } finally {
      setIsExporting(false);
    }
  }, [statementHTML, isExporting]);

  const toggleView = useCallback(() => {
    Haptics.selectionAsync();
    setViewMode(prev => prev === 'html' ? 'summary' : 'html');
  }, []);

  if (!statement || !statementHTML) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No Statement</Text>
        <Text style={styles.emptySubtitle}>Generate payslips first to view the bank statement</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoBar}>
        <View style={styles.infoLeft}>
          <Text style={styles.infoLabel}>{statement.accountHolder}</Text>
          <Text style={styles.infoSub}>{statement.transactions.length} transactions · {statement.pages.length} pages</Text>
        </View>
        <TouchableOpacity style={styles.toggleBtn} onPress={toggleView} activeOpacity={0.7}>
          {viewMode === 'html' ? (
            <LayoutGrid size={16} color={Colors.accent} />
          ) : (
            <FileText size={16} color={Colors.accent} />
          )}
          <Text style={styles.toggleText}>{viewMode === 'html' ? 'Summary' : 'Document'}</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'html' ? (
        <HTMLRenderer html={statementHTML} style={styles.webviewContainer} />
      ) : (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
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
              <Text style={styles.summaryValue}>${fmt(statement.openingBalance)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Closing Balance</Text>
              <Text style={[styles.summaryValue, styles.accentText]}>${fmt(statement.closingBalance)}</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExport}
          activeOpacity={0.8}
          disabled={isExporting}
        >
          <Download size={18} color={Colors.background} />
          <Text style={styles.exportButtonText}>{isExporting ? 'Exporting...' : 'Export Statement'}</Text>
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
  infoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLeft: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  webviewContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryContainer: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  accentText: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
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
});
