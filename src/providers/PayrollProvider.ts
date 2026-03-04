import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppConfig,
  DEFAULT_CONFIG,
  GeneratedOutput,
  Payslip,
  BankStatement,
  BankConfig,
  SavedProfile,
} from '@/types/payroll';
import { generatePayslips } from '@/utils/payslip';
import { generateBankStatement } from '@/utils/bankStatement';
import { generateSuncorpBankStatement } from '@/utils/suncorpBankStatement';
import { generateGenericBankStatement, getProfileByKey } from '@/utils/genericBankStatement';
import { isConfigValid } from '@/utils/validation';
import { generateGeneralPayslipHTML } from '@/lib/templates/generalPayslipTemplate';
import { generateConstructionPayslipHTML } from '@/lib/templates/constructionPayslipTemplate';
import { generateAdminFortnightlyPayslipHTML } from '@/lib/templates/adminFortnightlyPayslipTemplate';
import { generateExecutiveMonthlyPayslipHTML } from '@/lib/templates/executiveMonthlyPayslipTemplate';
import { generateStatementHTML, StatementAssets } from '@/utils/statementHTML';
import { generateSuncorpStatementHTML } from '@/utils/suncorpStatementHTML';
import { generateGenericStatementHTML } from '@/utils/genericBankHTML';
import { loadStatementAssets } from '@/utils/assetLoader';

export type PayslipTemplateType = 'general' | 'construction' | 'admin' | 'executive';

const PROFILES_KEY = 'auspayforge-profiles';

function pickStatementGenerator(template: string) {
  if (template === 'suncorp') return generateSuncorpStatementHTML;
  if (template === 'nab' || template === 'anz' || template === 'westpac') {
    return (statement: BankStatement, config: AppConfig, assets?: StatementAssets) =>
      generateGenericStatementHTML(statement, config, template, assets);
  }
  return generateStatementHTML;
}

function pickTransactionGenerator(template: string) {
  if (template === 'suncorp') return generateSuncorpBankStatement;
  if (template === 'nab' || template === 'anz' || template === 'westpac') {
    const profile = getProfileByKey(template);
    return (config: AppConfig, payslips: Payslip[]) =>
      generateGenericBankStatement(config, payslips, profile);
  }
  return generateBankStatement;
}

function generatePayslipHTML(payslip: Payslip, index: number, templateType: PayslipTemplateType): string {
  console.log('[PayrollProvider] Generating HTML with template:', templateType, 'for period', index + 1);
  switch (templateType) {
    case 'construction':
      return generateConstructionPayslipHTML(payslip, index);
    case 'admin':
      return generateAdminFortnightlyPayslipHTML(payslip, index);
    case 'executive':
      return generateExecutiveMonthlyPayslipHTML(payslip, index);
    default:
      return generateGeneralPayslipHTML(payslip, index);
  }
}

