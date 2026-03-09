import { useRef, useState, useCallback } from 'react';
import { initLlama, LlamaContext } from 'llama.rn';
import { Message } from '../store/chatStore';
import { ModelConfig, buildPrompt } from '../constants/models';

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  repeatPenalty?: number;
  systemPrompt?: string;
}

export function useLlama() {
  const contextRef = useRef<LlamaContext | null>(null);
  const [loadedModelId, setLoadedModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef(false);

  const loadModel = useCallback(
    async (config: ModelConfig, modelPath: string): Promise<boolean> => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Release previous context
        if (contextRef.current) {
          await contextRef.current.release();
          contextRef.current = null;
          setLoadedModelId(null);
        }

        const ctx = await initLlama({
          model: modelPath,
          use_mlock: true,
          n_ctx: config.contextLength,
          n_threads: 4,
          n_gpu_layers: 0, // CPU-only for broad compatibility; set higher for Vulkan-capable devices
          embedding: false,
        });

        contextRef.current = ctx;
        setLoadedModelId(config.id);
        return true;
      } catch (err: any) {
        setLoadError(err?.message ?? 'Failed to load model');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const generate = useCallback(
    async (
      messages: Message[],
      modelConfig: ModelConfig,
      onToken: (token: string) => void,
      options: GenerateOptions = {}
    ): Promise<{ text: string; tokensPerSec: number; totalTokens: number }> => {
      if (!contextRef.current) throw new Error('No model loaded');

      abortRef.current = false;

      const {
        maxTokens = 1024,
        temperature = 0.7,
        topP = 0.9,
        repeatPenalty = 1.1,
        systemPrompt,
      } = options;

      // Build messages array with optional system prompt
      const allMessages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
      if (systemPrompt) allMessages.push({ role: 'system', content: systemPrompt });
      allMessages.push(
        ...messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }))
      );

      const prompt = buildPrompt(allMessages, modelConfig.chatTemplate);

      const stopTokens: Record<ModelConfig['chatTemplate'], string[]> = {
        chatml: ['<|im_end|>', '<|im_start|>'],
        gemma: ['<end_of_turn>', '<start_of_turn>'],
        phi3: ['<|end|>', '<|user|>'],
        llama2: ['[INST]', '[/INST]'],
        qwen: ['<|im_end|>', '<|endoftext|>'],
      };

      let fullText = '';
      const startTime = Date.now();
      let tokenCount = 0;

      await contextRef.current.completion(
        {
          prompt,
          n_predict: maxTokens,
          temperature,
          top_p: topP,
          repeat_penalty: repeatPenalty,
          stop: stopTokens[modelConfig.chatTemplate],
        },
        (data: any) => {
          if (abortRef.current) return;
          if (data.token) {
            fullText += data.token;
            tokenCount++;
            onToken(data.token);
          }
        }
      );

      const elapsed = (Date.now() - startTime) / 1000;
      const tokensPerSec = tokenCount / Math.max(elapsed, 0.1);

      return { text: fullText.trim(), tokensPerSec, totalTokens: tokenCount };
    },
    []
  );

  const stopGeneration = useCallback(() => {
    abortRef.current = true;
    contextRef.current?.stopCompletion?.();
  }, []);

  const releaseModel = useCallback(async () => {
    if (contextRef.current) {
      await contextRef.current.release();
      contextRef.current = null;
      setLoadedModelId(null);
    }
  }, []);

  return {
    loadModel,
    generate,
    stopGeneration,
    releaseModel,
    loadedModelId,
    isLoading,
    loadError,
    isReady: !!loadedModelId && !isLoading,
  };
}
