import { create } from 'zustand';
import * as FileSystem from 'expo-file-system';
import { ModelConfig } from '../constants/models';

export interface DownloadedModel {
  id: string;
  path: string;
  downloadedAt: number;
  sizeGB: number;
}

export interface DownloadProgress {
  modelId: string;
  progress: number; // 0-1
  bytesDownloaded: number;
  totalBytes: number;
  status: 'downloading' | 'paused' | 'error';
}

interface ModelStore {
  // Active loaded model
  activeModelId: string | null;
  activeModelConfig: ModelConfig | null;

  // Downloaded models on disk
  downloadedModels: Record<string, DownloadedModel>;

  // In-progress downloads
  downloads: Record<string, DownloadProgress>;

  // Actions
  setActiveModel: (model: ModelConfig | null) => void;
  addDownloaded: (model: ModelConfig, path: string) => void;
  removeDownloaded: (modelId: string) => void;
  setDownloadProgress: (modelId: string, progress: DownloadProgress | null) => void;
  getModelPath: (modelId: string) => string | null;
  isDownloaded: (modelId: string) => boolean;
}

const MODELS_DIR = FileSystem.documentDirectory + 'models/';

export const useModelStore = create<ModelStore>((set, get) => ({
  activeModelId: null,
  activeModelConfig: null,
  downloadedModels: {},
  downloads: {},

  setActiveModel: (model) =>
    set({ activeModelId: model?.id ?? null, activeModelConfig: model }),

  addDownloaded: (model, path) =>
    set((state) => ({
      downloadedModels: {
        ...state.downloadedModels,
        [model.id]: {
          id: model.id,
          path,
          downloadedAt: Date.now(),
          sizeGB: model.sizeGB,
        },
      },
    })),

  removeDownloaded: (modelId) =>
    set((state) => {
      const next = { ...state.downloadedModels };
      delete next[modelId];
      return { downloadedModels: next };
    }),

  setDownloadProgress: (modelId, progress) =>
    set((state) => {
      if (!progress) {
        const next = { ...state.downloads };
        delete next[modelId];
        return { downloads: next };
      }
      return { downloads: { ...state.downloads, [modelId]: progress } };
    }),

  getModelPath: (modelId) => {
    const dm = get().downloadedModels[modelId];
    return dm ? dm.path : null;
  },

  isDownloaded: (modelId) => !!get().downloadedModels[modelId],
}));

export { MODELS_DIR };