export const [PayrollProvider, usePayroll] = createContextHook(() => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [output, setOutput] = useState<GeneratedOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState<boolean>(false);
  const [payslipTemplate, setPayslipTemplate] = useState<PayslipTemplateType>('general');
  const [payslipHTMLs, setPayslipHTMLs] = useState<string[]>([]);
  const [statementHTML, setStatementHTML] = useState<string>('');
  const [statementAssets, setStatementAssets] = useState<StatementAssets | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState<boolean>(false);
  const [metadataCleanEnabled, setMetadataCleanEnabled] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(PROFILES_KEY).then(data => {
      if (data) {
        try {
          setSavedProfiles(JSON.parse(data));
        } catch (e) {
          console.error('[PayrollProvider] Failed to parse profiles:', e);
        }
      }
      setProfilesLoaded(true);
      console.log('[PayrollProvider] Profiles loaded');
    });
  }, []);

  const persistProfiles = useCallback((profiles: SavedProfile[]) => {
    setSavedProfiles(profiles);
    AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles)).catch(e => {
      console.error('[PayrollProvider] Failed to persist profiles:', e);
    });
  }, []);

  const saveProfile = useCallback((name: string) => {
    const profile: SavedProfile = {
      id: 'prof_' + Date.now().toString(36),
      name,
      config: { ...config },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [profile, ...savedProfiles].slice(0, 20);
    persistProfiles(updated);
    console.log('[PayrollProvider] Saved profile:', name);
    return profile.id;
  }, [config, savedProfiles, persistProfiles]);

  const loadProfile = useCallback((id: string) => {
    const profile = savedProfiles.find(p => p.id === id);
    if (profile) {
      setConfig(profile.config);
      setOutput(null);
      setPayslipHTMLs([]);
      setStatementHTML('');
      console.log('[PayrollProvider] Loaded profile:', profile.name);
    }
  }, [savedProfiles]);

  const deleteProfile = useCallback((id: string) => {
    const updated = savedProfiles.filter(p => p.id !== id);
    persistProfiles(updated);
    console.log('[PayrollProvider] Deleted profile:', id);
  }, [savedProfiles, persistProfiles]);

  const updateProfile = useCallback((id: string) => {
    const updated = savedProfiles.map(p =>
      p.id === id ? { ...p, config: { ...config }, updatedAt: new Date().toISOString() } : p
    );
    persistProfiles(updated);
    console.log('[PayrollProvider] Updated profile:', id);
  }, [config, savedProfiles, persistProfiles]);

  const validation = useMemo(() => isConfigValid(config), [config]);

  const ensureAssets = useCallback(async (): Promise<StatementAssets | undefined> => {
    if (statementAssets) return statementAssets;
    try {
      console.log('[PayrollProvider] Loading statement assets...');
      const assets = await loadStatementAssets();
      setStatementAssets(assets);
      console.log('[PayrollProvider] Statement assets loaded');
      return assets;
    } catch (error) {
      console.error('[PayrollProvider] Failed to load statement assets:', error);
      return undefined;
    }
  }, [statementAssets]);

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
    const freq = cfg.payConfig.frequency;
    const salary = cfg.payConfig.annualSalary;
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
    if (
      freq === 'monthly' &&
      (salary >= 150000 ||
        dept.includes('executive') ||
        dept.includes('leadership') ||
        cls.includes('director') ||
        cls.includes('executive') ||
        cls.includes('manager'))
    ) {
      return 'executive';
    }
    if (
      dept.includes('admin') ||
      dept.includes('customer') ||
      dept.includes('office') ||
      cls.includes('admin') ||
      cls.includes('officer') ||
      cls.includes('clerk') ||
      employer.includes('council') ||
      employer.includes('government')
    ) {
      return 'admin';
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

  const generateStatementOnly = useCallback(async () => {
    console.log('[PayrollProvider] Generating statement only...');
    setIsGeneratingStatement(true);
    try {
      const assets = await ensureAssets();
      const payslips = output?.payslips ?? [];
      const genTx = pickTransactionGenerator(config.bankConfig.statementTemplate ?? 'commbank');
      const bankStatement: BankStatement = genTx(config, payslips);
      console.log('[PayrollProvider] Generated bank statement with', bankStatement.transactions.length, 'transactions');

      const genStmt = pickStatementGenerator(config.bankConfig.statementTemplate ?? 'commbank');
      const stmtHTML = genStmt(bankStatement, config, assets);
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
  }, [config, output, ensureAssets]);

  const generate = useCallback(async () => {
    console.log('[PayrollProvider] Starting full generation...');
    setIsGenerating(true);
    try {
      const assets = await ensureAssets();
      const payslips: Payslip[] = generatePayslips(config);
      console.log('[PayrollProvider] Generated', payslips.length, 'payslips');

      const genTx2 = pickTransactionGenerator(config.bankConfig.statementTemplate ?? 'commbank');
      const bankStatement: BankStatement = genTx2(config, payslips);
      console.log('[PayrollProvider] Generated bank statement with', bankStatement.transactions.length, 'transactions');

      const detected = detectTemplate(config);
      setPayslipTemplate(detected);
      console.log('[PayrollProvider] Auto-detected payslip template:', detected);

      const htmls = payslips.map((ps, i) => generatePayslipHTML(ps, i, detected));
      setPayslipHTMLs(htmls);
      console.log('[PayrollProvider] Generated', htmls.length, 'payslip HTML documents');

      const genStmt2 = pickStatementGenerator(config.bankConfig.statementTemplate ?? 'commbank');
      const stmtHTML = genStmt2(bankStatement, config, assets);
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
  }, [config, detectTemplate, ensureAssets]);

  const regenerateHTMLs = useCallback((template: PayslipTemplateType) => {
    if (!output) return;
    console.log('[PayrollProvider] Regenerating HTMLs with template:', template);
    setPayslipTemplate(template);
    const htmls = output.payslips.map((ps, i) => generatePayslipHTML(ps, i, template));
    setPayslipHTMLs(htmls);
  }, [output]);

  const regenerateStatement = useCallback(async (startDate: string, length: 30 | 60 | 90, bankOverrides?: Partial<BankConfig>) => {
    if (!output) return;
    console.log('[PayrollProvider] Regenerating statement with startDate:', startDate, 'length:', length, 'overrides:', bankOverrides);
    const assets = await ensureAssets();
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
    const genTx3 = pickTransactionGenerator(updatedConfig.bankConfig.statementTemplate ?? 'commbank');
    const bankStatement: BankStatement = genTx3(updatedConfig, output.payslips);
    const genStmt3 = pickStatementGenerator(updatedConfig.bankConfig.statementTemplate ?? 'commbank');
    const stmtHTML = genStmt3(bankStatement, updatedConfig, assets);
    setStatementHTML(stmtHTML);
    setOutput(prev => prev ? { ...prev, bankStatement } : null);
    console.log('[PayrollProvider] Statement regenerated with', bankStatement.transactions.length, 'transactions');
  }, [output, config, ensureAssets]);

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
    savedProfiles,
    saveProfile,
    loadProfile,
    deleteProfile,
    updateProfile,
    metadataCleanEnabled,
    setMetadataCleanEnabled,
  };
});
