import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FileText, ChevronLeft, ChevronRight, HardHat, Briefcase, Download, Share2, Calendar, ClipboardList, Crown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll, PayslipTemplateType } from '@/providers/PayrollProvider';
import PayslipCard from '@/components/PayslipCard';
import HTMLRenderer from '@/components/HTMLRenderer';
import { exportHTMLToPDF, exportAllPayslips } from '@/utils/export';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type TemplateOption = {
  key: PayslipTemplateType;
  label: string;
  icon: typeof Briefcase;
  activeColor: string;
  activeBg: string;
};

const TEMPLATE_OPTIONS: TemplateOption[] = [
  { key: 'general', label: 'General', icon: Briefcase, activeColor: Colors.accent, activeBg: Colors.accentDim },
  { key: 'construction', label: 'Construction', icon: HardHat, activeColor: Colors.gold, activeBg: Colors.goldDim },
  { key: 'admin', label: 'Admin', icon: ClipboardList, activeColor: Colors.cyan, activeBg: '#06B6D420' },
  { key: 'executive', label: 'Executive', icon: Crown, activeColor: '#A78BFA', activeBg: '#A78BFA20' },
];

function fmt(n: number): string {
  return Math.abs(n).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtShortDate(d: Date): string {
  return new Date(d).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' });
}

export default function PayslipsScreen() {
  const { output, payslipTemplate, setPayslipTemplate, payslipHTMLs } = usePayroll();
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'card' | 'html'>('card');
  const scrollRef = useRef<ScrollView>(null);

  const handlePrev = useCallback(() => {
    if (activeIndex > 0) {
      const newIndex = activeIndex - 1;
      setActiveIndex(newIndex);
      scrollRef.current?.scrollTo({ x: newIndex * (SCREEN_WIDTH - 32), animated: true });
      Haptics.selectionAsync();
    }
  }, [activeIndex]);

  const handleNext = useCallback(() => {
    if (output && activeIndex < output.payslips.length - 1) {
      const newIndex = activeIndex + 1;
      setActiveIndex(newIndex);
      scrollRef.current?.scrollTo({ x: newIndex * (SCREEN_WIDTH - 32), animated: true });
      Haptics.selectionAsync();
    }
  }, [activeIndex, output]);

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportCurrent = useCallback(async () => {
    if (!payslipHTMLs[activeIndex] || isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      const periodNum = activeIndex + 1;
      await exportHTMLToPDF(payslipHTMLs[activeIndex], `Payslip_Period_${periodNum}`);
      console.log('[Payslips] Exported payslip period', periodNum);
    } finally {
      setIsExporting(false);
    }
  }, [activeIndex, payslipHTMLs, isExporting]);

  const handleExportAll = useCallback(async () => {
    if (payslipHTMLs.length === 0 || isExporting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsExporting(true);
    try {
      await exportAllPayslips(payslipHTMLs, 'All_Payslips');
      console.log('[Payslips] Exported all payslips');
    } finally {
      setIsExporting(false);
    }
  }, [payslipHTMLs, isExporting]);

  const handleTemplateSwitch = useCallback((template: PayslipTemplateType) => {
    if (template === payslipTemplate) return;
    console.log('[Payslips] Switching template to:', template);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayslipTemplate(template);
  }, [payslipTemplate, setPayslipTemplate]);

  const toggleViewMode = useCallback(() => {
    Haptics.selectionAsync();
    setViewMode(prev => prev === 'card' ? 'html' : 'card');
  }, []);

  const handleScroll = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / (SCREEN_WIDTH - 32));
    if (idx !== activeIndex && idx >= 0) {
      setActiveIndex(idx);
    }
  }, [activeIndex]);

  if (!output || output.payslips.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <FileText size={40} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No Payslips Generated</Text>
        <Text style={styles.emptySubtitle}>
          Select a template on the Forge tab and tap Forge Payslips to get started
        </Text>
      </View>
    );
  }

  const currentPayslip = output.payslips[activeIndex];
  const totalSlips = output.payslips.length;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.segmentedBar}
        contentContainerStyle={styles.segmentedScroll}
      >
        <View style={styles.segmentedInner}>
          {TEMPLATE_OPTIONS.map((opt) => {
            const isActive = payslipTemplate === opt.key;
            const IconComp = opt.icon;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.segmentBtn, isActive && { backgroundColor: opt.activeBg }]}
                onPress={() => handleTemplateSwitch(opt.key)}
                activeOpacity={0.7}
              >
                <IconComp size={13} color={isActive ? opt.activeColor : Colors.textMuted} />
                <Text style={[styles.segmentBtnText, isActive && { color: opt.activeColor, fontWeight: '700' as const }]}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.paymentInfo}>
        <View style={[styles.paymentInfoAccent, { backgroundColor: Colors.accent }]} />
        <View style={styles.paymentInfoContent}>
          <View style={styles.paymentInfoLeft}>
            <View style={styles.paymentDateBadge}>
              <Calendar size={13} color={Colors.accent} />
              <Text style={styles.paymentDateText}>
                {fmtShortDate(currentPayslip.period.startDate)} – {fmtShortDate(currentPayslip.period.endDate)}
              </Text>
            </View>
            <Text style={styles.paidOnText}>
              Paid {fmtShortDate(currentPayslip.period.paymentDate)}
            </Text>
          </View>
          <View style={styles.paymentInfoRight}>
            <Text style={styles.netPayLabel}>Net Pay</Text>
            <Text style={styles.netPayAmount}>${fmt(currentPayslip.netPay)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={handlePrev}
          style={[styles.navButton, activeIndex === 0 && styles.navButtonDisabled]}
          disabled={activeIndex === 0}
        >
          <ChevronLeft size={20} color={activeIndex === 0 ? Colors.textMuted : Colors.accent} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Period {activeIndex + 1} of {totalSlips}</Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((activeIndex + 1) / totalSlips) * 100}%` },
              ]}
            />
          </View>
        </View>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.navButton, activeIndex === totalSlips - 1 && styles.navButtonDisabled]}
          disabled={activeIndex === totalSlips - 1}
        >
          <ChevronRight size={20} color={activeIndex === totalSlips - 1 ? Colors.textMuted : Colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.contentArea}>
        {viewMode === 'card' ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            contentContainerStyle={styles.carousel}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH - 32}
          >
            {output.payslips.map((ps, i) => (
              <View key={i} style={[styles.cardWrap, { width: SCREEN_WIDTH - 32 }]}>
                <PayslipCard payslip={ps} index={i} />
              </View>
            ))}
          </ScrollView>
        ) : (
          payslipHTMLs[activeIndex] ? (
            <HTMLRenderer html={payslipHTMLs[activeIndex]} style={styles.htmlContainer} />
          ) : (
            <View style={styles.htmlEmptyBox}>
              <Text style={styles.htmlEmptyText}>No HTML generated for this period</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportPill}
            onPress={handleExportCurrent}
            activeOpacity={0.7}
            disabled={isExporting}
          >
            <Download size={15} color={Colors.accent} />
            <Text style={styles.exportPillText}>{isExporting ? 'Exporting...' : 'This Slip'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportPill}
            onPress={handleExportAll}
            activeOpacity={0.7}
            disabled={isExporting}
          >
            <Share2 size={15} color={Colors.accent} />
            <Text style={styles.exportPillText}>{isExporting ? 'Exporting...' : 'All Slips'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportPill}
            onPress={toggleViewMode}
            activeOpacity={0.7}
          >
            <FileText size={15} color={Colors.accent} />
            <Text style={styles.exportPillText}>{viewMode === 'card' ? 'HTML' : 'Card'}</Text>
          </TouchableOpacity>
        </View>
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
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
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
  segmentedBar: {
    paddingTop: 10,
    paddingBottom: 4,
    maxHeight: 52,
  },
  segmentedScroll: {
    paddingHorizontal: 16,
  },
  segmentedInner: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  paymentInfo: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  paymentInfoAccent: {
    width: 4,
  },
  paymentInfoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  paymentInfoLeft: {
    gap: 4,
  },
  paymentDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentDateText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  paidOnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginLeft: 19,
  },
  paymentInfoRight: {
    alignItems: 'flex-end',
  },
  netPayLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textMuted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
  },
  netPayAmount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.success,
    fontVariant: ['tabular-nums'] as const,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 6,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accent,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  carousel: {
    paddingHorizontal: 16,
  },
  cardWrap: {
    paddingRight: 0,
  },
  htmlContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  htmlEmptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  htmlEmptyText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 4,
  },
  exportRow: {
    flexDirection: 'row',
    gap: 8,
  },
  exportPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accentDim,
  },
  exportPillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
});
