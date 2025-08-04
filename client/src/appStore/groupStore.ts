import { create } from 'zustand';

type Group = {
  _id: string;
  name: string;
  description: string;
  creatorId: any;
  iconUrl?: string;
};

interface GroupStore {
  groups: Group[];
  unreadCounts: Record<string, number>;
  activeGroupId: string | null; 
  setGroups: (groups: Group[]) => void;
  addGroup: (group: Group) => void;
  updateGroup: (updated: Group) => void;
  removeGroup: (groupId: string) => void;

  getUnreadCount: (groupId: string) => number;
  getTotalUnread: () => number;
  incrementUnread: (groupId: string) => void;
  clearUnread: (groupId: string) => void;
  syncUnreadFromStorage: () => void;
}

const UNREAD_KEY = 'unreadCountsByGroup';

const loadFromStorage = (): Record<string, number> => {
  const raw = localStorage.getItem(UNREAD_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveToStorage = (counts: Record<string, number>) => {
  localStorage.setItem(UNREAD_KEY, JSON.stringify(counts));
};

export const useGroupStore = create<GroupStore>((set, get) => ({
  groups: [],
  unreadCounts: loadFromStorage(),
  activeGroupId: null, 

  setGroups: (groups) => set({ groups }),
  setActiveGroup: (groupId) => set({ activeGroupId: groupId }), 

  addGroup: (group) => set((state) => ({ groups: [group, ...state.groups] })),
  updateGroup: (updated) =>
    set((state) => ({
      groups: state.groups.map((g) => (g._id === updated._id ? updated : g)),
    })),
  removeGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((g) => g._id !== groupId),
    })),

  getUnreadCount: (groupId) => get().unreadCounts[groupId] || 0,

  getTotalUnread: () => {
    const counts = get().unreadCounts;
    return Object.values(counts).reduce((acc, count) => acc + count, 0);
  },

  incrementUnread: (groupId) => {
    const counts = { ...get().unreadCounts };
    counts[groupId] = (counts[groupId] || 0) + 1;
    saveToStorage(counts);
    set({ unreadCounts: counts });
  },

  clearUnread: (groupId) => {
    const counts = { ...get().unreadCounts };
    delete counts[groupId];
    saveToStorage(counts);
    set({ unreadCounts: counts });
  },

  syncUnreadFromStorage: () => {
    const fresh = loadFromStorage();
    set({ unreadCounts: fresh });
  },
}));
