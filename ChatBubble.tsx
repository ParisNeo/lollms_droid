import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Message } from '../store/chatStore';
import { theme } from '../constants/theme';

interface Props {
  message: Message;
  isStreaming?: boolean;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const ChatBubble = memo(({ message, isStreaming }: Props) => {
  const isUser = message.role === 'user';

  const copyContent = async () => {
    await Clipboard.setStringAsync(message.content);
  };

  return (
    <View style={[styles.wrapper, isUser ? styles.wrapperUser : styles.wrapperAI]}>
      {/* Avatar */}
      {!isUser && (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}

      <View style={[styles.bubbleContainer, isUser && styles.bubbleContainerUser]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.text, isUser ? styles.textUser : styles.textAI]}>
            {message.content}
            {isStreaming && <Text style={styles.cursor}>▋</Text>}
          </Text>
        </View>

        <View style={[styles.meta, isUser && styles.metaUser]}>
          <Text style={styles.metaText}>{formatTime(message.timestamp)}</Text>
          {message.tokensPerSec && (
            <Text style={styles.metaText}> · {message.tokensPerSec.toFixed(1)} t/s</Text>
          )}
          {message.tokens && (
            <Text style={styles.metaText}> · {message.tokens} tokens</Text>
          )}
          <TouchableOpacity onPress={copyContent} style={styles.copyBtn}>
            <Ionicons name="copy-outline" size={12} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {isUser && (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Ionicons name="person" size={14} color={theme.colors.accent} />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'flex-start',
    gap: 8,
  },
  wrapperUser: {
    justifyContent: 'flex-end',
  },
  wrapperAI: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.bgCard,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  avatarUser: {
    borderColor: theme.colors.userBubbleBorder,
    backgroundColor: theme.colors.userBubble,
  },
  avatarText: {
    fontSize: 9,
    color: theme.colors.accent,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bubbleContainer: {
    maxWidth: '78%',
    alignItems: 'flex-start',
  },
  bubbleContainerUser: {
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  bubbleUser: {
    backgroundColor: theme.colors.userBubble,
    borderColor: theme.colors.userBubbleBorder,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: theme.colors.aiBubble,
    borderColor: theme.colors.aiBubbleBorder,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#d0d0f0',
  },
  textAI: {
    color: theme.colors.textPrimary,
  },
  cursor: {
    color: theme.colors.accent,
    opacity: 0.8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 2,
    paddingHorizontal: 4,
  },
  metaUser: {
    flexDirection: 'row-reverse',
  },
  metaText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  copyBtn: {
    padding: 2,
    marginLeft: 4,
  },
});
