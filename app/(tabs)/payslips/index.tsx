import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { FileText, ChevronLeft, ChevronRight, HardHat, Briefcase, Download, Share2, Calendar } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePayroll, PayslipTemplateType } from '@/providers/PayrollProvider';
import PayslipCard from '@/components/PayslipCard';
import HTMLRenderer from '@/components/HTMLRenderer';
import { exportHTMLToPDF, exportAllPayslips } from '@/utils/export';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

  return (
    <View style={styles.container}>
      <View style={styles.templateBar}>
        <TouchableOpacity
          style={[styles.templateBtn, payslipTemplate === 'general' && styles.templateBtnActive]}
          onPress={() => handleTemplateSwitch('general')}
          activeOpacity={0.7}
        >
          <Briefcase size={14} color={payslipTemplate === 'general' ? Colors.accent : Colors.textMuted} />
          <Text style={[styles.templateBtnText, payslipTemplate === 'general' && styles.templateBtnTextActive]}>General</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.templateBtn, payslipTemplate === 'construction' && styles.templateBtnActive]}
          onPress={() => handleTemplateSwitch('construction')}
          activeOpacity={0.7}
        >
          <HardHat size={14} color={payslipTemplate === 'construction' ? '#FF9500' : Colors.textMuted} />
          <Text style={[styles.templateBtnText, payslipTemplate === 'construction' && styles.templateBtnTextActive, payslipTemplate === 'construction' && { color: '#FF9500' }]}>Construction</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.paymentInfo}>
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

      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={handlePrev}
          style={[styles.navButton, activeIndex === 0 && styles.navButtonDisabled]}
          disabled={activeIndex === 0}
        >
          <ChevronLeft size={20} color={activeIndex === 0 ? Colors.textMuted : Colors.accent} />
        </TouchableOpacity>
        <View style={styles.navCenter}>
          <Text style={styles.navTitle}>Period {activeIndex + 1} of {output.payslips.length}</Text>
          <View style={styles.dots}>
            {output.payslips.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleNext}
          style={[styles.navButton, activeIndex === output.payslips.length - 1 && styles.navButtonDisabled]}
          disabled={activeIndex === output.payslips.length - 1}
        >
          <ChevronRight size={20} color={activeIndex === output.payslips.length - 1 ? Colors.textMuted : Colors.accent} />
        </TouchableOpacity>
      </View>

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

      <View style={styles.bottomBar}>
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={styles.exportSmallBtn}
            onPress={handleExportCurrent}
            activeOpacity={0.7}
            disabled={isExporting}
          >
            <Download size={15} color={Colors.accent} />
            <Text style={styles.exportSmallText}>{isExporting ? 'Exporting...' : 'This Slip'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportSmallBtn}
            onPress={handleExportAll}
            activeOpacity={0.7}
            disabled={isExporting}
          >
            <Share2 size={15} color={Colors.accent} />
            <Text style={styles.exportSmallText}>{isExporting ? 'Exporting...' : 'All Slips'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={toggleViewMode}
            activeOpacity={0.7}
          >
            <FileText size={15} color={Colors.accent} />
            <Text style={styles.exportSmallText}>{viewMode === 'card' ? 'HTML' : 'Card'}</Text>
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
  templateBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  templateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  templateBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '15',
  },
  templateBtnText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  templateBtnTextActive: {
    color: Colors.accent,
    fontWeight: '700' as const,
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 10,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
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
    alignItems: 'center',
    gap: 6,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 18,
    borderRadius: 3,
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
  exportSmallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  exportSmallText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    backgroundColor: Colors.card,
  },
});
