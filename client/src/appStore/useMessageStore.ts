import { create } from 'zustand';

const BASE_URL = (import.meta as any).env.VITE_BASE_URL || 'http://localhost:3001';

// Utility to persist to localStorage
const persistKey = 'message-store';

const loadPersistedState = (): Partial<MessageStore> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(persistKey);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load persisted message store:', error);
    return {};
  }
};

const saveToLocalStorage = (state: Partial<MessageStore>) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(persistKey, JSON.stringify({
      unreadCounts: state.unreadCounts,
      currentlyOpenChatId: state.currentlyOpenChatId,
    }));
  } catch (error) {
    console.error('Failed to save message store to localStorage:', error);
  }
};

interface MessageStore {
  unreadCounts: Record<string, number>;
  setUnreadCount: (chatId: string, count: number) => void;
  resetUnreadCount: (chatId: string) => void;
  incrementUnreadCount: (chatId: string) => void;
  currentlyOpenChatId: string | null;
  setCurrentlyOpenChatId: (chatId: string | null) => void;
}

// Initial state from localStorage
const persisted = loadPersistedState();

const useMessageStore = create<MessageStore>((set, get) => ({
  unreadCounts: persisted.unreadCounts || {},
  currentlyOpenChatId: persisted.currentlyOpenChatId || null,

  setUnreadCount: (chatId, count) => {
    console.log('setUnreadCount called with:', chatId, count);
    set((state) => {
      const newState = {
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: count,
        },
        currentlyOpenChatId: state.currentlyOpenChatId,
      };
      saveToLocalStorage(newState);
      return newState;
    });
  },

  resetUnreadCount: (chatId) => {
    console.log('resetUnreadCount called with:', chatId);
    set((state) => {
      const newState = {
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: 0,
        },
        currentlyOpenChatId: state.currentlyOpenChatId,
      };
      saveToLocalStorage(newState);
      return newState;
    });
  },

  incrementUnreadCount: (chatId) => {
    set((state) => {
      const currentCount = state.unreadCounts[chatId] || 0;
      const newCount = currentCount + 1;
      console.log('incrementUnreadCount for chatId:', chatId, 'new count:', newCount);
      const newState = {
        unreadCounts: {
          ...state.unreadCounts,
          [chatId]: newCount,
        },
        currentlyOpenChatId: state.currentlyOpenChatId,
      };
      saveToLocalStorage(newState);
      return newState;
    });
  },

  setCurrentlyOpenChatId: (chatId) => {
    if (typeof window !== 'undefined' && window.location.href === `${BASE_URL}/home/messages`) {
      console.log('setCurrentlyOpenChatId called with:', chatId);
      set((state) => {
        const newState = {
          unreadCounts: state.unreadCounts,
          currentlyOpenChatId: chatId,
        };
        saveToLocalStorage(newState);
        return newState;
      });
    } else {
      console.log('Skipping setCurrentlyOpenChatId due to different URL:', window.location.href);
      set((state) => {
        const newState = {
          unreadCounts: state.unreadCounts,
          currentlyOpenChatId: null,
        };
        saveToLocalStorage(newState);
        return newState;
      });
    }
  },
}));

export default useMessageStore;
