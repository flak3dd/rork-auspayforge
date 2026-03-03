import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import {
  AppConfig,
  DEFAULT_CONFIG,
  GeneratedOutput,
  Payslip,
  BankStatement,
  BankConfig,
} from '@/types/payroll';
import { generatePayslips } from '@/utils/payslip';
import { generateBankStatement } from '@/utils/bankStatement';
import { isConfigValid } from '@/utils/validation';
import { generateGeneralPayslipHTML } from '@/lib/templates/generalPayslipTemplate';
import { generateConstructionPayslipHTML } from '@/lib/templates/constructionPayslipTemplate';
import { generateStatementHTML } from '@/utils/statementHTML';

export type PayslipTemplateType = 'general' | 'construction';

function generatePayslipHTML(payslip: Payslip, index: number, templateType: PayslipTemplateType): string {
  console.log('[PayrollProvider] Generating HTML with template:', templateType, 'for period', index + 1);
  if (templateType === 'construction') {
    return generateConstructionPayslipHTML(payslip, index);
  }
  return generateGeneralPayslipHTML(payslip, index);
}

export const [PayrollProvider, usePayroll] = createContextHook(() => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState<boolean>(false);
  const [payslipTemplate, setPayslipTemplate] = useState<PayslipTemplateType>('general');
  const [payslipHTMLs, setPayslipHTMLs] = useState<string[]>([]);
  const [statementHTML, setStatementHTML] = useState<string>('');

  const validation = useMemo(() => isConfigValid(config), [config]);

  const updateConfig = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateBankConfig = useCallback(<K extends keyof BankConfig>(key: K, value: BankConfig[K]) => {
    setConfig(prev => ({
      ...prev,
      bankConfig: { ...prev.bankConfig, [key]: value },
    }));
  }, []);

  const detectTemplate = useCallback((cfg: AppConfig): PayslipTemplateType => {
    const dept = cfg.employee.department.toLowerCase();
    const cls = cfg.employee.classification.toLowerCase();
    const employer = cfg.employer.name.toLowerCase();
    if (
      dept.includes('construction') ||
      dept.includes('site') ||
      dept.includes('trade') ||
      cls.includes('trade') ||
      cls.includes('construction') ||
      employer.includes('construct') ||
      employer.includes('build')
    ) {
      return 'construction';
    }
    return 'general';
  }, []);

  const generatePayslipsOnly = useCallback(() => {
    console.log('[PayrollProvider] Generating payslips only...');
    setIsGenerating(true);
    try {
      const payslips: Payslip[] = generatePayslips(config);
      console.log('[PayrollProvider] Generated', payslips.length, 'payslips');

      const detected = detectTemplate(config);
      setPayslipTemplate(detected);
      console.log('[PayrollProvider] Auto-detected payslip template:', detected);

      const htmls = payslips.map((ps, i) => generatePayslipHTML(ps, i, detected));
      setPayslipHTMLs(htmls);
      console.log('[PayrollProvider] Generated', htmls.length, 'payslip HTML documents');

      setOutput(prev => {
        const bankStatement = prev?.bankStatement ?? {
          bankName: 'Commonwealth Bank of Australia',
          accountHolder: config.bankConfig.holderName,
          bsb: config.bankConfig.bsb,
          accountNumber: config.bankConfig.accountNumber,
          statementPeriod: '',
          openingBalance: config.bankConfig.openingBalance,
          closingBalance: config.bankConfig.closingBalance,
          transactions: [],
          pages: [],
        };
        return {
          payslips,
          bankStatement,
          generatedAt: new Date(),
        };
      });

      return payslips;
    } catch (error) {
      console.error('[PayrollProvider] Payslip generation error:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  }, [config, detectTemplate]);

  const generateStatementOnly = useCallback(() => {
    console.log('[PayrollProvider] Generating statement only...');
    setIsGeneratingStatement(true);
    try {
      const payslips = output?.payslips ?? [];
      const bankStatement: BankStatement = generateBankStatement(config, payslips);
      console.log('[PayrollProvider] Generated bank statement with', bankStatement.transactions.length, 'transactions');

      const stmtHTML = generateStatementHTML(bankStatement, config);
      setStatementHTML(stmtHTML);
      console.log('[PayrollProvider] Generated statement HTML');

      setOutput(prev => ({
        payslips: prev?.payslips ?? [],
        bankStatement,
        generatedAt: new Date(),
      }));

      return bankStatement;
    } catch (error) {
      console.error('[PayrollProvider] Statement generation error:', error);
      throw error;
    } finally {
      setIsGeneratingStatement(false);
    }
  }, [config, output]);

  const generate = useCallback(() => {
    console.log('[PayrollProvider] Starting full generation...');
    setIsGenerating(true);
    try {
      const payslips: Payslip[] = generatePayslips(config);
      console.log('[PayrollProvider] Generated', payslips.length, 'payslips');

      const bankStatement: BankStatement = generateBankStatement(config, payslips);
      console.log('[PayrollProvider] Generated bank statement with', bankStatement.transactions.length, 'transactions');

      const detected = detectTemplate(config);
      setPayslipTemplate(detected);
      console.log('[PayrollProvider] Auto-detected payslip template:', detected);

      const htmls = payslips.map((ps, i) => generatePayslipHTML(ps, i, detected));
      setPayslipHTMLs(htmls);
      console.log('[PayrollProvider] Generated', htmls.length, 'payslip HTML documents');

      const stmtHTML = generateStatementHTML(bankStatement, config);
      setStatementHTML(stmtHTML);
      console.log('[PayrollProvider] Generated statement HTML');

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
  }, [config, detectTemplate]);

  const regenerateHTMLs = useCallback((template: PayslipTemplateType) => {
    if (!output) return;
    console.log('[PayrollProvider] Regenerating HTMLs with template:', template);
    setPayslipTemplate(template);
    const htmls = output.payslips.map((ps, i) => generatePayslipHTML(ps, i, template));
    setPayslipHTMLs(htmls);
  }, [output]);

  const regenerateStatement = useCallback((startDate: string, length: 30 | 60 | 90, bankOverrides?: Partial<BankConfig>) => {
    if (!output) return;
    console.log('[PayrollProvider] Regenerating statement with startDate:', startDate, 'length:', length, 'overrides:', bankOverrides);
    const updatedConfig: AppConfig = {
      ...config,
      bankConfig: {
        ...config.bankConfig,
        ...bankOverrides,
        statementStartDate: startDate,
        statementLength: length,
      },
    };
    setConfig(updatedConfig);
    const bankStatement: BankStatement = generateBankStatement(updatedConfig, output.payslips);
    const stmtHTML = generateStatementHTML(bankStatement, updatedConfig);
    setStatementHTML(stmtHTML);
    setOutput(prev => prev ? { ...prev, bankStatement } : null);
    console.log('[PayrollProvider] Statement regenerated with', bankStatement.transactions.length, 'transactions');
  }, [output, config]);

  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setOutput(null);
    setPayslipHTMLs([]);
    setStatementHTML('');
  }, []);

  return {
    config,
    setConfig,
    updateConfig,
    updateBankConfig,
    output,
    isGenerating,
    isGeneratingStatement,
    validation,
    generate,
    generatePayslipsOnly,
    generateStatementOnly,
    resetConfig,
    payslipTemplate,
    setPayslipTemplate: regenerateHTMLs,
    payslipHTMLs,
    statementHTML,
    regenerateStatement,
  };
});
