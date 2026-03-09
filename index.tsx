import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLlama } from '../src/hooks/useLlama';
import { useChatStore, Message } from '../src/store/chatStore';
import { useModelStore } from '../src/store/modelStore';
import { ChatBubble } from '../src/components/ChatBubble';
import { theme } from '../src/constants/theme';
import { MODELS } from '../src/constants/models';

export default function ChatScreen() {
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const { generate, loadModel, stopGeneration, isReady, isLoading, loadedModelId } = useLlama();

  const {
    newConversation, addMessage, updateLastMessage,
    setGenerating, setStreaming, streamingContent,
    isGenerating, systemPrompt, activeConversationId,
    setActiveConversation, getActiveConversation, conversations
  } = useChatStore();

  const { activeModelConfig, getModelPath } = useModelStore();

  const conversation = getActiveConversation();
  const messages = conversation?.messages ?? [];

  // Auto-create conversation when model is active
  useEffect(() => {
    if (activeModelConfig && !activeConversationId) {
      const id = newConversation(activeModelConfig.id);
      setActiveConversation(id);
    }
  }, [activeModelConfig]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isGenerating || !isReady || !activeModelConfig || !conversation) return;

    const userText = input.trim();
    setInput('');

    // Add user message
    addMessage(conversation.id, { role: 'user', content: userText });

    // Add placeholder for assistant
    const assistantMsgId = addMessage(conversation.id, { role: 'assistant', content: '' });

    setGenerating(true);
    setStreaming('');

    try {
      const allMessages = [...messages, { id: 'tmp', role: 'user' as const, content: userText, timestamp: Date.now() }];
      let streamedText = '';

      const result = await generate(
        allMessages,
        activeModelConfig,
        (token) => {
          streamedText += token;
          setStreaming(streamedText);
        },
        { systemPrompt, maxTokens: 1024, temperature: 0.7 }
      );

      updateLastMessage(conversation.id, result.text, {
        tokens: result.totalTokens,
        tokensPerSec: result.tokensPerSec,
      });
    } catch (err: any) {
      updateLastMessage(conversation.id, `Error: ${err.message}`);
    } finally {
      setGenerating(false);
      setStreaming('');
    }
  }, [input, isGenerating, isReady, activeModelConfig, conversation, messages, generate, systemPrompt]);

  const handleNewChat = () => {
    if (!activeModelConfig) return;
    const id = newConversation(activeModelConfig.id);
    setActiveConversation(id);
  };

  const noModel = !activeModelConfig;
  const notLoaded = activeModelConfig && !isReady && !isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>L</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>LoLLMs</Text>
            {activeModelConfig ? (
              <View style={styles.modelBadge}>
                <View style={[styles.modelDot, isReady && styles.modelDotReady, isLoading && styles.modelDotLoading]} />
                <Text style={styles.modelName}>{activeModelConfig.name}</Text>
              </View>
            ) : (
              <Text style={styles.noModelText}>No model loaded</Text>
            )}
          </View>
        </View>
        <View style={styles.headerActions}>
          {conversation && (
            <TouchableOpacity style={styles.iconBtn} onPress={handleNewChat}>
              <Ionicons name="add" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/models')}>
            <Ionicons name="cube-outline" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* No model state */}
      {noModel && (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="cube-outline" size={40} color={theme.colors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No Model Loaded</Text>
          <Text style={styles.emptySubtitle}>
            Download and load a model to start chatting locally
          </Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/models')}>
            <Ionicons name="cloud-download-outline" size={16} color={theme.colors.bg} />
            <Text style={styles.emptyBtnText}>Browse Models</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading state */}
      {isLoading && (
        <View style={styles.loadingBanner}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading {activeModelConfig?.name}…</Text>
        </View>
      )}

      {/* Messages */}
      {!noModel && (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ChatBubble
              message={item}
              isStreaming={
                item.role === 'assistant' &&
                index === messages.length - 1 &&
                isGenerating
              }
            />
          )}
          ListFooterComponent={
            isGenerating && streamingContent && messages.length > 0 &&
            messages[messages.length - 1].role === 'assistant' &&
            messages[messages.length - 1].content === '' ? (
              <ChatBubble
                message={{
                  id: 'streaming',
                  role: 'assistant',
                  content: streamingContent,
                  timestamp: Date.now(),
                }}
                isStreaming={true}
              />
            ) : null
          }
          ListEmptyComponent={
            !noModel && !isLoading ? (
              <View style={styles.chatEmpty}>
                <Text style={styles.chatEmptyText}>
                  {isReady ? `${activeModelConfig?.name} is ready. Say something!` : 'Load a model to begin'}
                </Text>
              </View>
            ) : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messageList}
        />
      )}

      {/* Input bar */}
      {!noModel && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder={isReady ? 'Message…' : isLoading ? 'Loading model…' : 'Load a model first'}
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={4000}
              editable={isReady && !isGenerating}
              onSubmitEditing={handleSend}
            />
            {isGenerating ? (
              <TouchableOpacity style={[styles.sendBtn, styles.stopBtn]} onPress={stopGeneration}>
                <Ionicons name="stop" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.sendBtn, (!isReady || !input.trim()) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!isReady || !input.trim() || isGenerating}
              >
                <Ionicons name="arrow-up" size={18} color={theme.colors.bg} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.footer}>Runs 100% on-device · No data sent</Text>
        </KeyboardAvoidingView>
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modelBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  modelDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.textMuted },
  modelDotReady: { backgroundColor: theme.colors.success },
  modelDotLoading: { backgroundColor: theme.colors.warning },
  modelName: { color: theme.colors.textMuted, fontSize: 11 },
  noModelText: { color: theme.colors.textMuted, fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  loadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.accentDim,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  loadingText: { color: theme.colors.accent, fontSize: 13 },
  messageList: { paddingTop: 8, paddingBottom: 8 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.accentDim,
    borderWidth: 1,
    borderColor: theme.colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySubtitle: {
    color: theme.colors.textSecondary, fontSize: 14,
    textAlign: 'center', lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: { color: theme.colors.bg, fontWeight: '700', fontSize: 15 },
  chatEmpty: { flex: 1, alignItems: 'center', paddingTop: 60 },
  chatEmptyText: { color: theme.colors.textMuted, fontSize: 14 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 8,
    backgroundColor: theme.colors.bg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.bgInput,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: theme.colors.textPrimary,
    fontSize: 15,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: theme.colors.bgInput, opacity: 0.5 },
  stopBtn: { backgroundColor: theme.colors.errorDim, borderWidth: 1, borderColor: theme.colors.error + '44' },
  footer: {
    color: theme.colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    paddingBottom: 6,
    paddingTop: 2,
  },
});
