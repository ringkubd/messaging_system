import { create } from 'zustand';

interface FeedState {
  sort: 'smart' | 'latest' | 'popular';
  composerOpen: boolean;
  setSort: (sort: 'smart' | 'latest' | 'popular') => void;
  toggleComposer: () => void;
}

export const useFeedStore = create<FeedState>((set) => ({
  sort: 'smart',
  composerOpen: false,
  setSort: (sort) => set({ sort }),
  toggleComposer: () => set((s) => ({ composerOpen: !s.composerOpen })),
}));
