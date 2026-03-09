export interface ModelConfig {
  id: string;
  name: string;
  family: string;
  description: string;
  sizeGB: number;
  ramRequiredGB: number;
  downloadUrl: string;
  filename: string;
  contextLength: number;
  tags: string[];
  chatTemplate: 'chatml' | 'llama2' | 'gemma' | 'phi3' | 'qwen';
}

export const MODELS: ModelConfig[] = [
  {
    id: 'qwen2.5-0.5b',
    name: 'Qwen 2.5 0.5B',
    family: 'Qwen',
    description: 'Ultra-fast, minimal RAM. Perfect for quick queries.',
    sizeGB: 0.4,
    ramRequiredGB: 1.0,
    filename: 'qwen2.5-0.5b-instruct-q4_k_m.gguf',
    downloadUrl:
      'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf',
    contextLength: 4096,
    tags: ['fast', 'tiny', 'chat'],
    chatTemplate: 'chatml',
  },
  {
    id: 'smollm2-1.7b',
    name: 'SmolLM2 1.7B',
    family: 'SmolLM',
    description: 'HuggingFace small model, great balance of speed & quality.',
    sizeGB: 1.1,
    ramRequiredGB: 2.5,
    filename: 'smollm2-1.7b-instruct-q4_k_m.gguf',
    downloadUrl:
      'https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct-GGUF/resolve/main/smollm2-1.7b-instruct-q4_k_m.gguf',
    contextLength: 8192,
    tags: ['balanced', 'recommended'],
    chatTemplate: 'chatml',
  },
  {
    id: 'gemma-2b',
    name: 'Gemma 2 2B',
    family: 'Gemma',
    description: "Google's efficient 2B instruction-tuned model.",
    sizeGB: 1.6,
    ramRequiredGB: 3.5,
    filename: 'gemma-2-2b-it-q4_k_m.gguf',
    downloadUrl:
      'https://huggingface.co/lmstudio-community/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf',
    contextLength: 8192,
    tags: ['quality', 'google'],
    chatTemplate: 'gemma',
  },
  {
    id: 'phi3-mini',
    name: 'Phi-3 Mini 3.8B',
    family: 'Phi',
    description: "Microsoft's Phi-3 Mini. Best reasoning in this size class.",
    sizeGB: 2.2,
    ramRequiredGB: 4.5,
    filename: 'Phi-3-mini-4k-instruct-q4.gguf',
    downloadUrl:
      'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
    contextLength: 4096,
    tags: ['reasoning', 'microsoft', 'powerful'],
    chatTemplate: 'phi3',
  },
  {
    id: 'qwen2.5-1.5b',
    name: 'Qwen 2.5 1.5B',
    family: 'Qwen',
    description: 'Alibaba Qwen 1.5B — strong multilingual support.',
    sizeGB: 1.0,
    ramRequiredGB: 2.2,
    filename: 'qwen2.5-1.5b-instruct-q4_k_m.gguf',
    downloadUrl:
      'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf',
    contextLength: 8192,
    tags: ['multilingual', 'fast'],
    chatTemplate: 'chatml',
  },
];

export const FAMILY_COLORS: Record<string, string> = {
  Qwen: '#6366f1',
  SmolLM: '#10b981',
  Gemma: '#f59e0b',
  Phi: '#3b82f6',
  Llama: '#ef4444',
};

export function buildPrompt(
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
  template: ModelConfig['chatTemplate']
): string {
  switch (template) {
    case 'chatml': {
      let p = '';
      for (const m of messages) {
        p += `<|im_start|>${m.role}\n${m.content}<|im_end|>\n`;
      }
      p += '<|im_start|>assistant\n';
      return p;
    }
    case 'gemma': {
      let p = '';
      for (const m of messages) {
        if (m.role === 'user') p += `<start_of_turn>user\n${m.content}<end_of_turn>\n`;
        else if (m.role === 'assistant') p += `<start_of_turn>model\n${m.content}<end_of_turn>\n`;
      }
      p += '<start_of_turn>model\n';
      return p;
    }
    case 'phi3': {
      let p = '';
      for (const m of messages) {
        if (m.role === 'system') p += `<|system|>\n${m.content}<|end|>\n`;
        else if (m.role === 'user') p += `<|user|>\n${m.content}<|end|>\n`;
        else p += `<|assistant|>\n${m.content}<|end|>\n`;
      }
      p += '<|assistant|>\n';
      return p;
    }
    case 'llama2': {
      let p = '[INST] ';
      const sys = messages.find((m) => m.role === 'system');
      if (sys) p += `<<SYS>>\n${sys.content}\n<</SYS>>\n\n`;
      for (const m of messages.filter((m) => m.role !== 'system')) {
        if (m.role === 'user') p += `${m.content} [/INST] `;
        else p += `${m.content} [INST] `;
      }
      return p;
    }
    default:
      return messages.map((m) => `${m.role}: ${m.content}`).join('\n') + '\nassistant:';
  }
}
