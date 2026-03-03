import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { FileText, ChevronLeft, ChevronRight, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { usePayroll } from '@/providers/PayrollProvider';
import PayslipCard from '@/components/PayslipCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PayslipsScreen() {
  const { output } = usePayroll();
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number>(0);
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

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.statementButton}
          onPress={handleViewStatement}
          activeOpacity={0.8}
        >
          <Eye size={18} color={Colors.background} />
          <Text style={styles.statementButtonText}>View Bank Statement</Text>
        </TouchableOpacity>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 4,
  },
  statementButton: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
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
