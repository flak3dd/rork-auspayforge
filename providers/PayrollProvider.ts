import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import {
  AppConfig,
  DEFAULT_CONFIG,
  GeneratedOutput,
  Payslip,
  BankStatement,
} from '@/types/payroll';
import { generatePayslips } from '@/utils/payslip';
import { generateBankStatement } from '@/utils/bankStatement';
import { isConfigValid } from '@/utils/validation';

export const [PayrollProvider, usePayroll] = createContextHook(() => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const validation = useMemo(() => isConfigValid(config), [config]);

  const updateConfig = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const generate = useCallback(() => {
    console.log('[PayrollProvider] Starting generation...');
    setIsGenerating(true);
    try {
      const payslips: Payslip[] = generatePayslips(config);
      console.log('[PayrollProvider] Generated', payslips.length, 'payslips');

      const bankStatement: BankStatement = generateBankStatement(config, payslips);
      console.log('[PayrollProvider] Generated bank statement with', bankStatement.transactions.length, 'transactions');

      const result: GeneratedOutput = {
        payslips,
        bankStatement,
        generatedAt: new Date(),
      };
      setOutput(result);
      return result;
    } catch (error) {
      console.error('[PayrollProvider] Generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [config]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setOutput(null);
  }, []);

  return {
    config,
    setConfig,
    updateConfig,
    output,
    isGenerating,
    validation,
    generate,
    resetConfig,
  };
});
