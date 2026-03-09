import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Switch,
  ScrollView, TouchableOpacity, StatusBar, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../src/store/chatStore';
import { useModelStore } from '../src/store/modelStore';
import { useLlama } from '../src/hooks/useLlama';
import { theme } from '../src/constants/theme';

export default function SettingsScreen() {
  const { systemPrompt, setSystemPrompt } = useChatStore();
  const { downloadedModels, activeModelConfig } = useModelStore();
  const { releaseModel, loadedModelId } = useLlama();

  const [tempSystemPrompt, setTempSystemPrompt] = useState(systemPrompt);
  const [maxTokens, setMaxTokens] = useState('1024');
  const [temperature, setTemperature] = useState('0.7');
  const [streamEnabled, setStreamEnabled] = useState(true);

  const handleSavePrompt = () => {
    setSystemPrompt(tempSystemPrompt);
    Alert.alert('Saved', 'System prompt updated.');
  };

  const handleReleaseModel = async () => {
    if (!loadedModelId) return;
    await releaseModel();
    Alert.alert('Released', 'Model unloaded from memory.');
  };

  const totalGB = Object.values(downloadedModels).reduce((a, m) => a + m.sizeGB, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Model status */}
        <Section title="Active Model">
          {activeModelConfig ? (
            <View style={styles.activeModelCard}>
              <View>
                <Text style={styles.activeModelName}>{activeModelConfig.name}</Text>
                <Text style={styles.activeModelSub}>
                  {activeModelConfig.sizeGB} GB · {activeModelConfig.contextLength / 1024}K context
                </Text>
              </View>
              <TouchableOpacity style={styles.releaseBtn} onPress={handleReleaseModel}>
                <Ionicons name="power" size={14} color={theme.colors.error} />
                <Text style={styles.releaseBtnText}>Unload</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.noModelText}>No model loaded</Text>
          )}
        </Section>

        {/* System prompt */}
        <Section title="System Prompt">
          <TextInput
            style={styles.systemPromptInput}
            value={tempSystemPrompt}
            onChangeText={setTempSystemPrompt}
            multiline
            numberOfLines={4}
            placeholder="You are a helpful assistant..."
            placeholderTextColor={theme.colors.textMuted}
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSavePrompt}>
            <Text style={styles.saveBtnText}>Save Prompt</Text>
          </TouchableOpacity>
        </Section>

        {/* Generation params */}
        <Section title="Generation">
          <SettingRow label="Max Tokens" hint="Max response length">
            <TextInput
              style={styles.numInput}
              value={maxTokens}
              onChangeText={setMaxTokens}
              keyboardType="number-pad"
            />
          </SettingRow>
          <SettingRow label="Temperature" hint="0.0 = deterministic, 1.0 = creative">
            <TextInput
              style={styles.numInput}
              value={temperature}
              onChangeText={setTemperature}
              keyboardType="decimal-pad"
            />
          </SettingRow>
          <SettingRow label="Stream tokens" hint="Show response as it generates">
            <Switch
              value={streamEnabled}
              onValueChange={setStreamEnabled}
              trackColor={{ true: theme.colors.accent, false: theme.colors.border }}
              thumbColor="#fff"
            />
          </SettingRow>
        </Section>

        {/* Storage */}
        <Section title="Storage">
          <View style={styles.storageRow}>
            <Ionicons name="save-outline" size={16} color={theme.colors.textMuted} />
            <Text style={styles.storageText}>
              {Object.keys(downloadedModels).length} models · {totalGB.toFixed(1)} GB used
            </Text>
          </View>
        </Section>

        {/* About */}
        <Section title="About">
          <InfoRow label="App" value="LoLLMs Mobile v1.0.0" />
          <InfoRow label="Engine" value="llama.rn (llama.cpp)" />
          <InfoRow label="Privacy" value="100% on-device, no data sent" />
          <InfoRow label="Based on" value="llama.cpp by Georgi Gerganov" />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={rowStyles.row}>
      <View style={rowStyles.labelWrap}>
        <Text style={rowStyles.label}>{label}</Text>
        {hint && <Text style={rowStyles.hint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text style={rowStyles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: '700' },
  content: { padding: 16, gap: 4, paddingBottom: 40 },
  activeModelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeModelName: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '600' },
  activeModelSub: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  releaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.errorDim,
    borderWidth: 1,
    borderColor: theme.colors.error + '44',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  releaseBtnText: { color: theme.colors.error, fontSize: 12, fontWeight: '600' },
  noModelText: { color: theme.colors.textMuted, fontSize: 13 },
  systemPromptInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    padding: 12,
    fontSize: 13,
    lineHeight: 19,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  saveBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  numInput: {
    backgroundColor: theme.colors.bgInput,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
    fontSize: 14,
  },
  storageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageText: { color: theme.colors.textSecondary, fontSize: 13 },
});

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  body: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 14,
    gap: 12,
  },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelWrap: { flex: 1 },
  label: { color: theme.colors.textPrimary, fontSize: 14 },
  hint: { color: theme.colors.textMuted, fontSize: 11, marginTop: 2 },
  value: { color: theme.colors.textSecondary, fontSize: 13, maxWidth: '55%', textAlign: 'right' },
});
