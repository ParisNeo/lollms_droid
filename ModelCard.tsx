import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModelConfig, FAMILY_COLORS } from '../constants/models';
import { DownloadProgress } from '../store/modelStore';
import { theme } from '../constants/theme';

interface Props {
  model: ModelConfig;
  isDownloaded: boolean;
  isActive: boolean;
  downloadProgress?: DownloadProgress;
  onDownload: () => void;
  onDelete: () => void;
  onLoad: () => void;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function ModelCard({
  model, isDownloaded, isActive, downloadProgress,
  onDownload, onDelete, onLoad, onCancel
}: Props) {
  const familyColor = FAMILY_COLORS[model.family] ?? theme.colors.accent;
  const isDownloading = !!downloadProgress;

  return (
    <View style={[styles.card, isActive && styles.cardActive]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.familyBadge, { backgroundColor: familyColor + '22', borderColor: familyColor + '44' }]}>
          <Text style={[styles.familyText, { color: familyColor }]}>{model.family}</Text>
        </View>
        <Text style={styles.name}>{model.name}</Text>
        {isActive && (
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Loaded</Text>
          </View>
        )}
      </View>

      {/* Description */}
      <Text style={styles.description}>{model.description}</Text>

      {/* Stats row */}
      <View style={styles.stats}>
        <Stat icon="hardware-chip-outline" label={`${model.sizeGB} GB`} />
        <Stat icon="server-outline" label={`${model.ramRequiredGB} GB RAM`} />
        <Stat icon="document-text-outline" label={`${(model.contextLength / 1024).toFixed(0)}K ctx`} />
      </View>

      {/* Tags */}
      <View style={styles.tags}>
        {model.tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      {/* Download progress */}
      {isDownloading && downloadProgress && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${downloadProgress.progress * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>
            {formatBytes(downloadProgress.bytesDownloaded)} / {formatBytes(downloadProgress.totalBytes)}
            {' · '}{(downloadProgress.progress * 100).toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {isDownloading ? (
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onCancel}>
            <Ionicons name="stop" size={14} color={theme.colors.error} />
            <Text style={[styles.btnText, { color: theme.colors.error }]}>Cancel</Text>
          </TouchableOpacity>
        ) : isDownloaded ? (
          <>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, isActive && styles.btnDisabled]}
              onPress={onLoad}
              disabled={isActive}
            >
              <Ionicons name="play" size={14} color={isActive ? theme.colors.textMuted : theme.colors.accent} />
              <Text style={[styles.btnText, { color: isActive ? theme.colors.textMuted : theme.colors.accent }]}>
                {isActive ? 'Active' : 'Load'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onDelete}>
              <Ionicons name="trash-outline" size={14} color={theme.colors.error} />
              <Text style={[styles.btnText, { color: theme.colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnDownload]} onPress={onDownload}>
            <Ionicons name="cloud-download-outline" size={14} color={theme.colors.success} />
            <Text style={[styles.btnText, { color: theme.colors.success }]}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function Stat({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={11} color={theme.colors.textMuted} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardActive: {
    borderColor: theme.colors.accent + '66',
    backgroundColor: theme.colors.accentDim,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  familyBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  familyText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.success + '20',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.success,
  },
  activeText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: '#ffffff0a',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  tagText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  progressContainer: {
    marginBottom: 12,
    gap: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  progressText: {
    color: theme.colors.textMuted,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  btnPrimary: {
    borderColor: theme.colors.accent + '44',
    backgroundColor: theme.colors.accentDim,
  },
  btnDanger: {
    borderColor: theme.colors.error + '44',
    backgroundColor: theme.colors.errorDim,
  },
  btnDownload: {
    borderColor: theme.colors.success + '44',
    backgroundColor: theme.colors.successDim,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
