import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  Monitor,
  ShoppingBag,
  Wrench,
  Briefcase,
  UtensilsCrossed,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { PayrollTemplate } from '@/mocks/templates';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  Monitor,
  ShoppingBag,
  Wrench,
  Briefcase,
  UtensilsCrossed,
  FileText,
};

interface TemplateCardProps {
  template: PayrollTemplate;
  onSelect: (template: PayrollTemplate) => void;
}

function TemplateCardInner({ template, onSelect }: TemplateCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent = ICON_MAP[template.icon] || FileText;

  const basisLabel = template.config.payConfig.basis === 'salary'
    ? `$${template.config.payConfig.annualSalary.toLocaleString()}/yr`
    : `$${template.config.payConfig.hourlyRate}/hr`;

  const freqLabel = template.config.payConfig.frequency.charAt(0).toUpperCase()
    + template.config.payConfig.frequency.slice(1);

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(template);
  }, [onSelect, template]);

  return (
    <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={`template-${template.id}`}
      >
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: template.accent + '1A' }]}>
            <IconComponent size={20} color={template.accent} />
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: template.accent + '1A' }]}>
              <Text style={[styles.badgeText, { color: template.accent }]}>{basisLabel}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeTextMuted}>{freqLabel}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.name}>{template.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{template.description}</Text>
        <View style={styles.footer}>
          <Text style={styles.footerDetail}>{template.config.employer.name}</Text>
          <ChevronRight size={14} color={Colors.textMuted} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default React.memo(TemplateCardInner);

const styles = StyleSheet.create({
  cardOuter: {
    marginBottom: 10,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: Colors.cardElevated,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  badgeTextMuted: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textMuted,
  },
  name: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
  },
  footerDetail: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500' as const,
  },
});
