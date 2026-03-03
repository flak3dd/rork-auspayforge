import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Building2,
  User,
  Wallet,
  Landmark,
  PlusCircle,
  MinusCircle,
  Zap,
  CalendarDays,
  Banknote,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import FormField from '@/components/FormField';
import SectionHeader from '@/components/SectionHeader';
import { CLASSIFICATIONS } from '@/types/payroll';
import type { PayBasis, PayFrequency, Deduction, Allowance } from '@/types/payroll';

export default function ConfigureScreen() {
  const router = useRouter();
  const { config, updateConfig, validation, generate } = usePayroll();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    employer: false,
    employee: false,
    pay: false,
    super: false,
    deductions: true,
    allowances: true,
    bank: true,
    leave: true,
  });

  const toggle = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
    Haptics.selectionAsync();
  }, []);

  const handleForge = useCallback(() => {
    if (!validation.valid) {
      Alert.alert('Validation Errors', validation.errors.join('\n'));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      generate();
      router.dismiss();
      setTimeout(() => {
        router.push('/payslips' as never);
      }, 300);
    } catch (e) {
      console.error('[Configure] Generation error:', e);
      Alert.alert('Error', 'Generation failed. Check your inputs.');
    }
  }, [validation, generate, router]);

  const addDeduction = useCallback(() => {
    const newDed: Deduction = {
      id: 'ded_' + Date.now().toString(36),
      description: '',
      amountPerPeriod: 0,
      type: 'other',
    };
    updateConfig('deductions', [...config.deductions, newDed]);
  }, [config.deductions, updateConfig]);

  const removeDeduction = useCallback((id: string) => {
    updateConfig('deductions', config.deductions.filter((d) => d.id !== id));
  }, [config.deductions, updateConfig]);

  const updateDeduction = useCallback((id: string, field: keyof Deduction, value: string | number) => {
    updateConfig('deductions', config.deductions.map((d) =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  }, [config.deductions, updateConfig]);

  const addAllowance = useCallback(() => {
    const newAll: Allowance = {
      id: 'all_' + Date.now().toString(36),
      description: '',
      hours: 0,
      multiplier: 1,
      fixedAmount: 0,
    };
    updateConfig('allowances', [...config.allowances, newAll]);
  }, [config.allowances, updateConfig]);

  const removeAllowance = useCallback((id: string) => {
    updateConfig('allowances', config.allowances.filter((a) => a.id !== id));
  }, [config.allowances, updateConfig]);

  const updateAllowance = useCallback((id: string, field: keyof Allowance, value: string | number) => {
    updateConfig('allowances', config.allowances.map((a) =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  }, [config.allowances, updateConfig]);

  const freqOptions: PayFrequency[] = ['weekly', 'fortnightly', 'monthly'];

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <SectionHeader
          title="Employer"
          icon={<Building2 size={18} color={Colors.accent} />}
          collapsed={collapsed.employer}
          onToggle={() => toggle('employer')}
        />
        {!collapsed.employer && (
          <View style={styles.sectionBody}>
            <FormField
              label="Company Name"
              value={config.employer.name}
              onChangeText={(t) => updateConfig('employer', { ...config.employer, name: t })}
              placeholder="XYZ Pty Ltd"
            />
            <FormField
              label="ABN (11 digits)"
              value={config.employer.abn}
              onChangeText={(t) => updateConfig('employer', { ...config.employer, abn: t.replace(/\D/g, '').slice(0, 11) })}
              placeholder="51824753556"
              keyboardType="number-pad"
              maxLength={11}
            />
            <FormField
              label="Address"
              value={config.employer.address}
              onChangeText={(t) => updateConfig('employer', { ...config.employer, address: t })}
              placeholder="123 Collins St, Melbourne VIC 3000"
              multiline
            />
          </View>
        )}

        <SectionHeader
          title="Employee"
          icon={<User size={18} color={Colors.accent} />}
          collapsed={collapsed.employee}
          onToggle={() => toggle('employee')}
        />
        {!collapsed.employee && (
          <View style={styles.sectionBody}>
            <FormField
              label="Full Name"
              value={config.employee.name}
              onChangeText={(t) => updateConfig('employee', { ...config.employee, name: t })}
              placeholder="Jane Smith"
            />
            <FormField
              label="Employee ID"
              value={config.employee.id}
              onChangeText={(t) => updateConfig('employee', { ...config.employee, id: t })}
              placeholder="EMP001"
              autoCapitalize="characters"
            />
            <FormField
              label="Address"
              value={config.employee.address}
              onChangeText={(t) => updateConfig('employee', { ...config.employee, address: t })}
              placeholder="45 George St, Sydney NSW 2000"
              multiline
            />
            <Text style={styles.fieldLabel}>CLASSIFICATION</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {CLASSIFICATIONS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.chip, config.employee.classification === c && styles.chipActive]}
                    onPress={() => {
                      updateConfig('employee', { ...config.employee, classification: c });
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.chipText, config.employee.classification === c && styles.chipTextActive]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <FormField
              label="Department"
              value={config.employee.department}
              onChangeText={(t) => updateConfig('employee', { ...config.employee, department: t })}
              placeholder="Engineering"
            />
          </View>
        )}

        <SectionHeader
          title="Pay Configuration"
          icon={<Wallet size={18} color={Colors.accent} />}
          collapsed={collapsed.pay}
          onToggle={() => toggle('pay')}
        />
        {!collapsed.pay && (
          <View style={styles.sectionBody}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Pay Basis</Text>
              <View style={styles.toggleOptions}>
                {(['salary', 'hourly'] as PayBasis[]).map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.toggleBtn, config.payConfig.basis === b && styles.toggleBtnActive]}
                    onPress={() => {
                      updateConfig('payConfig', { ...config.payConfig, basis: b });
                      Haptics.selectionAsync();
                    }}
                  >
                    <Text style={[styles.toggleBtnText, config.payConfig.basis === b && styles.toggleBtnTextActive]}>
                      {b.charAt(0).toUpperCase() + b.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {config.payConfig.basis === 'salary' ? (
              <FormField
                label="Annual Salary"
                value={config.payConfig.annualSalary > 0 ? String(config.payConfig.annualSalary) : ''}
                onChangeText={(t) => updateConfig('payConfig', { ...config.payConfig, annualSalary: parseFloat(t) || 0 })}
                placeholder="95000"
                keyboardType="decimal-pad"
                suffix="$/yr"
              />
            ) : (
              <>
                <FormField
                  label="Hourly Rate"
                  value={config.payConfig.hourlyRate > 0 ? String(config.payConfig.hourlyRate) : ''}
                  onChangeText={(t) => updateConfig('payConfig', { ...config.payConfig, hourlyRate: parseFloat(t) || 0 })}
                  placeholder="51.78"
                  keyboardType="decimal-pad"
                  suffix="$/hr"
                />
                <FormField
                  label="Weekly Hours"
                  value={config.payConfig.weeklyHours > 0 ? String(config.payConfig.weeklyHours) : ''}
                  onChangeText={(t) => updateConfig('payConfig', { ...config.payConfig, weeklyHours: parseFloat(t) || 0 })}
                  placeholder="38"
                  keyboardType="decimal-pad"
                  suffix="hrs"
                />
              </>
            )}

            <Text style={styles.fieldLabel}>FREQUENCY</Text>
            <View style={styles.freqRow}>
              {freqOptions.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqBtn, config.payConfig.frequency === f && styles.freqBtnActive]}
                  onPress={() => {
                    updateConfig('payConfig', { ...config.payConfig, frequency: f });
                    Haptics.selectionAsync();
                  }}
                >
                  <Text style={[styles.freqText, config.payConfig.frequency === f && styles.freqTextActive]}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FormField
              label="Start Date"
              value={config.payConfig.startDate}
              onChangeText={(t) => updateConfig('payConfig', { ...config.payConfig, startDate: t })}
              placeholder="2025-07-01"
            />

            <View style={styles.infoBox}>
              <CalendarDays size={14} color={Colors.accent} />
              <Text style={styles.infoText}>Fixed: 4 consecutive pay periods will be generated</Text>
            </View>
          </View>
        )}

        <SectionHeader
          title="Superannuation"
          icon={<Landmark size={18} color={Colors.accent} />}
          collapsed={collapsed.super}
          onToggle={() => toggle('super')}
        />
        {!collapsed.super && (
          <View style={styles.sectionBody}>
            <FormField
              label="Fund Name"
              value={config.superConfig.fundName}
              onChangeText={(t) => updateConfig('superConfig', { ...config.superConfig, fundName: t })}
              placeholder="AustralianSuper"
            />
            <FormField
              label="Member ID"
              value={config.superConfig.memberID}
              onChangeText={(t) => updateConfig('superConfig', { ...config.superConfig, memberID: t.replace(/\D/g, '').slice(0, 12) })}
              placeholder="1234567890"
              keyboardType="number-pad"
            />
          </View>
        )}

        <SectionHeader
          title="Deductions"
          icon={<MinusCircle size={18} color={Colors.accent} />}
          collapsed={collapsed.deductions}
          onToggle={() => toggle('deductions')}
        />
        {!collapsed.deductions && (
          <View style={styles.sectionBody}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>PAYG Withholding is auto-calculated. Add extra deductions below.</Text>
            </View>
            {config.deductions.map((d) => (
              <View key={d.id} style={styles.dynamicItem}>
                <FormField
                  label="Description"
                  value={d.description}
                  onChangeText={(t) => updateDeduction(d.id, 'description', t)}
                  placeholder="Union Fees"
                />
                <FormField
                  label="Amount Per Period"
                  value={d.amountPerPeriod > 0 ? String(d.amountPerPeriod) : ''}
                  onChangeText={(t) => updateDeduction(d.id, 'amountPerPeriod', parseFloat(t) || 0)}
                  placeholder="22.50"
                  keyboardType="decimal-pad"
                  suffix="$"
                />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeDeduction(d.id)}
                >
                  <MinusCircle size={16} color={Colors.error} />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addDeduction}>
              <PlusCircle size={16} color={Colors.accent} />
              <Text style={styles.addBtnText}>Add Deduction</Text>
            </TouchableOpacity>
          </View>
        )}

        <SectionHeader
          title="Allowances & Overtime"
          icon={<PlusCircle size={18} color={Colors.accent} />}
          collapsed={collapsed.allowances}
          onToggle={() => toggle('allowances')}
        />
        {!collapsed.allowances && (
          <View style={styles.sectionBody}>
            {config.allowances.map((a) => (
              <View key={a.id} style={styles.dynamicItem}>
                <FormField
                  label="Description"
                  value={a.description}
                  onChangeText={(t) => updateAllowance(a.id, 'description', t)}
                  placeholder="Saturday Penalty"
                />
                <View style={styles.row2}>
                  <View style={styles.halfField}>
                    <FormField
                      label="Hours"
                      value={a.hours > 0 ? String(a.hours) : ''}
                      onChangeText={(t) => updateAllowance(a.id, 'hours', parseFloat(t) || 0)}
                      placeholder="0"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <FormField
                      label="Fixed Amount"
                      value={a.fixedAmount > 0 ? String(a.fixedAmount) : ''}
                      onChangeText={(t) => updateAllowance(a.id, 'fixedAmount', parseFloat(t) || 0)}
                      placeholder="0"
                      keyboardType="decimal-pad"
                      suffix="$"
                    />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>MULTIPLIER</Text>
                <View style={styles.multiplierRow}>
                  {[1, 1.5, 2].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.multBtn, a.multiplier === m && styles.multBtnActive]}
                      onPress={() => {
                        updateAllowance(a.id, 'multiplier', m);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.multText, a.multiplier === m && styles.multTextActive]}>
                        {m}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeAllowance(a.id)}
                >
                  <MinusCircle size={16} color={Colors.error} />
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={addAllowance}>
              <PlusCircle size={16} color={Colors.accent} />
              <Text style={styles.addBtnText}>Add Allowance</Text>
            </TouchableOpacity>
          </View>
        )}

        <SectionHeader
          title="Bank Details"
          icon={<Banknote size={18} color={Colors.accent} />}
          collapsed={collapsed.bank}
          onToggle={() => toggle('bank')}
        />
        {!collapsed.bank && (
          <View style={styles.sectionBody}>
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <FormField
                  label="BSB"
                  value={config.bankConfig.bsb}
                  onChangeText={(t) => updateConfig('bankConfig', { ...config.bankConfig, bsb: t.replace(/\D/g, '').slice(0, 6) })}
                  placeholder="062000"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Account Number"
                  value={config.bankConfig.accountNumber}
                  onChangeText={(t) => updateConfig('bankConfig', { ...config.bankConfig, accountNumber: t.replace(/\D/g, '').slice(0, 10) })}
                  placeholder="12345678"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>
            <FormField
              label="Account Holder"
              value={config.bankConfig.holderName}
              onChangeText={(t) => updateConfig('bankConfig', { ...config.bankConfig, holderName: t })}
              placeholder="Jane Smith"
            />
            <View style={styles.row2}>
              <View style={styles.halfField}>
                <FormField
                  label="Opening Balance"
                  value={config.bankConfig.openingBalance > 0 ? String(config.bankConfig.openingBalance) : ''}
                  onChangeText={(t) => updateConfig('bankConfig', { ...config.bankConfig, openingBalance: parseFloat(t) || 0 })}
                  placeholder="200"
                  keyboardType="decimal-pad"
                  suffix="$"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Closing Balance"
                  value={config.bankConfig.closingBalance > 0 ? String(config.bankConfig.closingBalance) : ''}
                  onChangeText={(t) => updateConfig('bankConfig', { ...config.bankConfig, closingBalance: parseFloat(t) || 0 })}
                  placeholder="1000"
                  keyboardType="decimal-pad"
                  suffix="$"
                />
              </View>
            </View>
          </View>
        )}

        {!validation.valid && (
          <View style={styles.errorBox}>
            {validation.errors.map((e, i) => (
              <Text key={i} style={styles.errorText}>• {e}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.forgeButton, !validation.valid && styles.forgeButtonDisabled]}
          onPress={handleForge}
          activeOpacity={0.8}
          disabled={!validation.valid}
          testID="configure-forge-button"
        >
          <Zap size={20} color={validation.valid ? Colors.background : Colors.textMuted} />
          <Text style={[styles.forgeButtonText, !validation.valid && styles.forgeButtonTextDisabled]}>
            Forge Payslips
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomPad} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sectionBody: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipScroll: {
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent + '1A',
    borderColor: Colors.accent,
  },
  chipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  chipTextActive: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  toggleRow: {
    marginBottom: 14,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent + '1A',
    borderColor: Colors.accent,
  },
  toggleBtnText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  toggleBtnTextActive: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  freqBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freqBtnActive: {
    backgroundColor: Colors.accent + '1A',
    borderColor: Colors.accent,
  },
  freqText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  freqTextActive: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  dynamicItem: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row2: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  multiplierRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  multBtn: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multBtnActive: {
    backgroundColor: Colors.accent + '1A',
    borderColor: Colors.accent,
  },
  multText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  multTextActive: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  addBtnText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  removeBtnText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    lineHeight: 20,
  },
  forgeButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  forgeButtonDisabled: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  forgeButtonText: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: Colors.background,
    letterSpacing: 0.3,
  },
  forgeButtonTextDisabled: {
    color: Colors.textMuted,
  },
  bottomPad: {
    height: 40,
  },
});
