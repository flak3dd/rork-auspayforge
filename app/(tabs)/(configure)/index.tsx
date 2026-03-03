import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import {
  Building2,
  User,
  DollarSign,
  Shield,
  Minus,
  Plus,
  CreditCard,
  Calendar,
  Trash2,
  ChevronDown,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import {
  Employer,
  Employee,
  PayConfig,
  SuperConfig,
  BankConfig,
  Deduction,
  Allowance,
  LeaveOverride,
  CLASSIFICATIONS,
  PayBasis,
  PayFrequency,
} from '@/types/payroll';
import { useRouter, Stack } from 'expo-router';
import SectionHeader from '@/components/SectionHeader';
import FormField from '@/components/FormField';
import { validateABN } from '@/utils/validation';

export default function ConfigureScreen() {
  const { config, updateConfig, validation } = usePayroll();
  const router = useRouter();

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    employer: false,
    employee: false,
    pay: false,
    super: false,
    deductions: true,
    allowances: true,
    bank: true,
    leave: true,
  });

  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showFreqPicker, setShowFreqPicker] = useState(false);

  const toggleSection = useCallback((key: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const updateEmployer = useCallback((field: keyof Employer, value: string) => {
    updateConfig('employer', { ...config.employer, [field]: value });
  }, [config.employer, updateConfig]);

  const updateEmployee = useCallback((field: keyof Employee, value: string) => {
    updateConfig('employee', { ...config.employee, [field]: value });
  }, [config.employee, updateConfig]);

  const updatePayConfig = useCallback((field: keyof PayConfig, value: string | number) => {
    updateConfig('payConfig', { ...config.payConfig, [field]: value });
  }, [config.payConfig, updateConfig]);

  const updateSuperConfig = useCallback((field: keyof SuperConfig, value: string) => {
    updateConfig('superConfig', { ...config.superConfig, [field]: value });
  }, [config.superConfig, updateConfig]);

  const updateBankConfig = useCallback((field: keyof BankConfig, value: string | number) => {
    updateConfig('bankConfig', { ...config.bankConfig, [field]: value });
  }, [config.bankConfig, updateConfig]);

  const addDeduction = useCallback(() => {
    const newDed: Deduction = {
      id: Date.now().toString(),
      description: '',
      amountPerPeriod: 0,
      type: 'other',
    };
    updateConfig('deductions', [...config.deductions, newDed]);
  }, [config.deductions, updateConfig]);

  const removeDeduction = useCallback((id: string) => {
    updateConfig('deductions', config.deductions.filter(d => d.id !== id));
  }, [config.deductions, updateConfig]);

  const updateDeduction = useCallback((id: string, field: keyof Deduction, value: string | number) => {
    updateConfig('deductions', config.deductions.map(d =>
      d.id === id ? { ...d, [field]: value } : d
    ));
  }, [config.deductions, updateConfig]);

  const addAllowance = useCallback(() => {
    const newAll: Allowance = {
      id: Date.now().toString(),
      description: '',
      hours: 0,
      multiplier: 1,
      fixedAmount: 0,
    };
    updateConfig('allowances', [...config.allowances, newAll]);
  }, [config.allowances, updateConfig]);

  const removeAllowance = useCallback((id: string) => {
    updateConfig('allowances', config.allowances.filter(a => a.id !== id));
  }, [config.allowances, updateConfig]);

  const updateAllowance = useCallback((id: string, field: keyof Allowance, value: string | number) => {
    updateConfig('allowances', config.allowances.map(a =>
      a.id === id ? { ...a, [field]: value } : a
    ));
  }, [config.allowances, updateConfig]);

  const updateLeaveOverride = useCallback((idx: number, field: keyof LeaveOverride, value: number) => {
    const updated = [...config.leaveOverrides];
    updated[idx] = { ...updated[idx], [field]: value };
    updateConfig('leaveOverrides', updated);
  }, [config.leaveOverrides, updateConfig]);

  const abnValid = validateABN(config.employer.abn);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              style={styles.templatesBtn}
              onPress={() => router.push('/(tabs)/(configure)/templates')}
              testID="templates-button"
            >
              <Sparkles size={16} color={Colors.accent} />
              <Text style={styles.templatesBtnText}>Templates</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <View style={styles.card}>
        <SectionHeader
          title="Employer"
          icon={<Building2 size={18} color={Colors.accent} />}
          collapsed={collapsedSections.employer}
          onToggle={() => toggleSection('employer')}
        />
        {!collapsedSections.employer && (
          <View>
            <FormField
              label="Company Name"
              value={config.employer.name}
              onChangeText={(v) => updateEmployer('name', v)}
              placeholder="XYZ Pty Ltd"
              testID="employer-name"
            />
            <FormField
              label="ABN"
              value={config.employer.abn}
              onChangeText={(v) => updateEmployer('abn', v)}
              placeholder="11 digit ABN"
              keyboardType="number-pad"
              maxLength={11}
              error={config.employer.abn.length > 0 && !abnValid ? 'Invalid ABN checksum' : undefined}
              testID="employer-abn"
            />
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>ADDRESS</Text>
              <TextInput
                style={styles.textArea}
                value={config.employer.address}
                onChangeText={(v) => updateEmployer('address', v)}
                placeholder="123 Collins Street\nMelbourne VIC 3000"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="employer-address"
              />
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Employee"
          icon={<User size={18} color={Colors.accent} />}
          collapsed={collapsedSections.employee}
          onToggle={() => toggleSection('employee')}
        />
        {!collapsedSections.employee && (
          <View>
            <FormField
              label="Full Name"
              value={config.employee.name}
              onChangeText={(v) => updateEmployee('name', v)}
              placeholder="Jane Smith"
              testID="employee-name"
            />
            <FormField
              label="Employee ID"
              value={config.employee.id}
              onChangeText={(v) => updateEmployee('id', v)}
              placeholder="EMP001"
              autoCapitalize="characters"
              testID="employee-id"
            />
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>ADDRESS</Text>
              <TextInput
                style={styles.textArea}
                value={config.employee.address}
                onChangeText={(v) => updateEmployee('address', v)}
                placeholder="45 George Street\nSydney NSW 2000"
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                testID="employee-address"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>CLASSIFICATION</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowClassPicker(!showClassPicker)}
                testID="classification-picker"
              >
                <Text style={styles.pickerText}>{config.employee.classification}</Text>
                <ChevronDown size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {showClassPicker && (
                <View style={styles.pickerDropdown}>
                  {CLASSIFICATIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.pickerOption,
                        config.employee.classification === c && styles.pickerOptionActive,
                      ]}
                      onPress={() => {
                        updateEmployee('classification', c);
                        setShowClassPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        config.employee.classification === c && styles.pickerOptionTextActive,
                      ]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormField
              label="Department"
              value={config.employee.department}
              onChangeText={(v) => updateEmployee('department', v)}
              placeholder="Engineering"
              testID="employee-department"
            />
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Pay Configuration"
          icon={<DollarSign size={18} color={Colors.accent} />}
          collapsed={collapsedSections.pay}
          onToggle={() => toggleSection('pay')}
        />
        {!collapsedSections.pay && (
          <View>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>PAY BASIS</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, config.payConfig.basis === 'salary' && styles.toggleBtnActive]}
                  onPress={() => updatePayConfig('basis', 'salary' as PayBasis)}
                >
                  <Text style={[styles.toggleText, config.payConfig.basis === 'salary' && styles.toggleTextActive]}>
                    Salaried
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, config.payConfig.basis === 'hourly' && styles.toggleBtnActive]}
                  onPress={() => updatePayConfig('basis', 'hourly' as PayBasis)}
                >
                  <Text style={[styles.toggleText, config.payConfig.basis === 'hourly' && styles.toggleTextActive]}>
                    Hourly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {config.payConfig.basis === 'salary' ? (
              <FormField
                label="Annual Salary"
                value={config.payConfig.annualSalary.toString()}
                onChangeText={(v) => updatePayConfig('annualSalary', parseFloat(v) || 0)}
                keyboardType="decimal-pad"
                suffix="AUD"
                testID="annual-salary"
              />
            ) : (
              <>
                <FormField
                  label="Hourly Rate"
                  value={config.payConfig.hourlyRate.toString()}
                  onChangeText={(v) => updatePayConfig('hourlyRate', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                  suffix="$/hr"
                  testID="hourly-rate"
                />
                <FormField
                  label="Weekly Hours"
                  value={config.payConfig.weeklyHours.toString()}
                  onChangeText={(v) => updatePayConfig('weeklyHours', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                  testID="weekly-hours"
                />
              </>
            )}

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>FREQUENCY</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowFreqPicker(!showFreqPicker)}
              >
                <Text style={styles.pickerText}>
                  {config.payConfig.frequency.charAt(0).toUpperCase() + config.payConfig.frequency.slice(1)}
                </Text>
                <ChevronDown size={16} color={Colors.textMuted} />
              </TouchableOpacity>
              {showFreqPicker && (
                <View style={styles.pickerDropdown}>
                  {(['weekly', 'fortnightly', 'monthly'] as PayFrequency[]).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.pickerOption, config.payConfig.frequency === f && styles.pickerOptionActive]}
                      onPress={() => {
                        updatePayConfig('frequency', f);
                        setShowFreqPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        config.payConfig.frequency === f && styles.pickerOptionTextActive,
                      ]}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <FormField
              label="Start Date (YYYY-MM-DD)"
              value={config.payConfig.startDate}
              onChangeText={(v) => updatePayConfig('startDate', v)}
              placeholder="2025-07-01"
              testID="start-date"
            />

            <View style={styles.infoBox}>
              <Calendar size={14} color={Colors.accent} />
              <Text style={styles.infoText}>Fixed: 4 consecutive pay periods will be generated</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Superannuation"
          icon={<Shield size={18} color={Colors.accent} />}
          collapsed={collapsedSections.super}
          onToggle={() => toggleSection('super')}
        />
        {!collapsedSections.super && (
          <View>
            <FormField
              label="Fund Name"
              value={config.superConfig.fundName}
              onChangeText={(v) => updateSuperConfig('fundName', v)}
              placeholder="AustralianSuper"
              testID="super-fund"
            />
            <FormField
              label="Member ID"
              value={config.superConfig.memberID}
              onChangeText={(v) => updateSuperConfig('memberID', v)}
              placeholder="1234567890"
              keyboardType="number-pad"
              testID="super-member-id"
            />
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>SG Rate: 12% of OTE (2025-26)</Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title={`Deductions (${config.deductions.length})`}
          icon={<Minus size={18} color={Colors.accent} />}
          collapsed={collapsedSections.deductions}
          onToggle={() => toggleSection('deductions')}
        />
        {!collapsedSections.deductions && (
          <View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>PAYG is computed automatically. Add other deductions below.</Text>
            </View>
            {config.deductions.map((ded) => (
              <View key={ded.id} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <TouchableOpacity
                    style={[
                      styles.smallToggle,
                      ded.type === 'tax' ? styles.smallToggleActive : null,
                    ]}
                    onPress={() => updateDeduction(ded.id, 'type', ded.type === 'tax' ? 'other' : 'tax')}
                  >
                    <Text style={styles.smallToggleText}>{ded.type}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeDeduction(ded.id)}>
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <FormField
                  label="Description"
                  value={ded.description}
                  onChangeText={(v) => updateDeduction(ded.id, 'description', v)}
                  placeholder="Union fees, salary sacrifice..."
                />
                <FormField
                  label="Amount per Period"
                  value={ded.amountPerPeriod > 0 ? ded.amountPerPeriod.toString() : ''}
                  onChangeText={(v) => updateDeduction(ded.id, 'amountPerPeriod', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                  suffix="$"
                />
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addDeduction}>
              <Plus size={16} color={Colors.accent} />
              <Text style={styles.addButtonText}>Add Deduction</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title={`Allowances / OT (${config.allowances.length})`}
          icon={<Plus size={18} color={Colors.accent} />}
          collapsed={collapsedSections.allowances}
          onToggle={() => toggleSection('allowances')}
        />
        {!collapsedSections.allowances && (
          <View>
            {config.allowances.map((al) => (
              <View key={al.id} style={styles.listItem}>
                <View style={styles.listItemHeader}>
                  <View style={styles.multiplierRow}>
                    {[1, 1.5, 2].map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.multBtn, al.multiplier === m && styles.multBtnActive]}
                        onPress={() => updateAllowance(al.id, 'multiplier', m)}
                      >
                        <Text style={[styles.multBtnText, al.multiplier === m && styles.multBtnTextActive]}>
                          {m}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity onPress={() => removeAllowance(al.id)}>
                    <Trash2 size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <FormField
                  label="Description"
                  value={al.description}
                  onChangeText={(v) => updateAllowance(al.id, 'description', v)}
                  placeholder="Overtime, travel allowance..."
                />
                <View style={styles.rowFields}>
                  <View style={styles.halfField}>
                    <FormField
                      label="Hours"
                      value={al.hours > 0 ? al.hours.toString() : ''}
                      onChangeText={(v) => updateAllowance(al.id, 'hours', parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <FormField
                      label="Fixed Amount"
                      value={al.fixedAmount > 0 ? al.fixedAmount.toString() : ''}
                      onChangeText={(v) => updateAllowance(al.id, 'fixedAmount', parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                      suffix="$"
                    />
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addButton} onPress={addAllowance}>
              <Plus size={16} color={Colors.accent} />
              <Text style={styles.addButtonText}>Add Allowance / Overtime</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Bank Details"
          icon={<CreditCard size={18} color={Colors.accent} />}
          collapsed={collapsedSections.bank}
          onToggle={() => toggleSection('bank')}
        />
        {!collapsedSections.bank && (
          <View>
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <FormField
                  label="BSB"
                  value={config.bankConfig.bsb}
                  onChangeText={(v) => updateBankConfig('bsb', v)}
                  placeholder="062000"
                  keyboardType="number-pad"
                  maxLength={6}
                  testID="bank-bsb"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Account Number"
                  value={config.bankConfig.accountNumber}
                  onChangeText={(v) => updateBankConfig('accountNumber', v)}
                  placeholder="12345678"
                  keyboardType="number-pad"
                  testID="bank-account"
                />
              </View>
            </View>
            <FormField
              label="Account Holder"
              value={config.bankConfig.holderName}
              onChangeText={(v) => updateBankConfig('holderName', v)}
              placeholder="Jane Smith"
            />
            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <FormField
                  label="Opening Balance"
                  value={config.bankConfig.openingBalance.toString()}
                  onChangeText={(v) => updateBankConfig('openingBalance', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                  suffix="$"
                />
              </View>
              <View style={styles.halfField}>
                <FormField
                  label="Closing Balance"
                  value={config.bankConfig.closingBalance.toString()}
                  onChangeText={(v) => updateBankConfig('closingBalance', parseFloat(v) || 0)}
                  keyboardType="decimal-pad"
                  suffix="$"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <SectionHeader
          title="Leave Overrides"
          icon={<Calendar size={18} color={Colors.accent} />}
          collapsed={collapsedSections.leave}
          onToggle={() => toggleSection('leave')}
        />
        {!collapsedSections.leave && (
          <View>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>Set hours of leave taken per period. Annual: 152h/yr, Personal: 76h/yr baseline.</Text>
            </View>
            {config.leaveOverrides.map((lo, idx) => (
              <View key={idx} style={styles.leaveRow}>
                <Text style={styles.leaveRowLabel}>Period {idx + 1}</Text>
                <View style={styles.rowFields}>
                  <View style={styles.halfField}>
                    <FormField
                      label="Annual (hrs)"
                      value={lo.takenHoursAnnual > 0 ? lo.takenHoursAnnual.toString() : ''}
                      onChangeText={(v) => updateLeaveOverride(idx, 'takenHoursAnnual', parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.halfField}>
                    <FormField
                      label="Personal (hrs)"
                      value={lo.takenHoursPersonal > 0 ? lo.takenHoursPersonal.toString() : ''}
                      onChangeText={(v) => updateLeaveOverride(idx, 'takenHoursPersonal', parseFloat(v) || 0)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {!validation.valid && (
        <View style={styles.errorsBox}>
          {validation.errors.map((err, i) => (
            <Text key={i} style={styles.errorItem}>• {err}</Text>
          ))}
        </View>
      )}

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
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.text,
    minHeight: 72,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.background,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerText: {
    fontSize: 16,
    color: Colors.text,
  },
  pickerDropdown: {
    marginTop: 4,
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionActive: {
    backgroundColor: Colors.accent + '22',
  },
  pickerOptionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  pickerOptionTextActive: {
    color: Colors.accent,
    fontWeight: '600' as const,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cardElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textMuted,
    flex: 1,
  },
  listItem: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  listItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  smallToggle: {
    backgroundColor: Colors.inputBg,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  smallToggleActive: {
    backgroundColor: Colors.accent + '33',
    borderColor: Colors.accent,
  },
  smallToggleText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  multiplierRow: {
    flexDirection: 'row',
    gap: 6,
  },
  multBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: Colors.inputBg,
    borderWidth: 1,
    borderColor: Colors.inputBorder,
  },
  multBtnActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  multBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  multBtnTextActive: {
    color: Colors.background,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '44',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  leaveRow: {
    marginBottom: 8,
  },
  leaveRowLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  errorsBox: {
    backgroundColor: Colors.error + '18',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.error + '44',
    marginBottom: 12,
  },
  errorItem: {
    fontSize: 13,
    color: Colors.error,
    marginBottom: 2,
  },
  bottomSpacer: {
    height: 20,
  },
  templatesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '1A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  templatesBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
});
