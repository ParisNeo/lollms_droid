import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
  ActivityIndicator, TouchableOpacity, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLlama } from '../src/hooks/useLlama';
import { useModelStore } from '../src/store/modelStore';
import { useChatStore } from '../src/store/chatStore';
import { useModelDownload } from '../src/hooks/useModelDownload';
import { ModelCard } from '../src/components/ModelCard';
import { MODELS } from '../src/constants/models';
import { theme } from '../src/constants/theme';

export default function ModelsScreen() {
  const { loadModel, isLoading, loadedModelId, releaseModel } = useLlama();
  const { downloadedModels, downloads, setActiveModel, activeModelId, getModelPath } = useModelStore();
  const { newConversation, setActiveConversation } = useChatStore();
  const { downloadModel, cancelDownload, deleteModel } = useModelDownload();
  const [loadingModelId, setLoadingModelId] = useState<string | null>(null);

  const handleDownload = async (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) return;

    Alert.alert(
      `Download ${model.name}`,
      `This will download ${model.sizeGB} GB. Make sure you're on Wi-Fi.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Download',
          onPress: async () => {
            try {
              await downloadModel(model);
            } catch (err: any) {
              Alert.alert('Download failed', err.message);
            }
          },
        },
      ]
    );
  };

  const handleLoad = async (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) return;

    const path = getModelPath(modelId);
    if (!path) {
      Alert.alert('Model not found', 'Please download the model first.');
      return;
    }

    setLoadingModelId(modelId);
    try {
      if (loadedModelId) await releaseModel();
      const success = await loadModel(model, path);
      if (success) {
        setActiveModel(model);
        const convId = newConversation(model.id);
        setActiveConversation(convId);
        Alert.alert('Model Loaded', `${model.name} is ready to chat!`);
      } else {
        Alert.alert('Load Failed', 'Could not load the model. Not enough RAM?');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoadingModelId(null);
    }
  };

  const handleDelete = (modelId: string) => {
    const model = MODELS.find((m) => m.id === modelId);
    if (!model) return;

    if (loadedModelId === modelId) {
      Alert.alert('Model in use', 'Release the model before deleting it.');
      return;
    }

    Alert.alert(
      `Delete ${model.name}`,
      'This will remove the model file from your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteModel(model),
        },
      ]
    );
  };

  const handleImportLocal = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (result.canceled || !result.assets[0]) return;

      const file = result.assets[0];
      if (!file.name.endsWith('.gguf')) {
        Alert.alert('Invalid file', 'Only .gguf model files are supported.');
        return;
      }

      Alert.alert('Import Model', `Import "${file.name}" as a custom model?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', onPress: () => {
          // Implementation would add custom model logic
          Alert.alert('Coming soon', 'Custom model import will be available in a future update.');
        }},
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const totalDownloadedGB = Object.values(downloadedModels).reduce(
    (acc, dm) => acc + dm.sizeGB, 0
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Models</Text>
          <Text style={styles.headerSub}>
            {Object.keys(downloadedModels).length} downloaded ·{' '}
            {totalDownloadedGB.toFixed(1)} GB used
          </Text>
        </View>
        <TouchableOpacity style={styles.importBtn} onPress={handleImportLocal}>
          <Ionicons name="folder-open-outline" size={16} color={theme.colors.accent} />
          <Text style={styles.importBtnText}>Import</Text>
        </TouchableOpacity>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={14} color={theme.colors.textMuted} />
        <Text style={styles.infoBannerText}>
          Models run 100% locally. Requires Wi-Fi for downloads.
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {MODELS.map((model) => (
          <ModelCard
            key={model.id}
            model={model}
            isDownloaded={!!downloadedModels[model.id]}
            isActive={loadedModelId === model.id}
            downloadProgress={downloads[model.id]}
            onDownload={() => handleDownload(model.id)}
            onDelete={() => handleDelete(model.id)}
            onLoad={() => handleLoad(model.id)}
            onCancel={() => cancelDownload(model.id)}
          />
        ))}

        <View style={styles.hint}>
          <Ionicons name="bulb-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.hintText}>
            Start with Qwen 2.5 0.5B for fastest response, or Phi-3 Mini for best quality.
          </Text>
        </View>
      </ScrollView>

      {/* Loading overlay */}
      {(isLoading || loadingModelId) && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
            <Text style={styles.loadingTitle}>Loading Model</Text>
            <Text style={styles.loadingSubtitle}>
              {MODELS.find((m) => m.id === loadingModelId)?.name ?? 'Please wait…'}
            </Text>
          </View>
        </View>
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    color: theme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSub: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.accent + '44',
    backgroundColor: theme.colors.accentDim,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  importBtnText: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff05',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  infoBannerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  hint: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffffff05',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  hintText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
  },
  loadingTitle: {
    color: theme.colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  loadingSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
});
