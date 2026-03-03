import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import {
  Download,
  Share2,
  FileText,
  Table,
  CheckCircle,
  PackageOpen,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import { Payslip, BankTransaction } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function payslipToText(ps: Payslip, idx: number): string {
  let text = '';
  text += `${'='.repeat(50)}\n`;
  text += `PAYSLIP - Period ${idx + 1}\n`;
  text += `${ps.employer.name} | ABN: ${ps.employer.abn}\n`;
  text += `${'='.repeat(50)}\n`;
  text += `Employee: ${ps.employee.name} (${ps.employee.id})\n`;
  text += `Period: ${fmtDate(ps.period.startDate)} - ${fmtDate(ps.period.endDate)}\n`;
  text += `Payment Date: ${fmtDate(ps.period.paymentDate)}\n`;
  text += `Annual Rate: $${fmt(ps.annualRate)}\n\n`;

  text += `--- EARNINGS ---\n`;
  for (const e of ps.earnings) {
    text += `  ${e.description.padEnd(20)} ${e.hours > 0 ? e.hours.toFixed(1) + 'h' : '    '} $${fmt(e.amount).padStart(10)}  YTD $${fmt(e.ytd)}\n`;
  }
  text += `  ${'─'.repeat(44)}\n`;
  text += `  GROSS PAY${' '.repeat(24)}$${fmt(ps.grossPay)}\n\n`;

  text += `--- DEDUCTIONS ---\n`;
  for (const d of ps.deductions) {
    text += `  ${d.description.padEnd(30)} $${fmt(d.amount).padStart(10)}  YTD $${fmt(d.ytd)}\n`;
  }
  text += `  ${'─'.repeat(44)}\n`;
  text += `  TOTAL DEDUCTIONS${' '.repeat(17)}-$${fmt(ps.totalDeductions)}\n\n`;

  text += `  *** NET PAY: $${fmt(ps.netPay)} ***\n\n`;

  text += `--- SUPERANNUATION ---\n`;
  text += `  SG (12% OTE): $${fmt(ps.superAmount)}  YTD: $${fmt(ps.superYTD)}\n\n`;

  text += `--- LEAVE ---\n`;
  for (const l of ps.leave) {
    text += `  ${l.type}: Accrued ${l.accruedThisPeriod.toFixed(2)}h | Taken ${l.takenThisPeriod.toFixed(2)}h | Balance ${l.balance.toFixed(2)}h\n`;
  }
  text += `\nPayment to: ${ps.bankAccount} | Ref: ${ps.paymentRef}\n`;
  text += `YTD Gross: $${fmt(ps.ytdGross)} | YTD Tax: $${fmt(ps.ytdTax)} | YTD Net: $${fmt(ps.ytdNet)}\n`;
  text += `\nSimulation — Generated ${new Date().toLocaleDateString('en-AU')} — No Signature Required\n`;
  return text;
}

function statementToText(stmt: { bankName: string; accountHolder: string; bsb: string; accountNumber: string; statementPeriod: string; openingBalance: number; closingBalance: number; transactions: BankTransaction[] }): string {
  let text = '';
  text += `${'='.repeat(60)}\n`;
  text += `${stmt.bankName}\n`;
  text += `Account Statement\n`;
  text += `${'='.repeat(60)}\n`;
  text += `Account Holder: ${stmt.accountHolder}\n`;
  text += `BSB: ${stmt.bsb} | Account: ${stmt.accountNumber}\n`;
  text += `Period: ${stmt.statementPeriod}\n`;
  text += `Opening Balance: $${fmt(stmt.openingBalance)} | Closing Balance: $${fmt(stmt.closingBalance)}\n`;
  text += `${'─'.repeat(60)}\n`;
  text += `${'Date'.padEnd(12)}${'Description'.padEnd(30)}${'Debit'.padStart(8)}${'Credit'.padStart(8)}${'Balance'.padStart(10)}\n`;
  text += `${'─'.repeat(60)}\n`;

  for (const tx of stmt.transactions) {
    const date = fmtDate(tx.date).padEnd(12);
    const desc = tx.description.substring(0, 28).padEnd(30);
    const debit = tx.debit > 0 ? fmt(tx.debit).padStart(8) : ''.padStart(8);
    const credit = tx.credit > 0 ? fmt(tx.credit).padStart(8) : ''.padStart(8);
    const bal = fmt(tx.balance).padStart(10);
    text += `${date}${desc}${debit}${credit}${bal}\n`;
  }

  text += `${'─'.repeat(60)}\n`;
  return text;
}

export default function ExportScreen() {
  const { output } = usePayroll();
  const [shared, setShared] = useState<Record<string, boolean>>({});

  const sharePayslip = useCallback(async (idx: number) => {
    if (!output) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const text = payslipToText(output.payslips[idx], idx);
    try {
      await Share.share({ message: text, title: `Payslip Period ${idx + 1}` });
      setShared(prev => ({ ...prev, [`payslip-${idx}`]: true }));
    } catch (e) {
      console.error('[Export] Share error:', e);
    }
  }, [output]);

  const shareStatement = useCallback(async () => {
    if (!output) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const text = statementToText(output.bankStatement);
    try {
      await Share.share({ message: text, title: 'Bank Statement' });
      setShared(prev => ({ ...prev, statement: true }));
    } catch (e) {
      console.error('[Export] Share error:', e);
    }
  }, [output]);

  const shareAll = useCallback(async () => {
    if (!output) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    let fullText = '';
    output.payslips.forEach((ps, i) => {
      fullText += payslipToText(ps, i) + '\n\n';
    });
    fullText += statementToText(output.bankStatement);
    try {
      await Share.share({ message: fullText, title: 'AusPayForge Bundle' });
      setShared(prev => ({ ...prev, all: true }));
    } catch (e) {
      console.error('[Export] Share all error:', e);
    }
  }, [output]);

  if (!output) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <PackageOpen size={48} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No Outputs Yet</Text>
          <Text style={styles.emptySubtitle}>
            Go to the Forge tab to generate payslips and a bank statement first.
          </Text>
        </View>
      </View>
    );
  }

  const lastPayslip = output.payslips[output.payslips.length - 1];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Generation Summary</Text>
        <Text style={styles.summaryMeta}>
          Generated {new Date(output.generatedAt).toLocaleString('en-AU')}
        </Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{output.payslips.length}</Text>
            <Text style={styles.summaryLabel}>Payslips</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{output.bankStatement.transactions.length}</Text>
            <Text style={styles.summaryLabel}>Transactions</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>${fmt(lastPayslip.ytdGross)}</Text>
            <Text style={styles.summaryLabel}>YTD Gross</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>PAYSLIPS</Text>
      {output.payslips.map((ps, i) => (
        <View key={i} style={styles.exportItem}>
          <View style={styles.exportItemLeft}>
            <View style={styles.exportIcon}>
              <FileText size={20} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.exportItemTitle}>Payslip Period {i + 1}</Text>
              <Text style={styles.exportItemSub}>
                {fmtDate(ps.period.startDate)} - {fmtDate(ps.period.endDate)} • ${fmt(ps.netPay)} net
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => sharePayslip(i)}
          >
            {shared[`payslip-${i}`] ? (
              <CheckCircle size={18} color={Colors.success} />
            ) : (
              <Share2 size={18} color={Colors.accent} />
            )}
          </TouchableOpacity>
        </View>
      ))}

      <Text style={styles.sectionLabel}>BANK STATEMENT</Text>
      <View style={styles.exportItem}>
        <View style={styles.exportItemLeft}>
          <View style={styles.exportIcon}>
            <Table size={20} color={Colors.blue} />
          </View>
          <View>
            <Text style={styles.exportItemTitle}>{output.bankStatement.bankName}</Text>
            <Text style={styles.exportItemSub}>
              {output.bankStatement.statementPeriod} • {output.bankStatement.transactions.length} txns
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={shareStatement}
        >
          {shared.statement ? (
            <CheckCircle size={18} color={Colors.success} />
          ) : (
            <Share2 size={18} color={Colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.bundleButton}
        onPress={shareAll}
        activeOpacity={0.8}
      >
        <Download size={18} color={Colors.background} />
        <Text style={styles.bundleText}>
          {shared.all ? 'Bundle Shared' : 'Share Full Bundle'}
        </Text>
        {shared.all && <CheckCircle size={16} color={Colors.background} />}
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.accent + '33',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  summaryMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.accent,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textMuted,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  exportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  exportItemSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bundleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  bundleText: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.background,
  },
  bottomSpacer: {
    height: 20,
  },
});
