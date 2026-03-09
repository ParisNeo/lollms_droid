import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useChatStore, Conversation } from '../src/store/chatStore';
import { MODELS } from '../src/constants/models';
import { theme } from '../src/constants/theme';

function timeAgo(ts: number): string {
  const seconds = (Date.now() - ts) / 1000;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function HistoryScreen() {
  const { conversations, setActiveConversation, deleteConversation, clearConversation } = useChatStore();

  const handleOpen = (conv: Conversation) => {
    setActiveConversation(conv.id);
    router.push('/');
  };

  const handleDelete = (conv: Conversation) => {
    Alert.alert('Delete conversation?', conv.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteConversation(conv.id),
      },
    ]);
  };

  const handleClearAll = () => {
    if (conversations.length === 0) return;
    Alert.alert('Clear all history?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: () => conversations.forEach((c) => deleteConversation(c.id)),
      },
    ]);
  };

  const getModelName = (modelId: string) => {
    return MODELS.find((m) => m.id === modelId)?.name ?? modelId;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        {conversations.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAll}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleOpen(item)} activeOpacity={0.7}>
            <View style={styles.cardMain}>
              <View style={styles.cardIcon}>
                <Ionicons name="chatbubble-ellipses" size={16} color={theme.colors.accent} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>{getModelName(item.modelId)}</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{item.messages.length} messages</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaText}>{timeAgo(item.updatedAt)}</Text>
                </View>
                {item.messages.length > 0 && (
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.messages[item.messages.length - 1].content}
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="time-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySubtitle}>Start chatting to build your history</Text>
          </View>
        }
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  clearAll: {
    color: theme.colors.error,
    fontSize: 13,
  },
  list: { padding: 16, gap: 8 },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardMain: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.accentDim,
    borderWidth: 1,
    borderColor: theme.colors.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 4,
  },
  metaText: { color: theme.colors.textMuted, fontSize: 11 },
  metaDot: { color: theme.colors.textMuted, fontSize: 11 },
  preview: { color: theme.colors.textSecondary, fontSize: 12 },
  deleteBtn: { padding: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 100 },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySubtitle: { color: theme.colors.textMuted, fontSize: 13 },
});
