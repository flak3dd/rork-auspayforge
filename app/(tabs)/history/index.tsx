import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Clock, Trash2, FileText, RefreshCw } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useForgeStore } from '@/store/useForgeStore';

export default function HistoryScreen() {
  const statements = useForgeStore((s) => s.statements);
  const loadStatement = useForgeStore((s) => s.loadStatement);
  const deleteStatement = useForgeStore((s) => s.deleteStatement);
  const clearAll = useForgeStore((s) => s.clearAll);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Statement', `Remove "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteStatement(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [deleteStatement]);

  const handleClearAll = useCallback(() => {
    if (statements.length === 0) return;
    Alert.alert('Clear All History', 'This will remove all saved statements.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => {
          clearAll();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [clearAll, statements.length]);

  if (statements.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Clock size={40} color={Colors.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>No History Yet</Text>
        <Text style={styles.emptySubtitle}>
          Generated statements will appear here for quick access
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={styles.countText}>{statements.length} statement{statements.length !== 1 ? 's' : ''}</Text>
        <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
          <RefreshCw size={14} color={Colors.error} />
          <Text style={styles.clearText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {statements.map((stmt) => (
        <View key={stmt.id} style={styles.card}>
          <View style={styles.cardIcon}>
            <FileText size={20} color={Colors.accent} />
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.cardName}>{stmt.name}</Text>
            <Text style={styles.cardDate}>
              {new Date(stmt.createdAt).toLocaleDateString('en-AU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            <Text style={styles.cardDetail} numberOfLines={1}>
              {stmt.config.account_holder} · {stmt.config.statement_period}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => handleDelete(stmt.id, stmt.name)}
          >
            <Trash2 size={16} color={Colors.error} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  countText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.error + '15',
  },
  clearText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    gap: 12,
  },
  cardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.accent + '1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  cardDetail: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPad: {
    height: 40,
  },
});
