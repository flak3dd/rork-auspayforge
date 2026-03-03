import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Colors from '@/constants/colors';
import { Payslip } from '@/types/payroll';

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface PayslipCardProps {
  payslip: Payslip;
  index: number;
}

export default React.memo(function PayslipCard({ payslip, index }: PayslipCardProps) {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.companyName}>{payslip.employer.name}</Text>
        <Text style={styles.abnText}>ABN: {payslip.employer.abn}</Text>
        <View style={styles.periodBadge}>
          <Text style={styles.periodLabel}>Period {index + 1}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Employee</Text>
          <Text style={styles.infoValue}>{payslip.employee.name}</Text>
          <Text style={styles.infoSub}>ID: {payslip.employee.id}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Period</Text>
          <Text style={styles.infoValue}>{fmtDate(payslip.period.startDate)}</Text>
          <Text style={styles.infoSub}>to {fmtDate(payslip.period.endDate)}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Payment Date</Text>
          <Text style={styles.infoValue}>{fmtDate(payslip.period.paymentDate)}</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.infoLabel}>Annual Rate</Text>
          <Text style={styles.infoValue}>${fmt(payslip.annualRate)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.success }]} />
          <Text style={styles.sectionTitle}>EARNINGS</Text>
        </View>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.descCol]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Hours</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Rate</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Amount</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>YTD</Text>
        </View>
        {payslip.earnings.map((e, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.descCol]} numberOfLines={1}>{e.description}</Text>
            <Text style={[styles.tableCellNum, styles.numCol]}>{e.hours > 0 ? e.hours.toFixed(1) : '-'}</Text>
            <Text style={[styles.tableCellNum, styles.numCol]}>{e.rate > 0 ? fmt(e.rate) : '-'}</Text>
            <Text style={[styles.tableCellNum, styles.numCol]}>{fmt(e.amount)}</Text>
            <Text style={[styles.tableCellNum, styles.numCol]}>{fmt(e.ytd)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, styles.descCol]}>Gross Pay</Text>
          <Text style={[styles.totalValue, { color: Colors.success }]}>${fmt(payslip.grossPay)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.error }]} />
          <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
        </View>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, { flex: 2 }]}>Description</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>Amount</Text>
          <Text style={[styles.tableHeaderText, styles.numCol]}>YTD</Text>
        </View>
        {payslip.deductions.map((d, i) => (
          <View key={i} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{d.description}</Text>
            <Text style={[styles.tableCellNum, styles.numCol]}>{fmt(d.amount)}</Text>
            <Text style={[styles.tableCellNum, styles.numCol]}>{fmt(d.ytd)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { flex: 2 }]}>Total Deductions</Text>
          <Text style={[styles.totalValue, { color: Colors.error }]}>-${fmt(payslip.totalDeductions)}</Text>
        </View>
      </View>

      <View style={styles.netPayBox}>
        <Text style={styles.netPayLabel}>NET PAY</Text>
        <Text style={styles.netPayAmount}>${fmt(payslip.netPay)}</Text>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.accent }]} />
          <Text style={styles.sectionTitle}>SUPERANNUATION</Text>
        </View>
        <View style={styles.superRow}>
          <Text style={styles.superLabel}>SG Contribution (12%)</Text>
          <Text style={styles.superValue}>${fmt(payslip.superAmount)}</Text>
        </View>
        <View style={styles.superRow}>
          <Text style={styles.superLabel}>YTD Super</Text>
          <Text style={styles.superValue}>${fmt(payslip.superYTD)}</Text>
        </View>
        <View style={styles.superRow}>
          <Text style={styles.superLabel}>OTE Base</Text>
          <Text style={styles.superValue}>${fmt(payslip.ote)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.gold }]} />
          <Text style={styles.sectionTitle}>LEAVE BALANCES</Text>
        </View>
        {payslip.leave.map((l, i) => (
          <View key={i} style={styles.leaveBlock}>
            <Text style={styles.leaveType}>{l.type}</Text>
            <View style={styles.leaveGrid}>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveLabel}>Accrued</Text>
                <Text style={styles.leaveNum}>{l.accruedThisPeriod.toFixed(2)}h</Text>
              </View>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveLabel}>Taken</Text>
                <Text style={styles.leaveNum}>{l.takenThisPeriod.toFixed(2)}h</Text>
              </View>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveLabel}>Balance</Text>
                <Text style={[styles.leaveNum, { color: Colors.accent }]}>{l.balance.toFixed(2)}h</Text>
              </View>
              <View style={styles.leaveItem}>
                <Text style={styles.leaveLabel}>YTD</Text>
                <Text style={styles.leaveNum}>{l.ytdAccrued.toFixed(2)}h</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.blue }]} />
          <Text style={styles.sectionTitle}>PAYMENT DETAILS</Text>
        </View>
        <View style={styles.superRow}>
          <Text style={styles.superLabel}>Account</Text>
          <Text style={styles.superValue}>{payslip.bankAccount}</Text>
        </View>
        <View style={styles.superRow}>
          <Text style={styles.superLabel}>Reference</Text>
          <Text style={styles.superValue}>{payslip.paymentRef}</Text>
        </View>
      </View>

      <View style={styles.ytdSection}>
        <View style={styles.sectionTitleRow}>
          <View style={[styles.sectionDot, { backgroundColor: Colors.teal }]} />
          <Text style={styles.sectionTitle}>YEAR TO DATE</Text>
        </View>
        <View style={styles.ytdGrid}>
          <View style={styles.ytdItem}>
            <Text style={styles.ytdLabel}>Gross</Text>
            <Text style={styles.ytdValue}>${fmt(payslip.ytdGross)}</Text>
          </View>
          <View style={styles.ytdItem}>
            <Text style={styles.ytdLabel}>Tax</Text>
            <Text style={styles.ytdValue}>${fmt(payslip.ytdTax)}</Text>
          </View>
          <View style={styles.ytdItem}>
            <Text style={styles.ytdLabel}>Net</Text>
            <Text style={styles.ytdValue}>${fmt(payslip.ytdNet)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Simulation — Generated {new Date().toLocaleDateString('en-AU')} — No Signature Required
      </Text>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 0.5,
  },
  abnText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  periodBadge: {
    marginTop: 10,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  periodLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  infoCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  infoSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
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
    letterSpacing: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  descCol: {
    flex: 2,
  },
  numCol: {
    flex: 1,
    textAlign: 'right' as const,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  tableCell: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  tableCellNum: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'] as const,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '800' as const,
    fontVariant: ['tabular-nums'] as const,
  },
  netPayBox: {
    marginTop: 16,
    backgroundColor: Colors.cardElevated,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  netPayLabel: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 1,
  },
  netPayAmount: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.accent,
    fontVariant: ['tabular-nums'] as const,
  },
  superRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  superLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  superValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  leaveBlock: {
    marginBottom: 10,
  },
  leaveType: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  leaveGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  leaveItem: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
  },
  leaveLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  leaveNum: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  ytdSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ytdGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  ytdItem: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  ytdLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  ytdValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    fontVariant: ['tabular-nums'] as const,
  },
  footer: {
    textAlign: 'center' as const,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
