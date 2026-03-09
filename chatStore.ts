import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens?: number;
  tokensPerSec?: number;
}

export interface Conversation {
  id: string;
  title: string;
  modelId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  isGenerating: boolean;
  streamingContent: string;
  systemPrompt: string;

  // Actions
  newConversation: (modelId: string) => string;
  setActiveConversation: (id: string | null) => void;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateLastMessage: (conversationId: string, content: string, meta?: Partial<Message>) => void;
  deleteConversation: (id: string) => void;
  clearConversation: (id: string) => void;
  setGenerating: (val: boolean) => void;
  setStreaming: (content: string) => void;
  setSystemPrompt: (prompt: string) => void;
  getActiveConversation: () => Conversation | null;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  isGenerating: false,
  streamingContent: '',
  systemPrompt: 'You are a helpful AI assistant running locally on this device. Be concise and helpful.',

  newConversation: (modelId) => {
    const id = `conv_${Date.now()}`;
    const conv: Conversation = {
      id,
      title: 'New Chat',
      modelId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: id,
    }));
    return id;
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const msg: Message = { ...message, id, timestamp: Date.now() };
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const title =
          c.messages.length === 0 && message.role === 'user'
            ? message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '')
            : c.title;
        return { ...c, messages: [...c.messages, msg], updatedAt: Date.now(), title };
      }),
    }));
    return id;
  },

  updateLastMessage: (conversationId, content, meta = {}) => {
    set((state) => ({
      conversations: state.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        const messages = [...c.messages];
        const last = messages[messages.length - 1];
        if (last && last.role === 'assistant') {
          messages[messages.length - 1] = { ...last, content, ...meta };
        }
        return { ...c, messages };
      }),
    }));
  },

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId:
        state.activeConversationId === id ? null : state.activeConversationId,
    })),

  clearConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c
      ),
    })),

  setGenerating: (val) => set({ isGenerating: val }),
  setStreaming: (content) => set({ streamingContent: content }),
  setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((c) => c.id === activeConversationId) ?? null;
  },
}));
