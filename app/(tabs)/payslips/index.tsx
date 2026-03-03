import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { FileText, ChevronLeft, ChevronRight, Eye, HardHat, Briefcase } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { usePayroll, PayslipTemplateType } from '@/providers/PayrollProvider';
import PayslipCard from '@/components/PayslipCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PayslipsScreen() {
  const { output, payslipTemplate, setPayslipTemplate, payslipHTMLs } = usePayroll();
  const router = useRouter();
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

  const handleViewStatement = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/preview');
  }, [router]);

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
          Select a template on the Forge tab and tap "Forge Payslips" to get started
        </Text>
      </View>
    );
  }

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
        <ScrollView style={styles.htmlScroll} contentContainerStyle={styles.htmlContent}>
          <View style={styles.htmlPreviewBox}>
            <Text style={styles.htmlPreviewLabel}>HTML Payslip Preview (Period {activeIndex + 1})</Text>
            <Text style={styles.htmlPreviewNote}>
              {payslipTemplate === 'construction' ? 'Construction Industry' : 'General'} template applied.
              Export to view the full formatted document.
            </Text>
            {payslipHTMLs[activeIndex] ? (
              <View style={styles.htmlSnippet}>
                <Text style={styles.htmlSnippetText} numberOfLines={20}>
                  {payslipHTMLs[activeIndex].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 800)}
                </Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}

      <View style={styles.bottomBar}>
        <View style={styles.bottomRow}>
          <TouchableOpacity
            style={styles.viewToggle}
            onPress={toggleViewMode}
            activeOpacity={0.7}
          >
            <FileText size={16} color={Colors.accent} />
            <Text style={styles.viewToggleText}>{viewMode === 'card' ? 'Preview HTML' : 'Card View'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statementButton}
            onPress={handleViewStatement}
            activeOpacity={0.8}
          >
            <Eye size={18} color={Colors.background} />
            <Text style={styles.statementButtonText}>View Statement</Text>
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
  htmlScroll: {
    flex: 1,
  },
  htmlContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  htmlPreviewBox: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  htmlPreviewLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  htmlPreviewNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    marginBottom: 12,
  },
  htmlSnippet: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  htmlSnippetText: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 10,
  },
  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    backgroundColor: Colors.card,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.accent,
  },
  statementButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statementButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.background,
  },
});
