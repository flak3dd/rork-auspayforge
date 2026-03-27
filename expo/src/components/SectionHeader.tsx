import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
}

export default React.memo(function SectionHeader({ title, icon, collapsed, onToggle }: SectionHeaderProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onToggle}
      activeOpacity={onToggle ? 0.7 : 1}
      disabled={!onToggle}
    >
      <View style={styles.left}>
        {icon}
        <Text style={styles.title}>{title}</Text>
      </View>
      {onToggle ? (
        <View style={[styles.chevron, collapsed && styles.chevronCollapsed]}>
          <ChevronDown size={18} color={Colors.textMuted} />
        </View>
      ) : null}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.accent,
    letterSpacing: 0.3,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronCollapsed: {
    transform: [{ rotate: '-90deg' }],
  },
});
