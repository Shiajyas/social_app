import { create } from 'zustand';

interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  resetUnreadCount: () => void;
  incrementUnreadCount: () => void;
}

// Helper to load from localStorage
const getInitialUnreadCount = (): number => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('unreadCount');
    return stored ? parseInt(stored, 10) : 0;
  }
  return 0;
};

const useNotificationStore = create<NotificationStore>((set) => {
  const updateLocalStorage = (count: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('unreadCount', count.toString());
    }
  };

  return {
    unreadCount: getInitialUnreadCount(),
    setUnreadCount: (count) => {
      updateLocalStorage(count);
      set({ unreadCount: count });
    },
    resetUnreadCount: () => {
      updateLocalStorage(0);
      set({ unreadCount: 0 });
    },
    incrementUnreadCount: () =>
      set((state) => {
        const newCount = state.unreadCount + 1;
        updateLocalStorage(newCount);
        return { unreadCount: newCount };
      }),
  };
});

export default useNotificationStore;
