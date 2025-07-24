
import { create } from 'zustand';

type SearchSource = 'header' | 'search' | null;

interface SearchStore {
  query: string;
  source: SearchSource;
  setQuery: (query: string, source?: SearchSource) => void;
  clearQuery: () => void;
  setSource: (source: SearchSource) => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  query: '',
  source: null,
  setQuery: (query, source = null) => set({ query, source }),
  clearQuery: () => set({ query: '', source: null }),
  setSource: (source) => set({ source }),
}));
