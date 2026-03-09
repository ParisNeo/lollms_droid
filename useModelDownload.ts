import { useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import { ModelConfig } from '../constants/models';
import { useModelStore, MODELS_DIR } from '../store/modelStore';

export function useModelDownload() {
  const { setDownloadProgress, addDownloaded, removeDownloaded, isDownloaded } = useModelStore();
  const downloadResumables = useRef<Record<string, FileSystem.DownloadResumable>>({});

  const ensureDir = async () => {
    const info = await FileSystem.getInfoAsync(MODELS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
    }
  };

  const downloadModel = useCallback(
    async (model: ModelConfig): Promise<string | null> => {
      await ensureDir();
      const destPath = MODELS_DIR + model.filename;

      // Check if already exists
      const existing = await FileSystem.getInfoAsync(destPath);
      if (existing.exists) {
        addDownloaded(model, destPath);
        return destPath;
      }

      setDownloadProgress(model.id, {
        modelId: model.id,
        progress: 0,
        bytesDownloaded: 0,
        totalBytes: Math.round(model.sizeGB * 1024 * 1024 * 1024),
        status: 'downloading',
      });

      return new Promise((resolve, reject) => {
        const resumable = FileSystem.createDownloadResumable(
          model.downloadUrl,
          destPath,
          {},
          (downloadProgress) => {
            const { totalBytesWritten, totalBytesExpectedToWrite } = downloadProgress;
            setDownloadProgress(model.id, {
              modelId: model.id,
              progress: totalBytesExpectedToWrite > 0
                ? totalBytesWritten / totalBytesExpectedToWrite
                : 0,
              bytesDownloaded: totalBytesWritten,
              totalBytes: totalBytesExpectedToWrite,
              status: 'downloading',
            });
          }
        );

        downloadResumables.current[model.id] = resumable;

        resumable.downloadAsync().then((result) => {
          delete downloadResumables.current[model.id];
          if (result?.uri) {
            addDownloaded(model, result.uri);
            setDownloadProgress(model.id, null);
            resolve(result.uri);
          } else {
            setDownloadProgress(model.id, null);
            resolve(null);
          }
        }).catch((err) => {
          setDownloadProgress(model.id, {
            modelId: model.id,
            progress: 0,
            bytesDownloaded: 0,
            totalBytes: 0,
            status: 'error',
          });
          reject(err);
        });
      });
    },
    [addDownloaded, setDownloadProgress]
  );

  const cancelDownload = useCallback(
    async (modelId: string) => {
      const resumable = downloadResumables.current[modelId];
      if (resumable) {
        await resumable.pauseAsync();
        delete downloadResumables.current[modelId];
        setDownloadProgress(modelId, null);
      }
    },
    [setDownloadProgress]
  );

  const deleteModel = useCallback(
    async (model: ModelConfig) => {
      const path = MODELS_DIR + model.filename;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        await FileSystem.deleteAsync(path);
      }
      removeDownloaded(model.id);
    },
    [removeDownloaded]
  );

  const importLocalModel = useCallback(
    async (model: ModelConfig, localUri: string): Promise<string> => {
      await ensureDir();
      const destPath = MODELS_DIR + model.filename;
      await FileSystem.copyAsync({ from: localUri, to: destPath });
      addDownloaded(model, destPath);
      return destPath;
    },
    [addDownloaded]
  );

  return { downloadModel, cancelDownload, deleteModel, importLocalModel };
}
